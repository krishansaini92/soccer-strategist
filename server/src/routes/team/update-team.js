const express = require('express');
const Joi = require('joi');
const Player = require('../../models/player');
const Team = require('../../models/team');
const User = require('../../models/user');
const { joiFailurePrettier } = require('../../lib/joi-validate');
const checkAuthentication = require('../../lib/check-authentication');
const commonArrayElements = require('../../lib/common-array-elements');

const router = express.Router();

const validateRequest = (payload) => {
  const { error, value } = Joi.validate(
    payload,
    Joi.object({
      id: Joi.string()
        .length(24)
        .trim()
        .required(),
      name: Joi.string()
        .regex(/^[a-zA-Z ]*$/)
        .min(1)
        .max(50)
        .trim()
        .allow('')
        .optional(),
      players: Joi.array()
        .items(
          Joi.string()
            .length(24)
            .required()
        )
        .optional(),
      balanceAmount: Joi.number()
        .min(100000)
        .optional(),
      user: Joi.string()
        .length(24)
        .optional(),
      country: Joi.string()
        .min(4)
        .max(56)
        .trim()
        .optional(),
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

router.put('/', async ({ body: payload, auth }, res, next) => {
  try {
    checkAuthentication({ auth, roles: ['ADMIN'] });
    const {
      id,
      country,
      name,
      players: playerIds,
      balanceAmount,
      user: userId,
      transfer
    } = validateRequest(payload);

    const team = await Team.findById(id);

    if (!team) {
      throw new Error('INVALID_ID');
    }

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('INVALID_USER_ID');
      }

      team.user = userId;
    }

    team.country = country || team.country;
    team.name = name || team.name;
    team.balanceAmount = balanceAmount || team.balanceAmount;

    if (playerIds?.length) {
      const players = await Player.find({ _id: { $in: playerIds } });

      if (players.length !== playerIds.length) {
        throw new Error('INVALID_PLAYER_ID');
      }

      const associatedTeams = await Team.find({
        players: { $in: playerIds },
        user: { $ne: team.user }
      });

      if (!transfer && associatedTeams.length) {
        throw new Error('PLAYER_ASSOCIATED_WITH_TEAM');
      } else if (transfer && associatedTeams.length) {
        await removePlayersFromTeams(players, playerIds, associatedTeams);
      }

      team.players = playerIds;
    }

    await team.save();

    const savedTeam = await Team.findById(team._id).populate('players');

    res.send({
      statusCode: 200,
      message: 'Team updated Successfully',
      data: {
        team: savedTeam
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
