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

describe('ListTeams', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('auth', () => {
    it('should return error when user authentication is not provided', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/team')
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(401);
    });
  });

  describe('success', () => {
    it('should fetch teams', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('team', 10);

      const response = (
        await chai
          .request(app)
          .get('/team')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.teams.length).to.equal(10);
    });
  });

  describe('.pagination', () => {
    it('should fetch teams based on pagination factors', async () => {
      const bearerToken = await createBearerToken();

      const teams = await factory.createMany('team', 15);

      const firstTeam = teams[4];

      const response = (
        await chai
          .request(app)
          .get('/team?skip=10&limit=3')
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.teams.length).to.equal(3);
      expect(String(firstTeam._id)).to.equal(String(response.data.teams[0]._id));
    });
  });

  describe('.userid', () => {
    it('should fetch team by userid', async () => {
      const bearerToken = await createBearerToken();

      const teams = await factory.createMany('team', 5);

      const selectedTeam = teams[2];

      const response = (
        await chai
          .request(app)
          .get(`/team?userId=${selectedTeam.user}`)
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.teams.length).to.equal(1);
      expect(String(selectedTeam._id)).to.equal(String(response.data.teams[0]._id));
    });

    it('should return error if userid is invalid', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/team?userId=mnp')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('userId length must be 24 characters long');
    });
  });

  describe('.id', () => {
    it('should fetch team by id', async () => {
      const bearerToken = await createBearerToken();

      const teams = await factory.createMany('team', 5);

      const selectedTeam = teams[2];

      const response = (
        await chai
          .request(app)
          .get(`/team?id=${selectedTeam._id}`)
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.teams.length).to.equal(1);
      expect(String(selectedTeam._id)).to.equal(String(response.data.teams[0]._id));
    });

    it('should return empty if team id is not present', async () => {
      const bearerToken = await createBearerToken();

      await factory.createMany('team', 5);

      const response = (
        await chai
          .request(app)
          .get(`/team?id=${ObjectId()}`)
          .set({ authorization: bearerToken })
          .send({})
      ).body;

      expect(response.statusCode).to.equal(200);
      expect(response.data.teams.length).to.equal(0);
    });

    it('should return error if team id is invalid', async () => {
      const bearerToken = await createBearerToken();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .get('/team?id=mnp')
            .set({ authorization: bearerToken })
            .send({})
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.message).to.equal('id length must be 24 characters long');
    });
  });
});
