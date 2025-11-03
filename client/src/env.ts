// Validate required environment variables
if (!import.meta.env.VITE_API_URL) {
  throw new Error(
    'Missing required environment variable: VITE_API_URL. ' +
    'Please set it to your API server URL (e.g., http://localhost:3000/api or https://api.example.com/api)'
  );
}

export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  vercelBypassToken: import.meta.env.VITE_VERCEL_PROTECTION_BYPASS,
};
