import BusinessProfile from '../models/BusinessProfile.js';
import { addNotification } from '../utils/notifications.js';

export const getProfiles = async (req, res, next) => {
  try {
    const profiles = await BusinessProfile.find({ createdBy: req.user.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({ profiles });
  } catch (error) {
    return next(error);
  }
};

export const createProfile = async (req, res, next) => {
  try {
    const {
      businessName,
      ownerName,
      logo,
      email,
      phone,
      gstNumber,
      address,
      city,
      state,
      country,
      postalCode,
      isDefault,
    } = req.body;

    if (!businessName || !ownerName) {
      return res.status(400).json({ message: 'Business Name and Owner Name are required' });
    }

    const existingCount = await BusinessProfile.countDocuments({ createdBy: req.user.id });
    const makeDefault = existingCount === 0 || isDefault === true;

    if (makeDefault) {
      await BusinessProfile.updateMany({ createdBy: req.user.id }, { $set: { isDefault: false } });
    }

    const profile = await BusinessProfile.create({
      businessName,
      ownerName,
      logo,
      email,
      phone,
      gstNumber,
      address,
      city,
      state,
      country,
      postalCode,
      isDefault: makeDefault,
      createdBy: req.user.id,
    });

    await addNotification(
      req.user.id,
      'inventory_update',
      'Business Profile Created',
      `Shop profile "${businessName}" added successfully.`,
      businessName
    );

    return res.status(201).json({ profile, message: 'Business profile created successfully' });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await BusinessProfile.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Business profile not found' });
    }

    const fields = [
      'businessName',
      'ownerName',
      'logo',
      'email',
      'phone',
      'gstNumber',
      'address',
      'city',
      'state',
      'country',
      'postalCode',
      'isDefault',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    if (profile.isDefault) {
      await BusinessProfile.updateMany(
        { createdBy: req.user.id, _id: { $ne: profile._id } },
        { $set: { isDefault: false } }
      );
    }

    await profile.save();

    await addNotification(
      req.user.id,
      'inventory_update',
      'Business Profile Updated',
      `Shop profile "${profile.businessName}" updated successfully.`,
      profile.businessName
    );

    return res.status(200).json({ profile, message: 'Business profile updated successfully' });
  } catch (error) {
    return next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    const profile = await BusinessProfile.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Business profile not found' });
    }

    if (profile.isDefault) {
      const remaining = await BusinessProfile.findOne({ createdBy: req.user.id });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    await addNotification(
      req.user.id,
      'inventory_update',
      'Business Profile Removed',
      `Shop profile "${profile.businessName}" removed.`,
      profile.businessName
    );

    return res.status(200).json({ message: 'Business profile deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
