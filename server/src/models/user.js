const mongoose = require('mongoose');
const softDeletePlugin = require('mongoose-delete');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');

const createAccessToken = require('../lib/create-jwt-token');
const RefreshToken = require('./refresh-token');

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      firstName: { type: String, index: true },
      lastName: { type: String, index: true }
    },
    email: {
      type: String,
      email: true,
      validate: isEmail,
      index: true
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
      index: true
    },
    password: { type: String, select: false, required: true }
  },
  { timestamps: true }
);

UserSchema.pre('save', async function encryptPassword(next) {
  this.wasNew = this.isNew;

  if (this.password && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.pre('save', async function uniqueEmailAddress(next) {
  if (this.isNew) {
    const emailExists = await this.model('User').countDocuments({ email: this.email });

    if (emailExists) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }
  }

  next();
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  const { password } = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, password, (err, data) => {
      if (err) return reject(err);

      return resolve(data);
    });
  });
};

UserSchema.methods.createSession = async function createSession() {
  const { name, role } = await this.model('User').findById(this._id, {}, { lean: true });

  const refreshToken = await RefreshToken.create({ user: this._id });

  const accessToken = await createAccessToken({
    user: {
      id: this._id,
      role,
      name
    }
  });

  return {
    refreshToken: refreshToken.token,
    accessToken
  };
};

UserSchema.plugin(softDeletePlugin, {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: true
});

module.exports = model('User', UserSchema);
