const express = require('express');
const Joi = require('joi');
const TransferablePlayer = require('../../models/transferable-players');
const Player = require('../../models/player');
const Team = require('../../models/team');
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
        .optional(),
      minAskingPrice: Joi.number()
        .min(0)
        .max(100000000)
        .optional(),
      maxAskingPrice: Joi.number()
        .min(0)
        .max(100000000)
        .optional(),
      country: Joi.string()
        .min(4)
        .max(56)
        .trim()
        .optional(),
      playerName: Joi.string()
        .regex(/^[a-zA-Z]*$/)
        .trim()
        .optional(),
      teamName: Joi.string()
        .regex(/^[a-zA-Z ]*$/)
        .trim()
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
    checkAuthentication({ auth, roles: ['ADMIN', 'USER'] });
    const {
      skip,
      limit,
      id,
      minAskingPrice,
      maxAskingPrice,
      playerName,
      teamName,
      country
    } = validateRequest(query);

    const searchCriteria = {};

    if (id) {
      searchCriteria._id = id;
    }

    if (minAskingPrice && maxAskingPrice) {
      searchCriteria.askingPrice = {
        $gte: minAskingPrice,
        $lte: maxAskingPrice
      };
    } else if (minAskingPrice) {
      searchCriteria.askingPrice = {
        $gte: minAskingPrice
      };
    } else if (maxAskingPrice) {
      searchCriteria.askingPrice = {
        $lte: maxAskingPrice
      };
    }

    if (playerName && country) {
      const players = await Player.find(
        {
          $or: [{ 'name.firstName': playerName }, { 'name.lastName': playerName }],
          country: country.toLowerCase()
        },
        { _id: 1 }
      );
      const playerIds = players.map((player) => player._id);

      searchCriteria.player = {
        $in: playerIds
      };
    } else if (playerName) {
      const players = await Player.find(
        { $or: [{ 'name.firstName': playerName }, { 'name.lastName': playerName }] },
        { _id: 1 }
      );
      const playerIds = players.map((player) => player._id);

      searchCriteria.player = {
        $in: playerIds
      };
    } else if (country) {
      const players = await Player.find({ country: country.toLowerCase() }, { _id: 1 });
      const playerIds = players.map((player) => player._id);

      searchCriteria.player = {
        $in: playerIds
      };
    }

    if (teamName) {
      const teams = await Team.find({ name: teamName }, { _id: 1 });
      const teamIds = teams.map((team) => team._id);

      searchCriteria.team = {
        $in: teamIds
      };
    }

    const transferablePlayers = await TransferablePlayer.find(
      searchCriteria,
      {},
      { limit, skip, sort: { _id: -1 } }
    ).populate('player team');

    // eslint-disable-next-line max-len
    const count = await TransferablePlayer.countDocuments(searchCriteria);

    res.send({
      statusCode: 200,
      data: {
        transferablePlayers,
        totalCount: count
      },
      message: 'TRANSFERABLE_PLAYERS_FETCHED'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
