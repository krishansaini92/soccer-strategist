const express = require('express');
const Joi = require('joi');
const User = require('../../models/user');
const Team = require('../../models/team');
const { joiFailurePrettier } = require('../../lib/joi-validate');

const router = express.Router();

const validateRequest = (payload) => {
  const { error, value } = Joi.validate(
    payload,
    Joi.object({
      email: Joi.string()
        .min(2)
        .max(50)
        .trim()
        .required(),
      password: Joi.string()
        .min(6)
        .required()
    })
  );
  if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

router.post('/signin', async ({ body: payload }, res, next) => {
  try {
    const { email, password } = validateRequest(payload);

    const findCriteria = {
      email: email.toLowerCase()
    };

    let user = await User.findOne(findCriteria).select('password role');

    if (!user) {
      throw new Error('INVALID_EMAIL');
    }

    const hasPasswordMatched = await user.comparePassword(password.toString());
    if (!hasPasswordMatched) {
      throw new Error('INVALID_CREDENTIALS');
    }

    /* Generate access token for logged in user. */
    const session = await user.createSession();

    user = await User.findById(user._id);

    const team = await Team.findOne({ user: user._id }).populate('players');

    res.send({
      statusCode: 201,
      message: 'Signed In Successfully',
      data: {
        user,
        session,
        team
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
