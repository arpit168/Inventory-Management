import Notification from "../models/Notification.js";

export const addNotification = async (
  userId,
  type,
  title,
  message,
  relatedProduct = "",
) => {
  await Notification.create({
    user: userId,
    type,
    title,
    message,
    relatedProduct,
  });
};
