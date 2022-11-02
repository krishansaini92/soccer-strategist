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

describe('UpdateUser', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  it('should return error when user authentication is not provided', async () => {
    const response = JSON.parse(
      (
        await chai
          .request(app)
          .put('/user')
          .send({})
      ).error.text
    );

    expect(response.statusCode).to.equal(401);
  });

  it('should throw error if user is not authorized to update a user', async () => {
    const bearerToken = await createBearerToken({}, 'USER');

    const response = JSON.parse(
      (
        await chai
          .request(app)
          .put('/user')
          .set({ authorization: bearerToken })
          .send({})
      ).error.text
    );

    expect(response.statusCode).to.equal(403);
  });

  it('should be successful when user is updated', async () => {
    const bearerToken = await createBearerToken();

    const user = await factory.create('user');
    const newName = chance.name();

    const payload = {
      id: user._id,
      firstName: newName.split(' ')[0],
      lastName: newName.split(' ')[1]
    };

    const response = (
      await chai
        .request(app)
        .put('/user')
        .set({ authorization: bearerToken })
        .send(payload)
    ).body;

    expect(response.statusCode).to.equal(200);
    expect(response.data.user.name.firstName).to.equal(payload.firstName);
    expect(response.data.user.name.lastName).to.equal(payload.lastName);
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
            .put('/user')
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
            .put('/user')
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
            .put('/user')
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
            .put('/user')
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
        id: 'jk24h',
        lastName: 'Kumar'
      };

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .put('/user')
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
            .put('/user')
            .set({ authorization: bearerToken })
            .send(payload)
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('Invalid id provided');
    });
  });
});
