const {
  describe, it, before, after, afterEach
} = require('mocha');
const chance = require('chance').Chance();
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

describe('UpdatePlayer', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('.auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });
  });

  describe('success', () => {
    it('should be successful when player is updated for name and country', async () => {
      const bearerToken = await createBearerToken();

      const player = await factory.create('player');
      const newName = chance.name();

      const payload = {
        id: player._id,
        firstName: newName.split(' ')[0],
        lastName: newName.split(' ')[1],
        country: 'india'
      };

      const response = (
        await chai
          .request(app)
          .put('/player')
          .set({ authorization: bearerToken })
          .send(payload)
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.player.name.firstName).to.equal(payload.firstName);
      expect(response.data.player.name.lastName).to.equal(payload.lastName);
      expect(response.data.player.country).to.equal(payload.country);
    });

    it('should be successful when player is updated', async () => {
      const bearerToken = await createBearerToken();

      const player = await factory.create('player');
      const newName = chance.name();

      const payload = {
        id: player._id,
        firstName: newName.split(' ')[0],
        lastName: newName.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = (
        await chai
          .request(app)
          .put('/player')
          .set({ authorization: bearerToken })
          .send(payload)
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.player.name.firstName).to.equal(payload.firstName);
      expect(response.data.player.name.lastName).to.equal(payload.lastName);
      expect(response.data.player.country).to.equal(payload.country);
      expect(response.data.player.role).to.equal(payload.role);
      expect(response.data.player.marketvalue).to.equal(payload.marketvalue);
      expect(response.data.player.age).to.equal(payload.age);
    });
  });

  describe('.firstName', () => {
    it('should throw error when firstName is not a string', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        id: ObjectId(),
        firstName: 11
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName must be a string');
    });

    it('should throw error when firstName contains special characters', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        id: ObjectId(),
        firstName: 'A@#$%^&*(m'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.lastName', () => {
    it('should throw error when lastName is not a string', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        id: ObjectId(),
        lastName: 11
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('lastName must be a string');
    });

    it('should throw error when lastName contains special characters', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        id: ObjectId(),
        lastName: 'A@#$%^&*(m'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.id', () => {
    it('should throw error when id is invalid', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        id: '13hs',
        lastName: 'Kumar'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('id length must be 24 characters long');
    });

    it('should throw error when id is not present on server', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        id: ObjectId(),
        lastName: 'String'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid id provided');
    });
  });

  describe('.role', () => {
    it('should throw error when role is invalid', async () => {
      const bearerToken = await createBearerToken();
      const player = await factory.create('player');

      const payload = {
        id: player._id,
        role: 'Kumar'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('GOALKEEPER, DEFENDER, MIDFIELDER, ATTACKER, ');
    });

    it("should throw error when user ties to update player's role", async () => {
      const bearerToken = await createBearerToken({}, 'USER');
      const player = await factory.create('player');

      const payload = {
        id: player._id,
        role: 'GOALKEEPER'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
      expect(response.message).to.equal('Unauthorized to perform operation');
    });
  });

  describe('.age', () => {
    it('should throw error when age is not in range', async () => {
      const bearerToken = await createBearerToken();
      const player = await factory.create('player');

      const payload = {
        id: player._id,
        age: 11
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('age must be larger than or equal to 18');
    });

    it("should throw error when user ties to update player's age", async () => {
      const bearerToken = await createBearerToken({}, 'USER');
      const player = await factory.create('player');

      const payload = {
        id: player._id,
        age: 19
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
      expect(response.message).to.equal('Unauthorized to perform operation');
    });
  });

  describe('.country', () => {
    it('should throw error when country is invalid', async () => {
      const bearerToken = await createBearerToken();
      const player = await factory.create('player');

      const payload = {
        id: player._id,
        country: 'i'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('country length must be at least 4 characters long');
    });
  });

  describe('.marketvalue', () => {
    it('should throw error when marketvalue is invalid', async () => {
      const bearerToken = await createBearerToken();
      const player = await factory.create('player');

      const payload = {
        id: player._id,
        marketvalue: 100
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('marketvalue must be larger than or equal to 1000000');
    });

    it('should throw error when user ties to update marketvalue', async () => {
      const bearerToken = await createBearerToken({}, 'USER');
      const player = await factory.create('player');

      const payload = {
        id: player._id,
        marketvalue: 1000000
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
      expect(response.message).to.equal('Unauthorized to perform operation');
    });
  });
});
