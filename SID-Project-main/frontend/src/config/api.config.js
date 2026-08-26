// config/api.config.js
// API Configuration для production

// Адрес боевого сервера задаётся в app.json → expo.extra.apiUrl и не хранится
// в коде: собранная с чужим адресом сборка молча уходит не туда.
import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra ?? {};

const ENV = {
  development: {
    API_URL: 'http://localhost:3000/api/v1',
    WS_URL: 'ws://localhost:3000',
    TIMEOUT: 10000,
  },
  production: {
    API_URL: extra.apiUrl ? `${extra.apiUrl}/api/v1` : null,
    WS_URL: extra.wsUrl ?? null,
    TIMEOUT: 15000,
  }
};

// Автоматическое определение окружения
const environment = __DEV__ ? 'development' : 'production';

export const API_CONFIG = ENV[environment];

if (!API_CONFIG.API_URL) {
  throw new Error(
    'Не задан адрес сервера. Укажите expo.extra.apiUrl в app.json перед сборкой релиза.'
  );
}

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // Requests
  REQUESTS: '/requests',
  REQUEST_BY_ID: (id) => `/requests/${id}`,
  
  // Categories
  CATEGORIES: '/categories',
  
  // User Profile
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/profile/password',
  
  // Upload
  UPLOAD: '/upload',
  
  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_STATS: '/admin/stats',
};

export default API_CONFIG;
