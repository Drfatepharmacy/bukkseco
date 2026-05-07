import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PendingApprovalScreen = ({ roleLabel }: { roleLabel: string }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md geo-card p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Account submitted</h1>
        <p className="text-sm text-muted-foreground font-body mb-6">
          Your {roleLabel} account is pending admin approval. You'll receive an
          email once verified — usually within 24 hours.
        </p>
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground font-body mb-6">
          <Clock className="w-3.5 h-3.5" />
          <span>Verification in progress</span>
        </div>
        <Button onClick={() => navigate("/login")} className="w-full btn-gold">
          Go to Login
        </Button>
      </motion.div>
    </div>
  );
};

export default PendingApprovalScreen;
