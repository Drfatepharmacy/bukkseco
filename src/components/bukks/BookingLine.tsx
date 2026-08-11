import { motion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";

export interface BookingNode {
  label: string;
  caption?: string;
  icon?: LucideIcon;
}

interface BookingLineProps {
  nodes: BookingNode[];
  /** index of the currently active node */
  active: number;
  className?: string;
}

/**
 * Bukks Booking Line — the signature luminous path.
 * Used for order status, group-buy participants and supply chain.
 */
const BookingLine = ({ nodes, active, className = "" }: BookingLineProps) => {
  const progress = nodes.length > 1 ? Math.min(active / (nodes.length - 1), 1) : 1;

  return (
    <div className={`relative w-full ${className}`}>
      {/* track */}
      <div className="absolute left-0 right-0 top-3 h-px bg-border" />
      <motion.div
        className="absolute left-0 top-3 h-px"
        style={{ background: "linear-gradient(90deg, hsl(var(--violet)), hsl(var(--cyan)))" }}
        initial={{ width: 0 }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      {/* travelling glow */}
      <div className="absolute left-0 right-0 top-[9px] overflow-hidden h-2 pointer-events-none">
        <div className="h-full w-16 animate-booking-travel rounded-full bg-primary/40 blur-[6px]" />
      </div>

      <div className="relative flex justify-between">
        {nodes.map((node, i) => {
          const done = i < active;
          const isActive = i === active;
          const Icon = node.icon;
          return (
            <div key={node.label} className="flex flex-col items-center gap-2 text-center min-w-0 flex-1">
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                  done
                    ? "border-transparent bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary bg-canvas text-primary animate-pulse-glow"
                      : "border-border bg-canvas text-faint"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : Icon ? (
                  <Icon className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={`font-body text-[11px] leading-tight ${
                  isActive ? "text-foreground font-semibold" : done ? "text-muted-foreground" : "text-faint"
                }`}
              >
                {node.label}
                {node.caption && (
                  <span className="block text-[10px] text-faint">{node.caption}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Booking Line used as the loading indicator instead of a spinner. */
export const BookingLoader = ({ label = "Loading" }: { label?: string }) => (
  <div className="w-full max-w-xs mx-auto py-6">
    <div className="relative h-px w-full overflow-visible bg-border">
      <div className="absolute -top-1 h-2 w-20 animate-booking-travel rounded-full bg-primary/60 blur-[5px]" />
    </div>
    <p className="mt-4 text-center micro-label">{label}</p>
  </div>
);

export default BookingLine;
