import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, RefreshCw, MapPin, Navigation, Clock, Users, Layers,
  ChevronLeft, ChevronRight, Bike, Phone, Mail, X
} from "lucide-react";
import { loadGoogleMaps, getRoute, BUKKS_CAMPUS_CENTER, BUKKS_MAP_STYLE } from "@/lib/googleMaps";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

const dotIcon = (maps: any, fill: string, scale = 6) => ({
  path: maps.SymbolPath.CIRCLE,
  scale,
  fillColor: fill,
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
});

const LiveRiderTracking = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapsApi = useRef<any>(null);
  const map = useRef<any>(null);
  const riderMarker = useRef<any>(null);
  const memberMarkers = useRef<any[]>([]);
  const landmarkMarkers = useRef<any[]>([]);
  const pathLine = useRef<any>(null);
  const routeLine = useRef<any>(null);
  const infoWindow = useRef<any>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [pathHistory, setPathHistory] = useState<{ lat: number; lng: number }[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showRoute] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [landmarksPassed, setLandmarksPassed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  // Init Google Map
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapContainer.current || map.current) return;
        mapsApi.current = maps;

        map.current = new maps.Map(mapContainer.current, {
          center: BUKKS_CAMPUS_CENTER,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          styles: BUKKS_MAP_STYLE,
          clickableIcons: false,
        });

        infoWindow.current = new maps.InfoWindow();

        pathLine.current = new maps.Polyline({
          map: map.current,
          path: [],
          strokeColor: "#f59e0b",
          strokeOpacity: 0.85,
          strokeWeight: 3,
        });

        routeLine.current = new maps.Polyline({
          map: map.current,
          path: [],
          strokeColor: "#3b82f6",
          strokeOpacity: 0.75,
          strokeWeight: 4,
        });

        map.current.addListener("click", () => setSidebarOpen(false));
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) {
          setMapError("Live map unavailable — Google Maps is not configured yet.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      map.current = null;
    };
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
      setPathHistory((prev) => [...prev, { lat: r.latitude, lng: r.longitude }]);
    }

    const { count } = await supabase
      .from("rider_locations")
      .select("landmark_passed", { count: "exact", head: true })
      .not("landmark_passed", "is", null);
    setLandmarksPassed(count || 0);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime rider positions
  useEffect(() => {
    const channel = supabase
      .channel("rider-live-tracking")
      .on("postgres_changes", { event: "*", schema: "public", table: "rider_locations" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const r = payload.new as RiderLoc;
          if (!r.is_available) return;
          setRiderPos({ lat: r.latitude, lng: r.longitude });
          setLastUpdated(new Date(r.updated_at).toLocaleTimeString());
          setPathHistory((prev) => [...prev, { lat: r.latitude, lng: r.longitude }]);
          if (r.landmark_passed) setLandmarksPassed((p) => p + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Rider marker + breadcrumb trail
  useEffect(() => {
    const maps = mapsApi.current;
    if (!maps || !map.current || !riderPos) return;

    if (!riderMarker.current) {
      riderMarker.current = new maps.Marker({
        map: map.current,
        position: riderPos,
        title: "Active rider",
        icon: dotIcon(maps, "#f59e0b", 7),
        zIndex: 999,
      });
      riderMarker.current.addListener("click", () => {
        infoWindow.current.setContent("<strong>Active rider</strong>");
        infoWindow.current.open(map.current, riderMarker.current);
      });
    } else {
      riderMarker.current.setPosition(riderPos);
    }

    if (pathLine.current && pathHistory.length > 1) pathLine.current.setPath(pathHistory);
  }, [riderPos, pathHistory]);

  // Member markers
  useEffect(() => {
    const maps = mapsApi.current;
    if (!maps || !map.current) return;
    memberMarkers.current.forEach((m) => m.setMap(null));
    memberMarkers.current = [];
    if (!showMembers) return;

    members.forEach((m) => {
      if (!m.latitude || !m.longitude) return;
      const marker = new maps.Marker({
        map: map.current,
        position: { lat: m.latitude, lng: m.longitude },
        icon: dotIcon(maps, "#10b981"),
        title: m.name,
      });
      marker.addListener("click", () => {
        setSelectedMember(m);
        infoWindow.current.setContent(
          `<div style="color:#000"><strong>${m.name}</strong><br/>${m.address || "No address"}</div>`
        );
        infoWindow.current.open(map.current, marker);
      });
      memberMarkers.current.push(marker);
    });
  }, [members, showMembers]);

  // Landmark markers
  useEffect(() => {
    const maps = mapsApi.current;
    if (!maps || !map.current) return;
    landmarkMarkers.current.forEach((m) => m.setMap(null));
    landmarkMarkers.current = [];
    if (!showLandmarks) return;

    landmarks.forEach((l) => {
      if (hiddenTypes.has(l.type)) return;
      const icon = iconMap[l.type] || { emoji: "📍", bg: "#8b5cf6", border: "#c4b5fd" };
      const marker = new maps.Marker({
        map: map.current,
        position: { lat: l.latitude, lng: l.longitude },
        label: { text: icon.emoji, fontSize: "14px" },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: icon.bg,
          fillOpacity: 1,
          strokeColor: icon.border,
          strokeWeight: 2,
        },
        title: l.name,
      });
      marker.addListener("click", () => {
        infoWindow.current.setContent(
          `<div style="color:#000"><strong>${icon.emoji} ${l.name}</strong><br/><em style="color:#666">${l.type}</em></div>`
        );
        infoWindow.current.open(map.current, marker);
      });
      landmarkMarkers.current.push(marker);
    });
  }, [landmarks, showLandmarks, hiddenTypes]);

  // Routes API directions
  const fetchDirections = useCallback(async (dest: Member) => {
    const maps = mapsApi.current;
    if (!riderPos || !maps || !map.current) return;
    setEta(null);

    const route = await getRoute(riderPos, { lat: dest.latitude, lng: dest.longitude });
    if (!route) return;

    const path = maps.geometry.encoding.decodePath(route.polyline);
    routeLine.current?.setPath(path);
    setEta(`${Math.round(route.duration / 60)} min (${(route.distance / 1000).toFixed(1)} km)`);

    const bounds = new maps.LatLngBounds();
    path.forEach((p: any) => bounds.extend(p));
    map.current.fitBounds(bounds, 80);
  }, [riderPos]);

  useEffect(() => {
    if (selectedMember && riderPos && showRoute) fetchDirections(selectedMember);
  }, [selectedMember, riderPos, showRoute, fetchDirections]);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const centerOnRider = () => {
    if (riderPos && map.current) {
      map.current.panTo(riderPos);
      map.current.setZoom(16);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-border/50">
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
                      map.current.panTo({ lat: m.latitude, lng: m.longitude });
                      map.current.setZoom(16);
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
        <Button
          variant={showLegend ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowLegend(!showLegend)}
          className="text-xs"
        >
          <MapPin className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Legend panel */}
      {showLegend && (
        <div className="absolute bottom-16 left-4 z-10 bg-background/95 backdrop-blur-lg border border-border/50 rounded-xl p-4 w-56">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-foreground">Legend</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowLegend(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {[
              { emoji: "🚪", label: "Gate", type: "gate", bg: "#f59e0b" },
              { emoji: "🎓", label: "Academic", type: "academic", bg: "#3b82f6" },
              { emoji: "🏥", label: "Hospital / Clinic", type: "hospital", bg: "#ef4444" },
              { emoji: "📚", label: "Library", type: "library", bg: "#8b5cf6" },
              { emoji: "⚽", label: "Recreation", type: "recreation", bg: "#10b981" },
              { emoji: "🛏️", label: "Hostel", type: "hostel", bg: "#6366f1" },
              { emoji: "🏛️", label: "Admin Building", type: "admin", bg: "#64748b" },
              { emoji: "🏦", label: "Bank", type: "bank", bg: "#0ea5e9" },
              { emoji: "🍽️", label: "Food / Cafeteria", type: "food", bg: "#f97316" },
              { emoji: "💻", label: "Technology", type: "technology", bg: "#14b8a6" },
              { emoji: "⛪", label: "Place of Worship", type: "worship", bg: "#a855f7" },
              { emoji: "📍", label: "Other Landmark", type: "landmark", bg: "#ec4899" },
            ].map((item) => {
              const isHidden = hiddenTypes.has(item.type);
              return (
                <button
                  key={item.label}
                  className={`flex items-center gap-2 text-xs w-full rounded-md px-1 py-0.5 transition-opacity ${isHidden ? "opacity-30" : "opacity-100 hover:bg-muted/50"}`}
                  onClick={() => {
                    setHiddenTypes((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.type)) next.delete(item.type);
                      else next.add(item.type);
                      return next;
                    });
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0"
                    style={{ background: item.bg, border: `2px solid ${item.bg}44` }}
                  >
                    {item.emoji}
                  </div>
                  <span className="text-foreground">{item.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {landmarks.filter((l) => l.type === item.type).length}
                  </span>
                </button>
              );
            })}
            <div className="border-t border-border/50 pt-2 mt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-[#f59e0b] border-2 border-white rounded-full shrink-0 ml-1.5" />
                <span className="text-foreground">Active Rider</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-[#10b981] border-2 border-white rounded-full shrink-0 ml-1.5" />
                <span className="text-foreground">Member</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected member detail panel */}
      {selectedMember && (
        <div className="absolute bottom-16 right-4 z-10 w-64 bg-background/95 backdrop-blur-lg border border-border/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-foreground">{selectedMember.name}</h4>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(null); setEta(null); routeLine.current?.setPath([]); }}>
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
          <Button size="sm" className="w-full mt-3 text-xs" onClick={() => fetchDirections(selectedMember)}>
            <Navigation className="w-3 h-3 mr-1" /> Get Directions
          </Button>
        </div>
      )}

      {/* Loading / error overlay */}
      {(loading || mapError) && (
        <div className="absolute inset-0 z-20 bg-background/80 flex items-center justify-center">
          <div className="text-center px-6">
            {mapError ? (
              <p className="text-sm text-muted-foreground">{mapError}</p>
            ) : (
              <>
                <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default LiveRiderTracking;
