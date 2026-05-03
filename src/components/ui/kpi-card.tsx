import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "secondary" | "success" | "destructive" | "purple" | "gold";

const toneMap: Record<KpiTone, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  purple: "bg-purple/10 text-purple",
  gold: "bg-gold/10 text-gold",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  tone?: KpiTone;
  trend?: string;
  delay?: number;
  className?: string;
}

/**
 * KPI tile mirroring the AnalyticsDashboard "Financials" visual language:
 * glass-card surface, tone-colored icon chip, display number, body label.
 */
export const KpiCard = ({
  label,
  value,
  prefix,
  suffix,
  icon: Icon,
  tone = "primary",
  trend,
  delay = 0,
  className,
}: KpiCardProps) => {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("glass-card p-4", className)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", toneMap[tone])}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className="text-[10px] font-bold opacity-50 font-body">{trend}</span>
        )}
      </div>
      <p className="text-lg font-display font-bold text-foreground">
        {prefix}{display}{suffix}
      </p>
      <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{label}</span>
    </motion.div>
  );
};

export default KpiCard;
