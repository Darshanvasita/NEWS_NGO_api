const express = require('express');
const { register, login, acceptInvite } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/accept-invite/:token', acceptInvite);

module.exports = router;
