// services/api.service.js
// Сервис для работы с API

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS } from '../config/api.config';

// Создание axios instance
const api = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Хранилище токенов
const TOKEN_KEY = '@sid_access_token';
const REFRESH_TOKEN_KEY = '@sid_refresh_token';

// Функции для работы с токенами
export const TokenService = {
  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },
  
  async getRefreshToken() {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  async setTokens(accessToken, refreshToken) {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  
  async removeTokens() {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  },
};

// Request interceptor - добавляем токен ко всем запросам
api.interceptors.request.use(
  async (config) => {
    const token = await TokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ошибок и refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await TokenService.getRefreshToken();

      if (!refreshToken) {
        processQueue(error, null);
        await TokenService.removeTokens();
        // Навигация на экран входа должна быть обработана в App
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_CONFIG.API_URL}${ENDPOINTS.REFRESH}`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        await TokenService.setTokens(accessToken, newRefreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await TokenService.removeTokens();
        isRefreshing = false;
        // Навигация на экран входа
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const AuthAPI = {
  async login(email, password) {
    const response = await api.post(ENDPOINTS.LOGIN, { email, password });
    const { accessToken, refreshToken } = response.data.data.tokens;
    await TokenService.setTokens(accessToken, refreshToken);
    return response.data;
  },

  async register(userData) {
    const response = await api.post(ENDPOINTS.REGISTER, userData);
    const { accessToken, refreshToken } = response.data.data.tokens;
    await TokenService.setTokens(accessToken, refreshToken);
    return response.data;
  },

  async logout() {
    const refreshToken = await TokenService.getRefreshToken();
    try {
      await api.post(ENDPOINTS.LOGOUT, { refreshToken });
    } finally {
      await TokenService.removeTokens();
    }
  },

  async getCurrentUser() {
    const response = await api.get(ENDPOINTS.ME);
    return response.data;
  },
};

export const RequestAPI = {
  async getRequests(params = {}) {
    const response = await api.get(ENDPOINTS.REQUESTS, { params });
    return response.data;
  },

  async createRequest(requestData) {
    const response = await api.post(ENDPOINTS.REQUESTS, requestData);
    return response.data;
  },

  async getRequestById(id) {
    const response = await api.get(ENDPOINTS.REQUEST_BY_ID(id));
    return response.data;
  },

  async updateRequest(id, updateData) {
    const response = await api.put(ENDPOINTS.REQUEST_BY_ID(id), updateData);
    return response.data;
  },

  async deleteRequest(id) {
    const response = await api.delete(ENDPOINTS.REQUEST_BY_ID(id));
    return response.data;
  },
};

export const CategoryAPI = {
  async getCategories() {
    const response = await api.get(ENDPOINTS.CATEGORIES);
    return response.data;
  },
};

// Error handler helper
export const handleAPIError = (error) => {
  if (error.response) {
    // Сервер ответил с ошибкой
    const { status, data } = error.response;
    
    if (status === 401) {
      return 'Сессия истекла. Пожалуйста, войдите снова.';
    }
    
    if (status === 403) {
      return 'Недостаточно прав для выполнения операции.';
    }
    
    if (status === 404) {
      return 'Запрашиваемый ресурс не найден.';
    }
    
    if (status === 429) {
      return 'Слишком много запросов. Попробуйте позже.';
    }
    
    if (status >= 500) {
      return 'Ошибка сервера. Попробуйте позже.';
    }
    
    return data.error || 'Произошла ошибка при выполнении запроса.';
  }
  
  if (error.request) {
    // Запрос был отправлен, но ответа не получено
    return 'Нет связи с сервером. Проверьте интернет соединение.';
  }
  
  // Ошибка при настройке запроса
  return error.message || 'Произошла неизвестная ошибка.';
};

export default api;
