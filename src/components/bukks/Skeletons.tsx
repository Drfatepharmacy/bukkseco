import { LucideIcon } from "lucide-react";

const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-lg bg-utility ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
  </div>
);

export const VendorSkeleton = () => (
  <div className="surface-feature p-4 space-y-3">
    <Shimmer className="aspect-[16/9] w-full rounded-2xl" />
    <Shimmer className="h-4 w-2/3" />
    <Shimmer className="h-3 w-1/3" />
  </div>
);

export const ProductSkeleton = () => (
  <div className="space-y-3">
    <Shimmer className="aspect-[4/3] w-full rounded-2xl" />
    <Shimmer className="h-3.5 w-3/4" />
    <Shimmer className="h-3 w-1/4" />
  </div>
);

export const OrderSkeleton = () => (
  <div className="surface-utility p-4 space-y-4">
    <div className="flex items-center justify-between">
      <Shimmer className="h-3 w-24" />
      <Shimmer className="h-3 w-16" />
    </div>
    <Shimmer className="h-px w-full" />
    <Shimmer className="h-3 w-1/2" />
  </div>
);

export const PulseSkeleton = () => (
  <div className="surface-feature p-5 space-y-3">
    <Shimmer className="h-2.5 w-20" />
    <Shimmer className="h-5 w-3/5" />
    <Shimmer className="h-3 w-2/5" />
  </div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-utility">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
    {hint && <p className="mt-1 max-w-xs font-body text-sm text-muted-foreground">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default Shimmer;
