const express = require('express');

const makePlayerTransferable = require('./make-player-transferable');
const listTransferablePlayers = require('./list-transferable-players');
const transferPlayer = require('./transfer-player');

const router = express.Router();

router.use('/add-player-to-market', makePlayerTransferable);
router.use('/transferable-players', listTransferablePlayers);
router.use('/transfer-player', transferPlayer);

module.exports = router;
