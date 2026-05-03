import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Glass-card section wrapper used across dashboards for chart / list panels.
 * Mirrors AnalyticsDashboard's `glass-card p-5` panel with a small display heading.
 */
export const SectionCard = ({ title, icon: Icon, action, children, className, bodyClassName }: SectionCardProps) => {
  return (
    <div className={cn("glass-card p-5", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default SectionCard;
