import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, X, Wallet, CreditCard, Loader2 } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { calculateDeliveryFee } from "@/lib/pricing/delivery";
import { getCartItemPrice } from "@/lib/pricing/groupBuy";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { CAMPUS_DELIVERY_POINTS } from "@/config/campus";

const PAYSTACK_PUBLIC_KEY = "pk_live_efc7f697d85e3814c0eac669cb42221df8cb1ba1";
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const checkoutSchema = z.object({
  spot: z.string().min(1, "Choose a delivery point"),
  phone: z.string().trim().regex(/^(\+?234|0)[789]\d{9}$/, "Enter a valid Nigerian phone number"),
  note: z.string().trim().max(200, "Note is too long"),
});

type PayMethod = "paystack" | "wallet";

const PayButton = ({
  amount, email, disabled, label, onPaid,
}: { amount: number; email: string; disabled: boolean; label: string; onPaid: (ref: string) => void }) => {
  const init = usePaystackPayment({
    reference: `BKS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    amount: Math.round(amount * 100),
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: "NGN",
  });
  return (
    <button
      disabled={disabled}
      onClick={() => init({ onSuccess: (r: any) => onPaid(r.reference), onClose: () => toast.info("Payment cancelled") })}
      className="h-14 w-full rounded-xl bg-primary font-display text-base font-bold text-primary-foreground disabled:opacity-50"
    >
      {label}
    </button>
  );
};

const CartSheet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSound } = useSoundNotification();
  const { cart, updateQuantity, removeFromCart, clearCart, grandTotal } = useCart();
  const [open, setOpen] = useState(false);
  const [spot, setSpot] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PayMethod>("paystack");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const count = cart.reduce((s, c) => s + c.quantity, 0);
  const vendorIds = Array.from(new Set(cart.map((c) => c.meal.vendor_id)));
  const feeFor = (sub: number, items: typeof cart) =>
    calculateDeliveryFee(sub, items[0]?.meal.vendor?.delivery_multiplier || 1);
  const groups = vendorIds.map((vid) => {
    const items = cart.filter((c) => c.meal.vendor_id === vid);
    const sub = items.reduce((s, c) => s + getCartItemPrice(c) * c.quantity, 0);
    return { vid, items, sub, fee: feeFor(sub, items) };
  });
  const deliveryTotal = groups.reduce((s, g) => s + g.fee, 0);
  const total = grandTotal + deliveryTotal;

  const parsed = checkoutSchema.safeParse({ spot, phone, note });
  const validate = () => {
    if (parsed.success) { setErrors({}); return true; }
    const e: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (e[String(i.path[0])] = i.message));
    setErrors(e);
    return false;
  };

  const createOrders = async (paymentRef: string | null) => {
    const notes = [`Phone: ${phone.trim()}`, note.trim() && `Note: ${note.trim()}`].filter(Boolean).join(" · ");
    const ids: string[] = [];
    for (const g of groups) {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          buyer_id: user!.id,
          vendor_id: g.vid,
          subtotal: g.sub,
          delivery_fee: g.fee,
          total_amount: g.sub + g.fee,
          delivery_address: spot,
          notes,
          payment_reference: paymentRef,
          payment_status: paymentRef ? "verifying" : "pending",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: itemsErr } = await supabase.from("order_items").insert(
        g.items.map((c) => ({ order_id: order.id, meal_id: c.meal.id, quantity: c.quantity, unit_price: getCartItemPrice(c) })),
      );
      if (itemsErr) throw itemsErr;
      ids.push(order.id);
    }
    return ids;
  };

  const finish = (ids: string[]) => {
    playSound("order");
    toast.success("Order placed");
    clearCart();
    setOpen(false);
    setNote("");
    navigate(`/order/${ids[0]}`);
  };

  const onPaystackPaid = async (ref: string) => {
    setBusy(true);
    try {
      const ids = await createOrders(ref);
      await Promise.all(ids.map((id) => supabase.functions.invoke("verify-payment", { body: { reference: ref, order_id: id } })));
      finish(ids);
    } catch (e: any) {
      toast.error(e.message || "We couldn't save your order. Contact support with your payment reference.");
    } finally {
      setBusy(false);
    }
  };

  const payWithWallet = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const ids = await createOrders(null);
      for (const id of ids) {
        const { data, error } = await supabase.functions.invoke("wallet-checkout", { body: { order_id: id } });
        if (error || data?.error) {
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
          throw new Error(data?.error?.includes("Insufficient") ? "Not enough money in your wallet" : "Wallet payment failed");
        }
      }
      finish(ids);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (count === 0) return null;

  return (
    <>
      {!open && (
        <motion.button
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => setOpen(true)}
          className="fixed inset-x-3 z-30 flex h-14 items-center justify-between rounded-xl bg-primary px-4 text-primary-foreground"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
        >
          <span className="flex items-center gap-2 font-body text-sm font-semibold">
            <ShoppingBag className="h-5 w-5" /> {count} item{count > 1 ? "s" : ""}
          </span>
          <span className="font-display text-base font-bold">View cart · {naira(grandTotal)}</span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-background/70"
            onClick={() => !busy && setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-3xl border-t border-border bg-card"
              role="dialog" aria-label="Your cart"
            >
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" />
              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="font-display text-xl font-bold text-foreground">Your order</h2>
                <button aria-label="Close" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
                <ul className="divide-y divide-border">
                  {cart.map((c) => (
                    <li key={c.meal.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-sm font-semibold text-foreground">{c.meal.name}</p>
                        <p className="font-body text-sm text-primary">{naira(getCartItemPrice(c) * c.quantity)}</p>
                      </div>
                      <div className="flex items-center rounded-full border border-border">
                        <button aria-label="Less" onClick={() => c.quantity > 1 ? updateQuantity(c.meal.id, -1) : removeFromCart(c.meal.id)} className="flex h-10 w-10 items-center justify-center">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-body text-sm">{c.quantity}</span>
                        <button aria-label="More" onClick={() => updateQuantity(c.meal.id, 1)} className="flex h-10 w-10 items-center justify-center">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <p className="font-body text-sm font-semibold text-foreground">Deliver to</p>
                  <div className="flex flex-wrap gap-2">
                    {CAMPUS_DELIVERY_POINTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setSpot(p)}
                        className={`min-h-10 rounded-full px-3 font-body text-sm ${spot === p ? "bg-primary text-primary-foreground" : "border border-border text-foreground"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {errors.spot && <p className="font-body text-xs text-destructive">{errors.spot}</p>}
                </div>

                <label className="block space-y-1.5">
                  <span className="font-body text-sm font-semibold text-foreground">Phone for the rider</span>
                  <input
                    inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080..."
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 font-body text-base text-foreground outline-none focus:border-primary"
                  />
                  {errors.phone && <span className="font-body text-xs text-destructive">{errors.phone}</span>}
                </label>

                <label className="block space-y-1.5">
                  <span className="font-body text-sm font-semibold text-foreground">Note for the vendor (optional)</span>
                  <input
                    value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. extra pepper, no onions"
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 font-body text-base text-foreground outline-none focus:border-primary"
                  />
                </label>

                <div className="space-y-2">
                  <p className="font-body text-sm font-semibold text-foreground">Pay with</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([["paystack", "Card / Transfer", CreditCard], ["wallet", "Bukks Wallet", Wallet]] as const).map(([k, label, Icon]) => (
                      <button
                        key={k} onClick={() => setMethod(k)}
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl font-body text-sm font-semibold ${method === k ? "border-2 border-primary text-primary" : "border border-border text-foreground"}`}
                      >
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                <dl className="space-y-1.5 font-body text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Food</dt><dd className="text-foreground">{naira(grandTotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Delivery{groups.length > 1 ? ` (${groups.length} vendors)` : ""}</dt><dd className="text-foreground">{naira(deliveryTotal)}</dd></div>
                  <div className="flex justify-between border-t border-border pt-2 font-display text-base font-bold"><dt className="text-foreground">Total</dt><dd className="text-primary">{naira(total)}</dd></div>
                </dl>
              </div>

              <div className="border-t border-border px-5 pt-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
                {busy ? (
                  <div className="flex h-14 items-center justify-center gap-2 font-body text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /> Placing your order…
                  </div>
                ) : method === "wallet" ? (
                  <button onClick={payWithWallet} className="h-14 w-full rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
                    Pay {naira(total)} from wallet
                  </button>
                ) : parsed.success && user ? (
                  <PayButton amount={total} email={user.email || ""} disabled={busy} label={`Pay ${naira(total)}`} onPaid={onPaystackPaid} />
                ) : (
                  <button onClick={validate} className="h-14 w-full rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
                    Pay {naira(total)}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartSheet;
