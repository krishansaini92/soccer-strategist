const {
  describe, it, before, after, afterEach
} = require('mocha');
const chai = require('chai');
const chaiDatetime = require('chai-datetime');
const {
  factory, connectAndCleanUp, disconnectDb, cleanUp
} = require('../fixtures');
const Player = require('./player');

chai.use(chaiDatetime);
const { expect } = chai;

describe('Model Player', () => {
  before(connectAndCleanUp);
  after(disconnectDb);
  afterEach(cleanUp);

  describe('success', () => {
    it('should save a new player', async () => {
      const player = await factory.build('player');

      const savedPlayer = await player.save();

      expect(savedPlayer).to.containSubset(player);
    });
  });

  describe('.createNewPlayer', () => {
    it('should create a new player with random values', async () => {
      const player = await Player.createNewPlayer('DEFENDER');

      const savedPlayer = await Player.findById(player._id);
      expect(savedPlayer.role).to.equal('DEFENDER');
    });

    it('should throw error if invalid role is provided', async () => {
      const query = Player.createNewPlayer('TEST');

      await expect(query).to.be.rejectedWith('`TEST` is not a valid enum value for path `role`');
    });
  });
});
