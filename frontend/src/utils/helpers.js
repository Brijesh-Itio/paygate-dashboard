export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(typeof amount === 'number' ? amount : parseFloat(amount) || 0);
};

export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(new Date(date));
};

export const formatDateShort = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
};

export const truncate = (str, length = 20) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const getSuccessRate = (successful, total) => {
  if (!total) return '0%';
  return `${((successful / total) * 100).toFixed(1)}%`;
};
