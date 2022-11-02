const express = require('express');
const createplayer = require('./create-player');
const listplayers = require('./list-players');
const deleteplayer = require('./delete-player');
const updateplayer = require('./update-player');

const router = express.Router();

router.use('/', createplayer);
router.use('/', listplayers);
router.use('/', deleteplayer);
router.use('/', updateplayer);

module.exports = router;
