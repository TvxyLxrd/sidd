const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const logger = require('../utils/logger');
const { isUuid } = require('../utils/validators');

const getCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, slug, name, icon, description, is_active, created_at
       FROM categories
       WHERE is_active = true
       ORDER BY name`
    );
    res.json({ success: true, data: { categories: result.rows } });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, icon, description } = req.body;
    const result = await db.query(
      `INSERT INTO categories (id, name, slug, icon, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uuidv4(), name, slug, icon || null, description || null]
    );
    res.status(201).json({ success: true, data: { category: result.rows[0] } });
  } catch (error) {
    logger.error('Create category error:', error);
    const status = error.code === '23505' ? 400 : 500;
    res.status(status).json({
      success: false,
      error: status === 400 ? 'Category slug already exists' : 'Failed to create category'
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, description, isActive } = req.body;

    if (!isUuid(id)) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // COALESCE позволяет присылать только изменившиеся поля
    const result = await db.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           icon = COALESCE($3, icon),
           description = COALESCE($4, description),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [
        name ?? null,
        slug ?? null,
        icon ?? null,
        description ?? null,
        typeof isActive === 'boolean' ? isActive : null,
        id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: { category: result.rows[0] } });
  } catch (error) {
    logger.error('Update category error:', error);
    const status = error.code === '23505' ? 400 : 500;
    res.status(status).json({
      success: false,
      error: status === 400 ? 'Category slug already exists' : 'Failed to update category'
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const result = await db.query(
      `UPDATE categories SET is_active = false WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
