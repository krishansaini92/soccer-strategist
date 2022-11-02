const {
  describe, it, before, after, afterEach
} = require('mocha');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
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

describe('DeleteUser', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  it('should return error when user authentication is not provided', async () => {
    const response = JSON.parse(
      (
        await chai
          .request(app)
          .delete('/user')
          .send({})
      ).error.text
    );

    expect(response.statusCode).to.equal(401);
  });

  it('should throw error if user is not authorized to delete a user', async () => {
    const bearerToken = await createBearerToken({}, 'USER');

    const response = JSON.parse(
      (
        await chai
          .request(app)
          .delete('/user')
          .set({ authorization: bearerToken })
          .send({})
      ).error.text
    );

    expect(response.statusCode).to.equal(403);
  });

  it('should be successful when user is deleted', async () => {
    const bearerToken = await createBearerToken();
    const user = await factory.create('user');

    const response = (
      await chai
        .request(app)
        .delete('/user')
        .set({ authorization: bearerToken })
        .send({
          id: user._id
        })
    ).body;

    expect(response.statusCode).to.equal(200);

    const getResponse = (
      await chai
        .request(app)
        .get(`/user?id=${user._id}`)
        .set({ authorization: bearerToken })
        .send({})
    ).body;

    expect(getResponse.data.users.length).to.equal(0);
  });

  it('should throw error if id is not present on server', async () => {
    const bearerToken = await createBearerToken();

    const response = JSON.parse(
      (
        await chai
          .request(app)
          .delete('/user')
          .set({ authorization: bearerToken })
          .send({
            id: ObjectId()
          })
      ).error.text
    );

    expect(response.statusCode).to.equal(400);
    expect(response.message).to.equal('Invalid id provided');
  });

  it('should throw error if id is invalid', async () => {
    const bearerToken = await createBearerToken();

    const response = JSON.parse(
      (
        await chai
          .request(app)
          .delete('/user')
          .set({ authorization: bearerToken })
          .send({
            id: 'mnp'
          })
      ).error.text
    );

    expect(response.statusCode).to.equal(400);
    expect(response.message).to.equal('id length must be 24 characters long');
  });
});
