import test from 'node:test';
import assert from 'node:assert';
import { calculateInvoice } from '../src/calculator.js';

test('calculateInvoice computes total with discount correctly', () => {
  const items = [
    { name: 'Widget A', price: 10.0, quantity: 2 },
    { name: 'Widget B', price: 15.0, quantity: 1 }
  ];
  // Subtotal: 35.00, discountRate 0.10 -> discount 3.50, total 31.50
  const result = calculateInvoice(items, 0.10);
  assert.strictEqual(result.subtotal, 35.00);
  assert.strictEqual(result.discountAmount, 3.50);
  assert.strictEqual(result.total, 31.50);
  assert.strictEqual(result.itemCount, 3);
});

test('calculateInvoice handles zero discount', () => {
  const items = [{ name: 'Solo', price: 50.0, quantity: 1 }];
  const result = calculateInvoice(items, 0);
  assert.strictEqual(result.total, 50.00);
});
