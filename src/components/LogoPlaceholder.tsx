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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center"
    >
      <span className={`font-display font-bold tracking-tight ${sizes[size]} text-primary`}>
        bukks
      </span>
    </motion.div>
  );
};

export default LogoPlaceholder;
