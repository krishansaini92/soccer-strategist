const { describe, it } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('./index');

chai.use(chaiHttp);
const { expect } = chai;

describe('.index', () => {
  it('should throw error if access token is invalid', async () => {
    const response = (
      await chai
        .request(app)
        .get('/')
        .set({ authorization: 'Bearer invalid-token' })
    ).body;

    expect(response.statusCode).to.equal(400);
    expect(response.message).to.equal('jwt malformed');
  });
});
