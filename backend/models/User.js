import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,

      required: [true, 'Email is required'],

      unique: true,

      lowercase: true,

      trim: true,

      match: [
        /^\S+@\S+\.\S+$/,
        'Please use a valid email address',
      ],
    },

    password: {
      type: String,

      required: [true, 'Password is required'],

      minlength: [
        8,
        'Password must be at least 8 characters',
      ],
    },

    role: {
      type: String,

      enum: ['shopkeeper', 'admin'],

      default: 'shopkeeper',
    },

    theme: {
      type: String,

      enum: ['dark', 'light'],

      default: 'dark',
    },

    avatar: {
      type: String,
      default: '',
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();

  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;

  return user;
};

const User = mongoose.model(
  'User',
  userSchema
);

export default User;