import { motion } from "framer-motion";
import jollofImage from "@/assets/jollof-egusi.png";

const FoodHero = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass-card overflow-hidden mb-8"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 p-6">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Today's Special 🔥
          </h2>
          <p className="text-muted-foreground font-body text-sm mb-4">
            Smoky jollof rice with creamy egusi soup, assorted meat & fried plantains. Order now before it's gone!
          </p>
          <button className="bg-primary text-primary-foreground font-body font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Order Now — ₦2,500
          </button>
        </div>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-full md:w-72 h-56 rounded-xl overflow-hidden flex-shrink-0"
        >
          <img
            src={jollofImage}
            alt="Jollof rice with egusi soup and fried plantains"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FoodHero;
