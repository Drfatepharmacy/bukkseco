import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity, Eye, Globe, Ban, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SecurityMetrics {
  totalEvents: number;
  highSeverity: number;
  unresolvedThreats: number;
  failedLogins: number;
  suspiciousIPs: number;
  recentEvents: any[];
  eventsByType: { type: string; count: number }[];
}

const SecurityDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);

    const [
      { count: totalEvents },
      { count: highSeverity },
      { count: unresolvedThreats },
      { data: recentEvents },
      { data: eventLogs },
    ] = await Promise.all([
      supabase.from("security_events").select("*", { count: "exact", head: true }),
      supabase.from("security_events").select("*", { count: "exact", head: true }).in("severity", ["high", "critical"]),
      supabase.from("security_events").select("*", { count: "exact", head: true }).eq("is_resolved", false),
      supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("event_logs").select("event_type, created_at").order("created_at", { ascending: false }).limit(200),
    ]);

    // Count failed logins from event logs
    const failedLogins = eventLogs?.filter(e => 
      e.event_type === "failed_login" || e.event_type === "auth_failure"
    ).length || 0;

    // Aggregate events by type
    const typeCounts: Record<string, number> = {};
    recentEvents?.forEach(e => {
      typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
    });
    const eventsByType = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Count unique IPs
    const uniqueIPs = new Set(recentEvents?.map(e => e.source_ip).filter(Boolean));

    setMetrics({
      totalEvents: totalEvents || 0,
      highSeverity: highSeverity || 0,
      unresolvedThreats: unresolvedThreats || 0,
      failedLogins,
      suspiciousIPs: uniqueIPs.size,
      recentEvents: recentEvents || [],
      eventsByType,
    });
    setLoading(false);
  };

  useEffect(() => { loadMetrics(); }, []);

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-destructive/10 text-destructive";
      case "medium": return "bg-secondary/10 text-secondary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Events", value: metrics?.totalEvents || 0, icon: Activity, color: "text-primary" },
    { label: "High/Critical", value: metrics?.highSeverity || 0, icon: AlertTriangle, color: "text-destructive" },
    { label: "Unresolved", value: metrics?.unresolvedThreats || 0, icon: Eye, color: "text-secondary" },
    { label: "Failed Logins", value: metrics?.failedLogins || 0, icon: Ban, color: "text-destructive" },
    { label: "Unique IPs", value: metrics?.suspiciousIPs || 0, icon: Globe, color: "text-primary" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-destructive" />
          <h2 className="font-display text-lg font-bold text-foreground">Security Intelligence</h2>
        </div>
        <Button variant="outline" size="sm" onClick={loadMetrics} className="font-body text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center"
          >
            <kpi.icon className={`w-5 h-5 mx-auto mb-2 ${kpi.color}`} />
            <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Threat Type Breakdown */}
      {metrics?.eventsByType && metrics.eventsByType.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            <TrendingUp className="w-4 h-4 inline mr-1.5" /> Event Type Distribution
          </h3>
          <div className="space-y-2">
            {metrics.eventsByType.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-body text-foreground flex-1 truncate">{item.type}</span>
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (item.count / Math.max(1, metrics.eventsByType[0].count)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-body text-muted-foreground w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Security Events */}
      <div className="glass-card p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">Recent Security Events</h3>
        {metrics?.recentEvents && metrics.recentEvents.length > 0 ? (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {metrics.recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                  event.severity === "critical" || event.severity === "high" ? "text-destructive" : "text-muted-foreground"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-body font-medium text-foreground">{event.event_type}</span>
                    <Badge variant="outline" className={`text-[10px] ${severityColor(event.severity)}`}>
                      {event.severity}
                    </Badge>
                    {!event.is_resolved && (
                      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive">unresolved</Badge>
                    )}
                  </div>
                  {event.endpoint && <p className="text-[10px] text-muted-foreground font-body font-mono">{event.endpoint}</p>}
                  {event.source_ip && <p className="text-[10px] text-muted-foreground font-body">IP: {event.source_ip}</p>}
                  <p className="text-[10px] text-muted-foreground/60 font-body">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-body text-center py-8">
            No security events recorded. Your system is clean. 🛡️
          </p>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;
