import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { loadGoogleMaps, getRoute, BUKKS_CAMPUS_CENTER, BUKKS_MAP_STYLE } from "@/lib/googleMaps";
import { pointCoords } from "@/config/campus";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bike, Flag, Navigation, Package, RefreshCw, Store } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Job = {
  id: string; order_number: string; status: string; rider_id: string | null;
  delivery_address: string | null; delivery_fee: number | null; prep_minutes: number | null;
  created_at: string; vendor_name: string | null;
  pickup_lat: number | null; pickup_lng: number | null; pickup_landmark: string | null;
  items: { q: number; name: string }[];
};
type LatLng = { lat: number; lng: number };

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const pickupOf = (j: Job): LatLng =>
  j.pickup_lat != null && j.pickup_lng != null ? { lat: j.pickup_lat, lng: j.pickup_lng } : BUKKS_CAMPUS_CENTER;

const RiderRun = () => {
  const { user } = useAuth();
  const { position, error: geoError } = useGeolocation(true);
  const { playSound } = useSoundNotification();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [eta, setEta] = useState<{ min: number; km: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const known = useRef<Set<string> | null>(null);

  const mapEl = useRef<HTMLDivElement>(null);
  const g = useRef<any>(null);
  const map = useRef<any>(null);
  const marks = useRef<{ me?: any; pick?: any; drop?: any; line?: any }>({});

  const active = jobs.find((j) => j.rider_id === user?.id) ?? null;
  const open = jobs.filter((j) => !j.rider_id);
  const me: LatLng | null = position ? { lat: position.latitude, lng: position.longitude } : null;

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_rider_jobs" as never);
    if (error) { setLoading(false); return; }
    const list = (data as unknown as Job[]) ?? [];
    const ids = new Set(list.filter((j) => !j.rider_id).map((j) => j.id));
    if (known.current && [...ids].some((id) => !known.current!.has(id))) {
      playSound("delivery");
      toast.success("New pickup available");
    }
    known.current = ids;
    setJobs(list);
    setLoading(false);
  }, [playSound]);

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`rider-run-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    const poll = setInterval(load, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [user, load]);

  // Share live position while on a run so the student can follow.
  useEffect(() => {
    if (!user || !me) return;
    supabase.from("rider_locations").upsert(
      { user_id: user.id, latitude: me.lat, longitude: me.lng, is_available: !active, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, me?.lat, me?.lng, active?.id]);

  // Map init
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled || !mapEl.current) return;
      g.current = maps;
      map.current = new maps.Map(mapEl.current, {
        center: BUKKS_CAMPUS_CENTER, zoom: 15, disableDefaultUI: true, zoomControl: true,
        gestureHandling: "greedy", styles: BUKKS_MAP_STYLE,
      });
    }).catch(() => !cancelled && setMapError("Map is not set up yet. Directions still work below."));
    return () => { cancelled = true; };
  }, []);

  // Markers + route for current leg
  useEffect(() => {
    const maps = g.current;
    if (!maps || !map.current) return;
    const dot = (color: string, scale = 8) => ({
      path: maps.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 1, strokeColor: "#060810", strokeWeight: 3,
    });
    const place = (k: "me" | "pick" | "drop", pos: LatLng | null, color: string, title: string) => {
      if (!pos) { marks.current[k]?.setMap(null); marks.current[k] = undefined; return; }
      if (!marks.current[k]) marks.current[k] = new maps.Marker({ map: map.current, title, icon: dot(color, k === "me" ? 7 : 9) });
      marks.current[k].setPosition(pos);
    };
    const pick = active ? pickupOf(active) : null;
    const drop = active ? pointCoords(active.delivery_address) : null;
    place("me", me, "#D4A017", "You");
    place("pick", active?.status === "rider_assigned" ? pick : null, "#7C3AED", "Pickup");
    place("drop", drop, "#10B981", "Drop-off");

    const target = active?.status === "rider_assigned" ? pick : drop;
    const bounds = new maps.LatLngBounds();
    [me, pick, drop].forEach((p) => p && bounds.extend(p));
    if (!bounds.isEmpty()) map.current.fitBounds(bounds, 60);

    let cancelled = false;
    if (me && target) {
      getRoute(me, target).then((r) => {
        if (cancelled || !r) return;
        const path = maps.geometry?.encoding?.decodePath(r.polyline);
        marks.current.line?.setMap(null);
        if (path) marks.current.line = new maps.Polyline({ map: map.current, path, strokeColor: "#D4A017", strokeWeight: 5, strokeOpacity: 0.9 });
        setEta({ min: Math.max(1, Math.round(r.duration / 60)), km: r.distance / 1000 });
      });
    } else {
      marks.current.line?.setMap(null);
      setEta(null);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.status, me?.lat, me?.lng]);

  const claim = async (j: Job) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("rider_claim_order" as never, { _order_id: j.id } as never);
    setBusy(false);
    if (error) return toast.error(error.message.includes("current") ? "Finish your current delivery first" : "Could not take this pickup");
    if (!data) return toast.error("Another rider took this pickup");
    playSound("order");
    toast.success(`Heading to ${j.vendor_name ?? "vendor"}`);
    load();
  };

  const advance = async () => {
    if (!active) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("rider_advance_order" as never, { _order_id: active.id } as never);
    setBusy(false);
    if (error) return toast.error("Could not update. Try again.");
    playSound("delivery");
    toast.success(data === "delivered" ? "Delivered. Nice run!" : "Picked up — head to drop-off");
    load();
  };

  const navTo = (p: LatLng | null) =>
    p && window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`, "_blank");

  const leg = active?.status === "rider_assigned" ? "pickup" : "dropoff";

  return (
    <div className="space-y-4">
      <div className="relative -mx-4 overflow-hidden border-y border-border" style={{ height: active ? "44vh" : "32vh" }}>
        <div ref={mapEl} className="h-full w-full bg-muted" />
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 px-6 text-center text-sm text-muted-foreground">{mapError}</div>
        )}
        {eta && (
          <div className="absolute left-3 top-3 rounded-lg border border-border bg-background px-3 py-2">
            <p className="font-display text-lg font-bold leading-none text-foreground">{eta.min} min</p>
            <p className="text-xs text-muted-foreground">{eta.km.toFixed(1)} km to {leg === "pickup" ? "pickup" : "drop-off"}</p>
          </div>
        )}
      </div>
      {geoError && <p className="text-xs text-destructive">Turn on location so the map and student can follow your run.</p>}

      {loading ? (
        <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>
      ) : active ? (
        <section className="space-y-4 rounded-xl border border-primary bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">{leg === "pickup" ? "Leg 1 · Pickup" : "Leg 2 · Drop-off"}</p>
              <p className="font-display text-lg font-bold text-foreground">{active.order_number}</p>
            </div>
            <p className="font-display font-bold text-success">{naira(Number(active.delivery_fee ?? 0))}</p>
          </div>

          <ol className="space-y-3">
            <li className={`flex gap-3 ${leg === "dropoff" ? "opacity-50" : ""}`}>
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{active.vendor_name ?? "Vendor"}</p>
                <p className="text-xs text-muted-foreground">{active.pickup_landmark ?? "Pickup spot not set by vendor"}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Flag className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">{active.delivery_address ?? "Drop-off"}</p>
                <p className="text-xs text-muted-foreground">{active.items.map((i) => `${i.q}× ${i.name}`).join(", ")}</p>
              </div>
            </li>
          </ol>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12"
              onClick={() => navTo(leg === "pickup" ? pickupOf(active) : pointCoords(active.delivery_address))}>
              <Navigation className="mr-2 h-4 w-4" />Directions
            </Button>
            <Button className="h-12" disabled={busy} onClick={advance}>
              {leg === "pickup" ? <><Package className="mr-2 h-4 w-4" />Picked up</> : <><Flag className="mr-2 h-4 w-4" />Delivered</>}
            </Button>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">Ready for pickup ({open.length})</h2>
          {open.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <Bike className="mx-auto mb-2 h-8 w-8" />
              No orders waiting. Kitchens' ready orders appear here instantly.
            </div>
          )}
          {open.map((j) => (
            <article key={j.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-bold text-foreground">{j.vendor_name ?? "Vendor"}</p>
                  <p className="text-xs text-muted-foreground">{j.order_number} · {j.items.reduce((s, i) => s + i.q, 0)} items</p>
                </div>
                <p className="font-display font-bold text-success">{naira(Number(j.delivery_fee ?? 0))}</p>
              </div>
              <p className="flex items-center gap-2 text-sm text-foreground"><Flag className="h-4 w-4 text-success" />{j.delivery_address ?? "Campus drop-off"}</p>
              <Button className="h-12 w-full" disabled={busy} onClick={() => claim(j)}>Take this pickup</Button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default RiderRun;
