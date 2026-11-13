const express = require('express');
const router = express.Router();
const { subscribe, testPush, getVapidPublicKey } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/vapid-key', getVapidPublicKey);
router.post('/subscribe', authMiddleware, subscribe);
router.get('/test-push', authMiddleware, testPush);

module.exports = router;
