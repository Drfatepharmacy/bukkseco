export function isGroupBuyActive(item: { meal: any; quantity: number; groupBuySelected: boolean }): boolean {
  const { meal, quantity, groupBuySelected } = item;
  return !!(
    meal.group_buy_enabled &&
    groupBuySelected &&
    quantity >= (meal.group_buy_min_qty || 5)
  );
}

export function getCartItemPrice(item: { meal: any; quantity: number; groupBuySelected: boolean }): number {
  const basePrice = Number(item.meal.price);
  if (isGroupBuyActive(item)) {
    const discountPercent = item.meal.group_buy_discount_percent || 10;
    return basePrice * (1 - discountPercent / 100);
  }
  return basePrice;
}

export function getCartItemSavings(item: { meal: any; quantity: number; groupBuySelected: boolean }): number {
  const basePrice = Number(item.meal.price);
  const discountedPrice = getCartItemPrice(item);
  return (basePrice - discountedPrice) * item.quantity;
}
