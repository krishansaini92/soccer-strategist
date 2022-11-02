const {
  describe, it, before, after, afterEach
} = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSubset = require('chai-subset');
const { ObjectId } = require('mongoose').Types;
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

describe('CreateTeam', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/team')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user is not authorized to create a team', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/team')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
    });
  });

  describe('success', () => {
    it('should be successful when team is created with unassocisated players', async () => {
      const bearerToken = await createBearerToken();
      const team = (await factory.build('team', { totalCost: undefined })).toObject();
      delete team._id;
      delete team.deleted;

      const response = (
        await chai
          .request(app)
          .post('/team')
          .set({ authorization: bearerToken })
          .send(team)
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.team).to.include.all.keys(
        'players',
        'name',
        'country',
        'totalCost',
        'balanceAmount'
      );
      expect(response.data.team.name).to.equal(team.name);
    });

    it('should be successful when team is created with players already associated with other teams', async () => {
      const bearerToken = await createBearerToken();
      const team1 = await factory.create('team');

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(team1.players[1]);

      const allRequestPlayers = newTeam.players.map((p) => String(p));

      const response = (
        await chai
          .request(app)
          .post('/team')
          .set({ authorization: bearerToken })
          .send({ ...newTeam, transfer: true })
      ).body;

      const allResponsePlayers = response.data.team.players.map((p) => String(p._id));

      expect(response.statusCode).to.equal(200);
      expect(allRequestPlayers).deep.equal(allResponsePlayers);
    });
  });

  describe('error', () => {
    it('should throw error when team is created with players already associated with other teams and `transfer` param is false', async () => {
      const bearerToken = await createBearerToken();
      const team1 = await factory.create('team');

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(team1.players[1]);

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/team')
            .set({ authorization: bearerToken })
            .send(newTeam)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Player is associated with another team');
    });
  });

  describe('.name', () => {
    it('should throw error when name is not provided', async () => {
      const bearerToken = await createBearerToken();

      const newTeam = (
        await factory.build('team', { name: undefined, totalCost: undefined })
      ).toObject();
      delete newTeam._id;
      delete newTeam.deleted;

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/team')
            .set({ authorization: bearerToken })
            .send(newTeam)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('name is required');
    });

    it('should throw error when firstName contains special characters', async () => {
      const bearerToken = await createBearerToken();

      const newTeam = (
        await factory.build('team', { name: 'hg%^*kL', totalCost: undefined })
      ).toObject();
      delete newTeam._id;
      delete newTeam.deleted;

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/team')
            .set({ authorization: bearerToken })
            .send(newTeam)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.userId', () => {
    it('should throw error when invalid userId is provided', async () => {
      const bearerToken = await createBearerToken();

      const newTeam = (
        await factory.build('team', { user: ObjectId(), totalCost: undefined })
      ).toObject();
      delete newTeam._id;
      delete newTeam.deleted;

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/team')
            .set({ authorization: bearerToken })
            .send(newTeam)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid user id provided');
    });
  });

  describe('.playerId', () => {
    it('should throw error when invalid playerId is provided', async () => {
      const bearerToken = await createBearerToken();

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(ObjectId());

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/team')
            .set({ authorization: bearerToken })
            .send(newTeam)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid player id provided');
    });
  });
});
