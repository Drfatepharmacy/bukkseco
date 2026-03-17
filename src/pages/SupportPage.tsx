import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

const issueCategories = [
  "Order Issue", "Payment Problem", "Delivery Complaint",
  "Account Issue", "Technical Bug", "Suggestion", "Other"
];

const SupportPage = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (user) {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        name: form.name || user.user_metadata?.full_name || "User",
        email: form.email || user.email || "",
        role: form.role || role || "buyer",
        category: form.category,
        subject: form.subject,
        message: form.message,
      } as any);

      if (error) {
        toast.error("Failed to submit ticket. Please try again.");
        console.error(error);
        setSubmitting(false);
        return;
      }
    }

    const ticketId = `BKS-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
    toast.success(`Ticket ${ticketId} created! We'll get back to you soon.`);
    setForm({});
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Support Center</h1>
          <p className="text-muted-foreground font-body mb-8">Having an issue? Submit a ticket and we'll get back to you.</p>

          <form onSubmit={handleSubmit} className="geo-card p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Name</Label>
                <Input required placeholder="Your name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Email</Label>
                <Input required type="email" placeholder="you@email.com" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Your Role</Label>
                <select required className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body" value={form.role || ""} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="">Select role</option>
                  {["Buyer", "Vendor", "Farmer", "Rider"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Issue Category</Label>
                <select required className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category</option>
                  {issueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Subject</Label>
              <Input required placeholder="Brief description" value={form.subject || ""} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Message</Label>
              <Textarea required rows={5} placeholder="Describe your issue in detail..." value={form.message || ""} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full btn-gold text-base py-5">
              <Send className="w-4 h-4 mr-2" /> {submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </form>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportPage;
