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

describe('CreateUser', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const payload = {
        firstName: chance.name().split(' ')[1],
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/user')
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user is not authorized to create a user', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const payload = {
        firstName: chance.name().split(' ')[1],
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
    });
  });

  describe('success', () => {
    it('should be successful when user is created', async () => {
      const bearerToken = await createBearerToken();
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
          .post('/user')
          .set({ authorization: bearerToken })
          .send(payload)
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.user).to.include.all.keys('name', 'email');
      expect(response.data.user.email).to.equal(payload.email);
    });
  });

  describe('.firstName', () => {
    it('should throw error when firstName is not provided', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        lastName: chance.name().split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName is required');
    });

    it('should throw error when firstName is not a string', async () => {
      const bearerToken = await createBearerToken();
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
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName must be a string');
    });

    it('should throw error when firstName is empty', async () => {
      const bearerToken = await createBearerToken();
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
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('firstName is not allowed to be empty');
    });

    it('should throw error when firstName contains special characters', async () => {
      const bearerToken = await createBearerToken();
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
            .post('/user')
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
        lastName: 11,
        firstName: chance.name().split(' ')[0],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/user')
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
        lastName: 'A@#$%^&*(m',
        firstName: chance.name().split(' ')[0],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid name');
    });
  });

  describe('.email', () => {
    it('should throw error when email is provided but not valid', async () => {
      const bearerToken = await createBearerToken();
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
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Please provide a valid email');
    });

    it('should throw error if email id already exists on the server', async () => {
      const bearerToken = await createBearerToken();
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
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('EMAIL_ALREADY_REGISTERED');
    });

    it('should throw error when password is not provided', async () => {
      const bearerToken = await createBearerToken();
      const payload = {
        firstName: chance.name().split(' ')[0],
        lastName: chance.name().split(' ')[1],
        email: chance.email()
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('INVALID_PASSWORD');
    });

    it('should throw error when email and password are provided but password is not valid', async () => {
      const bearerToken = await createBearerToken();
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
            .post('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('password length must be at least 6 characters long');
    });
  });
});
