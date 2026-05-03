import { cn } from "@/lib/utils";

export interface DashboardTab<T extends string = string> {
  key: T;
  label: string;
}

interface DashboardTabsProps<T extends string> {
  tabs: DashboardTab<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}

/**
 * Pill-tab control matching AnalyticsDashboard's tab strip:
 * `flex gap-1 p-1 bg-muted rounded-lg`, primary active state.
 */
export function DashboardTabs<T extends string>({ tabs, value, onChange, className }: DashboardTabsProps<T>) {
  return (
    <div className={cn("flex gap-1 p-1 bg-muted rounded-lg w-fit overflow-x-auto", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "px-4 py-2 rounded-md text-xs font-body whitespace-nowrap transition-all",
            value === t.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default DashboardTabs;
