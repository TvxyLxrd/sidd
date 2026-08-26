const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const {
  validate,
  updateProfileSchema,
  changePasswordSchema
} = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.post('/password', validate(changePasswordSchema), profileController.changePassword);

module.exports = router;
