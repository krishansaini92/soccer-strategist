const {
  describe, it, before, after, afterEach
} = require('mocha');
const chai = require('chai');
const { ObjectId } = require('mongoose').Types;
const chaiHttp = require('chai-http');
const chaiSubset = require('chai-subset');
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

describe('UpdateTeam', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user is not authorized to update a team', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
    });
  });

  describe('success', () => {
    it('should be successful when team is updated with country', async () => {
      const bearerToken = await createBearerToken();

      const oldTeam = await factory.create('team');

      const response = (
        await chai
          .request(app)
          .put('/team')
          .set({ authorization: bearerToken })
          .send({ id: oldTeam._id, country: 'India' })
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.team.country).to.equal('India');
    });

    it('should be successful when team is updated with name', async () => {
      const bearerToken = await createBearerToken();

      const oldTeam = await factory.create('team');

      const response = (
        await chai
          .request(app)
          .put('/team')
          .set({ authorization: bearerToken })
          .send({ id: oldTeam._id, name: 'India' })
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.team.name).to.equal('India');
    });

    it('should be successful when team is updated', async () => {
      const bearerToken = await createBearerToken();

      const oldTeam = await factory.create('team');

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;

      const oldTeamPlayers = oldTeam.players.map((p) => String(p));
      const requestPlayers = newTeam.players.map((p) => String(p));

      const response = (
        await chai
          .request(app)
          .put('/team')
          .set({ authorization: bearerToken })
          .send({ ...newTeam, id: oldTeam._id })
      ).body;

      const responserPlayers = response.data.team.players.map((p) => String(p._id));

      expect(response.statusCode).to.equal(200);
      expect(oldTeamPlayers).not.deep.equal(responserPlayers);
      expect(requestPlayers).deep.equal(responserPlayers);
    });

    it('should be successful when team is updated with players already associated with other teams', async () => {
      const bearerToken = await createBearerToken();
      const team1 = await factory.create('team');
      const team2 = await factory.create('team');

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(team1.players[1]);

      const allRequestPlayers = newTeam.players.map((p) => String(p));

      const response = (
        await chai
          .request(app)
          .put('/team')
          .set({ authorization: bearerToken })
          .send({ ...newTeam, id: team2._id, transfer: true })
      ).body;

      const allResponsePlayers = response.data.team.players.map((p) => String(p._id));

      expect(response.statusCode).to.equal(200);
      expect(allRequestPlayers).deep.equal(allResponsePlayers);
    });
  });

  describe('error', () => {
    it('should throw error when team is updated with players already associated with other teams and `transfer` param is false', async () => {
      const bearerToken = await createBearerToken();
      const team1 = await factory.create('team');
      const team2 = await factory.create('team');

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(team2.players[1]);

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({ ...newTeam, id: team1._id })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Player is associated with another team');
    });
  });

  describe('.name', () => {
    it('should throw error when firstName contains special characters', async () => {
      const bearerToken = await createBearerToken();
      const oldTeam = await factory.create('team');

      const newTeam = (
        await factory.build('team', { name: 'hg%^*kL', totalCost: undefined })
      ).toObject();
      delete newTeam._id;
      delete newTeam.deleted;

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({ ...newTeam, id: oldTeam._id })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.userId', () => {
    it('should throw error when invalid userId is provided', async () => {
      const bearerToken = await createBearerToken();
      const oldTeam = await factory.create('team');

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({ ...newTeam, user: 'sh355H', id: oldTeam._id })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('user length must be 24 characters long');
    });

    it('should throw error when userId is provided which is not present on server', async () => {
      const bearerToken = await createBearerToken();
      const oldTeam = await factory.create('team');

      const newTeam = (
        await factory.build('team', { user: ObjectId(), totalCost: undefined })
      ).toObject();
      delete newTeam._id;
      delete newTeam.deleted;

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({ ...newTeam, id: oldTeam._id })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid user id provided');
    });
  });

  describe('.playerId', () => {
    it('should throw error when invalid playerId is provided', async () => {
      const bearerToken = await createBearerToken();
      const oldTeam = await factory.create('team');

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(ObjectId());

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({ ...newTeam, id: oldTeam._id })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid player id provided');
    });
  });

  describe('.id', () => {
    it('should throw error when id is provided which is not present on server', async () => {
      const bearerToken = await createBearerToken();

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(ObjectId());

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({ ...newTeam, id: ObjectId() })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid id provided');
    });

    it('should throw error when invalid id is provided', async () => {
      const bearerToken = await createBearerToken();

      const newTeam = (await factory.build('team', { totalCost: undefined })).toObject();
      delete newTeam._id;
      delete newTeam.deleted;
      newTeam.players.push(ObjectId());

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/team')
            .set({ authorization: bearerToken })
            .send({ ...newTeam, id: '123' })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('id length must be 24 characters long');
    });
  });
});
