const {
  describe, it, before, after, afterEach
} = require('mocha');
const chance = require('chance').Chance();
const { session: sessionConfig } = require('config');
const chai = require('chai');
const ms = require('ms');
const jwt = require('jsonwebtoken');
const chaiHttp = require('chai-http');
const {
  connectAndCleanUp, cleanUpAndDisconnect, cleanUp, factory
} = require('../../fixtures');
const RefreshToken = require('../../models/refresh-token');
const app = require('../../index');

chai.use(chaiHttp);
const { expect } = chai;

describe('updateSession', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('.success', () => {
    it('should create new session if refreshToken is valid', async () => {
      const userDetails = {
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      await factory.create('user', {
        password: userDetails.password,
        email: userDetails.email
      });

      const signInResponse = (
        await chai
          .request(app)
          .post('/iam/signin')
          .send({
            email: userDetails.email,
            password: userDetails.password
          })
      ).body;

      const response = (
        await chai
          .request(app)
          .post('/iam/update-session')
          .send({
            refreshToken: signInResponse.data.session.refreshToken
          })
      ).body;

      expect(response.statusCode).to.equal(201);
      expect(response.message).to.equal('Session updated');
    });

    it(`should set the expiry time of access token by ${sessionConfig.get(
      'refreshTtl'
    )} from current time`, async () => {
      const userDetails = {
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      await factory.create('user', {
        password: userDetails.password,
        email: userDetails.email
      });

      const signInResponse = (
        await chai
          .request(app)
          .post('/iam/signin')
          .send({
            email: userDetails.email,
            password: userDetails.password
          })
      ).body;

      const expectedTtlMin = Math.floor(
        (new Date().getTime() + ms(sessionConfig.get('refreshTtl'))) / 1000
      );
      const expectedTtlMax = Math.ceil(
        (new Date().getTime() + ms(sessionConfig.get('refreshTtl'))) / 1000
      );

      const response = (
        await chai
          .request(app)
          .post('/iam/update-session')
          .send({
            refreshToken: signInResponse.data.session.refreshToken
          })
      ).body;

      const { accessToken } = response.data.session;

      expect((await jwt.decode(accessToken)).exp).to.be.within(expectedTtlMin, expectedTtlMax);
    });

    it(`should extend the expiry time of refresh token by ${sessionConfig.get(
      'expiryTtl'
    )} from current time`, async () => {
      const userDetails = {
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      await factory.create('user', {
        password: userDetails.password,
        email: userDetails.email
      });

      const signInResponse = (
        await chai
          .request(app)
          .post('/iam/signin')
          .send({
            email: userDetails.email,
            password: userDetails.password
          })
      ).body;

      const response = (
        await chai
          .request(app)
          .post('/iam/update-session')
          .send({
            refreshToken: signInResponse.data.session.refreshToken
          })
      ).body;

      const expectedTtlMin = Math.floor(
        (new Date().getTime() + ms(sessionConfig.get('expiryTtl'))) / 1000
      );
      const expectedTtlMax = Math.ceil(
        (new Date().getTime() + ms(sessionConfig.get('expiryTtl'))) / 1000
      );

      const refreshToken = await RefreshToken.findOne({
        token: response.data.session.refreshToken
      });

      expect(new Date(refreshToken.validTill).getTime() / 1000).to.be.within(
        expectedTtlMin,
        expectedTtlMax
      );
    });
  });

  describe('.error', () => {
    it('should give error response if refreshToken is not valid', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/update-session')
            .send({
              refreshToken: chance.string()
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('INVALID_REFRESH_TOKEN');
    });

    it('should give error if refresh-token has already been expired', async () => {
      const userDetails = {
        email: chance.email(),
        password: chance.string({ length: 6 })
      };
      const user = await factory.create('user', {
        password: userDetails.password,
        email: userDetails.email
      });

      const signInResponse = (
        await chai
          .request(app)
          .post('/iam/signin')
          .send({
            email: userDetails.email,
            password: userDetails.password
          })
      ).body;

      const refreshToken = await RefreshToken.findOne({
        token: signInResponse.data.session.refreshToken,
        user: user._id
      });
      await refreshToken.invalidate();

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/update-session')
            .send({
              refreshToken: signInResponse.data.session.refreshToken
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('INVALID_REFRESH_TOKEN');
    });
  });
});
