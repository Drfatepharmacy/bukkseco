import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoPlaceholder from "@/components/LogoPlaceholder";

interface StepShellProps {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  hideNext?: boolean;
}

const StepShell = ({
  title,
  subtitle,
  step,
  total,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  loading,
  children,
  hideNext,
}: StepShellProps) => {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="geo-card p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-body"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <LogoPlaceholder size="sm" />

          <div className="mt-4 mb-1 flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
            <span className="text-xs font-body text-muted-foreground">
              Step {step} of {total}
            </span>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-body mb-4">{subtitle}</p>
          )}

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted/40 mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="space-y-4">{children}</div>

          {!hideNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || loading}
              className="w-full mt-6 btn-gold py-5 text-base"
            >
              {loading ? "Please wait..." : nextLabel}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StepShell;
