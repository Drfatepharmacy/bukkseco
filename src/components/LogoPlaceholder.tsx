import { motion } from "framer-motion";

interface LogoPlaceholderProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

const LogoPlaceholder = ({ size = "md" }: LogoPlaceholderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="flex items-center gap-2"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-lg gradient-border bg-muted/50 flex items-center justify-center">
          <span className="gradient-text font-display font-bold text-lg">B</span>
        </div>
      </div>
      <span className={`font-display font-bold tracking-tight ${sizes[size]} gradient-text`}>
        BUKKS
      </span>
    </motion.div>
  );
};

export default LogoPlaceholder;
