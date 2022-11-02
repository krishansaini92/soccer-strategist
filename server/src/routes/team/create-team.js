const express = require('express');
const Joi = require('joi');
const Player = require('../../models/player');
const User = require('../../models/user');
const Team = require('../../models/team');
const { joiFailurePrettier } = require('../../lib/joi-validate');
const checkAuthentication = require('../../lib/check-authentication');
const commonArrayElements = require('../../lib/common-array-elements');

const router = express.Router();

const validateRequest = (payload) => {
  const { error, value } = Joi.validate(
    payload,
    Joi.object({
      name: Joi.string()
        .regex(/^[a-zA-Z ]*$/)
        .min(1)
        .max(50)
        .trim()
        .required(),
      players: Joi.array()
        .items()
        .required(
          Joi.string()
            .length(24)
            .required()
        ),
      balanceAmount: Joi.number()
        .min(100000)
        .required(),
      user: Joi.string()
        .length(24)
        .required(),
      country: Joi.string()
        .min(4)
        .max(56)
        .trim()
        .required(),
      transfer: Joi.boolean()
        .default(false)
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

const removePlayersFromTeams = async (players, playerIds, associatedTeams) => {
  let allTeamPlayerIds = [];

  associatedTeams.forEach((team) => {
    allTeamPlayerIds = allTeamPlayerIds.concat(team.players);
  });

  const associatedPlayerIds = commonArrayElements(playerIds, allTeamPlayerIds);

  // eslint-disable-next-line no-restricted-syntax
  for (const playerId of associatedPlayerIds) {
    const player = players.filter((p) => String(p._id) === String(playerId))[0];
    const team = associatedTeams.filter((t) => t.players.indexOf(playerId) !== -1)[0];

    team.players = team.players.filter((p) => String(p) !== playerId);
    team.balanceAmount += player.marketvalue;

    // eslint-disable-next-line no-await-in-loop
    await team.save();
  }
};

router.post('/', async ({ body: payload, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['ADMIN'] });
    const {
      country,
      name,
      players: playerIds,
      balanceAmount,
      user: userId,
      transfer
    } = validateRequest(payload);

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('INVALID_USER_ID');
    }

    const players = await Player.find({ _id: { $in: playerIds } });

    if (players.length !== playerIds.length) {
      throw new Error('INVALID_PLAYER_ID');
    }

    const associatedTeams = await Team.find({
      players: { $in: playerIds }
    });

    if (!transfer && associatedTeams.length) {
      throw new Error('PLAYER_ASSOCIATED_WITH_TEAM');
    } else if (transfer && associatedTeams.length) {
      await removePlayersFromTeams(players, playerIds, associatedTeams);
    }

    const dataToSave = {
      country: country.toLowerCase(),
      name,
      balanceAmount,
      user: userId,
      players: playerIds
    };

    const savedTeam = await Team.create(dataToSave);

    const team = await Team.findById(savedTeam._id).populate('players');

    res.send({
      statusCode: 200,
      message: 'Team created Successfully',
      data: {
        team
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
