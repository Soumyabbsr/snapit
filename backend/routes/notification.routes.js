const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const { registerToken } = require('../controllers/notification.controller');

router.post('/token', auth, registerToken);

module.exports = router;
