const User = require('../models/User');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const validatePassword = require('../utils/passwordValidator');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  user.password_hash = undefined; // Don't send password hash to client

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        username: user.username,
        email: user.email,
        contact_info: user.contact_info,
      },
    },
    redirectUrl: '/index.html', // Add redirect URL
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password, contact_info } = req.body;

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return next(
      new AppError(
        `Password requirements: ${passwordValidation.errors.join(', ')}`,
        400
      )
    );
  }

  // Check if user exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return next(
      new AppError('User with this email or username already exists', 400)
    );
  }

  const newUser = await User.create({
    username,
    email,
    password_hash: password,
    contact_info,
    role: 'user',
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // 3) Check if user exists
  const user = await User.findOne({ email }).select('+password_hash');
  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 4) Check if password is correct
  if (!(await user.matchPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 5) If everything ok, send token to client with redirect
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  // For JWT, logout is typically handled by the client deleting the token.
  // On the backend, we can send an empty token or instruct the client.
  // For a stateless JWT, there's no server-side session to destroy.
  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully' });
};

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
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

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user posts password data
  if (req.body.password_hash) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  if (req.body.username) filteredBody.username = req.body.username;
  if (req.body.email) filteredBody.email = req.body.email;
  if (req.body.contact_info) filteredBody.contact_info = req.body.contact_info;

  // 2) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
