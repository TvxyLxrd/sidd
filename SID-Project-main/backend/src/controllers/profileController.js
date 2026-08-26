const bcrypt = require('bcryptjs');
const db = require('../database/db');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/crypto');

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const result = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, full_name, phone, avatar_url, role, created_at`,
      [
        fullName || null,
        phone === undefined ? null : encrypt(phone),
        avatarUrl || null,
        req.user.id
      ]
    );

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: decrypt(user.phone),
          avatarUrl: user.avatar_url,
          role: user.role,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
    );
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hash, req.user.id]
    );
    await db.query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
      [req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};

module.exports = { updateProfile, changePassword };
