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

describe('DeleteTeam', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .delete('/team')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });

    it('should throw error if user is not authorized to delete a team', async () => {
      const bearerToken = await createBearerToken({}, 'USER');

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .delete('/team')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(403);
    });
  });

  describe('success', () => {
    it('should be successful when team is deleted', async () => {
      const bearerToken = await createBearerToken();
      const team = await factory.create('team');

      const response = (
        await chai
          .request(app)
          .delete('/team')
          .set({ authorization: bearerToken })
          .send({
            id: team.id
          })
      ).body;

      expect(response.statusCode).to.equal(200);

      const getResponse = (
        await chai
          .request(app)
          .get('/team')
          .set({ authorization: bearerToken })
          .send({
            id: team.id
          })
      ).body;

      expect(getResponse.data.teams.length).to.equal(0);
    });
  });

  describe('.id', () => {
    it('should throw error if id is not present on server', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .delete('/team')
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
            .delete('/team')
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
});
