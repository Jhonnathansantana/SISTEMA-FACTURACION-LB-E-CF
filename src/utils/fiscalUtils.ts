import { InvoiceItem } from '../types';

/**
 * Validates a Dominican Republic RNC (Registro Nacional de Contribuyente) or Cédula
 * using the Modulo 11 algorithm.
 *
 * @param rnc The RNC or Cédula string to validate.
 * @returns true if valid, false otherwise.
 */
export const validateRNC = (rnc: string): boolean => {
  const str = rnc.replace(/[^\d]/g, ''); // Remove non-numeric characters

  if (str.length !== 9 && str.length !== 11) {
    return false;
  }

  if (str.length === 9) {
    return validateRNCJuridical(str);
  } else {
    return validateCedula(str);
  }
};

const validateRNCJuridical = (rnc: string): boolean => {
  const weights = [7, 9, 8, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += parseInt(rnc[i]) * weights[i];
  }

  const remainder = sum % 11;
  let digit = 0;

  if (remainder === 0) {
    digit = 2;
  } else if (remainder === 1) {
    digit = 1;
  } else {
    digit = 11 - remainder;
  }

  return digit === parseInt(rnc[8]);
};

const validateCedula = (cedula: string): boolean => {
  let sum = 0;
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

  for (let i = 0; i < 10; i++) {
    let val = parseInt(cedula[i]) * weights[i];
    if (val >= 10) {
      const valStr = val.toString();
      val = parseInt(valStr[0]) + parseInt(valStr[1]);
    }
    sum += val;
  }

  const remainder = sum % 10;
  const digit = remainder === 0 ? 0 : 10 - remainder;

  return digit === parseInt(cedula[10]);
};

/**
 * Calculates the totals for a list of invoice items.
 */
export const calculateInvoiceTotals = (items: InvoiceItem[]) => {
  let subtotal = 0;
  let totalTax = 0;
  let totalAmount = 0;

  items.forEach(item => {
    subtotal += item.subtotal;
    totalTax += item.taxAmount;
    totalAmount += item.total;
  });

  return {
    subtotal,
    totalTax,
    totalAmount
  };
};

/**
 * Generates the next NCF string based on type, serie and sequence.
 * Format: Serie (1 char) + Type (2 chars) + Sequence (10 chars, padded)
 */
export const formatNCF = (serie: string, type: string, sequence: number): string => {
  return `${serie}${type}${sequence.toString().padStart(10, '0')}`;
};
