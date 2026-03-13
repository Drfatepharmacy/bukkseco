import { motion } from "framer-motion";
import { MessageCircleQuestion } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SupportButton = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring" }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate("/support")}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center"
      title="Support"
    >
      <MessageCircleQuestion className="w-6 h-6" />
    </motion.button>
  );
};

export default SupportButton;
