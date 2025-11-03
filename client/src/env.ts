// Validate required environment variables
const isProduction = import.meta.env.PROD;

if (isProduction && !import.meta.env.VITE_API_URL) {
  throw new Error(
    'Missing required environment variable: VITE_API_URL is required in production. ' +
    'Please set it to your API server URL.'
  );
}

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'),
  vercelBypassToken: import.meta.env.VITE_VERCEL_PROTECTION_BYPASS,
};
