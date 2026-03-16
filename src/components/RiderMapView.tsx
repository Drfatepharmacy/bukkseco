import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, RefreshCw, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";

// Lazy load Leaflet to avoid SSR issues
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const riderIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

interface RiderLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  display_id?: string;
}

const RiderMapView = () => {
  const { user } = useAuth();
  const { position, error: geoError } = useGeolocation(true);
  const latitude = position?.latitude;
  const longitude = position?.longitude;
  const [riders, setRiders] = useState<RiderLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  const defaultLat = 6.5244;
  const defaultLng = 3.3792;
  const lat = latitude || defaultLat;
  const lng = longitude || defaultLng;

  const loadRiders = async () => {
    setLoading(true);
    const { data: locations } = await supabase
      .from("rider_locations")
      .select("*")
      .eq("is_available", true);

    if (locations) {
      // Enrich with display IDs
      const enriched = await Promise.all(
        locations.map(async (loc) => {
          const { data: rp } = await supabase
            .from("rider_profiles")
            .select("display_id")
            .eq("user_id", loc.user_id)
            .single();
          return { ...loc, display_id: rp?.display_id || "RDR-?????" };
        })
      );
      setRiders(enriched);
    }
    setLoading(false);
  };

  const toggleTracking = async () => {
    if (!user || !latitude || !longitude) return;

    if (!tracking) {
      // Upsert location
      const { data: existing } = await supabase
        .from("rider_locations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        await supabase.from("rider_locations").update({
          latitude, longitude, is_available: true, updated_at: new Date().toISOString()
        }).eq("user_id", user.id);
      } else {
        await supabase.from("rider_locations").insert({
          user_id: user.id, latitude, longitude, is_available: true
        });
      }
      setTracking(true);
    } else {
      await supabase.from("rider_locations").update({ is_available: false }).eq("user_id", user.id);
      setTracking(false);
    }
    loadRiders();
  };

  useEffect(() => {
    loadRiders();
  }, []);

  // Update location periodically when tracking
  useEffect(() => {
    if (!tracking || !user || !latitude || !longitude) return;
    const interval = setInterval(async () => {
      await supabase.from("rider_locations").update({
        latitude, longitude, updated_at: new Date().toISOString()
      }).eq("user_id", user.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [tracking, latitude, longitude, user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          <MapPin className="w-5 h-5 inline mr-2 text-primary" />
          Rider Map
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleTracking} className="font-body text-xs">
            <Navigation className={`w-3.5 h-3.5 mr-1.5 ${tracking ? "text-success" : ""}`} />
            {tracking ? "Stop Tracking" : "Go Online"}
          </Button>
          <Button variant="ghost" size="sm" onClick={loadRiders}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {geoError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-xs text-destructive font-body">
          Location access denied. Please enable GPS for rider tracking.
        </div>
      )}

      <div className="glass-card overflow-hidden rounded-xl" style={{ height: 400 }}>
        <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={lat} lng={lng} />

          {/* Current user position */}
          {latitude && longitude && (
            <>
              <Circle center={[latitude, longitude]} radius={200} pathOptions={{ color: "hsl(43, 96%, 56%)", fillOpacity: 0.1 }} />
              <Marker position={[latitude, longitude]}>
                <Popup><span className="font-body text-xs">Your Location</span></Popup>
              </Marker>
            </>
          )}

          {/* Other riders */}
          {riders
            .filter((r) => r.user_id !== user?.id)
            .map((rider) => (
              <Marker key={rider.id} position={[rider.latitude, rider.longitude]} icon={riderIcon}>
                <Popup>
                  <div className="font-body text-xs">
                    <p className="font-semibold">{rider.display_id}</p>
                    <p className="text-muted-foreground">Available</p>
                  </div>
                </Popup>
              </Marker>
            ))
          }
        </MapContainer>
      </div>

      {/* Active riders count */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bike className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-foreground">{riders.length} Riders Online</p>
            <p className="text-xs text-muted-foreground font-body">
              {tracking ? "You are visible to nearby orders" : "Go online to receive delivery requests"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderMapView;
