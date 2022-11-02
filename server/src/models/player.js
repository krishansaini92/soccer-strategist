const { defaultCountries } = require('config');
const mongoose = require('mongoose');
const softDeletePlugin = require('mongoose-delete');
const chance = require('chance').Chance();

const { Schema, model } = mongoose;

const PlayerSchema = new Schema(
  {
    name: {
      firstName: { type: String, index: true },
      lastName: { type: String, index: true }
    },
    role: {
      type: String,
      enum: ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER'],
      defult: 'GOALKEEPER',
      index: true
    },
    country: {
      type: String,
      index: true
    },
    marketvalue: { type: Number, index: true },
    age: { type: Number, index: true }
  },
  { timestamps: true }
);

PlayerSchema.statics.createNewPlayer = function createNewPlayer(role) {
  const player = {
    name: {
      firstName: chance.name().split(' ')[0],
      lastName: chance.name().split(' ')[1]
    },
    country: chance.pickone(defaultCountries),
    role,
    age: chance.integer({ min: 18, max: 40 }),
    marketvalue: 1000000
  };

  return this.model('Player').create(player);
};

PlayerSchema.plugin(softDeletePlugin, {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: true
});

module.exports = model('Player', PlayerSchema);
