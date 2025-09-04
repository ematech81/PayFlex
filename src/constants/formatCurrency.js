export const formatCurrency = (amount, currencyCode) => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedAmount = formatter.format(amount);
  const symbols = { NGN: '₦', USD: '$', EUR: '€' };
  const currencySymbol = symbols[currencyCode] || '₦';
  return `${currencySymbol}${formattedAmount}`;
};
