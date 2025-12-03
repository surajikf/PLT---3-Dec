/**
 * Format number as Indian Rupee currency
 */
export const formatCurrency = (amount: number | null | undefined, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showSymbol = true
  } = options || {};

  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format currency for tooltips and charts
 */
export const formatCurrencyTooltip = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '₹0';
  return `₹${numValue.toLocaleString('en-IN')}`;
};

