const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  validate,
  createCategorySchema,
  updateCategorySchema
} = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);
router.get('/', categoryController.getCategories);
router.post('/', requireAdmin, validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', requireAdmin, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', requireAdmin, categoryController.deleteCategory);

module.exports = router;
