import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import { addNotification } from '../utils/notifications.js';
import { sendEmail } from '../utils/email.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = signToken(user._id);

    return res.status(201).json({
      token,
      user,
      message: 'Account registered successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      token,
      user,
      message: 'Login successful',
    });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(200).json({
        message: 'If the account exists, a reset token has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${
      process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173'
    }/reset-password?token=${resetToken}`;

    await addNotification(
      user._id,
      'inventory_update',
      'Password reset requested',
      'We received a password reset request for your account. Use the reset link or token to continue.',
      'account'
    );

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Inventory Pro',
      text: `You requested a password reset. Click the following link or copy the token:\n\nReset Link: ${resetUrl}\nReset Token: ${resetToken}\n\nIf you did not request this, ignore this email. This token expires in 15 minutes.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0891b2;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password for your Inventory Pro account. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0891b2; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or use this token directly on the reset page: <strong>${resetToken}</strong></p>
        <p style="color: #666; font-size: 12px;">If you did not request a password reset, please ignore this email. This link expires in 15 minutes.</p>
      </div>`,
    });

    const response = {
      message: 'If the account exists, a reset token has been generated and sent to your email.',
    };

    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
      response.resetUrl = resetUrl;
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: 'Token and new password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long',
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Reset token is invalid or expired',
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message: 'Password reset successfully. Please log in again.',
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfile = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, theme, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (theme !== undefined) user.theme = theme;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    return res.status(200).json({
      user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentValid) {
      return res.status(401).json({
        message: 'Current password is incorrect',
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    return res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (_req, res) => {
  return res.status(200).json({
    message: 'Logged out successfully',
  });
};