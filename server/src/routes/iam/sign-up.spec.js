const {
  describe, it, before, after, afterEach
} = require('mocha');
const chance = require('chance').Chance();
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSubset = require('chai-subset');
const { connectAndCleanUp, cleanUpAndDisconnect, cleanUp } = require('../../fixtures');
const app = require('../../index');

chai.use(chaiHttp);
chai.use(chaiSubset);
const { expect } = chai;

describe('SignUp', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('.success', () => {
    it('should be successful when user registers using email and password', async () => {
      const name = chance.name();
      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = (
        await chai
          .request(app)
          .post('/iam/signup')
          .send(payload)
      ).body;

      expect(response.statusCode).to.equal(201);
      expect(response.data.user.email).to.equal(payload.email);
      expect(response.data).to.have.all.keys('user', 'session', 'team');
      expect(response.data.session).to.have.all.keys('refreshToken', 'accessToken');
      expect(response.data.team).to.include.all.keys(
        'players',
        'name',
        'country',
        'totalCost',
        'balanceAmount'
      );
    });
  });

  describe('.firstName', () => {
    it('should throw error when firstName is not provided', async () => {
      const payload = {
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName is required');
    });

    it('should throw error when firstName is not a string', async () => {
      const payload = {
        firstName: 11,
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName must be a string');
    });

    it('should throw error when firstName is empty', async () => {
      const payload = {
        firstName: '',
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName is not allowed to be empty');
    });

    it('should throw error when firstName contains special characters', async () => {
      const payload = {
        firstName: 'A@#$%^&*(m',
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.lastName', () => {
    it('should throw error when lastName is not a string', async () => {
      const payload = {
        lastName: 11,
        firstName: chance.name().split(' ')[0],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('lastName must be a string');
    });

    it('should throw error when lastName contains special characters', async () => {
      const payload = {
        lastName: 'A@#$%^&*(m',
        firstName: chance.name().split(' ')[0],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.email && .password', () => {
    it('should throw error when email is provided but not valid', async () => {
      const payload = {
        lastName: chance.name().split(' ')[0],
        email: 'abc@abc',
        firstName: chance.name().split(' ')[0],
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid email');
    });

    it('should throw error if email id already exists on the server', async () => {
      const email = chance.email();
      const payload = {
        lastName: chance.name().split(' ')[0],
        email,
        firstName: chance.name().split(' ')[1],
        password: chance.string({ length: 6 })
      };

      await chai
        .request(app)
        .post('/iam/signup')
        .send(payload);

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('EMAIL_ALREADY_REGISTERED');
    });

    it('should throw error when password is not provided', async () => {
      const payload = {
        firstName: chance.name().split(' ')[0],
        lastName: chance.name().split(' ')[1],
        email: chance.email()
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('INVALID_PASSWORD');
    });

    it('should throw error when email and password are provided but password is not valid', async () => {
      const payload = {
        firstName: chance.name().split(' ')[0],
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 5 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signup')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('password length must be at least 6 characters long');
    });
  });

  describe('.session', () => {
    it('should return valid accessToken and refreshToken of the same user when registration is successful', async () => {
      const payload = {
        firstName: chance.name().split(' ')[0],
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = (
        await chai
          .request(app)
          .post('/iam/signup')
          .send(payload)
      ).body;

      expect(response.statusCode).to.equal(201);
      expect(response.data.session).to.contain.keys('accessToken', 'refreshToken');
    });
  });
});
