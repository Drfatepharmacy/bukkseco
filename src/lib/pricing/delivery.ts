/**
 * Calculates the dynamic delivery fee based on the cart total and optional vendor multiplier.
 *
 * Logic:
 * - < ₦2,000 -> ₦500
 * - < ₦5,000 -> ₦800
 * - < ₦10,000 -> ₦1,200
 * - >= ₦10,000 -> ₦1,500
 *
 * @param cartTotal The total amount of items in the cart
 * @param vendorMultiplier Optional multiplier set by the vendor
 * @returns The calculated delivery fee
 */
export function calculateDeliveryFee(cartTotal: number, vendorMultiplier: number = 1.0): number {
  let baseFee = 0;

  if (cartTotal < 2000) {
    baseFee = 500;
  } else if (cartTotal < 5000) {
    baseFee = 800;
  } else if (cartTotal < 10000) {
    baseFee = 1200;
  } else {
    baseFee = 1500;
  }

  return baseFee * vendorMultiplier;
}

/**
 * Returns the breakdown of a checkout total.
 */
export function getOrderBreakdown(subtotal: number, vendorMultiplier: number = 1.0) {
  const deliveryFee = calculateDeliveryFee(subtotal, vendorMultiplier);
  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee
  };
}
