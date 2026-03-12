import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef, useState } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface InteractiveChartProps {
  data: DataPoint[];
  title: string;
  color?: "primary" | "secondary" | "success";
}

const colorValues = {
  primary: { fill: "hsl(239 84% 67%)", glow: "hsl(239 84% 67% / 0.3)" },
  secondary: { fill: "hsl(187 92% 41%)", glow: "hsl(187 92% 41% / 0.3)" },
  success: { fill: "hsl(160 84% 39%)", glow: "hsl(160 84% 39% / 0.3)" },
};

const InteractiveChart = ({ data, title, color = "primary" }: InteractiveChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const mouseX = useMotionValue(0);

  const max = Math.max(...data.map((d) => d.value));
  const colors = colorValues[color];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h3 className="font-display text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((point, i) => {
          const height = (point.value / max) * 100;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-body text-foreground bg-muted px-2 py-1 rounded"
                >
                  {point.value.toLocaleString()}
                </motion.div>
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, type: "spring", stiffness: 100 }}
                className="w-full rounded-t-md transition-all duration-200 relative"
                style={{
                  background: isHovered ? colors.fill : `${colors.fill}80`,
                  boxShadow: isHovered ? `0 0 20px ${colors.glow}` : "none",
                  minHeight: 4,
                }}
              />
              <span className="text-[10px] text-muted-foreground font-body mt-1">{point.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default InteractiveChart;
