import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, RefreshCw, MapPin, Navigation, Clock, Users, Layers,
  ChevronLeft, ChevronRight, Bike, Phone, Mail, X
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZW1tdGVjIiwiYSI6ImNtbjJicTVpOTEyaDcycXIzdHV6cjhueDIifQ.vw4mUcJIUB2aYzEGomLI9Q";

interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  status: string;
}

interface Landmark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface RiderLoc {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  landmark_passed: string | null;
  is_available: boolean;
}

const LiveRiderTracking = () => {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const riderMarker = useRef<mapboxgl.Marker | null>(null);
  const memberMarkers = useRef<mapboxgl.Marker[]>([]);
  const landmarkMarkers = useRef<mapboxgl.Marker[]>([]);

  const [members, setMembers] = useState<Member[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [pathHistory, setPathHistory] = useState<[number, number][]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [landmarksPassed, setLandmarksPassed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [5.6100, 6.4000],
      zoom: 14,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.current.on("load", () => {
      // Path source
      map.current!.addSource("rider-path", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      });
      map.current!.addLayer({
        id: "rider-path-line",
        type: "line",
        source: "rider-path",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 3,
          "line-opacity": 0.8,
        },
      });

      // Directions route source
      map.current!.addSource("directions-route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      });
      map.current!.addLayer({
        id: "directions-route-line",
        type: "line",
        source: "directions-route",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 0.7,
          "line-dasharray": [2, 1],
        },
      });

      setLoading(false);
    });

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    const [membersRes, landmarksRes, ridersRes] = await Promise.all([
      supabase.from("registered_members").select("*").eq("status", "active"),
      supabase.from("landmarks").select("*"),
      supabase.from("rider_locations").select("*").eq("is_available", true).order("updated_at", { ascending: false }).limit(1),
    ]);

    if (membersRes.data) setMembers(membersRes.data as Member[]);
    if (landmarksRes.data) setLandmarks(landmarksRes.data as Landmark[]);

    if (ridersRes.data && ridersRes.data.length > 0) {
      const r = ridersRes.data[0] as RiderLoc;
      setRiderPos({ lat: r.latitude, lng: r.longitude });
      setLastUpdated(new Date(r.updated_at).toLocaleTimeString());
      setPathHistory((prev) => [...prev, [r.longitude, r.latitude]]);
    }

    // Count landmarks passed
    const { count } = await supabase
      .from("rider_locations")
      .select("landmark_passed", { count: "exact", head: true })
      .not("landmark_passed", "is", null);
    setLandmarksPassed(count || 0);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("rider-live-tracking")
      .on("postgres_changes", { event: "*", schema: "public", table: "rider_locations" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const r = payload.new as RiderLoc;
          if (!r.is_available) return;
          setRiderPos({ lat: r.latitude, lng: r.longitude });
          setLastUpdated(new Date(r.updated_at).toLocaleTimeString());
          setPathHistory((prev) => [...prev, [r.longitude, r.latitude]]);
          if (r.landmark_passed) setLandmarksPassed((p) => p + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Update rider marker
  useEffect(() => {
    if (!map.current || !riderPos) return;

    if (!riderMarker.current) {
      const el = document.createElement("div");
      el.className = "rider-pulse-marker";
      el.innerHTML = `<div class="rider-dot"></div><div class="rider-ring"></div>`;
      riderMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([riderPos.lng, riderPos.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML("<strong>🏍️ Active Rider</strong>"))
        .addTo(map.current);
    } else {
      riderMarker.current.setLngLat([riderPos.lng, riderPos.lat]);
    }

    // Update path
    const src = map.current.getSource("rider-path") as mapboxgl.GeoJSONSource;
    if (src && pathHistory.length > 1) {
      src.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: pathHistory },
        properties: {},
      });
    }
  }, [riderPos, pathHistory]);

  // Update member markers
  useEffect(() => {
    if (!map.current) return;
    memberMarkers.current.forEach((m) => m.remove());
    memberMarkers.current = [];

    if (!showMembers) return;

    members.forEach((m) => {
      if (!m.latitude || !m.longitude) return;
      const el = document.createElement("div");
      el.className = "member-marker";
      el.innerHTML = `<div style="width:12px;height:12px;background:#10b981;border:2px solid #fff;border-radius:50%;cursor:pointer;"></div>`;
      el.onclick = () => setSelectedMember(m);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.longitude, m.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<div style="color:#000;"><strong>${m.name}</strong><br/>${m.address || "No address"}</div>`
          )
        )
        .addTo(map.current!);
      memberMarkers.current.push(marker);
    });
  }, [members, showMembers]);

  // Update landmark markers
  useEffect(() => {
    if (!map.current) return;
    landmarkMarkers.current.forEach((m) => m.remove());
    landmarkMarkers.current = [];

    if (!showLandmarks) return;

    const iconMap: Record<string, { emoji: string; bg: string; border: string }> = {
      gate: { emoji: "🚪", bg: "#f59e0b", border: "#fbbf24" },
      academic: { emoji: "🎓", bg: "#3b82f6", border: "#60a5fa" },
      hospital: { emoji: "🏥", bg: "#ef4444", border: "#f87171" },
      library: { emoji: "📚", bg: "#8b5cf6", border: "#a78bfa" },
      recreation: { emoji: "⚽", bg: "#10b981", border: "#34d399" },
      hostel: { emoji: "🛏️", bg: "#6366f1", border: "#818cf8" },
      admin: { emoji: "🏛️", bg: "#64748b", border: "#94a3b8" },
      bank: { emoji: "🏦", bg: "#0ea5e9", border: "#38bdf8" },
      food: { emoji: "🍽️", bg: "#f97316", border: "#fb923c" },
      technology: { emoji: "💻", bg: "#14b8a6", border: "#2dd4bf" },
      worship: { emoji: "⛪", bg: "#a855f7", border: "#c084fc" },
      clinic: { emoji: "🏥", bg: "#ef4444", border: "#f87171" },
      landmark: { emoji: "📍", bg: "#ec4899", border: "#f472b6" },
    };

    landmarks.forEach((l) => {
      const icon = iconMap[l.type] || { emoji: "📍", bg: "#8b5cf6", border: "#c4b5fd" };
      const el = document.createElement("div");
      el.style.cssText = "cursor:pointer;";
      el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:${icon.bg};border:2px solid ${icon.border};border-radius:50%;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${icon.emoji}</div>`;
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([l.longitude, l.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(`<div style="color:#000;"><strong>${icon.emoji} ${l.name}</strong><br/><em style="color:#666;">${l.type}</em></div>`))
        .addTo(map.current!);
      landmarkMarkers.current.push(marker);
    });
  }, [landmarks, showLandmarks]);

  // Directions
  const fetchDirections = useCallback(async (dest: Member) => {
    if (!riderPos || !map.current) return;
    setEta(null);
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${riderPos.lng},${riderPos.lat};${dest.longitude},${dest.latitude}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      );
      const data = await res.json();
      if (data.routes?.[0]) {
        const route = data.routes[0];
        const src = map.current.getSource("directions-route") as mapboxgl.GeoJSONSource;
        if (src) {
          src.setData({
            type: "Feature",
            geometry: route.geometry,
            properties: {},
          });
        }
        const mins = Math.round(route.duration / 60);
        setEta(`${mins} min (${(route.distance / 1000).toFixed(1)} km)`);

        // Fit bounds
        const coords = route.geometry.coordinates;
        const bounds = coords.reduce(
          (b: mapboxgl.LngLatBounds, c: [number, number]) => b.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.current.fitBounds(bounds, { padding: 80 });
      }
    } catch (e) {
      console.error("Directions error:", e);
    }
  }, [riderPos]);

  useEffect(() => {
    if (selectedMember && riderPos && showRoute) {
      fetchDirections(selectedMember);
    }
  }, [selectedMember, riderPos, showRoute, fetchDirections]);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const centerOnRider = () => {
    if (riderPos && map.current) {
      map.current.flyTo({ center: [riderPos.lng, riderPos.lat], zoom: 15 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-border/50">
      {/* Pulse marker CSS */}
      <style>{`
        .rider-pulse-marker { position: relative; width: 24px; height: 24px; }
        .rider-dot { width: 14px; height: 14px; background: #f59e0b; border: 3px solid #fff; border-radius: 50%; position: absolute; top: 5px; left: 5px; z-index: 2; }
        .rider-ring { width: 24px; height: 24px; border: 2px solid #f59e0b; border-radius: 50%; position: absolute; top: 0; left: 0; animation: pulse-ring 1.5s ease-out infinite; }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 h-full z-10 transition-all duration-300 ${sidebarOpen ? "w-72" : "w-0"} overflow-hidden`}>
        <div className="w-72 h-full bg-background/95 backdrop-blur-lg border-r border-border/50 flex flex-col">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Members
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs bg-muted/50"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredMembers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No members found</p>
              )}
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMember(m);
                    if (map.current && m.latitude && m.longitude) {
                      map.current.flyTo({ center: [m.longitude, m.latitude], zoom: 15 });
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors text-xs ${
                    selectedMember?.id === m.id ? "bg-primary/20 border border-primary/30" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{m.name}</span>
                    <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                  {m.address && <p className="text-muted-foreground mt-1 truncate">{m.address}</p>}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Sidebar toggle */}
      {!sidebarOpen && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 z-10"
          onClick={() => setSidebarOpen(true)}
        >
          <ChevronRight className="w-4 h-4 mr-1" /> Members
        </Button>
      )}

      {/* Top stats bar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 flex-wrap">
        <div className="bg-background/90 backdrop-blur-lg border border-border/50 rounded-lg px-3 py-2 flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground">Last Update</p>
            <p className="text-xs font-semibold text-foreground">{lastUpdated || "—"}</p>
          </div>
        </div>
        <div className="bg-background/90 backdrop-blur-lg border border-border/50 rounded-lg px-3 py-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-[10px] text-muted-foreground">Landmarks</p>
            <p className="text-xs font-semibold text-foreground">{landmarksPassed}</p>
          </div>
        </div>
        {eta && (
          <div className="bg-background/90 backdrop-blur-lg border border-border/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">ETA</p>
              <p className="text-xs font-semibold text-foreground">{eta}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <Button variant="secondary" size="sm" onClick={centerOnRider} className="text-xs">
          <Navigation className="w-3.5 h-3.5 mr-1" /> Center Rider
        </Button>
        <Button variant="secondary" size="sm" onClick={loadData} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
        <Button
          variant={showMembers ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowMembers(!showMembers)}
          className="text-xs"
        >
          <Users className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant={showLandmarks ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowLandmarks(!showLandmarks)}
          className="text-xs"
        >
          <Layers className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Selected member detail panel */}
      {selectedMember && (
        <div className="absolute bottom-16 right-4 z-10 w-64 bg-background/95 backdrop-blur-lg border border-border/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-foreground">{selectedMember.name}</h4>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(null); setEta(null); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            {selectedMember.email && (
              <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{selectedMember.email}</div>
            )}
            {selectedMember.phone && (
              <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{selectedMember.phone}</div>
            )}
            {selectedMember.address && (
              <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{selectedMember.address}</div>
            )}
            {eta && (
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Navigation className="w-3 h-3" /> {eta}
              </div>
            )}
          </div>
          <Button
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => fetchDirections(selectedMember)}
          >
            <Navigation className="w-3 h-3 mr-1" /> Get Directions
          </Button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default LiveRiderTracking;
