(function () {
  const API_BASE = '/api/v1';
  const ACCESS_TOKEN_KEY = 'sid_access_token';
  const REFRESH_TOKEN_KEY = 'sid_refresh_token';
  const USER_KEY = 'sid_user';

  class ApiError extends Error {
    constructor(message, status, details) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details;
    }
  }

  const storage = {
    get accessToken() {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    get refreshToken() {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    },
    get user() {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      } catch {
        return null;
      }
    },
    setSession(data) {
      if (data.tokens?.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.accessToken);
      }
      if (data.tokens?.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refreshToken);
      }
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    },
    setUser(user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clear() {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  async function refreshSession() {
    if (!storage.refreshToken) return false;

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storage.refreshToken })
    });

    if (!response.ok) {
      storage.clear();
      return false;
    }

    const payload = await response.json();
    storage.setSession({ tokens: payload.data.tokens });
    return true;
  }

  async function request(path, options = {}, allowRefresh = true) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (storage.accessToken) {
      headers.set('Authorization', `Bearer ${storage.accessToken}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
    });

    if (response.status === 401 && allowRefresh && storage.refreshToken) {
      const refreshed = await refreshSession();
      if (refreshed) return request(path, options, false);
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationMessage = payload.details?.map((item) => item.message).join(', ');
      throw new ApiError(
        validationMessage || translateError(payload.error) || 'Не удалось выполнить запрос',
        response.status,
        payload.details
      );
    }

    return payload;
  }

  function translateError(message) {
    const dictionary = {
      'Invalid email or password': 'Неверный email или пароль',
      'User with this email already exists': 'Пользователь с таким email уже существует',
      'Current password is incorrect': 'Текущий пароль указан неверно',
      'Access token required': 'Требуется авторизация',
      'Request not found': 'Заявка не найдена',
      'Failed to fetch requests': 'Не удалось загрузить заявки',
      'Failed to create request': 'Не удалось создать заявку',
      'Failed to update request': 'Не удалось обновить заявку',
      'Failed to delete request': 'Не удалось удалить заявку',
      'Category slug already exists': 'Категория с таким кодом уже существует'
    };
    return dictionary[message] || message;
  }

  const api = {
    health: () => request('/health', {}, false),
    async login(email, password) {
      const payload = await request('/auth/login', {
        method: 'POST',
        body: { email, password }
      }, false);
      storage.setSession(payload.data);
      return payload.data.user;
    },
    async register(userData) {
      const payload = await request('/auth/register', {
        method: 'POST',
        body: userData
      }, false);
      storage.setSession(payload.data);
      return payload.data.user;
    },
    async logout() {
      try {
        if (storage.accessToken) {
          await request('/auth/logout', {
            method: 'POST',
            body: { refreshToken: storage.refreshToken }
          }, false);
        }
      } catch {
        // The local session must still be cleared when the server is unavailable.
      } finally {
        storage.clear();
      }
    },
    async me() {
      const payload = await request('/auth/me');
      storage.setUser(payload.data.user);
      return payload.data.user;
    },
    async requests(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/requests${query ? `?${query}` : ''}`);
    },
    async requestById(id) {
      return request(`/requests/${encodeURIComponent(id)}`);
    },
    async createRequest(data) {
      return request('/requests', { method: 'POST', body: data });
    },
    async updateRequest(id, data) {
      return request(`/requests/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: data
      });
    },
    async deleteRequest(id) {
      return request(`/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    async categories() {
      return request('/categories');
    },
    async createCategory(data) {
      return request('/categories', { method: 'POST', body: data });
    },
    async updateCategory(id, data) {
      return request(`/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: data
      });
    },
    async deleteCategory(id) {
      return request(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    async updateProfile(data) {
      const payload = await request('/profile', { method: 'PUT', body: data });
      storage.setUser(payload.data.user);
      return payload.data.user;
    },
    changePassword: (data) => request('/profile/password', { method: 'POST', body: data }),
    adminStats: () => request('/admin/stats'),
    adminUsers: () => request('/admin/users'),
    updateUser: (id, data) => request(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: data
    })
  };

  async function requireAuth() {
    if (!storage.accessToken) {
      window.location.replace('login.html');
      return null;
    }

    try {
      return await api.me();
    } catch {
      storage.clear();
      window.location.replace('login.html');
      return null;
    }
  }

  async function requireAdmin() {
    const user = await requireAuth();
    if (!user) return null;
    if (user.role !== 'admin') {
      window.location.replace('dashboard.html');
      return null;
    }
    return user;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[char]);
  }

  function formatDate(value, withTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(date);
  }

  const statusConfig = {
    pending: { label: 'Ожидает', className: 'warning', icon: 'clock' },
    in_progress: { label: 'В работе', className: 'info', icon: 'spinner' },
    completed: { label: 'Завершена', className: 'success', icon: 'check' },
    rejected: { label: 'Отклонена', className: 'danger', icon: 'xmark' },
    on_hold: { label: 'На паузе', className: 'neutral', icon: 'pause' }
  };

  const priorityConfig = {
    low: { label: 'Низкий', className: 'success' },
    medium: { label: 'Средний', className: 'warning' },
    high: { label: 'Высокий', className: 'danger' },
    urgent: { label: 'Срочный', className: 'danger' }
  };

  function statusBadge(status) {
    const item = statusConfig[status] || { label: status || 'Неизвестно', className: 'neutral', icon: 'circle' };
    return `<span class="badge badge-${item.className}"><i class="fas fa-${item.icon}"></i>${escapeHtml(item.label)}</span>`;
  }

  function priorityBadge(priority) {
    const item = priorityConfig[priority] || { label: priority || 'Не указан', className: 'neutral' };
    return `<span class="badge badge-${item.className}">${escapeHtml(item.label)}</span>`;
  }

  function initials(name) {
    return String(name || 'SID')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  function toast(message, type = 'info') {
    const element = document.createElement('div');
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'circle-exclamation' : 'circle-info';
    element.className = `toast toast-${type}`;
    element.innerHTML = `<i class="fas fa-${icon}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 3600);
  }

  function setLoading(button, loading, text = 'Подождите...') {
    if (!button) return;
    if (loading) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i>${escapeHtml(text)}`;
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    }
  }

  function hydrateHeader(user) {
    document.querySelectorAll('[data-user-name]').forEach((item) => {
      item.textContent = user.fullName;
    });
    document.querySelectorAll('[data-user-role]').forEach((item) => {
      item.textContent = user.role === 'admin' ? 'Администратор' : 'Пользователь';
    });
    document.querySelectorAll('[data-user-initials]').forEach((item) => {
      item.textContent = initials(user.fullName);
    });
    document.querySelectorAll('[data-admin-only]').forEach((item) => {
      item.hidden = user.role !== 'admin';
    });
    document.querySelectorAll('[data-logout]').forEach((button) => {
      button.addEventListener('click', async () => {
        await api.logout();
        window.location.replace('login.html');
      });
    });
  }

  window.SID = {
    api,
    storage,
    ApiError,
    requireAuth,
    requireAdmin,
    escapeHtml,
    formatDate,
    statusConfig,
    priorityConfig,
    statusBadge,
    priorityBadge,
    initials,
    toast,
    setLoading,
    hydrateHeader
  };
})();
