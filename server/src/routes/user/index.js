const express = require('express');
const createUser = require('./create-user');
const listUsers = require('./list-users');
const deleteUser = require('./delete-user');
const updateUser = require('./update-user');

const router = express.Router();

router.use('/', createUser);
router.use('/', listUsers);
router.use('/', deleteUser);
router.use('/', updateUser);

module.exports = router;
