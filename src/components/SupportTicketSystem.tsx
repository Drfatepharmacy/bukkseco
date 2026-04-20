import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Plus, Clock, CheckCircle, AlertCircle, MessageSquare, RefreshCw, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const issueCategories = [
  "Order Issue", "Payment Problem", "Delivery Complaint",
  "Account Issue", "Technical Bug", "Suggestion", "Other"
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-primary/10 text-primary",
  high: "bg-destructive/10 text-destructive",
  urgent: "bg-destructive text-destructive-foreground",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-secondary/10 text-secondary",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

interface SupportTicket {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  role: string | null;
  user_id: string;
}

interface SupportTicketSystemProps {
  viewAs?: "user" | "admin";
}

const SupportTicketSystem = ({ viewAs = "user" }: SupportTicketSystemProps) => {
  const { user, role } = useAuth();
  const isAdmin = viewAs === "admin" || role === "admin" || role === "super_admin";
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "", subject: "", message: "", priority: "normal" });
  const [adminNote, setAdminNote] = useState("");

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setTickets(data as SupportTicket[]);
    if (error) console.error("Failed to load tickets:", error);
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("You must be logged in"); return; }

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      name: user.user_metadata?.full_name || "User",
      email: user.email || "",
      role: role || "user",
      category: form.category,
      subject: form.subject,
      message: form.message,
      priority: form.priority,
    } as any);

    if (error) {
      toast.error("Failed to create ticket");
      console.error(error);
    } else {
      toast.success("Support ticket created!");
      setForm({ category: "", subject: "", message: "", priority: "normal" });
      setShowForm(false);
      loadTickets();
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status } as any).eq("id", ticketId);
    toast.success(`Ticket marked as ${status}`);
    loadTickets();
  };

  const addAdminNote = async (ticketId: string) => {
    if (!adminNote.trim()) return;
    await supabase.from("support_tickets").update({
      admin_notes: adminNote,
      resolved_by: user?.id,
    } as any).eq("id", ticketId);
    toast.success("Admin note added");
    setAdminNote("");
    loadTickets();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="w-3.5 h-3.5" />;
      case "in_progress": return <Clock className="w-3.5 h-3.5" />;
      case "resolved": return <CheckCircle className="w-3.5 h-3.5" />;
      default: return <Ticket className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          {isAdmin ? "Support Tickets" : "My Support Tickets"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTickets} className="font-body text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          {!isAdmin && (
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="font-body text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Create Ticket Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="glass-card p-5 space-y-4"
          >
            <h3 className="font-display text-sm font-semibold text-foreground">Submit a Ticket</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-muted-foreground">Category</Label>
                <select
                  required
                  className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {issueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-muted-foreground">Priority</Label>
                <select
                  className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {["low", "normal", "high", "urgent"].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-muted-foreground">Subject</Label>
              <Input required placeholder="Brief description" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-muted/50 font-body text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-muted-foreground">Message</Label>
              <Textarea required rows={4} placeholder="Describe your issue..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-muted/50 font-body text-sm" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="font-body text-xs">
                <Send className="w-3.5 h-3.5 mr-1" /> Submit Ticket
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="font-body text-xs">Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {isAdmin ? "No support tickets yet" : "You haven't submitted any tickets yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <motion.div key={ticket.id} layout className="glass-card overflow-hidden">
              <button
                onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-body font-mono text-muted-foreground">{ticket.ticket_number}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[ticket.status] || ""}`}>
                      {statusIcon(ticket.status)}
                      <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${priorityColors[ticket.priority] || ""}`}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
                  </div>
                  <p className="text-sm font-body font-medium text-foreground truncate">{ticket.subject}</p>
                  {isAdmin && (
                    <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                      by {ticket.name} ({ticket.email}) • {ticket.role}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground font-body">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedTicket === ticket.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedTicket === ticket.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground font-body mb-1">Message:</p>
                        <p className="text-sm font-body text-foreground whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      {ticket.admin_notes && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs text-primary font-body font-semibold mb-1">
                            <MessageSquare className="w-3 h-3 inline mr-1" /> Admin Response:
                          </p>
                          <p className="text-sm font-body text-foreground">{ticket.admin_notes}</p>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add admin note/response..."
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              className="bg-muted/50 font-body text-xs"
                            />
                            <Button size="sm" onClick={() => addAdminNote(ticket.id)} className="font-body text-xs shrink-0">
                              Reply
                            </Button>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {["open", "in_progress", "resolved", "closed"].map((s) => (
                              <Button
                                key={s}
                                variant={ticket.status === s ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateTicketStatus(ticket.id, s)}
                                className="font-body text-[10px] h-7"
                              >
                                {s.replace("_", " ")}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTicketSystem;
