const express = require('express');
const Joi = require('joi');
const Player = require('../../models/player');
const { joiFailurePrettier } = require('../../lib/joi-validate');
const checkAuthentication = require('../../lib/check-authentication');

const router = express.Router();

const validateRequest = (payload) => {
  const { error, value } = Joi.validate(
    payload,
    Joi.object({
      id: Joi.string()
        .length(24)
        .trim()
        .required()
    })
  );

  if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

router.delete('/', async ({ body: payload, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['ADMIN'] });
    const { id } = validateRequest(payload);

    const player = await Player.findById(id);

    if (!player) {
      throw new Error('INVALID_ID');
    }

    await player.delete();

    res.send({
      statusCode: 200,
      message: 'Player has been deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
