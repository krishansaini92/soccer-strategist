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
      player: Joi.string()
        .length(24)
        .trim()
        .required(),
      askingPrice: Joi.number()
        .min(1000000)
        .required()
    })
  );

  if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

router.post('/', async ({ body: payload, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['USER', 'ADMIN'] });
    const { player: playerId, askingPrice } = validateRequest(payload);

    const player = await Player.findById(playerId);

    if (!player) {
      throw new Error('INVALID_PLAYER_ID');
    }

    const existingTransferablePLayer = await TransferablePlayer.findOne({ player: playerId });

    if (existingTransferablePLayer) {
      throw new Error('PLAYER_ALREADY_TRANSFERABLE');
    }

    const associatedTeam = await Team.findOne({ players: playerId });

    if (
      associatedTeam
      && auth.user.role === 'USER'
      && String(associatedTeam.user) !== String(auth.user.id)
    ) {
      throw new Error('UNAUTHORIZED');
    }

    const dataToSave = {
      player: playerId,
      team: associatedTeam ? associatedTeam._id : undefined,
      askingPrice
    };

    const savedPlayer = await TransferablePlayer.create(dataToSave);

    const response = await TransferablePlayer.findById(savedPlayer._id).populate('player team');

    res.send({
      statusCode: 200,
      message: 'Player has been added to market',
      data: {
        transferablePlayer: response
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
