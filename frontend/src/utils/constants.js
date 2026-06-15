export const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially Refunded' },
  { value: 'canceled', label: 'Canceled' },
];

export const CURRENCIES = [
  { value: 'usd', label: 'USD — US Dollar' },
  { value: 'eur', label: 'EUR — Euro' },
  { value: 'gbp', label: 'GBP — British Pound' },
  { value: 'inr', label: 'INR — Indian Rupee' },
  { value: 'cad', label: 'CAD — Canadian Dollar' },
  { value: 'aud', label: 'AUD — Australian Dollar' },
  { value: 'jpy', label: 'JPY — Japanese Yen' },
  { value: 'sgd', label: 'SGD — Singapore Dollar' },
];

export const REFUND_REASONS = [
  { value: 'requested_by_customer', label: 'Requested by customer' },
  { value: 'duplicate', label: 'Duplicate charge' },
  { value: 'fraudulent', label: 'Fraudulent transaction' },
];

export const REPORT_PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const STATUS_COLORS = {
  succeeded: '#10b981',
  failed: '#ef4444',
  pending: '#f59e0b',
  processing: '#3b82f6',
  refunded: '#a855f7',
  partially_refunded: '#f97316',
  canceled: '#64748b',
};

export const STRIPE_TEST_CARDS = [
  { number: '4242 4242 4242 4242', scenario: 'Successful payment', type: 'Visa' },
  { number: '4000 0000 0000 9995', scenario: 'Insufficient funds', type: 'Visa' },
  { number: '4000 0027 6000 3184', scenario: '3D Secure required', type: 'Visa' },
  { number: '4000 0000 0000 0002', scenario: 'Generic decline', type: 'Visa' },
  { number: '5555 5555 5555 4444', scenario: 'Successful payment', type: 'Mastercard' },
];
