const mongoose = require('mongoose');
const chance = require('chance').Chance();
const { factory, MongooseAdapter } = require('factory-girl');
const { ObjectId } = require('mongoose').Types;
const db = require('./db');
const User = require('./models/user');
const RefreshToken = require('./models/refresh-token');
const Player = require('./models/player');
const Team = require('./models/team');
const TransferablePlayer = require('./models/transferable-players');
const createAccessToken = require('./lib/create-jwt-token');

factory.setAdapter(new MongooseAdapter());

factory.define('user', User, {
  name: {
    firstName: chance.name().split(' ')[0],
    lastName: chance.name().split(' ')[1]
  },
  email: factory.chance('email'),
  role: 'ADMIN',
  password: factory.chance('string', { length: 6 })
});

factory.define('player', Player, {
  name: {
    firstName: chance.name().split(' ')[0],
    lastName: chance.name().split(' ')[1]
  },
  country: 'india',
  role: factory.chance('pickone', ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
  age: factory.chance('integer', { min: 18, max: 40 }),
  marketvalue: 1000000
});

factory.define('team', Team, {
  name: chance.name().split(' ')[0],
  country: 'india',
  players: factory.assocMany('player', 20, '_id'),
  user: factory.assoc('user', '_id'),
  totalCost: 2000000,
  balanceAmount: 5000000
});

factory.define('transferablePlayer', TransferablePlayer, {
  player: factory.assoc('player', '_id'),
  team: factory.assoc('team', '_id'),
  askingPrice: factory.chance('integer', { min: 1000000, max: 5000000 })
});

factory.define('refreshToken', RefreshToken, {
  token: factory.chance('string'),
  user: factory.assoc('user', 'id'),
  validTill: factory.chance('date'),
  revokedAt: undefined
});

const connectDb = async () => db.connect();

const cleanUp = async () => {
  await factory.cleanUp();

  await User.deleteMany();
  await Player.deleteMany();
  await Team.deleteMany();
  await TransferablePlayer.deleteMany();
  await RefreshToken.deleteMany();
};

const disconnectDb = () => mongoose.disconnect();

const connectAndCleanUp = async () => {
  await connectDb();
  await cleanUp();
};

const cleanUpAndDisconnect = async () => {
  await cleanUp();
  await disconnectDb();
};

const createBearerToken = async (data = {}, role = 'ADMIN') => {
  const dataToEncode = {
    user: {}
  };

  dataToEncode.user = {
    id: ObjectId(),
    role,
    ...data
  };
  const accessToken = await createAccessToken(dataToEncode);

  return `Bearer ${accessToken}`;
};

module.exports = {
  factory,
  connectDb,
  cleanUp,
  disconnectDb,
  connectAndCleanUp,
  cleanUpAndDisconnect,
  createBearerToken
};
