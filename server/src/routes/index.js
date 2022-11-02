const express = require('express');
const { appName } = require('config');
const iamRoutes = require('./iam');
const playerRoutes = require('./player');
const playerTransferRoutes = require('./player-transfer');
const teamRoutes = require('./team');
const userRoutes = require('./user');

const router = express.Router();

/* This needs to be used to check if site is up. */
router.get('/', (_, res) => {
  res.json({ title: appName });
});

router.use('/iam', iamRoutes);
router.use('/player', playerRoutes);
router.use('/', playerTransferRoutes);
router.use('/team', teamRoutes);
router.use('/user', userRoutes);

module.exports = router;
