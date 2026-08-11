import { motion } from "framer-motion";
import { UtensilsCrossed, ShoppingBasket, Users, Compass } from "lucide-react";

interface CommandDeckProps {
  onSelect: (zone: "eat" | "shop" | "together" | "discover") => void;
}

/**
 * Bukks Command Deck — one asymmetric surface, four zones.
 * Eat carries the most visual weight.
 */
const CommandDeck = ({ onSelect }: CommandDeckProps) => {
  const zone =
    "relative overflow-hidden text-left p-4 rounded-2xl transition-all duration-300 group";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Command deck"
      className="surface-feature p-3 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2"
    >
      <button
        onClick={() => onSelect("eat")}
        className={`${zone} col-span-2 row-span-2 md:col-span-2 min-h-[150px] bg-[linear-gradient(150deg,hsl(var(--violet)/0.28),hsl(var(--cyan)/0.10))]`}
      >
        <span className="micro-label text-foreground/60">Hungry now</span>
        <h3 className="mt-2 font-display text-2xl font-bold text-foreground">Eat</h3>
        <p className="mt-1 max-w-[16ch] font-body text-xs text-muted-foreground">
          Hot meals from campus kitchens, delivered.
        </p>
        <UtensilsCrossed className="absolute -bottom-3 -right-2 h-20 w-20 text-primary/25 transition-transform duration-500 group-hover:scale-110" />
      </button>

      <button onClick={() => onSelect("shop")} className={`${zone} bg-utility min-h-[70px]`}>
        <ShoppingBasket className="h-5 w-5 text-accent" />
        <h4 className="mt-2 font-display text-sm font-semibold text-foreground">Shop</h4>
        <p className="font-body text-[11px] text-faint">Farm & market</p>
      </button>

      <button onClick={() => onSelect("together")} className={`${zone} bg-utility min-h-[70px]`}>
        <Users className="h-5 w-5 text-success" />
        <h4 className="mt-2 font-display text-sm font-semibold text-foreground">Together</h4>
        <p className="font-body text-[11px] text-faint">Group buys</p>
      </button>

      <button
        onClick={() => onSelect("discover")}
        className={`${zone} col-span-2 bg-utility min-h-[70px] flex items-center gap-3`}
      >
        <Compass className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground">Discover</h4>
          <p className="font-body text-[11px] text-faint">What's moving on campus</p>
        </div>
      </button>
    </motion.section>
  );
};

export default CommandDeck;
