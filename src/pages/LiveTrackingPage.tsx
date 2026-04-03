import LiveRiderTracking from "@/components/LiveRiderTracking";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LiveTrackingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">Live Rider Tracking</h1>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            {user?.email || "Real-time GPS tracking"}
          </p>
        </div>
        <LiveRiderTracking />
      </div>
    </div>
  );
};

export default LiveTrackingPage;
