const {
  describe, it, before, after, afterEach
} = require('mocha');
const chance = require('chance').Chance();
const chai = require('chai');
const chaiHttp = require('chai-http');
const {
  connectAndCleanUp, cleanUpAndDisconnect, cleanUp, factory
} = require('../../fixtures');
const app = require('../../index');

chai.use(chaiHttp);
const { expect } = chai;

describe('SignIn', () => {
  before(connectAndCleanUp);
  afterEach(cleanUp);
  after(cleanUpAndDisconnect);

  describe('success', () => {
    it('should be able to sign in successfully using email and password', async () => {
      const name = chance.name();
      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      await chai
        .request(app)
        .post('/iam/signup')
        .send(payload);

      const response = (
        await chai
          .request(app)
          .post('/iam/signin')
          .send({
            email: payload.email,
            password: payload.password
          })
      ).body;

      expect(response.statusCode).to.equal(201);
      expect(response.data.user.email).to.equal(payload.email);
      expect(response.data).to.have.all.keys('user', 'session', 'team');
      expect(response.data.session).to.have.all.keys('refreshToken', 'accessToken');
    });

    it('should be able to view team when logged in', async () => {
      const name = chance.name();
      const payload = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        email: chance.email(),
        password: chance.string({ length: 6 })
      };

      await chai
        .request(app)
        .post('/iam/signup')
        .send(payload);

      const response = (
        await chai
          .request(app)
          .post('/iam/signin')
          .send({
            email: payload.email,
            password: payload.password
          })
      ).body;

      expect(response.statusCode).to.equal(201);
      expect(response.data.team.players.length).to.equal(20);
      expect(response.data.team).to.include.all.keys(
        'players',
        'name',
        'country',
        'totalCost',
        'balanceAmount'
      );
    });

    it('should return valid session in response', async () => {
      const userDetails = {
        email: chance.email(),
        password: chance.string({ length: 6 })
      };
      await factory.create('user', {
        password: userDetails.password,
        email: userDetails.email
      });

      const response = (
        await chai
          .request(app)
          .post('/iam/signin')
          .send({
            email: userDetails.email,
            password: userDetails.password
          })
      ).body;

      expect(response.statusCode).to.equal(201);
      expect(response.data.session).to.contain.keys('accessToken', 'refreshToken');
    });
  });

  describe('.error', () => {
    it('should throw error when email is not valid', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signin')
            .send({
              email: 'Hello',
              password: 'testing'
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('INVALID_EMAIL');
    });

    it('should throw error when email does not exist on server', async () => {
      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signin')
            .send({
              email: chance.email(),
              password: 'Random'
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('INVALID_EMAIL');
    });

    it('should throw error when email and password do not match', async () => {
      const userDetails = {
        email: chance.email(),
        password: chance.string({ length: 6 })
      };
      await factory.create('user', {
        password: userDetails.password,
        email: userDetails.email
      });

      const response = JSON.parse(
        (
          await chai
            .request(app)
            .post('/iam/signin')
            .send({
              email: userDetails.email,
              password: 'Random'
            })
        ).error.text
      );

      expect(response.statusCode).to.equal(400);
      expect(response.error).to.equal('INVALID_CREDENTIALS');
    });
  });
});
