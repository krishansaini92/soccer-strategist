const {
  describe, it, before, after, afterEach
} = require('mocha');
const chai = require('chai');
const chaiDatetime = require('chai-datetime');
const {
  factory, connectAndCleanUp, disconnectDb, cleanUp
} = require('../fixtures');
const Team = require('./team');

chai.use(chaiDatetime);
const { expect } = chai;

describe('Model Team', () => {
  before(connectAndCleanUp);
  after(disconnectDb);
  afterEach(cleanUp);

  describe('success', () => {
    it('should save a new team', async () => {
      const team = await factory.build('team');

      const savedTeam = await team.save();

      expect(savedTeam).to.containSubset(team);
    });
  });

  describe('.createNewTeam', () => {
    it('should create a new team with random values', async () => {
      const user = await factory.create('user');
      const team = await Team.createNewTeam(user._id);

      const savedTeam = await Team.findById(team._id, {}, { lean: true });
      expect(String(savedTeam.user)).to.equal(String(user._id));
      expect(savedTeam).to.include.keys('players', 'name', 'country', 'totalCost', 'balanceAmount');
    });

    it('should update total cost when players are updated', async () => {
      const player = await factory.create('player', { marketvalue: 1000000 });
      const extraPlayer = await factory.create('player', { marketvalue: 1000000 });

      const team = await factory.create('team', { players: [player._id, extraPlayer._id] });

      expect(team.totalCost).to.equal(2000000);

      team.players = team.players.filter((p) => String(p) !== String(player._id));

      await team.save();

      const updatedTeam = await Team.findById(team._id);

      expect(updatedTeam.totalCost).to.equal(1000000);
    });
  });
});
