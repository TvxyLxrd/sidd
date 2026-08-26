const db = require('../database/db');
const logger = require('../utils/logger');
const { isUuid } = require('../utils/validators');
const { decrypt } = require('../utils/crypto');

const getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.is_active,
              u.is_verified, u.created_at, u.last_login,
              COALESCE(us.total_requests, 0) AS total_requests
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       ORDER BY u.created_at DESC`
    );

    // Телефоны хранятся зашифрованными — расшифровываем на выдаче
    const users = result.rows.map((user) => ({ ...user, phone: decrypt(user.phone) }));
    res.json({ success: true, data: { users } });
  } catch (error) {
    logger.error('Get admin users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    if (!isUuid(id)) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role !== undefined && !['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role value' });
    }

    if (id === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account'
      });
    }

    const result = await db.query(
      `UPDATE users
       SET role = COALESCE($1, role),
           is_active = COALESCE($2, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, full_name, role, is_active`,
      [role || null, typeof isActive === 'boolean' ? isActive : null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: { user: result.rows[0] } });
  } catch (error) {
    logger.error('Update admin user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

const getStats = async (req, res) => {
  try {
    const [usersResult, activeUsersResult, requestCountsResult] = await Promise.all([
      db.query(
        'SELECT COUNT(*)::int AS total_users FROM users'
      ),
      db.query(
        'SELECT COUNT(*)::int AS active_users FROM users WHERE is_active = true'
      ),
      db.query(
        'SELECT status, COUNT(*)::int AS count FROM requests GROUP BY status'
      )
    ]);

    const requestCounts = requestCountsResult.rows.reduce((accumulator, item) => {
      accumulator[item.status] = item.count;
      return accumulator;
    }, {});

    res.json({
      success: true,
      data: {
        total_users: usersResult.rows[0].total_users,
        active_users: activeUsersResult.rows[0].active_users,
        total_requests: Object.values(requestCounts).reduce((sum, count) => sum + count, 0),
        pending_requests: requestCounts.pending || 0,
        in_progress_requests: requestCounts.in_progress || 0,
        completed_requests: requestCounts.completed || 0
      }
    });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
};

module.exports = { getUsers, updateUser, getStats };
