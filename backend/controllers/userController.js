const User = require('../models/User');
const Item = require('../models/Item'); // Assuming Item model is in the same directory
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all users (Admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password_hash');
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// Get a single user by ID (Admin only)
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password_hash');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// Update user by ID (Admin only - for changing roles etc.)
exports.updateUser = catchAsync(async (req, res, next) => {
  const { username, email, contact_info, role } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { username, email, contact_info, role }, // Be careful what fields you allow admin to update
    {
      new: true,
      runValidators: true,
    }
  ).select('-password_hash');

  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// Delete user by ID (Admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Get dashboard statistics (Admin only)
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalItems = await Item.countDocuments();
  const lostItems = await Item.countDocuments({ type: 'lost' });
  const foundItems = await Item.countDocuments({ type: 'found' });
  const activeItems = await Item.countDocuments({ status: 'active' });
  const claimedItems = await Item.countDocuments({ status: 'claimed' });

  // Recent activity (last 10 items)
  const recentItems = await Item.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'username email')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalUsers,
        totalItems,
        lostItems,
        foundItems,
        activeItems,
        claimedItems,
      },
      recentActivity: recentItems,
    },
  });
});

// Reset user password (Admin only)
exports.resetUserPassword = catchAsync(async (req, res, next) => {
  const { newPassword } = req.body;
  const userId = req.params.userId;

  if (!newPassword) {
    return next(new AppError('New password is required', 400));
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return next(
      new AppError('Password must be at least 8 characters long', 400)
    );
  }

  if (!/[A-Z]/.test(newPassword)) {
    return next(
      new AppError('Password must contain at least one uppercase letter', 400)
    );
  }

  if (!/[a-z]/.test(newPassword)) {
    return next(
      new AppError('Password must contain at least one lowercase letter', 400)
    );
  }

  if (!/\d/.test(newPassword)) {
    return next(new AppError('Password must contain at least one number', 400));
  }

  if (!/[!@#$%^&*]/.test(newPassword)) {
    return next(
      new AppError(
        'Password must contain at least one special character (!@#$%^&*)',
        400
      )
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Hash the new password
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password_hash = hashedPassword;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
});
