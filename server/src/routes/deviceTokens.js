const express = require('express');
const router = express.Router();
const { registerDeviceToken, unregisterDeviceToken } = require('../controllers/deviceTokenController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', registerDeviceToken);
router.delete('/', unregisterDeviceToken);

module.exports = router;
