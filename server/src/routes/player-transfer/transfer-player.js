const { playerIncrementPercentageRange } = require('config');
const express = require('express');
const Joi = require('joi');
const Player = require('../../models/player');
const Team = require('../../models/team');
const TransferablePlayer = require('../../models/transferable-players');
const { joiFailurePrettier } = require('../../lib/joi-validate');
const checkAuthentication = require('../../lib/check-authentication');

const router = express.Router();

const validateRequest = (payload) => {
  const { error, value } = Joi.validate(
    payload,
    Joi.object({
      playerId: Joi.string()
        .length(24)
        .trim()
        .required(),
      destinationTeamId: Joi.string()
        .length(24)
        .trim()
        .optional()
        .description('This field will only be used when api is hit by the admin')
    })
  );

  if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

const incrementPlayerMarketValue = async (playerId) => {
  const player = await Player.findById(playerId);

  const incrementPercentage = Math.floor(
    Math.random() * (playerIncrementPercentageRange.max - playerIncrementPercentageRange.min + 1)
  ) + playerIncrementPercentageRange.min;
  player.marketvalue = (player.marketvalue * (1 + incrementPercentage / 100)).toFixed(0);

  await player.save();
};

router.post('/', async ({ body: payload, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['USER', 'ADMIN'] });

    const { playerId, destinationTeamId } = validateRequest(payload);

    const transferablePlayer = await TransferablePlayer.findOne({ player: playerId });

    if (!transferablePlayer) {
      throw new Error('INVALID_PLAYER_ID');
    }

    const teamSearchCriteria = {
      players: { $ne: playerId }
    };

    if (auth.user.role === 'ADMIN' && !destinationTeamId) {
      throw new Error('TEAM_ID_REQUIRED');
    } else if (auth.user.role === 'ADMIN') {
      teamSearchCriteria._id = destinationTeamId;
    } else {
      teamSearchCriteria.user = auth.user.id;
    }

    const destinationTeam = await Team.findOne(teamSearchCriteria);

    if (!destinationTeam) {
      throw new Error('INVALID_TEAM_ID');
    }

    if (destinationTeam.balanceAmount < transferablePlayer.askingPrice) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    /* Incement Player's marketvalue */
    await incrementPlayerMarketValue(playerId);

    /* Remove Player from his current team */
    const currentTeam = await Team.findOne({ players: playerId });
    if (currentTeam) {
      currentTeam.players = currentTeam.players.filter(
        (player) => String(player) !== String(playerId)
      );
      currentTeam.balanceAmount += transferablePlayer.askingPrice;
      await currentTeam.save();
    }

    /* Add Player to his new team */
    destinationTeam.players.push(playerId);
    destinationTeam.balanceAmount -= transferablePlayer.askingPrice;
    await destinationTeam.save();

    /* Remove Player from market */
    await transferablePlayer.delete();

    res.send({
      statusCode: 200,
      message: 'Player has been transferred'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
