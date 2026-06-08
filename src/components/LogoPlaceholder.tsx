import { motion } from "framer-motion";
import logoAsset from "@/assets/bukks-logo.png.asset.json";

interface LogoPlaceholderProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

const sizes = {
  sm: { mark: "h-6 w-6", text: "text-xl" },
  md: { mark: "h-9 w-9", text: "text-3xl" },
  lg: { mark: "h-14 w-14", text: "text-5xl" },
};

const LogoPlaceholder = ({ size = "md", showWordmark = true }: LogoPlaceholderProps) => {
  const s = sizes[size];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      <img
        src={logoAsset.url}
        alt="Bukks logo"
        className={`${s.mark} object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)]`}
      />
      {showWordmark && (
        <span className={`font-display font-bold tracking-tight ${s.text} text-primary`}>
          bukks
        </span>
      )}
    </motion.div>
  );
};

export default LogoPlaceholder;
