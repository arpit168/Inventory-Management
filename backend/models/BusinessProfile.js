import mongoose from 'mongoose';

const businessProfileSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Business Name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner Name is required'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    postalCode: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const BusinessProfile = mongoose.model('BusinessProfile', businessProfileSchema);
export default BusinessProfile;
