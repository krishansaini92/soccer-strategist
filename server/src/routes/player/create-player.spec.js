const {
  describe, it, before, after, afterEach
} = require('mocha');
const chance = require('chance').Chance();
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSubset = require('chai-subset');
const {
  connectAndCleanUp,
  cleanUpAndDisconnect,
  cleanUp,
  createBearerToken
} = require('../../fixtures');
const app = require('../../index');

chai.use(chaiHttp);
chai.use(chaiSubset);
const { expect } = chai;

describe('CreatePlayer', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('.auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user is not authorized to create a player', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
    });
  });

  describe('success', () => {
    it('should be successful when player is created', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = (
        await chai
          .request(app)
          .post('/player')
          .set({ authorization: bearerToken })
          .send(payload)
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.player).to.include.all.keys(
        'name',
        'age',
        'country',
        'role',
        'marketvalue'
      );
      expect(response.data.player.name.firstName).to.equal(payload.firstName);
      expect(response.data.player.role).to.equal(payload.role);
      expect(response.data.player.marketvalue).to.equal(payload.marketvalue);
      expect(response.data.player.country).to.equal(payload.country);
    });
  });

  describe('.firstName', () => {
    it('should throw error when firstName is not provided', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName is required');
    });

    it('should throw error when firstName is not a string', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: 1233,
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName must be a string');
    });

    it('should throw error when firstName is empty', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: '',
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName is not allowed to be empty');
    });

    it('should throw error when firstName contains special characters', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: 'Rg$%^&j',
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
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
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: 123,
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('lastName must be a string');
    });

    it('should throw error when lastName contains special characters', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: 'eR$%^j',
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.role', () => {
    it('should throw error when role is not valid', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: 'TEST',
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('GOALKEEPER, DEFENDER, MIDFIELDER, ATTACKER');
    });

    it('should throw error when role is not provided', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('role is required');
    });
  });

  describe('.age', () => {
    it('should throw error when age is not within the range', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        age: 12,
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('age must be larger than or equal to 18');
    });

    it('should throw error when age is not provided', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('age is required');
    });
  });

  describe('.marketvalue', () => {
    it('should throw error when marketvalue is not within the range', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        country: 'india',
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: 1000
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('marketvalue must be larger than or equal to 1000000');
    });

    it('should throw error when marketvalue is not provided', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        country: 'india'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('marketvalue is required');
    });
  });

  describe('.country', () => {
    it('should throw error when country is not provided', async () => {
      const bearerToken = await createBearerToken();
      const name = chance.name();

      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        age: chance.integer({ min: 18, max: 40 }),
        role: chance.pickone(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER']),
        marketvalue: chance.integer({ min: 1000000, max: 5000000 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/player')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('country is required');
    });
  });
});
