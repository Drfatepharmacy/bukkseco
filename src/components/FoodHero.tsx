import { motion } from "framer-motion";
import jollofImage from "@/assets/jollof-egusi.png";

const FoodHero = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl mb-8 min-h-[340px] md:min-h-[420px] flex items-end p-6 md:p-10 isolate"
    >
      {/* Foreground image card on top of section */}
      <motion.img
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        src={jollofImage}
        alt="Smoky jollof rice with egusi soup and fried plantains"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
      {/* Readable gradient over image */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-background/10" />

      <div className="relative max-w-lg">
        <span className="inline-block text-[11px] uppercase tracking-[0.2em] text-primary font-body font-bold mb-3">
          Today's Special
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
          Smoky Jollof + Egusi
        </h2>
        <p className="text-muted-foreground font-body text-sm md:text-base mb-5 max-w-md">
          Creamy egusi soup, assorted meat & fried plantains. Order now before it's gone!
        </p>
        <button className="bg-primary text-primary-foreground font-body font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
          Order Now — ₦2,500
        </button>
      </div>
    </motion.div>
  );
};

export default FoodHero;
