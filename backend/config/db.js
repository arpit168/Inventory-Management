import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.Mongo_URI || 'mongodb://localhost:27017/inventory-management';

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};

export default connectDB;
