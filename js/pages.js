(function () {
  const {
    api,
    escapeHtml,
    formatDate,
    statusBadge,
    priorityBadge,
    initials,
    toast,
    setLoading,
    hydrateHeader,
    requireAuth,
    requireAdmin
  } = window.SID;

  const loadingMarkup = `
    <div class="loading-state">
      <div>
        <div class="spinner"></div>
        <p class="muted text-small">Загружаем данные...</p>
      </div>
    </div>
  `;

  function errorMarkup(message) {
    return `
      <div class="error-state">
        <div>
          <div class="error-icon"><i class="fas fa-triangle-exclamation"></i></div>
          <h3>Не удалось загрузить данные</h3>
          <p>${escapeHtml(message)}</p>
          <button class="btn btn-secondary" type="button" onclick="window.location.reload()">
            <i class="fas fa-rotate-right"></i>Повторить
          </button>
        </div>
      </div>
    `;
  }

  function emptyMarkup(title, text, actionHref, actionText) {
    return `
      <div class="empty-state">
        <div>
          <div class="empty-icon"><i class="fas fa-inbox"></i></div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(text)}</p>
          ${actionHref ? `<a class="btn btn-primary" href="${actionHref}"><i class="fas fa-plus"></i>${escapeHtml(actionText)}</a>` : ''}
        </div>
      </div>
    `;
  }

  function requestCard(item, showOwner = false) {
    return `
      <article class="request-card" data-request-id="${escapeHtml(item.id)}">
        <div>
          <div class="badge-row">
            <span class="badge badge-primary">${escapeHtml(item.request_number)}</span>
            ${priorityBadge(item.priority)}
            ${statusBadge(item.status)}
          </div>
          <a href="request-detail.html?id=${encodeURIComponent(item.id)}">
            <h3>${escapeHtml(item.title)}</h3>
          </a>
          <p>${escapeHtml(item.description)}</p>
          <div class="request-meta">
            <span><i class="fas fa-layer-group"></i>${escapeHtml(item.category_name || 'Без категории')}</span>
            ${showOwner ? `<span><i class="fas fa-user"></i>${escapeHtml(item.user_name || 'Неизвестный пользователь')}</span>` : ''}
            <span><i class="fas fa-calendar"></i>${formatDate(item.created_at)}</span>
          </div>
        </div>
        <a class="btn btn-secondary" href="request-detail.html?id=${encodeURIComponent(item.id)}">
          Открыть <i class="fas fa-arrow-right"></i>
        </a>
      </article>
    `;
  }

  function normalizeSearch(value) {
    return String(value || '').trim().toLowerCase();
  }

  async function initLanding() {
    const indicator = document.querySelector('[data-api-status]');
    if (!indicator) return;

    try {
      const result = await api.health();
      indicator.innerHTML = `<i class="fas fa-circle-check"></i> API подключен · ${escapeHtml(result.database.driver)}`;
      indicator.classList.add('badge-success');
    } catch {
      indicator.innerHTML = '<i class="fas fa-circle-xmark"></i> API недоступен';
      indicator.classList.add('badge-danger');
    }
  }

  async function initLogin() {
    if (window.SID.storage.accessToken) {
      const user = window.SID.storage.user;
      window.location.replace(user?.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html');
      return;
    }

    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      setLoading(button, true, 'Входим...');

      try {
        const user = await api.login(
          document.getElementById('email').value.trim(),
          document.getElementById('password').value
        );
        window.location.replace(user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html');
      } catch (error) {
        toast(error.message, 'error');
        setLoading(button, false);
      }
    });
  }

  async function initRegister() {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
        toast('Пароли не совпадают', 'error');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      setLoading(button, true, 'Создаем аккаунт...');

      try {
        await api.register({
          fullName: document.getElementById('fullName').value.trim(),
          email: document.getElementById('email').value.trim(),
          phone: document.getElementById('phone').value.trim(),
          password
        });
        window.location.replace('dashboard.html');
      } catch (error) {
        toast(error.message, 'error');
        setLoading(button, false);
      }
    });
  }

  async function initDashboard() {
    const user = await requireAuth();
    if (!user) return;
    hydrateHeader(user);

    const content = document.getElementById('dashboardContent');
    content.innerHTML = loadingMarkup;

    try {
      const payload = await api.requests({ limit: 100 });
      const requests = payload.data.requests;
      const stats = {
        total: requests.length,
        pending: requests.filter((item) => item.status === 'pending').length,
        inProgress: requests.filter((item) => item.status === 'in_progress').length,
        completed: requests.filter((item) => item.status === 'completed').length
      };

      content.innerHTML = `
        <section class="page-heading">
          <div>
            <span class="eyebrow">Рабочее пространство</span>
            <h1>Добрый день, ${escapeHtml(user.fullName.split(' ')[0])}</h1>
            <p>Здесь собраны ваши обращения, актуальные статусы и быстрые действия.</p>
          </div>
          <a class="btn btn-primary btn-lg" href="new-request.html">
            <i class="fas fa-plus"></i>Новая заявка
          </a>
        </section>

        <section class="stats-grid">
          <article class="stat-card" style="--stat-color: var(--accent)">
            <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
            <strong class="stat-value">${stats.total}</strong>
            <span class="stat-label">Всего заявок</span>
          </article>
          <article class="stat-card" style="--stat-color: var(--amber)">
            <div class="stat-icon"><i class="fas fa-clock"></i></div>
            <strong class="stat-value">${stats.pending}</strong>
            <span class="stat-label">Ожидают ответа</span>
          </article>
          <article class="stat-card" style="--stat-color: var(--cyan)">
            <div class="stat-icon"><i class="fas fa-spinner"></i></div>
            <strong class="stat-value">${stats.inProgress}</strong>
            <span class="stat-label">Сейчас в работе</span>
          </article>
          <article class="stat-card" style="--stat-color: var(--green)">
            <div class="stat-icon"><i class="fas fa-check"></i></div>
            <strong class="stat-value">${stats.completed}</strong>
            <span class="stat-label">Завершено</span>
          </article>
        </section>

        <section class="quick-grid">
          <a class="quick-action" href="new-request.html">
            <i class="fas fa-paper-plane"></i>
            <div><strong>Создать заявку</strong><span>Опишите задачу и задайте приоритет</span></div>
          </a>
          <a class="quick-action" href="requests.html">
            <i class="fas fa-list-check"></i>
            <div><strong>Все обращения</strong><span>Фильтры, поиск и история статусов</span></div>
          </a>
          <a class="quick-action" href="profile.html">
            <i class="fas fa-user-gear"></i>
            <div><strong>Настройки профиля</strong><span>Контакты и безопасность аккаунта</span></div>
          </a>
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <h2>Последние заявки</h2>
              <p class="muted text-small">Свежие обновления вашего рабочего потока</p>
            </div>
            <a class="btn btn-secondary" href="requests.html">Смотреть все</a>
          </div>
          ${requests.length
            ? `<div class="request-list">${requests.slice(0, 4).map((item) => requestCard(item)).join('')}</div>`
            : emptyMarkup('Пока нет заявок', 'Создайте первое обращение, и оно появится здесь.', 'new-request.html', 'Создать заявку')}
        </section>
      `;
    } catch (error) {
      content.innerHTML = errorMarkup(error.message);
    }
  }

  async function initRequests() {
    const user = await requireAuth();
    if (!user) return;
    hydrateHeader(user);

    const container = document.getElementById('requestsList');
    container.innerHTML = loadingMarkup;
    let requests = [];

    const render = () => {
      const search = normalizeSearch(document.getElementById('searchInput').value);
      const status = document.getElementById('statusFilter').value;
      const filtered = requests.filter((item) => {
        const matchesSearch = !search
          || normalizeSearch(item.title).includes(search)
          || normalizeSearch(item.request_number).includes(search)
          || normalizeSearch(item.category_name).includes(search);
        const matchesStatus = status === 'all' || item.status === status;
        return matchesSearch && matchesStatus;
      });

      container.innerHTML = filtered.length
        ? `<div class="request-list">${filtered.map((item) => requestCard(item)).join('')}</div>`
        : emptyMarkup('Ничего не найдено', 'Попробуйте изменить поиск или фильтр статуса.', 'new-request.html', 'Создать заявку');
      document.getElementById('requestCount').textContent = `${filtered.length} из ${requests.length}`;
    };

    try {
      const payload = await api.requests({ limit: 100 });
      requests = payload.data.requests;
      render();
    } catch (error) {
      container.innerHTML = errorMarkup(error.message);
    }

    document.getElementById('searchInput').addEventListener('input', render);
    document.getElementById('statusFilter').addEventListener('change', render);
  }

  async function initNewRequest() {
    const user = await requireAuth();
    if (!user) return;
    hydrateHeader(user);

    const categorySelect = document.getElementById('categoryId');
    try {
      const payload = await api.categories();
      categorySelect.innerHTML = payload.data.categories
        .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
        .join('');
    } catch (error) {
      categorySelect.innerHTML = '<option value="">Категории недоступны</option>';
      toast(error.message, 'error');
    }

    const form = document.getElementById('requestForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      setLoading(button, true, 'Отправляем...');

      try {
        const payload = await api.createRequest({
          title: document.getElementById('title').value.trim(),
          description: document.getElementById('description').value.trim(),
          categoryId: categorySelect.value,
          priority: form.elements.priority.value
        });
        toast('Заявка успешно создана', 'success');
        setTimeout(() => {
          window.location.href = `request-detail.html?id=${encodeURIComponent(payload.data.request.id)}`;
        }, 350);
      } catch (error) {
        toast(error.message, 'error');
        setLoading(button, false);
      }
    });
  }

  function timeline(status) {
    const steps = [
      { key: 'pending', label: 'Создана' },
      { key: 'in_progress', label: 'В работе' },
      { key: 'completed', label: 'Завершена' }
    ];
    const current = steps.findIndex((step) => step.key === status);
    return `
      <div class="timeline">
        ${steps.map((step, index) => {
          const className = index < current ? 'done' : index === current ? 'active' : '';
          return `<div class="timeline-step ${className}">${step.label}</div>`;
        }).join('')}
      </div>
    `;
  }

  async function initRequestDetail() {
    const user = await requireAuth();
    if (!user) return;
    hydrateHeader(user);

    const container = document.getElementById('requestDetailContent');
    const requestId = new URLSearchParams(window.location.search).get('id');
    if (!requestId) {
      window.location.replace('requests.html');
      return;
    }

    container.innerHTML = loadingMarkup;

    try {
      const payload = await api.requestById(requestId);
      const item = payload.data.request;
      const isAdmin = user.role === 'admin';

      container.innerHTML = `
        <div class="page-heading">
          <div>
            <a class="muted text-small" href="${isAdmin ? 'admin-requests.html' : 'requests.html'}">
              <i class="fas fa-arrow-left"></i> Назад к заявкам
            </a>
            <h1 class="detail-title">${escapeHtml(item.title)}</h1>
            <div class="badge-row">
              <span class="badge badge-primary">${escapeHtml(item.request_number)}</span>
              ${priorityBadge(item.priority)}
              ${statusBadge(item.status)}
            </div>
          </div>
        </div>

        <div class="detail-layout">
          <section class="card">
            <div class="card-header">
              <div>
                <h2>Ход выполнения</h2>
                <p class="muted text-small">Текущий этап обработки обращения</p>
              </div>
            </div>
            ${timeline(item.status)}
            <div class="detail-description">
              <h3>Описание задачи</h3>
              <p>${escapeHtml(item.description)}</p>
            </div>
          </section>

          <aside class="card">
            <div class="card-header"><h3>Детали</h3></div>
            <div class="side-list">
              <div class="side-item"><span>Категория</span><strong>${escapeHtml(item.category_name || 'Не указана')}</strong></div>
              <div class="side-item"><span>Автор</span><strong>${escapeHtml(item.user_name || user.fullName)}</strong></div>
              <div class="side-item"><span>Исполнитель</span><strong>${escapeHtml(item.assigned_name || 'Еще не назначен')}</strong></div>
              <div class="side-item"><span>Создана</span><strong>${formatDate(item.created_at, true)}</strong></div>
              ${isAdmin ? `
                <div class="side-item">
                  <span>Изменить статус</span>
                  <select class="form-control" id="detailStatus">
                    <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Ожидает</option>
                    <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                    <option value="on_hold" ${item.status === 'on_hold' ? 'selected' : ''}>На паузе</option>
                    <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>Завершена</option>
                    <option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>Отклонена</option>
                  </select>
                  <button class="btn btn-primary btn-block" id="saveStatusBtn" type="button" style="margin-top: 10px;">Сохранить статус</button>
                </div>
              ` : ''}
            </div>
            <button class="btn btn-danger btn-block" id="deleteRequestBtn" type="button" style="margin-top: 20px;">
              <i class="fas fa-trash"></i>Удалить заявку
            </button>
          </aside>
        </div>
      `;

      document.getElementById('deleteRequestBtn').addEventListener('click', async () => {
        if (!window.confirm('Удалить заявку без возможности восстановления?')) return;
        try {
          await api.deleteRequest(item.id);
          toast('Заявка удалена', 'success');
          setTimeout(() => {
            window.location.href = isAdmin ? 'admin-requests.html' : 'requests.html';
          }, 350);
        } catch (error) {
          toast(error.message, 'error');
        }
      });

      if (isAdmin) {
        document.getElementById('saveStatusBtn').addEventListener('click', async (event) => {
          setLoading(event.currentTarget, true, 'Сохраняем...');
          try {
            await api.updateRequest(item.id, {
              status: document.getElementById('detailStatus').value
            });
            toast('Статус обновлен', 'success');
            setTimeout(() => window.location.reload(), 300);
          } catch (error) {
            toast(error.message, 'error');
            setLoading(event.currentTarget, false);
          }
        });
      }
    } catch (error) {
      container.innerHTML = errorMarkup(error.message);
    }
  }

  async function initProfile() {
    const user = await requireAuth();
    if (!user) return;
    hydrateHeader(user);

    document.getElementById('profileInitials').textContent = initials(user.fullName);
    document.getElementById('profileName').textContent = user.fullName;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileCreated').textContent = `В системе с ${formatDate(user.createdAt)}`;
    document.getElementById('totalRequests').textContent = user.stats?.totalRequests || 0;
    document.getElementById('completedRequests').textContent = user.stats?.completedRequests || 0;
    document.getElementById('pendingRequests').textContent = user.stats?.pendingRequests || 0;
    document.getElementById('fullName').value = user.fullName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';

    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = profileForm.querySelector('button[type="submit"]');
      setLoading(button, true, 'Сохраняем...');
      try {
        const updated = await api.updateProfile({
          fullName: document.getElementById('fullName').value.trim(),
          phone: document.getElementById('phone').value.trim()
        });
        hydrateHeader(updated);
        document.getElementById('profileInitials').textContent = initials(updated.fullName);
        document.getElementById('profileName').textContent = updated.fullName;
        toast('Профиль обновлен', 'success');
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        setLoading(button, false);
      }
    });

    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const newPassword = document.getElementById('newPassword').value;
      if (newPassword !== document.getElementById('confirmNewPassword').value) {
        toast('Новые пароли не совпадают', 'error');
        return;
      }

      const button = passwordForm.querySelector('button[type="submit"]');
      setLoading(button, true, 'Обновляем...');
      try {
        await api.changePassword({
          currentPassword: document.getElementById('currentPassword').value,
          newPassword
        });
        toast('Пароль изменен. Войдите заново.', 'success');
        setTimeout(async () => {
          await api.logout();
          window.location.replace('login.html');
        }, 700);
      } catch (error) {
        toast(error.message, 'error');
        setLoading(button, false);
      }
    });
  }

  async function initAdminDashboard() {
    const user = await requireAdmin();
    if (!user) return;
    hydrateHeader(user);

    const content = document.getElementById('adminDashboardContent');
    content.innerHTML = loadingMarkup;

    try {
      const [statsPayload, requestsPayload] = await Promise.all([
        api.adminStats(),
        api.requests({ limit: 6 })
      ]);
      const stats = statsPayload.data;
      const requests = requestsPayload.data.requests;

      content.innerHTML = `
        <section class="page-heading">
          <div>
            <span class="eyebrow">Администрирование</span>
            <h1>Пульс сервиса</h1>
            <p>Заявки, пользователи и ключевые показатели системы в одном окне.</p>
          </div>
          <a class="btn btn-primary btn-lg" href="admin-requests.html"><i class="fas fa-list-check"></i>Обработать заявки</a>
        </section>

        <section class="stats-grid">
          <article class="stat-card" style="--stat-color: var(--accent)"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><strong class="stat-value">${stats.total_requests}</strong><span class="stat-label">Всего заявок</span></article>
          <article class="stat-card" style="--stat-color: var(--amber)"><div class="stat-icon"><i class="fas fa-clock"></i></div><strong class="stat-value">${stats.pending_requests}</strong><span class="stat-label">Ожидают обработки</span></article>
          <article class="stat-card" style="--stat-color: var(--cyan)"><div class="stat-icon"><i class="fas fa-spinner"></i></div><strong class="stat-value">${stats.in_progress_requests}</strong><span class="stat-label">В работе</span></article>
          <article class="stat-card" style="--stat-color: var(--green)"><div class="stat-icon"><i class="fas fa-users"></i></div><strong class="stat-value">${stats.active_users}</strong><span class="stat-label">Активных пользователей</span></article>
        </section>

        <section class="quick-grid">
          <a class="quick-action" href="admin-requests.html"><i class="fas fa-list-check"></i><div><strong>Очередь заявок</strong><span>Приоритеты, статусы и исполнители</span></div></a>
          <a class="quick-action" href="admin-users.html"><i class="fas fa-users-gear"></i><div><strong>Пользователи</strong><span>Роли и доступ к системе</span></div></a>
          <a class="quick-action" href="admin-services.html"><i class="fas fa-shapes"></i><div><strong>Категории</strong><span>Структура входящих обращений</span></div></a>
        </section>

        <section class="card">
          <div class="card-header"><div><h2>Свежие обращения</h2><p class="muted text-small">Последние заявки всех пользователей</p></div><a class="btn btn-secondary" href="admin-requests.html">Все заявки</a></div>
          <div class="request-list">${requests.map((item) => requestCard(item, true)).join('')}</div>
        </section>
      `;
    } catch (error) {
      content.innerHTML = errorMarkup(error.message);
    }
  }

  async function initAdminRequests() {
    const user = await requireAdmin();
    if (!user) return;
    hydrateHeader(user);

    const container = document.getElementById('adminRequestsList');
    container.innerHTML = loadingMarkup;
    let requests = [];

    const render = () => {
      const search = normalizeSearch(document.getElementById('searchInput').value);
      const status = document.getElementById('statusFilter').value;
      const filtered = requests.filter((item) => {
        const matchesSearch = !search
          || normalizeSearch(item.title).includes(search)
          || normalizeSearch(item.request_number).includes(search)
          || normalizeSearch(item.user_name).includes(search);
        return matchesSearch && (status === 'all' || item.status === status);
      });

      container.innerHTML = filtered.length ? `
        <div class="table-responsive">
          <table>
            <thead><tr><th>Номер</th><th>Заявка</th><th>Автор</th><th>Приоритет</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
            <tbody>
              ${filtered.map((item) => `
                <tr>
                  <td><span class="badge badge-primary">${escapeHtml(item.request_number)}</span></td>
                  <td class="table-title">${escapeHtml(item.title)}</td>
                  <td>${escapeHtml(item.user_name || '—')}</td>
                  <td>${priorityBadge(item.priority)}</td>
                  <td>${statusBadge(item.status)}</td>
                  <td>${formatDate(item.created_at)}</td>
                  <td><a class="btn btn-ghost" href="request-detail.html?id=${encodeURIComponent(item.id)}" aria-label="Открыть"><i class="fas fa-arrow-right"></i></a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : emptyMarkup('Заявки не найдены', 'Измените параметры поиска или статус.', null, null);
      document.getElementById('requestCount').textContent = `${filtered.length} из ${requests.length}`;
    };

    try {
      const payload = await api.requests({ limit: 100 });
      requests = payload.data.requests;
      render();
    } catch (error) {
      container.innerHTML = errorMarkup(error.message);
    }

    document.getElementById('searchInput').addEventListener('input', render);
    document.getElementById('statusFilter').addEventListener('change', render);
  }

  async function initAdminUsers() {
    const user = await requireAdmin();
    if (!user) return;
    hydrateHeader(user);

    const container = document.getElementById('adminUsersList');
    container.innerHTML = loadingMarkup;
    let users = [];

    const render = () => {
      const search = normalizeSearch(document.getElementById('searchInput').value);
      const filtered = users.filter((item) =>
        !search
        || normalizeSearch(item.full_name).includes(search)
        || normalizeSearch(item.email).includes(search)
      );

      container.innerHTML = `
        <div class="table-responsive">
          <table>
            <thead><tr><th>Пользователь</th><th>Роль</th><th>Заявки</th><th>Статус</th><th>Регистрация</th><th></th></tr></thead>
            <tbody>
              ${filtered.map((item) => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <span class="user-avatar">${initials(item.full_name)}</span>
                      <div><strong>${escapeHtml(item.full_name)}</strong><div class="muted">${escapeHtml(item.email)}</div></div>
                    </div>
                  </td>
                  <td><span class="badge badge-${item.role === 'admin' ? 'primary' : 'neutral'}">${item.role === 'admin' ? 'Администратор' : 'Пользователь'}</span></td>
                  <td>${item.total_requests}</td>
                  <td>${item.is_active ? '<span class="badge badge-success">Активен</span>' : '<span class="badge badge-danger">Заблокирован</span>'}</td>
                  <td>${formatDate(item.created_at)}</td>
                  <td>
                    ${item.id !== user.id ? `<button class="btn btn-ghost" type="button" data-toggle-user="${escapeHtml(item.id)}" data-active="${item.is_active}" title="${item.is_active ? 'Заблокировать' : 'Активировать'}"><i class="fas fa-${item.is_active ? 'lock' : 'unlock'}"></i></button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    try {
      const payload = await api.adminUsers();
      users = payload.data.users;
      render();
    } catch (error) {
      container.innerHTML = errorMarkup(error.message);
    }

    document.getElementById('searchInput').addEventListener('input', render);
    container.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-toggle-user]');
      if (!button) return;
      const isActive = button.dataset.active === 'true';
      setLoading(button, true, '...');
      try {
        await api.updateUser(button.dataset.toggleUser, { isActive: !isActive });
        const target = users.find((item) => item.id === button.dataset.toggleUser);
        target.is_active = !isActive;
        render();
        toast(isActive ? 'Пользователь заблокирован' : 'Пользователь активирован', 'success');
      } catch (error) {
        toast(error.message, 'error');
        render();
      }
    });
  }

  async function initAdminCategories() {
    const user = await requireAdmin();
    if (!user) return;
    hydrateHeader(user);

    const container = document.getElementById('categoriesList');
    const form = document.getElementById('categoryForm');
    let categories = [];

    const render = () => {
      container.innerHTML = categories.length ? `
        <div class="feature-grid">
          ${categories.map((item) => `
            <article class="feature-card" style="min-height: 230px">
              <div class="feature-icon"><i class="fas fa-${escapeHtml(item.icon || 'shapes')}"></i></div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.description || 'Без описания')}</p>
              <div class="badge-row" style="margin-top:18px">
                <span class="badge badge-neutral">${escapeHtml(item.slug)}</span>
                <button class="btn btn-danger" type="button" data-delete-category="${escapeHtml(item.id)}" style="min-height:32px;padding:5px 10px"><i class="fas fa-trash"></i></button>
              </div>
            </article>
          `).join('')}
        </div>
      ` : emptyMarkup('Категорий пока нет', 'Добавьте первую категорию через форму.', null, null);
    };

    const load = async () => {
      container.innerHTML = loadingMarkup;
      try {
        const payload = await api.categories();
        categories = payload.data.categories;
        render();
      } catch (error) {
        container.innerHTML = errorMarkup(error.message);
      }
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      setLoading(button, true, 'Добавляем...');
      try {
        await api.createCategory({
          name: document.getElementById('categoryName').value.trim(),
          slug: document.getElementById('categorySlug').value.trim().toLowerCase(),
          icon: document.getElementById('categoryIcon').value.trim(),
          description: document.getElementById('categoryDescription').value.trim()
        });
        form.reset();
        toast('Категория добавлена', 'success');
        await load();
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        setLoading(button, false);
      }
    });

    container.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-delete-category]');
      if (!button || !window.confirm('Удалить категорию?')) return;
      try {
        await api.deleteCategory(button.dataset.deleteCategory);
        toast('Категория удалена', 'success');
        await load();
      } catch (error) {
        toast(error.message, 'error');
      }
    });

    await load();
  }

  const initializers = {
    landing: initLanding,
    login: initLogin,
    register: initRegister,
    dashboard: initDashboard,
    requests: initRequests,
    'new-request': initNewRequest,
    'request-detail': initRequestDetail,
    profile: initProfile,
    'admin-dashboard': initAdminDashboard,
    'admin-requests': initAdminRequests,
    'admin-users': initAdminUsers,
    'admin-categories': initAdminCategories
  };

  document.addEventListener('DOMContentLoaded', () => {
    const initializer = initializers[document.body.dataset.page];
    if (initializer) {
      initializer().catch((error) => {
        console.error(error);
        toast(error.message || 'Произошла непредвиденная ошибка', 'error');
      });
    }
  });
})();
