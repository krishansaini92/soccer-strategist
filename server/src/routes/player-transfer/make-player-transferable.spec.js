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

describe('MakePlayerTransferable', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/add-player-to-market')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user is not authorized to transfer a player', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const player = await factory.create('player');
      await factory.create('team', { players: [player._id] });

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/add-player-to-market')
            .set({ authorization: bearerToken })
            .send({
              player: player._id,
              askingPrice: 1000000
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
    });
  });

  describe('success', () => {
    it('should make a player transferable', async () => {
      const userId = ObjectId();
      const bearerToken = await createBearerToken({ id: userId }, 'USER');

      const player = await factory.create('player');
      await factory.create('team', { players: [player._id], user: userId });

      const response = (
        await chai
          .request(app)
          .post('/add-player-to-market')
          .set({ authorization: bearerToken })
          .send({
            player: player._id,
            askingPrice: 1000000
          })
      ).body;

      expect(response.statusCode).to.equal(200);
    });

    it('should make a player transferable who is not associated with a team', async () => {
      const bearerToken = await createBearerToken();

      const player = await factory.create('player');

      const response = (
        await chai
          .request(app)
          .post('/add-player-to-market')
          .set({ authorization: bearerToken })
          .send({
            player: player._id,
            askingPrice: 1000000
          })
      ).body;

      expect(response.statusCode).to.equal(200);
    });
  });

  describe('error', () => {
    it('should throw error if player is already in transfer list', async () => {
      const userId = ObjectId();
      const bearerToken = await createBearerToken({ id: userId }, 'USER');

      const player = await factory.create('player');
      await factory.create('team', { players: [player._id], user: userId });

      await chai
        .request(app)
        .post('/add-player-to-market')
        .set({ authorization: bearerToken })
        .send({
          player: player._id,
          askingPrice: 1000000
        });

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/add-player-to-market')
            .set({ authorization: bearerToken })
            .send({
              player: player._id,
              askingPrice: 1000000
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Player is already in the market');
    });
  });

  describe('.playerId', () => {
    it('should throw error when invalid playerId is provided', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/add-player-to-market')
            .set({ authorization: bearerToken })
            .send({
              player: '3HGjns3',
              askingPrice: 1000000
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('player length must be 24 characters long');
    });

    it('should throw error when playerId is valid but not present on server', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/add-player-to-market')
            .set({ authorization: bearerToken })
            .send({
              player: ObjectId(),
              askingPrice: 1000000
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid player id provided');
    });
  });
});
