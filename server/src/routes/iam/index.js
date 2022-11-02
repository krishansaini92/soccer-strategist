const express = require('express');
const signUp = require('./sign-up');
const signIn = require('./sign-in');
const updateSession = require('./update-session');

const router = express.Router();

router.use('/', signUp);
router.use('/', signIn);
router.use('/', updateSession);

module.exports = router;
