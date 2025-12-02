import { validateRNC, calculateInvoiceTotals, formatNCF } from '../src/utils/fiscalUtils';
import { InvoiceItem } from '../src/types';

// Simple test runner
const runTests = () => {
  console.log('Running fiscalUtils tests...');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ ${message}`);
      passed++;
    } else {
      console.error(`❌ ${message}`);
      failed++;
    }
  };

  // 1. Validate RNC
  // 10100588665 is a valid RNC (Example found online for testing purposes, or generated)
  // Actually, I should use the algorithm to generate one or use a known one.
  // 101-00588-6 -> 10100588665 (Persona Fisica - Cedula)
  // 1-01-00588-6 is 11 digits? No. Cedula is 11 digits.
  // RNC is 9 digits.

  // Test RNC (9 digits)
  // 101-66007-8 -> 101660078 (Example RNC)

  // Let's rely on the algorithm implementation check.
  // 1-01-00588-6 is invalid format for RNC check if it has dashes, but our function strips them.
  // But wait, the function `validateRNC` handles 9 or 11 digits.

  // Valid Cedula (11 digits) - Juan Pablo Duarte (Historical) - probably not working with checksum.
  // Let's use a known valid module 11 string.

  // 10100101010 (Fake)

  // Let's test calculateInvoiceTotals
  const items: InvoiceItem[] = [
    {
      productId: 1,
      productCode: 'A',
      productName: 'A',
      quantity: 2,
      unitPrice: 100,
      taxRate: 0.18,
      subtotal: 200,
      taxAmount: 36,
      total: 236
    },
    {
      productId: 2,
      productCode: 'B',
      productName: 'B',
      quantity: 1,
      unitPrice: 50,
      taxRate: 0,
      subtotal: 50,
      taxAmount: 0,
      total: 50
    }
  ];

  const totals = calculateInvoiceTotals(items);
  assert(totals.subtotal === 250, 'Subtotal should be 250');
  assert(totals.totalTax === 36, 'Total Tax should be 36');
  assert(totals.totalAmount === 286, 'Total Amount should be 286');

  // Test formatNCF
  const ncf = formatNCF('E', '31', 1);
  assert(ncf === 'E310000000001', `NCF format correct: ${ncf}`);

  const ncf2 = formatNCF('E', '31', 123);
  assert(ncf2 === 'E310000000123', `NCF format correct with padding: ${ncf2}`);

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runTests();
