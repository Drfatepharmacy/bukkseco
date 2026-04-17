import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { getCartItemSavings } from "@/lib/pricing/groupBuy";

export interface CartItem {
  meal: any;
  quantity: number;
  groupBuySelected: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (meal: any) => void;
  updateQuantity: (mealId: string, delta: number) => void;
  removeFromCart: (mealId: string) => void;
  toggleGroupBuy: (mealId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  discountTotal: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("bukks-cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("bukks-cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (meal: any) => {
    if (meal.stock_quantity !== null && meal.stock_quantity !== undefined && meal.stock_quantity <= 0) {
      toast.error("This item is out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.meal.id === meal.id);
      if (existing) {
        return prev.map((c) => (c.meal.id === meal.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { meal, quantity: 1, groupBuySelected: false }];
    });
    toast.success(`${meal.name} added to cart`);
  };

  const updateQuantity = (mealId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.meal.id === mealId) {
            const newQty = c.quantity + delta;
            return newQty <= 0 ? c : { ...c, quantity: newQty };
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (mealId: string) => {
    setCart((prev) => prev.filter((c) => c.meal.id !== mealId));
  };

  const toggleGroupBuy = (mealId: string) => {
    setCart((prev) =>
      prev.map((c) => (c.meal.id === mealId ? { ...c, groupBuySelected: !c.groupBuySelected } : c))
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.meal.price) * c.quantity, 0);

  const discountTotal = cart.reduce((sum, c) => sum + getCartItemSavings(c), 0);

  const grandTotal = cartTotal - discountTotal;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        toggleGroupBuy,
        clearCart,
        cartTotal,
        discountTotal,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
