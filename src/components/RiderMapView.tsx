import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, RefreshCw, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { loadGoogleMaps, BUKKS_CAMPUS_CENTER, BUKKS_MAP_STYLE } from "@/lib/googleMaps";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  const [tracking, setTracking] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const container = useRef<HTMLDivElement>(null);
  const mapsApi = useRef<any>(null);
  const map = useRef<any>(null);
  const selfMarker = useRef<any>(null);
  const selfCircle = useRef<any>(null);
  const riderMarkers = useRef<any[]>([]);
  const infoWindow = useRef<any>(null);

  const lat = latitude ?? BUKKS_CAMPUS_CENTER.lat;
  const lng = longitude ?? BUKKS_CAMPUS_CENTER.lng;

  const loadRiders = async () => {
    const { data: locations } = await supabase
      .from("rider_locations")
      .select("*")
      .eq("is_available", true);

    if (locations) {
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
  };

  // Init Google Map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !container.current || map.current) return;
        mapsApi.current = maps;
        map.current = new maps.Map(container.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          styles: BUKKS_MAP_STYLE,
        });
        infoWindow.current = new maps.InfoWindow();
      })
      .catch(() => {
        if (!cancelled) setMapError("Map unavailable — Google Maps is not configured yet.");
      });
    return () => {
      cancelled = true;
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Own position
  useEffect(() => {
    const maps = mapsApi.current;
    if (!maps || !map.current || !latitude || !longitude) return;
    const pos = { lat: latitude, lng: longitude };

    if (!selfMarker.current) {
      selfMarker.current = new maps.Marker({
        map: map.current,
        position: pos,
        title: "Your location",
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#f5b301",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      selfCircle.current = new maps.Circle({
        map: map.current,
        center: pos,
        radius: 200,
        strokeColor: "#f5b301",
        strokeOpacity: 0.5,
        fillColor: "#f5b301",
        fillOpacity: 0.08,
      });
    } else {
      selfMarker.current.setPosition(pos);
      selfCircle.current?.setCenter(pos);
    }
    map.current.panTo(pos);
  }, [latitude, longitude]);

  // Other riders
  useEffect(() => {
    const maps = mapsApi.current;
    if (!maps || !map.current) return;
    riderMarkers.current.forEach((m) => m.setMap(null));
    riderMarkers.current = [];

    riders
      .filter((r) => r.user_id !== user?.id)
      .forEach((r) => {
        const marker = new maps.Marker({
          map: map.current,
          position: { lat: r.latitude, lng: r.longitude },
          title: r.display_id,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        marker.addListener("click", () => {
          infoWindow.current.setContent(
            `<div style="color:#000"><strong>${r.display_id}</strong><br/>Available</div>`
          );
          infoWindow.current.open(map.current, marker);
        });
        riderMarkers.current.push(marker);
      });
  }, [riders, user?.id]);

  const toggleTracking = async () => {
    if (!user || !latitude || !longitude) return;

    if (!tracking) {
      const { data: existing } = await supabase
        .from("rider_locations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        await supabase
          .from("rider_locations")
          .update({ latitude, longitude, is_available: true, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("rider_locations")
          .insert({ user_id: user.id, latitude, longitude, is_available: true });
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

  useEffect(() => {
    if (!tracking || !user || !latitude || !longitude) return;
    const interval = setInterval(async () => {
      await supabase
        .from("rider_locations")
        .update({ latitude, longitude, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
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

      <div className="glass-card overflow-hidden rounded-xl relative" style={{ height: 400 }}>
        <div ref={container} className="w-full h-full" />
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs text-muted-foreground font-body px-6 text-center">
            {mapError}
          </div>
        )}
      </div>

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
