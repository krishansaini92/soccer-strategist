const express = require('express');
const Joi = require('joi');
const RefreshToken = require('../../models/refresh-token');
const User = require('../../models/user');
const { joiFailurePrettier } = require('../../lib/joi-validate');

const router = express.Router();

const validateRequest = (payload) => {
  const { error, value } = Joi.validate(
    payload,
    Joi.object({
      refreshToken: Joi.string().required()
    })
  );
  if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

router.post('/update-session', async ({ body: payload, logger }, res, next) => {
  try {
    const { refreshToken: token } = validateRequest(payload);

    logger.debug('Refreshing session from token...', token);

    const refreshToken = await RefreshToken.findOne({
      token,
      validTill: { $gt: new Date() }
    }).populate('user');

    if (!refreshToken || !refreshToken.isValid) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    /* Generate access token for logged in user. */
    const session = await refreshToken.user.createSession();

    await refreshToken.invalidate();

    const user = await User.findById(refreshToken.user._id, {}, { lean: true });

    logger.info(`Refreshed session '${refreshToken._id}' for user ${user._id}`, {
      refreshToken: refreshToken._id
    });

    res.send({
      statusCode: 201,
      message: 'Session updated',
      data: {
        user,
        session
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
