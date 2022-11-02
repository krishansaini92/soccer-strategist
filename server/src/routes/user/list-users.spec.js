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

describe('ListUsers', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  it('should return error when user authentication is not provided', async () => {
    const response = JSON.parse(
      (
        await chai
          .request(app)
          .get('/user')
          .send({})
      ).error.text
    );

    expect(response.statusCode).to.equal(401);
  });

  it('should throw error if user is not authorized to list a user', async () => {
    const bearerToken = await createBearerToken({}, 'USER');

    const response = JSON.parse(
      (
        await chai
          .request(app)
          .get('/user')
          .set({ authorization: bearerToken })
          .send({})
      ).error.text
    );

    expect(response.statusCode).to.equal(403);
  });

  it('should fetch users', async () => {
    const bearerToken = await createBearerToken();

    await factory.createMany('user', 10, { role: 'USER' });

    const response = (
      await chai
        .request(app)
        .get('/user')
        .set({ authorization: bearerToken })
        .send({})
    ).body;

    expect(response.statusCode).to.equal(200);
    expect(response.data.users.length).to.equal(10);
  });

  it('should fetch users based on pagination factors', async () => {
    const bearerToken = await createBearerToken();

    const users = await factory.createMany('user', 15, { role: 'USER' });

    const eleventhUser = users[4];

    const response = (
      await chai
        .request(app)
        .get('/user?skip=10&limit=3')
        .set({ authorization: bearerToken })
        .send({})
    ).body;

    expect(response.statusCode).to.equal(200);
    expect(response.data.users.length).to.equal(3);
    expect(eleventhUser.email).to.equal(response.data.users[0].email);
  });

  it('should fetch userby id', async () => {
    const bearerToken = await createBearerToken();

    const users = await factory.createMany('user', 5, { role: 'USER' });

    const selectedUser = users[2];

    const response = (
      await chai
        .request(app)
        .get(`/user?id=${selectedUser._id}`)
        .set({ authorization: bearerToken })
        .send({})
    ).body;

    expect(response.statusCode).to.equal(200);
    expect(response.data.users.length).to.equal(1);
    expect(selectedUser.email).to.equal(response.data.users[0].email);
  });

  it('should return empty if user id is not present', async () => {
    const bearerToken = await createBearerToken();

    await factory.createMany('user', 5, { role: 'USER' });

    const response = (
      await chai
        .request(app)
        .get(`/user?id=${ObjectId()}`)
        .set({ authorization: bearerToken })
        .send({})
    ).body;

    expect(response.statusCode).to.equal(200);
    expect(response.data.users.length).to.equal(0);
  });

  it('should return error if user id is invalid', async () => {
    const bearerToken = await createBearerToken();

    const response = JSON.parse(
      (
        await chai
          .request(app)
          .get('/user?id=mnp')
          .set({ authorization: bearerToken })
          .send({})
      ).error.text
    );

    expect(response.statusCode).to.equal(400);
    expect(response.message).to.equal('id length must be 24 characters long');
  });
});
