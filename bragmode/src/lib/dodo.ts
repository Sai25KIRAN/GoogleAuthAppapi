import DodoPayments from 'dodopayments';

const apiKey = process.env.DODO_PAYMENTS_API_KEY || 'placeholder-dodo-api-key';

if (!apiKey) {
  console.warn('Warning: DODO_PAYMENTS_API_KEY is missing.');
}

// Dynamically select sandbox/live endpoint depending on key prefix or environment variable
const isLive = apiKey.startsWith('live_') || process.env.DODO_ENVIRONMENT === 'live_mode';
const environment = isLive ? 'live_mode' : 'test_mode';

console.log(`Dodo Payments client initialized in: ${environment}`);

export const dodo = new DodoPayments({
  bearerToken: apiKey,
  environment: environment,
});
