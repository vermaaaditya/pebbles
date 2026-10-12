/**
 * Simple billing and discount calculator (Verified Bugfix by Pebbles Builder)
 */
export function calculateInvoice(items, discountRate = 0) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // FIXED: Discount properly subtracted from subtotal
  const discountAmount = subtotal * discountRate;
  const total = subtotal - discountAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount: items.reduce((count, item) => count + item.quantity, 0)
  };
}
