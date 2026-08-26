const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');
const { validate, createRequestSchema, updateRequestSchema } = require('../middleware/validation');
const { createRequestLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);

router.get('/', requestController.getUserRequests);
router.post('/', createRequestLimiter, validate(createRequestSchema), requestController.createRequest);
router.get('/:id', requestController.getRequestById);
router.put('/:id', validate(updateRequestSchema), requestController.updateRequest);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
