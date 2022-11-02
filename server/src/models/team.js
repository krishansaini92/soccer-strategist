const { teamCombination, defaultCountries } = require('config');
const mongoose = require('mongoose');
const softDeletePlugin = require('mongoose-delete');
const chance = require('chance').Chance();

const { Schema, model } = mongoose;

const TeamSchema = new Schema(
  {
    name: { type: String, index: true },
    country: {
      type: String,
      index: true
    },
    players: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Player', index: true }]
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    totalCost: {
      type: Number
    },
    balanceAmount: {
      type: Number
    }
  },
  { timestamps: true }
);

TeamSchema.pre('save', async function updateAmounts(next) {
  this.wasNew = this.isNew;

  if (this.isModified('players')) {
    // Update Total Cost
    const players = await this.model('Player').find({ _id: { $in: this.players } });
    let totalCost = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const player of players) {
      totalCost += player.marketvalue;
    }

    this.totalCost = totalCost;
  }

  next();
});

TeamSchema.statics.createNewTeam = async function createNewTeam(userId) {
  let allPlayers = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const combination of teamCombination) {
    const promisesArray = [];
    for (let i = 0; i < combination.count; i++) {
      promisesArray.push(this.model('Player').createNewPlayer(combination.role));
    }

    // eslint-disable-next-line no-await-in-loop
    const createdPlayers = await Promise.all(promisesArray);
    allPlayers = allPlayers.concat(createdPlayers);
  }

  const team = {
    name: chance.name().split(' ')[0],
    country: chance.pickone(defaultCountries),
    players: allPlayers.map((player) => player._id),
    user: userId,
    totalCost: 20000000,
    balanceAmount: 5000000
  };

  return this.model('Team').create(team);
};

TeamSchema.plugin(softDeletePlugin, {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: true
});

module.exports = model('Team', TeamSchema);
