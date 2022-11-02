const { Schema, model } = require('mongoose');
const ms = require('ms');
const softDeletePlugin = require('mongoose-delete');
const { session: sessionConfig } = require('config');
const randToken = require('rand-token');

const RefreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    token: { type: String, index: true },
    validTill: {
      type: Date
    }
  },
  { timestamps: true, getters: true }
);

RefreshTokenSchema.index({ token: 1, validTill: 1 });

RefreshTokenSchema.virtual('isValid').get(function isRefreshTokenValid() {
  return Math.floor(this.validTill.getTime() - new Date().getTime()) / 1000 > 0;
});

RefreshTokenSchema.pre('save', async function preSaveRefreshToken() {
  if (this.isNew) {
    this.validTill = this.validTill || new Date().getTime() + ms(sessionConfig.get('expiryTtl'));
    this.token = this.token || this.model('RefreshToken').createToken();
  }
});

RefreshTokenSchema.statics.expire = async function expireRefreshToken(criteria) {
  return this.model('RefreshToken').updateMany(
    { ...criteria, validTill: { $gt: new Date() } },
    { $set: { validTill: new Date().getTime() - ms('1h') } }
  );
};

RefreshTokenSchema.methods.invalidate = async function invalidate() {
  this.validTill = new Date();

  return this.save();
};

RefreshTokenSchema.statics.createToken = function createToken() {
  return randToken.uid(256);
};

RefreshTokenSchema.plugin(softDeletePlugin, {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: true
});

module.exports = model('RefreshToken', RefreshTokenSchema);
