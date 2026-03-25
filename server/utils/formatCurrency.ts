import { CURRENCY_CONFIG } from '../config/currency';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.code,
    minimumFractionDigits: CURRENCY_CONFIG.decimals,
    maximumFractionDigits: CURRENCY_CONFIG.decimals,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  const numericValue = value.replace(/[^0-9.-]+/g, '');
  return parseInt(numericValue, 10) || 0;
}
