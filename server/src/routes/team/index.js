const express = require('express');
const createTeam = require('./create-team');
const listTeams = require('./list-teams');
const deleteTeam = require('./delete-team');
const updateTeam = require('./update-team');

const router = express.Router();

router.use('/', createTeam);
router.use('/', listTeams);
router.use('/', deleteTeam);
router.use('/', updateTeam);

module.exports = router;
