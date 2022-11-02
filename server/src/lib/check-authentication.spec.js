const { describe, it } = require('mocha');
const chai = require('chai');
const checkAuthentication = require('./check-authentication');

const { expect } = chai;

describe('Lib: CheckAuthentication', () => {
  describe('success', () => {
    it('should return true if valid auth is provided but no roles are to be validated', async () => {
      expect(checkAuthentication({ auth: { user: { id: '123' } } })).to.equal(true);
    });

    it('should return true if valid auth is provided and matching role is provided', async () => {
      expect(
        checkAuthentication({ auth: { user: { id: '123', role: 'user' } }, roles: ['user'] })
      ).to.equal(true);
    });
  });

  describe('error', () => {
    it('should throw authentication error if auth is not provided', async () => {
      expect(() => checkAuthentication({})).to.throw('AUTHENTICATION_FAILED');
    });

    it('should throw authentication error if auth is provided but it does not have user property', async () => {
      expect(() => checkAuthentication({ auth: { id: '123' } })).to.throw('AUTHENTICATION_FAILED');
    });

    it('should throw authorization error if valid auth is provided but it role is not matching', async () => {
      expect(() => checkAuthentication({ auth: { user: { id: '123', role: 'user' } }, roles: ['admin'] })).to.throw('UNAUTHORIZED');
    });
  });
});
