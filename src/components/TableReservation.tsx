import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, Clock, Users, CreditCard, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { toast } from "@/hooks/use-toast";

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM",
];

const TableReservation = () => {
  const { user } = useAuth();
  const { playSound, speakNotification } = useSoundNotification();
  const [vendors, setVendors] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: vendorData } = await supabase
        .from("vendor_profiles")
        .select("user_id, business_name")
        .eq("is_approved", true);
      if (vendorData) setVendors(vendorData);

      if (user) {
        const { data: resData } = await supabase
          .from("reservations")
          .select("*")
          .eq("user_id", user.id)
          .order("reservation_date", { ascending: true });
        if (resData) setReservations(resData);
      }
    };
    fetchData();
  }, [user]);

  const bookReservation = async () => {
    if (!user || !selectedVendor || !date || !timeSlot) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("reservations").insert({
      user_id: user.id,
      vendor_id: selectedVendor,
      reservation_date: format(date, "yyyy-MM-dd"),
      time_slot: timeSlot,
      party_size: partySize,
      booking_fee: 500,
      notes,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      playSound("transaction");
      speakNotification("Table reservation booked successfully");
      toast({ title: "Reservation booked!", description: `₦500 booking fee applied. ${format(date, "PPP")} at ${timeSlot}` });
      setShowForm(false);
      setSelectedVendor("");
      setDate(undefined);
      setTimeSlot("");
      setNotes("");
      // Refresh
      const { data } = await supabase.from("reservations").select("*").eq("user_id", user.id).order("reservation_date", { ascending: true });
      if (data) setReservations(data);
    }
  };

  const cancelReservation = async (id: string) => {
    await supabase.from("reservations").update({ status: "cancelled" as any }).eq("id", id);
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    toast({ title: "Reservation cancelled" });
  };

  const getVendorName = (vendorId: string) => vendors.find((v) => v.user_id === vendorId)?.business_name || "Unknown";

  const statusColors: Record<string, string> = {
    pending: "bg-primary/10 text-primary",
    confirmed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Table Reservations</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Book a Table"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-display text-base">New Reservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-body text-sm">Select Vendor/Eatery</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger><SelectValue placeholder="Choose an eatery" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.user_id} value={v.user_id}>{v.business_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-body text-sm">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(d) => d < new Date()}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="font-body text-sm">Time Slot</Label>
                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                      <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="font-body text-sm">Party Size</Label>
                  <Input type="number" min={1} max={20} value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} />
                </div>

                <div>
                  <Label className="font-body text-sm">Special Requests</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any dietary requirements or preferences..." />
                </div>

                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="font-body text-sm">Booking fee</span>
                  </div>
                  <span className="font-display font-bold text-primary">₦500</span>
                </div>

                <Button onClick={bookReservation} disabled={loading} className="w-full">
                  {loading ? "Booking..." : "Confirm Reservation"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Reservations */}
      <div className="space-y-3">
        {reservations.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground font-body">No reservations yet</CardContent></Card>
        ) : (
          reservations.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm text-foreground">{getVendorName(r.vendor_id)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(r.reservation_date).toLocaleDateString()}
                        <Clock className="w-3 h-3 ml-1" />
                        {r.time_slot}
                        <Users className="w-3 h-3 ml-1" />
                        {r.party_size} guests
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[r.status] || ""}>{r.status}</Badge>
                    {r.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => cancelReservation(r.id)}>
                        <XCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TableReservation;
