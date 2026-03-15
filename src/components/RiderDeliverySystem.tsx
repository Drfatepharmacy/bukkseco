import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Clock, Zap, CheckCircle, XCircle, Truck, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { toast } from "@/hooks/use-toast";

interface DeliveryAssignment {
  id: string;
  order_id: string;
  status: string;
  search_radius: number;
  pickup_lat: number | null;
  pickup_lng: number | null;
  created_at: string;
}

const RiderDeliverySystem = () => {
  const { user } = useAuth();
  const { position, error: geoError } = useGeolocation(true);
  const { playSound, speakNotification } = useSoundNotification();
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  // Update rider location
  useEffect(() => {
    if (!user || !position) return;
    const updateLocation = async () => {
      await supabase.from("rider_locations").upsert({
        user_id: user.id,
        latitude: position.latitude,
        longitude: position.longitude,
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    };
    updateLocation();
  }, [user, position, isAvailable]);

  // Fetch rider profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("rider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setRiderProfile(data);
    };
    fetchProfile();
  }, [user]);

  // Fetch & subscribe to delivery assignments
  useEffect(() => {
    if (!user) return;
    const fetchAssignments = async () => {
      const { data } = await supabase
        .from("delivery_assignments")
        .select("*")
        .or(`status.eq.offered,rider_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (data) setAssignments(data as DeliveryAssignment[]);
      setLoading(false);
    };
    fetchAssignments();

    const channel = supabase
      .channel("rider-deliveries")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_assignments" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const newAssignment = payload.new as DeliveryAssignment;
          if (newAssignment.status === "offered") {
            playSound("delivery");
            speakNotification("New delivery request nearby");
          }
          setAssignments((prev) => {
            const idx = prev.findIndex((a) => a.id === newAssignment.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = newAssignment;
              return updated;
            }
            return [newAssignment, ...prev];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const acceptDelivery = async (assignment: DeliveryAssignment) => {
    if (!user || !riderProfile) return;
    const { error } = await supabase
      .from("delivery_assignments")
      .update({
        rider_id: user.id,
        rider_display_id: riderProfile.display_id,
        status: "accepted" as any,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", assignment.id)
      .eq("status", "offered" as any);

    if (error) {
      toast({ title: "Already taken", description: "Another rider accepted this delivery", variant: "destructive" });
    } else {
      playSound("order");
      speakNotification("Delivery accepted successfully");
      toast({ title: "Delivery accepted!" });
      // Update order status
      await supabase.from("orders").update({ rider_id: user.id, status: "rider_assigned" as any }).eq("id", assignment.order_id);
    }
  };

  const updateDeliveryStatus = async (assignmentId: string, orderId: string, status: string) => {
    await supabase.from("delivery_assignments").update({ status: status as any, ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}) }).eq("id", assignmentId);
    const orderStatus = status === "picked_up" ? "out_for_delivery" : status === "delivered" ? "delivered" : undefined;
    if (orderStatus) {
      await supabase.from("orders").update({ status: orderStatus as any }).eq("id", orderId);
    }
    playSound("delivery");
    speakNotification(`Delivery ${status.replace("_", " ")}`);
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast({ title: isAvailable ? "You're now offline" : "You're now online" });
  };

  const activeDeliveries = assignments.filter((a) => ["accepted", "picked_up"].includes(a.status));
  const availableDeliveries = assignments.filter((a) => a.status === "offered");

  return (
    <div className="space-y-6">
      {/* Rider Status Bar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isAvailable ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
              <div>
                <p className="font-display font-semibold text-foreground">
                  {riderProfile?.display_id || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  {isAvailable ? "Online - Accepting deliveries" : "Offline"}
                </p>
              </div>
              {riderProfile && (
                <div className="flex items-center gap-3 ml-4">
                  <Badge variant="outline" className="gap-1">
                    <Gauge className="w-3 h-3" />
                    {riderProfile.avg_speed || 0} km/h avg
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Truck className="w-3 h-3" />
                    {riderProfile.total_deliveries || 0} deliveries
                  </Badge>
                </div>
              )}
            </div>
            <Button
              onClick={toggleAvailability}
              variant={isAvailable ? "destructive" : "default"}
              size="sm"
            >
              {isAvailable ? "Go Offline" : "Go Online"}
            </Button>
          </div>
          {position && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
            </div>
          )}
          {geoError && (
            <p className="text-xs text-destructive mt-2">Location: {geoError}. City-based matching active.</p>
          )}
        </CardContent>
      </Card>

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3">Active Deliveries</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {activeDeliveries.map((a) => (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-semibold text-sm text-foreground">Order #{a.order_id.slice(0, 8)}</p>
                          <Badge className="mt-1">{a.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="flex gap-2">
                          {a.status === "accepted" && (
                            <Button size="sm" onClick={() => updateDeliveryStatus(a.id, a.order_id, "picked_up")}>
                              <Navigation className="w-3 h-3 mr-1" /> Picked Up
                            </Button>
                          )}
                          {a.status === "picked_up" && (
                            <Button size="sm" variant="default" onClick={() => updateDeliveryStatus(a.id, a.order_id, "delivered")}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Delivered
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Available Deliveries */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3">
          Available Deliveries ({availableDeliveries.length})
        </h3>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : availableDeliveries.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No deliveries available nearby</CardContent></Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {availableDeliveries.map((a) => (
                <motion.div key={a.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <Card className="border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-display font-semibold text-sm text-foreground">Delivery Request</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs gap-1">
                            <MapPin className="w-3 h-3" />{a.search_radius}m radius
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(a.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => acceptDelivery(a)}>
                          <Zap className="w-3 h-3 mr-1" /> Accept
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDeliverySystem;
