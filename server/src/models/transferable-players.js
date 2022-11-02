const mongoose = require('mongoose');
const softDeletePlugin = require('mongoose-delete');

const { Schema, model } = mongoose;

const TransferablePlayerSchema = new Schema(
  {
    player: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      index: true,
      required: true
    },
    team: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
    askingPrice: { type: Number, index: true }
  },
  { timestamps: true }
);

TransferablePlayerSchema.plugin(softDeletePlugin, {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: true
});

module.exports = model('TransferablePlayer', TransferablePlayerSchema);
