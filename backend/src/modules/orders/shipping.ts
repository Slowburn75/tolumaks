/** Keep in sync with frontend/src/lib/constants.ts deliveryMethods + free shipping rules */

export const FREE_SHIPPING_THRESHOLD = 50_000;

export const SHIPPING_FEES: Record<string, number> = {
  standard: 1500,
  express: 3500,
  pickup: 0,
};

export function calculateShippingFee(deliveryMethod: string | undefined, subtotal: number): number {
  const method = (deliveryMethod || 'standard').toLowerCase();

  if (method === 'pickup') return 0;

  // Free shipping on paid delivery methods when subtotal meets threshold
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;

  return SHIPPING_FEES[method] ?? SHIPPING_FEES.standard;
}
