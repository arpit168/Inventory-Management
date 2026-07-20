import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Ensure that for a given user and sequence ID, there is only one counter
counterSchema.index({ id: 1, user: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
