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

describe('ListTransferablePlayers', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/transferable-players')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });
  });

  describe('success', () => {
    it('should fetch transferable players', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('transferablePlayer', 10);

      const response = (
        await chai
          .request(app)
          .get('/transferable-players')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(10);
    });

    it('should fetch transferable players based on pagination factors', async () => {
      const bearerToken = await createBearerToken();

      const transferablePlayers = await factory.createMany('transferablePlayer', 15);

      const firstTransferablePlayer = transferablePlayers[4];

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?skip=10&limit=3')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(3);
      expect(String(firstTransferablePlayer._id)).to.equal(
        String(response.data.transferablePlayers[0]._id)
      );
    });

    it('should fetch transferable player by id', async () => {
      const bearerToken = await createBearerToken();

      const transferablePlayers = await factory.createMany('transferablePlayer', 5);

      const selectedTransferablePlayer = transferablePlayers[2];

      const response = (
        await chai
          .request(app)
          .get(`/transferable-players?id=${selectedTransferablePlayer._id}`)
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(1);
      expect(String(selectedTransferablePlayer._id)).to.equal(
        String(response.data.transferablePlayers[0]._id)
      );
    });

    it('should return empty if transferable player id is not present', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('transferablePlayer', 5);

      const response = (
        await chai
          .request(app)
          .get(`/transferable-players?id=${ObjectId()}`)
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(0);
    });
  });

  describe('.id', () => {
    it('should return error if id is invalid', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/transferable-players?id=mnp')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('id length must be 24 characters long');
    });
  });

  describe('.playerName', () => {
    it('should fetch transferable player by playerName', async () => {
      const bearerToken = await createBearerToken();

      const player1 = await factory.create('player', {
        name: { firstName: 'Krishan', lastName: 'Saini' }
      });
      const player2 = await factory.create('player', {
        name: { firstName: 'Saini', lastName: 'Krishan' }
      });

      await factory.create('transferablePlayer', { askingPrice: 100000, player: player1._id });
      await factory.createMany('transferablePlayer', 2, { askingPrice: 100000 });
      await factory.create('transferablePlayer', { askingPrice: 100000, player: player2._id });
      await factory.createMany('transferablePlayer', 3, { askingPrice: 200000 });

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?playerName=Krishan')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(2);
      expect(
        response.data.transferablePlayers.every(
          (transferablePlayer) => transferablePlayer.player.name.firstName === 'Krishan'
            || transferablePlayer.player.name.lastName === 'Krishan'
        )
      ).to.be.equal(true);
    });
  });

  describe('.country', () => {
    it('should fetch transferable player by country', async () => {
      const bearerToken = await createBearerToken();

      const player1 = await factory.create('player', { country: 'test' });
      const player2 = await factory.create('player', { country: 'test' });

      await factory.create('transferablePlayer', { askingPrice: 100000, player: player1._id });
      await factory.createMany('transferablePlayer', 2, { askingPrice: 100000 });
      await factory.create('transferablePlayer', { askingPrice: 100000, player: player2._id });
      await factory.createMany('transferablePlayer', 3, { askingPrice: 200000 });

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?country=test')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(2);
      expect(
        response.data.transferablePlayers.every(
          (transferablePlayer) => transferablePlayer.player.country === 'test'
        )
      ).to.be.equal(true);
    });
  });

  describe('.country && .playerName', () => {
    it('should fetch transferable player by country and player name', async () => {
      const bearerToken = await createBearerToken();

      const player1 = await factory.create('player', {
        country: 'test',
        name: { firstName: 'Krishan', lastName: 'Saini' }
      });
      const player2 = await factory.create('player', {
        country: 'test',
        name: { firstName: 'Saini', lastName: 'Krishan' }
      });

      await factory.create('transferablePlayer', { askingPrice: 100000, player: player1._id });
      await factory.createMany('transferablePlayer', 2, { askingPrice: 100000 });
      await factory.create('transferablePlayer', { askingPrice: 100000, player: player2._id });
      await factory.createMany('transferablePlayer', 3, { askingPrice: 200000 });

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?country=test')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(2);
      expect(
        response.data.transferablePlayers.every(
          (transferablePlayer) => transferablePlayer.player.country === 'test'
        )
      ).to.be.equal(true);
    });
  });

  describe('.teamName', () => {
    it('should fetch transferable player by teamName', async () => {
      const bearerToken = await createBearerToken();

      const team = await factory.create('team', { name: 'test' });

      await factory.create('transferablePlayer', { askingPrice: 100000, team: team._id });
      await factory.createMany('transferablePlayer', 2, { askingPrice: 100000 });
      await factory.createMany('transferablePlayer', 3, { askingPrice: 200000 });

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?teamName=test')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(1);
      expect(response.data.transferablePlayers[0].team.name).to.be.equal('test');
    });
  });

  describe('.askingPrice', () => {
    it('should fetch transferable player by minAskingPrice', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('transferablePlayer', 2, { askingPrice: 100000 });
      await factory.createMany('transferablePlayer', 3, { askingPrice: 200000 });

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?minAskingPrice=150000')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(3);
      expect(
        response.data.transferablePlayers.every(
          (transferablePlayer) => transferablePlayer.askingPrice >= 150000
        )
      ).to.be.equal(true);
    });

    it('should fetch transferable player by maxAskingPrice', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('transferablePlayer', 2, { askingPrice: 100000 });
      await factory.createMany('transferablePlayer', 3, { askingPrice: 200000 });

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?maxAskingPrice=150000')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(2);
      expect(
        response.data.transferablePlayers.every(
          (transferablePlayer) => transferablePlayer.askingPrice <= 150000
        )
      ).to.be.equal(true);
    });

    it('should fetch transferable player by maxAskingPrice and minAskingPrice', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('transferablePlayer', 2, { askingPrice: 100000 });
      await factory.createMany('transferablePlayer', 3, { askingPrice: 200000 });
      await factory.createMany('transferablePlayer', 2, { askingPrice: 300000 });

      const response = (
        await chai
          .request(app)
          .get('/transferable-players?minAskingPrice=150000&maxAskingPrice=250000')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.transferablePlayers.length).to.equal(3);
      expect(
        response.data.transferablePlayers.every(
          // eslint-disable-next-line max-len
          (transferablePlayer) => transferablePlayer.askingPrice >= 150000 && transferablePlayer.askingPrice <= 250000
        )
      ).to.be.equal(true);
    });
  });
});
