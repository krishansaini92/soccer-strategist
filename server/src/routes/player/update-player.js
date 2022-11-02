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
        .required(),
      firstName: Joi.string()
        .regex(/^[a-zA-Z ]*$/)
        .min(1)
        .max(50)
        .trim()
        .allow('')
        .optional(),
      lastName: Joi.string()
        .regex(/^[a-zA-Z ]*$/)
        .min(1)
        .max(50)
        .trim()
        .allow('')
        .optional(),
      role: Joi.string()
        .valid('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER')
        .allow('')
        .optional(),
      age: Joi.number()
        .min(18)
        .max(40)
        .optional(),
      marketvalue: Joi.number()
        .min(1000000)
        .optional(),
      country: Joi.string()
        .min(4)
        .max(56)
        .trim()
        .allow('')
        .optional()
    })
  );

  if (error?.details[0]?.message.indexOf('fails to match the required pattern') > -1) {
    throw new Error('INVALID_NAME');
  } else if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

router.put('/', async ({ body: payload, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['ADMIN', 'USER'] });
    const {
      id, firstName, lastName, country, role, marketvalue, age
    } = validateRequest(payload);

    const player = await Player.findById(id);

    if (!player) {
      throw new Error('INVALID_ID');
    }

    const dataToUpdate = {
      country: country ? country.toLowerCase() : player.country,
      name: {
        firstName: firstName || player.firstName,
        lastName: lastName || player.lastName
      }
    };

    if ((marketvalue || age || role) && auth.user.role === 'USER') {
      throw new Error('UNAUTHORIZED');
    }

    if (marketvalue && auth.user.role === 'ADMIN') {
      dataToUpdate.marketvalue = marketvalue;
    }

    if (age && auth.user.role === 'ADMIN') {
      dataToUpdate.age = age;
    }

    if (role && auth.user.role === 'ADMIN') {
      dataToUpdate.role = role;
    }

    await Player.updateOne({ _id: player._id }, { $set: dataToUpdate });

    const responsePlayer = await Player.findById(player._id);

    res.send({
      statusCode: 200,
      message: 'Player updated Successfully',
      data: {
        player: responsePlayer
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
