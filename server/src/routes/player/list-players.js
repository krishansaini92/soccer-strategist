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
      skip: Joi.number()
        .default(0)
        .min(0)
        .max(1000000)
        .optional(),
      limit: Joi.number()
        .default(10)
        .min(0)
        .max(1000)
        .optional(),
      id: Joi.string()
        .length(24)
        .optional()
    })
  );
  if (error) {
    joiFailurePrettier(error);
  }

  return value;
};

router.get('/', async ({ query, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['ADMIN'] });
    const { skip, limit, id } = validateRequest(query);

    const searchCriteria = {};

    if (id) {
      searchCriteria._id = id;
    }

    const players = await Player.find(searchCriteria, {}, { limit, skip, sort: { _id: -1 } });

    // eslint-disable-next-line max-len
    const count = await Player.countDocuments(searchCriteria);

    res.send({
      statusCode: 200,
      data: {
        players,
        totalCount: count
      },
      message: 'PLAYERS_FETCHED'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
