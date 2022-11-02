const express = require('express');
const Joi = require('joi');
const User = require('../../models/user');
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
    checkAuthentication({ auth, roles: ['ADMIN'] });
    const { id, firstName, lastName } = validateRequest(payload);

    const user = await User.findById(id);

    if (!user) {
      throw new Error('INVALID_ID');
    }

    const dataToUpdate = {
      name: user.name
    };

    if (firstName) {
      dataToUpdate.name.firstName = firstName;
    }

    if (lastName) {
      dataToUpdate.name.lastName = lastName;
    }

    await User.updateOne({ _id: user._id }, { $set: dataToUpdate });

    const responseUser = await User.findById(user._id);

    res.send({
      statusCode: 200,
      message: 'User updated Successfully',
      data: {
        user: responseUser
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
