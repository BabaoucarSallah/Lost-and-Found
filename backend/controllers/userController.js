const User = require('../models/User');
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
