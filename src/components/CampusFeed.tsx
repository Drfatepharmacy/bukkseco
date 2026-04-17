import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Clock, Tag, Image as ImageIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["general", "events", "sports", "academics", "food", "deals", "announcements"];

interface Activity {
  id: string;
  title: string;
  content: string;
  category: string;
  posted_by: string;
  image_url: string | null;
  created_at: string;
  posterName?: string;
}

interface CampusFeedProps {
  onSelectUser?: (userId: string) => void;
}

const CampusFeed = ({ onSelectUser }: CampusFeedProps) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filterCat, setFilterCat] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("campus_activities")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (data) {
        const posterIds = [...new Set(data.map((a) => a.posted_by))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", posterIds);
        const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
        setActivities(data.map((a) => ({ ...a, posterName: profileMap[a.posted_by] || "Unknown" })));
      }
    };
    fetchActivities();

    // Realtime subscription
    const channel = supabase
      .channel("campus-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "campus_activities" }, async (payload) => {
        const newActivity = payload.new as Activity;
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", newActivity.posted_by).single();
        setActivities((prev) => [{ ...newActivity, posterName: profile?.full_name || "Unknown" }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const postActivity = async () => {
    if (!user || !title.trim() || !content.trim()) {
      toast({ title: "Fill in title and content", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("campus_activities").insert({
      title: title.trim(),
      content: content.trim(),
      category,
      posted_by: user.id,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to post", variant: "destructive" });
    } else {
      toast({ title: "Posted to campus feed!" });
      setShowForm(false);
      setTitle("");
      setContent("");
    }
  };

  const filtered = filterCat === "all" ? activities : activities.filter((a) => a.category === filterCat);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const catColors: Record<string, string> = {
    events: "bg-primary/10 text-primary",
    sports: "bg-success/10 text-success",
    academics: "bg-secondary/10 text-secondary",
    food: "bg-primary/10 text-primary",
    deals: "bg-success/10 text-success",
    announcements: "bg-destructive/10 text-destructive",
    general: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> Campus Feed
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Post
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...CATEGORIES].map((cat) => (
          <Badge
            key={cat}
            variant={filterCat === cat ? "default" : "outline"}
            className="cursor-pointer capitalize whitespace-nowrap"
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-border">
              <CardContent className="p-4 space-y-3">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="font-body" />
                <Textarea placeholder="What's happening on campus?" value={content} onChange={(e) => setContent(e.target.value)} className="font-body" />
                <div className="flex items-center gap-3">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={postActivity} disabled={loading} className="ml-auto">
                    <Send className="w-4 h-4 mr-1" /> {loading ? "Posting..." : "Post"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground font-body">No activities yet</CardContent></Card>
        ) : (
          filtered.map((activity, i) => (
            <motion.div key={activity.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      className={`w-9 h-9 mt-0.5 ${onSelectUser ? "cursor-pointer" : ""}`}
                      onClick={() => onSelectUser?.(activity.posted_by)}
                    >
                      <AvatarFallback className="bg-primary/10 text-primary font-display text-xs">
                        {activity.posterName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-display text-sm font-semibold text-foreground ${onSelectUser ? "cursor-pointer hover:underline" : ""}`}
                          onClick={() => onSelectUser?.(activity.posted_by)}
                        >
                          {activity.posterName}
                        </span>
                        <Badge className={`text-[10px] ${catColors[activity.category] || catColors.general}`}>
                          {activity.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />{timeAgo(activity.created_at)}
                        </span>
                      </div>
                      <h4 className="font-display text-sm font-semibold text-foreground">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground font-body mt-1">{activity.content}</p>
                    </div>
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

export default CampusFeed;
