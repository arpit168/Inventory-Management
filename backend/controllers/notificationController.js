import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    return next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        read: true,
      }
    );

    return res.status(200).json({
      message: 'Notification marked as read',
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({
      message: 'Notification deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({
      user: req.user.id,
    });

    return res.status(200).json({
      message: 'All notifications cleared successfully',
    });
  } catch (error) {
    return next(error);
  }
};