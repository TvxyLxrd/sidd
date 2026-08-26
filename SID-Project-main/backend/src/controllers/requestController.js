const db = require('../database/db');
const logger = require('../utils/logger');
const { isUuid } = require('../utils/validators');
const { encrypt, decrypt } = require('../utils/crypto');

// Текст заявки — самое чувствительное, что есть в базе: в нём встречаются
// внутренние детали и контакты. Он хранится зашифрованным и расшифровывается
// только на выдаче конкретному пользователю.
const present = (row) => (row ? { ...row, description: decrypt(row.description) } : row);

// Явный список колонок, которые вообще разрешено менять. Имя колонки
// подставляется в SQL, поэтому оно не должно приходить из запроса — даже
// после проверки схемой.
const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  priority: 'priority',
  status: 'status',
  categoryId: 'category_id',
  assignedTo: 'assigned_to'
};

const ENCRYPTED_FIELDS = new Set(['description']);

// Получение всех заявок пользователя
const getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, page = 1, limit = 10 } = req.query;
    
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
    const where = [];
    const params = [];
    let paramCount = 0;

    if (!isAdmin) {
      paramCount++;
      where.push(`user_id = $${paramCount}`);
      params.push(userId);
    }

    if (status) {
      paramCount++;
      where.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (priority) {
      paramCount++;
      where.push(`priority = $${paramCount}`);
      params.push(priority);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countQuery = `SELECT COUNT(*)::int AS total FROM requests ${whereClause}`;
    const countResult = await db.query(countQuery, params);

    const query = `
      SELECT r.*, c.name as category_name, c.icon as category_icon,
             u.full_name as user_name
      FROM (
        SELECT *
        FROM requests
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      ) r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;
    params.push(parsedLimit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        requests: result.rows.map(present),
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: countResult.rows[0].total
        }
      }
    });
  } catch (error) {
    logger.error('Get user requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch requests' });
  }
};

// Создание заявки
const createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, priority, categoryId } = req.body;

    // Генерация номера заявки: суффикс исключает совпадение у одновременных запросов
    const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const requestNumber = `REQ-${Date.now().toString().slice(-6)}-${suffix}`;

    const result = await db.query(
      `INSERT INTO requests (request_number, user_id, category_id, title, description, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [requestNumber, userId, categoryId, title, encrypt(description), priority]
    );

    // Обновление статистики
    await db.query(
      `UPDATE user_stats SET total_requests = total_requests + 1, pending_requests = pending_requests + 1,
       last_request_date = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId]
    );

    logger.info('Request created', { userId, requestId: result.rows[0].id });

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: { request: present(result.rows[0]) }
    });
  } catch (error) {
    logger.error('Create request error:', error);
    res.status(500).json({ success: false, error: 'Failed to create request' });
  }
};

// Получение заявки по ID
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isUuid(id)) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const result = await db.query(
      `SELECT r.*, c.name as category_name, c.icon as category_icon,
              u.full_name as user_name, a.full_name as assigned_name
       FROM (
         SELECT * FROM requests
         WHERE id = $1 ${!isAdmin ? 'AND user_id = $2' : ''}
       ) r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN users a ON r.assigned_to = a.id
      `,
      isAdmin ? [id] : [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.json({ success: true, data: { request: present(result.rows[0]) } });
  } catch (error) {
    logger.error('Get request error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch request' });
  }
};

// Обновление заявки
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
    const updates = req.body;

    if (!isUuid(id)) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Проверка владельца
    const checkResult = await db.query(
      'SELECT user_id, status FROM requests WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (!isAdmin && checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const oldStatus = checkResult.rows[0].status;
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key === 'assignedTo' && !isAdmin) return;
      if (key === 'status' && !isAdmin) return;

      const column = UPDATABLE_COLUMNS[key];
      if (!column) return;

      fields.push(`${column} = $${paramCount}`);
      values.push(ENCRYPTED_FIELDS.has(key) ? encrypt(updates[key]) : updates[key]);
      paramCount++;
    });

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE requests SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );

    // История изменений
    if (updates.status && updates.status !== oldStatus) {
      await db.query(
        `INSERT INTO request_history (request_id, changed_by, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, userId, 'status', oldStatus, updates.status]
      );

      await db.query(
        `UPDATE user_stats
         SET completed_requests = completed_requests
               + CASE WHEN $1 = 'completed' THEN 1 ELSE 0 END
               - CASE WHEN $2 = 'completed' THEN 1 ELSE 0 END,
             pending_requests = pending_requests
               + CASE WHEN $1 = 'pending' THEN 1 ELSE 0 END
               - CASE WHEN $2 = 'pending' THEN 1 ELSE 0 END
         WHERE user_id = $3`,
        [updates.status, oldStatus, checkResult.rows[0].user_id]
      );
    }

    res.json({
      success: true,
      message: 'Request updated successfully',
      data: { request: present(result.rows[0]) }
    });
  } catch (error) {
    logger.error('Update request error:', error);
    res.status(500).json({ success: false, error: 'Failed to update request' });
  }
};

// Удаление заявки
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isUuid(id)) {
      return res.status(404).json({ success: false, error: 'Request not found or access denied' });
    }

    const result = await db.query(
      `DELETE FROM requests WHERE id = $1 ${!isAdmin ? 'AND user_id = $2' : ''}
       RETURNING id, user_id, status`,
      isAdmin ? [id] : [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found or access denied' });
    }

    // Счетчики профиля должны совпадать с фактическим числом заявок
    const removed = result.rows[0];
    await db.query(
      `UPDATE user_stats
       SET total_requests = GREATEST(total_requests - 1, 0),
           completed_requests = GREATEST(completed_requests
             - CASE WHEN $1 = 'completed' THEN 1 ELSE 0 END, 0),
           pending_requests = GREATEST(pending_requests
             - CASE WHEN $1 = 'pending' THEN 1 ELSE 0 END, 0)
       WHERE user_id = $2`,
      [removed.status, removed.user_id]
    );

    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    logger.error('Delete request error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete request' });
  }
};

module.exports = {
  getUserRequests,
  createRequest,
  getRequestById,
  updateRequest,
  deleteRequest
};
