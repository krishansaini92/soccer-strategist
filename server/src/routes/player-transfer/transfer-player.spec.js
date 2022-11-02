const { playerIncrementPercentageRange } = require('config');
const {
  describe, it, before, after, afterEach
} = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSubset = require('chai-subset');
const { ObjectId } = require('mongoose').Types;
const Team = require('../../models/team');
const Player = require('../../models/player');
const {
  factory,
  connectAndCleanUp,
  cleanUpAndDisconnect,
  cleanUp,
  createBearerToken
} = require('../../fixtures');
const app = require('../../index');

chai.use(chaiHttp);
chai.use(chaiSubset);
const { expect } = chai;

describe('TransferPlayer', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user does not have a team associated with him', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const transferablePlayer = await factory.create('transferablePlayer');

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .set({ authorization: bearerToken })
            .send({
              playerId: transferablePlayer.player
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid team id provided');
    });
  });

  describe('success', () => {
    it('should add the player into his new team and remove from old team', async () => {
      const userId = ObjectId();
      const bearerToken = await createBearerToken({ id: userId }, 'USER');

      const player = await factory.create('player');
      const extraPlayer = await factory.create('player');
      const oldTeam = await factory.create('team', { players: [player._id, extraPlayer._id] });

      await factory.create('transferablePlayer', { player: player._id });

      const newTeam = await factory.create('team', { user: userId });

      const response = (
        await chai
          .request(app)
          .post('/transfer-player')
          .set({ authorization: bearerToken })
          .send({
            playerId: player._id
          })
      ).body;

      const updatedOldTeam = await Team.findById(oldTeam._id);
      const updatedNewTeam = await Team.findById(newTeam._id);
      const newteamPlayers = updatedNewTeam.players.map((p) => String(p));
      const oldteamPlayers = updatedOldTeam.players.map((p) => String(p));

      expect(response.statusCode).to.equal(200);
      expect(newteamPlayers).to.include(String(player._id));
      expect(oldteamPlayers).not.to.include(String(player._id));
    });

    it(`should update player's marketvalue by ${playerIncrementPercentageRange.min} to ${playerIncrementPercentageRange.max} percentage`, async () => {
      const userId = ObjectId();
      const bearerToken = await createBearerToken({ id: userId }, 'USER');

      const player = await factory.create('player');
      const extraPlayer = await factory.create('player');

      await factory.create('team', { players: [player._id, extraPlayer._id] });
      await factory.create('transferablePlayer', { player: player._id });
      await factory.create('team', { user: userId });

      const response = (
        await chai
          .request(app)
          .post('/transfer-player')
          .set({ authorization: bearerToken })
          .send({
            playerId: player._id
          })
      ).body;

      const updatedPlayer = await Player.findById(player._id);
      const increment = (updatedPlayer.marketvalue / player.marketvalue - 1).toFixed(2) * 100;

      expect(response.statusCode).to.equal(200);
      expect(increment).to.be.within(
        playerIncrementPercentageRange.min,
        playerIncrementPercentageRange.max
      );
    });

    it('should update balance of new and old team accordingly', async () => {
      const userId = ObjectId();
      const bearerToken = await createBearerToken({ id: userId }, 'USER');

      const player = await factory.create('player');
      const extraPlayer = await factory.create('player');
      const oldTeam = await factory.create('team', { players: [player._id, extraPlayer._id] });

      const transferablePlayer = await factory.create('transferablePlayer', { player: player._id });

      const newTeam = await factory.create('team', { user: userId });

      const response = (
        await chai
          .request(app)
          .post('/transfer-player')
          .set({ authorization: bearerToken })
          .send({
            playerId: player._id
          })
      ).body;

      const updatedOldTeam = await Team.findById(oldTeam._id);
      const updatedNewTeam = await Team.findById(newTeam._id);

      expect(response.statusCode).to.equal(200);
      expect(updatedNewTeam.balanceAmount).to.equal(
        newTeam.balanceAmount - transferablePlayer.askingPrice
      );
      expect(updatedOldTeam.balanceAmount).to.equal(
        oldTeam.balanceAmount + transferablePlayer.askingPrice
      );
    });

    it('should update total cost of new and old team accordingly', async () => {
      const userId = ObjectId();
      const bearerToken = await createBearerToken({ id: userId }, 'USER');

      const player = await factory.create('player');
      const extraPlayer = await factory.create('player');
      const oldTeam = await factory.create('team', { players: [player._id, extraPlayer._id] });

      await factory.create('transferablePlayer', { player: player._id });

      const newTeam = await factory.create('team', { user: userId });

      const response = (
        await chai
          .request(app)
          .post('/transfer-player')
          .set({ authorization: bearerToken })
          .send({
            playerId: player._id
          })
      ).body;

      const updatedOldTeam = await Team.findById(oldTeam._id);
      const updatedNewTeam = await Team.findById(newTeam._id);

      const updatedPlayer = await Player.findById(player._id);

      expect(response.statusCode).to.equal(200);
      expect(updatedNewTeam.totalCost).to.equal(newTeam.totalCost + updatedPlayer.marketvalue);
      expect(updatedOldTeam.totalCost).to.equal(oldTeam.totalCost - player.marketvalue);
    });
  });

  describe('error', () => {
    it("should throw error when new team's balance is insufficient", async () => {
      const userId = ObjectId();
      const bearerToken = await createBearerToken({ id: userId }, 'USER');

      const player = await factory.create('player');
      const extraPlayer = await factory.create('player');

      await factory.create('team', { players: [player._id, extraPlayer._id] });
      await factory.create('transferablePlayer', { player: player._id, askingPrice: 1000000 });
      await factory.create('team', { user: userId, balanceAmount: 999999 });

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .set({ authorization: bearerToken })
            .send({
              playerId: player._id
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Team does not have sufficient funds');
    });
  });

  describe('.playerId', () => {
    it('should throw error when invalid playerId is provided', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .set({ authorization: bearerToken })
            .send({
              playerId: 'j234hjk'
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('playerId length must be 24 characters long');
    });

    it('should throw error when playerId is valid but not present on server', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .set({ authorization: bearerToken })
            .send({
              playerId: ObjectId()
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid player id provided');
    });
  });

  describe('.destinationTeamId', () => {
    it('should throw error when admin tries to transfer without destinationTeamId', async () => {
      const bearerToken = await createBearerToken();

      const player = await factory.create('player');
      await factory.create('transferablePlayer', { player: player._id });

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .set({ authorization: bearerToken })
            .send({
              playerId: player._id
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Team id is required');
    });

    it('should throw error when destinationTeamId is invalid', async () => {
      const bearerToken = await createBearerToken();

      const player = await factory.create('player');
      await factory.create('transferablePlayer', { player: player._id });

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .set({ authorization: bearerToken })
            .send({
              destinationTeamId: '1mjhj4',
              playerId: player._id
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('destinationTeamId length must be 24 characters long');
    });

    it('should throw error when destinationTeamId is valid but not present on server', async () => {
      const bearerToken = await createBearerToken();

      const player = await factory.create('player');
      await factory.create('transferablePlayer', { player: player._id });

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/transfer-player')
            .set({ authorization: bearerToken })
            .send({
              destinationTeamId: ObjectId(),
              playerId: player._id
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid team id provided');
    });

    it('should add the player into his new team and remove from old team when destinationTeamId is provided ', async () => {
      const bearerToken = await createBearerToken();

      const player = await factory.create('player');
      const extraPlayer = await factory.create('player');
      const oldTeam = await factory.create('team', { players: [player._id, extraPlayer._id] });

      await factory.create('transferablePlayer', { player: player._id });

      const newTeam = await factory.create('team');

      const response = (
        await chai
          .request(app)
          .post('/transfer-player')
          .set({ authorization: bearerToken })
          .send({
            destinationTeamId: newTeam._id,
            playerId: player._id
          })
      ).body;

      const updatedOldTeam = await Team.findById(oldTeam._id);
      const updatedNewTeam = await Team.findById(newTeam._id);
      const newteamPlayers = updatedNewTeam.players.map((p) => String(p));
      const oldteamPlayers = updatedOldTeam.players.map((p) => String(p));

      expect(response.statusCode).to.equal(200);
      expect(newteamPlayers).to.include(String(player._id));
      expect(oldteamPlayers).not.to.include(String(player._id));
    });
  });
});
