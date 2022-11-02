const {
  describe, it, before, after, afterEach
} = require('mocha');
const chai = require('chai');
const chaiDatetime = require('chai-datetime');
const { Types: MongoTypes } = require('mongoose');
const ms = require('ms');
const {
  session: { expiryTtl: refreshTokenConfig }
} = require('config');
const {
  factory, connectAndCleanUp, disconnectDb, cleanUp
} = require('../fixtures');
const RefreshToken = require('./refresh-token');

chai.use(chaiDatetime);
const { expect } = chai;

describe('Model RefreshToken', () => {
  before(connectAndCleanUp);
  after(disconnectDb);
  afterEach(cleanUp);

  describe('.validTill', () => {
    it('should automatically set the value to future date after duration from configuration', async () => {
      const token = await RefreshToken.create({ token: 'random' });

      const expectedExpiry = new Date(new Date().getTime() + ms(refreshTokenConfig));

      expect(token.validTill).to.be.equalDate(expectedExpiry);
    });
  });

  describe('.isValid', () => {
    it('should return true for token which is not expired yet', async () => {
      const token = await factory.create('refreshToken');

      expect(token.isValid).to.be.equal(true);
    });

    it('should return false for token which is already expired', async () => {
      let token = await factory.create('refreshToken');

      token.validTill = new Date();
      token = await token.save();

      expect(token.isValid).to.be.equal(false);
    });

    it('should return true if token is set to never expire', async () => {
      const user = await factory.create('user', { isMachine: true });
      const token = await factory.create('refreshToken', { user: user.id });

      expect(token.isValid).to.be.equal(true);
    });
  });

  describe('.createToken', () => {
    it('should create a random uuid', async () => {
      const token = RefreshToken.createToken();

      expect(token.length).to.be.equal(256);
    });
  });

  describe('.expire', () => {
    it('should expire all the valid refresh tokens for the given user', async () => {
      const userId = MongoTypes.ObjectId();
      await factory.createMany('refreshToken', 2, {
        userId,
        validTill: new Date().getTime() + ms('1h')
      });
      await factory.createMany('refreshToken', 2, {
        userId: null,
        validTill: new Date().getTime() + ms('1h')
      });

      await RefreshToken.expire({ userId });
      expect(
        (
          await RefreshToken.find({
            userId,
            validTill: { $gt: new Date() }
          })
        ).length
      ).to.be.equal(0);
    });

    it('should expire all the valid refresh tokens for the given device', async () => {
      const deviceId = MongoTypes.ObjectId();
      await factory.createMany('refreshToken', 2, {
        deviceId,
        validTill: new Date().getTime() + ms('1h')
      });
      await factory.createMany('refreshToken', 2, {
        deviceId: null,
        validTill: new Date().getTime() + ms('1h')
      });

      await RefreshToken.expire({ deviceId });
      expect(
        (
          await RefreshToken.find({
            deviceId,
            validTill: { $gt: new Date() }
          })
        ).length
      ).to.be.equal(0);
    });
  });
});
