const express = require('express');
const Joi = require('joi');
const validator = require('validator');
const User = require('../../models/user');
const Team = require('../../models/team');
const { joiFailurePrettier } = require('../../lib/joi-validate');

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
      email: Joi.string()
        .email()
        .min(2)
        .max(50)
        .trim()
        .required(),
      password: Joi.string()
        .min(6)
        .required()
    })
  );

  if (
    error?.details[0]?.message.indexOf('fails to match the required pattern') > -1
    && (error.details[0].message.indexOf('firstName') > -1
      || error.details[0].message.indexOf('lastName') > -1)
  ) {
    throw new Error('INVALID_NAME');
  } else if (error?.details[0]?.message.indexOf('"password" is required') > -1) {
    throw new Error('INVALID_PASSWORD');
  } else if (error) {
    joiFailurePrettier(error);
  }

  if (payload.email && !validator.isEmail(payload.email)) {
    throw new Error('INVALID_EMAIL');
  }

  return value;
};

router.post('/signup', async ({ body }, res, next) => {
  try {
    const payload = validateRequest(body);

    const dataToSave = {
      email: payload.email.toLowerCase(),
      name: {
        firstName: payload.firstName,
        lastName: payload.lastName
      },
      password: payload.password
    };

    const savedUser = await User.create(dataToSave);

    await Team.createNewTeam(savedUser._id);

    /* Generate session for registered user. */
    const session = await savedUser.createSession();

    const responseUser = await User.findById({ _id: savedUser._id });
    const team = await Team.findOne({ user: savedUser._id }).populate('players');

    res.send({
      statusCode: 201,
      message: 'Signed Up Successfully',
      data: {
        user: responseUser,
        session,
        team
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
