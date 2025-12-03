import { validateRNC, calculateInvoiceTotals, formatNCF } from '../src/utils/fiscalUtils';
import { InvoiceItem } from '../src/types';

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

  // --- 1. Validate RNC/Cédula ---
  console.log('\n--- RNC/Cédula Validation ---');

  // Known Valid Cédulas (Public figures for testing algorithms)
  // Danilo Medina: 001-0068308-5 (11 digits: 00100683085)
  // Leonel Fernandez: 001-0072462-4 (11 digits: 00100724624)
  const validCedulas = [
    '00100683085',
    '00100724624'
  ];

  // Known Valid RNCs (Juridical)
  // Claro: 1-01-00157-7 (9 digits: 101001577)
  // Banco Popular: 1-01-01063-2 (9 digits: 101010632)
  const validRNCs = [
    '101001577',
    '101010632'
  ];

  const invalidIDs = [
    '000000000',   // Too short/invalid
    '123456789',   // Sequential
    '101001578',   // Modified valid RNC (last digit changed)
    '00100683081', // Modified valid Cedula (last digit changed)
    'abcdefg',     // Non-numeric
  ];

  validCedulas.forEach(id => assert(validateRNC(id), `Valid Cédula ${id} should pass`));
  validRNCs.forEach(id => assert(validateRNC(id), `Valid RNC ${id} should pass`));
  invalidIDs.forEach(id => assert(!validateRNC(id), `Invalid ID ${id} should fail`));


  // --- 2. Calculations ---
  console.log('\n--- Totals Calculation ---');
  const items: InvoiceItem[] = [
    {
      productId: 1,
      productCode: 'A',
      productName: 'Item A',
      quantity: 2,
      unitPrice: 100,
      taxRate: 0.18,
      subtotal: 200, // 2 * 100
      taxAmount: 36, // 200 * 0.18
      total: 236     // 200 + 36
    },
    {
      productId: 2,
      productCode: 'B',
      productName: 'Item B',
      quantity: 1,
      unitPrice: 50,
      taxRate: 0,
      subtotal: 50,
      taxAmount: 0,
      total: 50
    }
  ];

  const totals = calculateInvoiceTotals(items);
  assert(totals.subtotal === 250, 'Subtotal should be 250 (200 + 50)');
  assert(totals.totalTax === 36, 'Total Tax should be 36 (36 + 0)');
  assert(totals.totalAmount === 286, 'Total Amount should be 286 (236 + 50)');


  // --- 3. NCF Formatting ---
  console.log('\n--- NCF Formatting ---');
  const ncf1 = formatNCF('E', '31', 1);
  assert(ncf1 === 'E310000000001', `NCF format correct: ${ncf1}`);

  const ncf2 = formatNCF('E', '31', 123456);
  // It should have 10 digits for sequence. 123456 is 6 digits, so 4 zeros padding.
  // E + 31 + 0000 + 123456 = E310000123456
  assert(ncf2 === 'E310000123456', `NCF format correct with large sequence: ${ncf2}`);

  const ncf3 = formatNCF('E', '31', 1234567890);
  assert(ncf3 === 'E311234567890', `NCF format correct with max sequence: ${ncf3}`);

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runTests();
