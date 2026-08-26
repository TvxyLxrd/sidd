const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.get('/stats', adminController.getStats);

module.exports = router;
