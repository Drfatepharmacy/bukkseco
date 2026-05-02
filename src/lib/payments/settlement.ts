import { supabase } from "@/integrations/supabase/client";

export interface SettlementResult {
  status: "success" | "already_paid";
  order_id?: string;
  total?: number;
  vendor_share?: number;
  rider_share?: number;
  platform_share?: number;
  buyer_balance?: number;
}

/**
 * Pay an order from the buyer's wallet. Atomically:
 *   - debits the buyer
 *   - credits the vendor (vendor split)
 *   - credits the rider (delivery fee + rider split, if assigned)
 *   - credits the platform (commission)
 * Throws on insufficient balance or invalid order.
 */
export async function payOrderFromWallet(orderId: string): Promise<SettlementResult> {
  const { data, error } = await supabase.functions.invoke("wallet-checkout", {
    body: { order_id: orderId },
  });
  if (error) throw new Error(error.message || "Settlement failed");
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as SettlementResult;
}
