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

describe('ListPlayers', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('.auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/player')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user is not authorized to list a player', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/player')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
    });
  });

  describe('success', () => {
    it('should fetch players', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('player', 10);

      const response = (
        await chai
          .request(app)
          .get('/player')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.players.length).to.equal(10);
    });

    it('should fetch players based on pagination factors', async () => {
      const bearerToken = await createBearerToken();

      const players = await factory.createMany('player', 15);

      const firstPlayer = players[4];

      const response = (
        await chai
          .request(app)
          .get('/player?skip=10&limit=3')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.players.length).to.equal(3);
      expect(String(firstPlayer._id)).to.equal(String(response.data.players[0]._id));
    });

    it('should fetch player by id', async () => {
      const bearerToken = await createBearerToken();

      const players = await factory.createMany('player', 5);

      const selectedPlayer = players[2];

      const response = (
        await chai
          .request(app)
          .get(`/player?id=${selectedPlayer._id}`)
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.players.length).to.equal(1);
      expect(String(selectedPlayer._id)).to.equal(String(response.data.players[0]._id));
    });

    it('should return empty if player id is not present', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('player', 5);

      const response = (
        await chai
          .request(app)
          .get(`/player?id=${ObjectId()}`)
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.players.length).to.equal(0);
    });
  });

  describe('error', () => {
    it('should return error if player id is invalid', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/player?id=mnp')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('id length must be 24 characters long');
    });
  });
});
