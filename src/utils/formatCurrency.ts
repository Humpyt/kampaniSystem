import { CURRENCY_CONFIG } from '../config/currency';

export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'UGX 0';
  }
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.code,
    minimumFractionDigits: CURRENCY_CONFIG.minimumFractionDigits,
    maximumFractionDigits: CURRENCY_CONFIG.maximumFractionDigits,
  }).format(amount);
};

export function parseCurrency(value: string): number {
  const numericValue = value.replace(/[^0-9.-]+/g, '');
  return parseInt(numericValue, 10) || 0;
}