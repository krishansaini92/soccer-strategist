const {
  describe, it, before, after, afterEach
} = require('mocha');
const chai = require('chai');
const chaiDatetime = require('chai-datetime');
const { ObjectId } = require('mongoose').Types;
const {
  factory, connectAndCleanUp, disconnectDb, cleanUp
} = require('../fixtures');
const TransferablePlayer = require('./transferable-players');

chai.use(chaiDatetime);
const { expect } = chai;

describe('Model TransferablePlayer', () => {
  before(connectAndCleanUp);
  after(disconnectDb);
  afterEach(cleanUp);

  it('should save a new transferable player', async () => {
    const transferablePlayer = await factory.build('transferablePlayer');

    const savedTransferablePlayer = await transferablePlayer.save();

    expect(savedTransferablePlayer).to.containSubset(transferablePlayer);
  });

  it('should throw error if player is provided', async () => {
    const payload = {
      askingPrice: 100000,
      user: ObjectId()
    };

    await expect(TransferablePlayer.create(payload)).to.be.rejectedWith(
      'Path `player` is required'
    );
  });
});
