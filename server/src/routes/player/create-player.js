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
      firstName: Joi.string()
        .regex(/^[a-zA-Z ]*$/)
        .min(1)
        .max(50)
        .trim()
        .required(),
      lastName: Joi.string()
        .regex(/^[a-zA-Z ]*$/)
        .min(1)
        .max(50)
        .trim()
        .required(),
      role: Joi.string()
        .valid('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER')
        .required(),
      age: Joi.number()
        .min(18)
        .max(40)
        .required(),
      marketvalue: Joi.number()
        .min(1000000)
        .required(),
      country: Joi.string()
        .min(4)
        .max(56)
        .trim()
        .required()
    })
  );

  if (error?.details[0]?.message.indexOf('fails to match the required pattern') > -1) {
    throw new Error('INVALID_NAME');
  } else if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

router.post('/', async ({ body: payload, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['ADMIN'] });
    const {
      country, firstName, lastName, age, role, marketvalue
    } = validateRequest(payload);

    const dataToSave = {
      country: country.toLowerCase(),
      name: {
        firstName,
        lastName
      },
      age,
      role,
      marketvalue
    };

    const savedPlayer = await Player.create(dataToSave);

    res.send({
      statusCode: 200,
      message: 'Player created Successfully',
      data: {
        player: savedPlayer
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
