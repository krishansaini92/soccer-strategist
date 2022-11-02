const { session: sessionConfig } = require('config');
const {
  describe, it, before, after, afterEach
} = require('mocha');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const { Error: MongooseError } = require('mongoose');
const chaiAsExpected = require('chai-as-promised');
const {
  connectAndCleanUp, cleanUpAndDisconnect, cleanUp, factory
} = require('../fixtures');
const User = require('./user');
const RefreshToken = require('./refresh-token');

chai.use(chaiAsExpected);
const { expect } = chai;

describe('Model User', () => {
  before(connectAndCleanUp);

  after(cleanUpAndDisconnect);

  afterEach(cleanUp);

  it('should create user given the correct input', async () => {
    await expect(factory.create('user')).to.be.fulfilled;
  });

  describe('.email', () => {
    it('should refuse to create user if email are missing', async () => {
      const userObject = (await factory.build('user')).toObject();
      delete userObject.email;

      const user = new User(userObject);

      expect(user.save()).to.be.rejectedWith('One of phone or email is required');
    });

    it('should create if email is present', async () => {
      const userObject = (await factory.build('user')).toObject();

      const user = new User(userObject);

      await expect(user.save()).to.be.fulfilled;
    });

    it('should refuse to create user if User.email is not a valid email ID', async () => {
      await expect(factory.create('user', { email: 'A@b@c@example.com' })).to.be.rejectedWith(
        MongooseError.ValidationError
      );
      await expect(
        factory.create('user', { email: 'just"not"right@example.com' })
      ).to.be.rejectedWith(MongooseError.ValidationError);
    });

    it('should refuse to create user with duplicate email', async () => {
      await expect(factory.create('user', { email: 'test@yopmail.com' })).to.be.fulfilled;
      await expect(factory.create('user', { email: 'test@yopmail.com' })).to.be.rejectedWith(
        'EMAIL_ALREADY_REGISTERED'
      );
    });
  });

  describe('.passwordHash', () => {
    it('should refuse to create user if password is missing', async () => {
      const userObject = (await factory.build('user')).toObject();
      delete userObject.password;

      const user = new User(userObject);

      await expect(user.save()).to.be.rejectedWith('Path `password` is required');
    });

    it('should hash the password before saving the user model', async () => {
      const user = await factory.create('user');

      expect(user.password)
        .to.be.a('string')
        .which.is.not.equal('test@123');
    });

    it('should not have password field when finding users in db', async () => {
      const user = await factory.create('user');

      const userData = await User.findOne({ _id: user._id });

      expect(userData.password).to.be.equal(undefined);
    });
  });

  describe('.verifyPassword', () => {
    it('should verify correct password', async () => {
      await factory.create('user', { email: 'test@test.com', password: 'test@123' });
      const user = await User.findOne({ email: 'test@test.com' }).select('+password');

      expect(await user.comparePassword('test@123')).to.be.equal(true);
    });

    it('should not verify incorrect password', async () => {
      await factory.create('user', { email: 'test@test.com', passwordHash: 'test@123' });
      const user = await User.findOne({ email: 'test@test.com' }).select('+password');

      expect(await user.comparePassword('helloworld')).to.be.equal(false);
    });
  });

  describe('.createSession', () => {
    it('should create a valid JWT access token not verifiable with invalid public key', async () => {
      const user = await factory.create('user');
      const { accessToken } = await user.createSession();

      expect(() => jwt.verify(accessToken, 'INVALID_KEY')).to.throw();
    });

    it('should create a valid JWT access token verifiable with valid key', async () => {
      const user = await factory.create('user');
      const { accessToken } = await user.createSession();

      expect(() => jwt.verify(accessToken, sessionConfig.get('key'))).to.not.throw();
      expect(jwt.verify(accessToken, sessionConfig.get('key')))
        .to.have.property('user')
        .to.include({ id: user.id });
    });

    it('should add refresh token in database in the user document', async () => {
      const user = await factory.create('user');
      const { refreshToken } = await user.createSession();
      const userRefreshTokens = await RefreshToken.find({ user: user.id });

      expect(userRefreshTokens[0])
        .to.have.property('token')
        .which.is.equals(refreshToken);
    });
  });
});
