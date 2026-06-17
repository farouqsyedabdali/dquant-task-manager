const express = require('express');
const auth = require('../middleware/auth');
const { detect } = require('../controllers/emailProviderController');

const router = express.Router();

router.use(auth);

router.get('/detect', detect);

module.exports = router;
