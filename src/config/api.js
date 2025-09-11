   // API Configuration
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

const API_CONFIG = {
  BASE_URL: 'https://stream.bancongnghe.tech',
  AUTH_URL: isDevelopment ? '/auth' : 'https://stream.bancongnghe.tech/auth', 
  ADMIN_URL: isDevelopment ? '/admin' : 'https://stream.bancongnghe.tech/admin',
  WS_URL: 'wss://stream.bancongnghe.tech', // Always use production server
};

// Debug logging
console.log('API Configuration:', {
  isDevelopment,
  isProduction,
  config: API_CONFIG
});

export default API_CONFIG;
