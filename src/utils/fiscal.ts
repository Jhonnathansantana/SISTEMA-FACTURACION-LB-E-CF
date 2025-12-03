
export const ITBIS_RATES = {
  STANDARD: 0.18,
  REDUCED: 0.16,
  EXEMPT: 0.00,
};

/**
 * Validates an RNC or Cedula using the Module 11 algorithm.
 * @param rnc The RNC (9 digits) or Cedula (11 digits) string.
 * @returns True if valid, false otherwise.
 */
export function validateRNC(rnc: string): boolean {
  const cleanRNC = rnc.replace(/[^\d]/g, '');

  if (cleanRNC.length === 9) {
    return validateCorporateRNC(cleanRNC);
  } else if (cleanRNC.length === 11) {
    return validateCedula(cleanRNC);
  }

  return false;
}

function validateCorporateRNC(rnc: string): boolean {
  const weights = [7, 9, 8, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += parseInt(rnc[i]) * weights[i];
  }

  const remainder = sum % 11;
  let checkDigit = 0;

  if (remainder === 0) {
    checkDigit = 2;
  } else if (remainder === 1) {
    checkDigit = 1;
  } else {
    checkDigit = 11 - remainder;
  }

  return checkDigit === parseInt(rnc[8]);
}

function validateCedula(cedula: string): boolean {
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    let product = parseInt(cedula[i]) * weights[i];
    if (product >= 10) {
      const productStr = product.toString();
      product = parseInt(productStr[0]) + parseInt(productStr[1]);
    }
    sum += product;
  }

  const remainder = sum % 10;
  const checkDigit = (10 - remainder) % 10;

  return checkDigit === parseInt(cedula[10]);
}

/**
 * Validates the format of an e-NCF.
 * Format: E + Type (2 digits) + Sequence (10 digits) = 13 characters total.
 * @param ncf The NCF string.
 * @returns True if the format is correct.
 */
export function validateNCFFormat(ncf: string): boolean {
  // Format: E + 2 digits + 10 digits
  const regex = /^E\d{12}$/;
  return regex.test(ncf);
}

/**
 * Calculates ITBIS for a given amount and rate type.
 * @param amount The base amount.
 * @param rateType 'STANDARD', 'REDUCED', or 'EXEMPT'.
 * @returns The calculated tax amount rounded to 2 decimal places.
 */
export function calculateITBIS(amount: number, rateType: keyof typeof ITBIS_RATES): number {
  const rate = ITBIS_RATES[rateType];
  const tax = amount * rate;
  return Math.round((tax + Number.EPSILON) * 100) / 100;
}
