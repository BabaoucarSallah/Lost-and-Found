const User = require('../models/User');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
      user,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  console.log('Auth Controller: Registering user...'); // ADD THIS LOG
  const { username, email, password, contact_info } = req.body;

  // Comprehensive validation with specific error messages
  if (!username || username.trim().length === 0) {
    return next(new AppError('Full name is required', 400));
  }

  if (username.trim().length < 2) {
    return next(
      new AppError('Full name must be at least 2 characters long', 400)
    );
  }

  if (username.trim().length > 50) {
    return next(new AppError('Full name cannot exceed 50 characters', 400));
  }

  if (!email || email.trim().length === 0) {
    return next(new AppError('Email is required', 400));
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return next(new AppError('Please enter a valid email', 400));
  }

  if (!password || password.length === 0) {
    return next(new AppError('Password is required', 400));
  }

  // Password strength validation
  if (password.length < 8) {
    return next(
      new AppError('Password must be at least 8 characters long', 400)
    );
  }

  if (!/[A-Z]/.test(password)) {
    return next(
      new AppError('Password must contain at least one uppercase letter', 400)
    );
  }

  if (!/[a-z]/.test(password)) {
    return next(
      new AppError('Password must contain at least one lowercase letter', 400)
    );
  }

  if (!/\d/.test(password)) {
    return next(new AppError('Password must contain at least one number', 400));
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return next(
      new AppError(
        'Password must contain at least one special character (!@#$%^&*)',
        400
      )
    );
  }

  // Phone validation (if provided)
  if (contact_info && contact_info.trim().length > 0) {
    const phoneRegex = /^[\d\s\-()+]+$/;
    if (
      !phoneRegex.test(contact_info.trim()) ||
      contact_info.trim().length < 7
    ) {
      return next(
        new AppError(
          'Please enter a valid phone number (minimum 7 digits)',
          400
        )
      );
    }
  }

  try {
    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: password,
      contact_info: contact_info ? contact_info.trim() : '',
      role: 'user',
    });
    console.log('Auth Controller: User created successfully.'); // ADD THIS LOG
    createSendToken(newUser, 201, res);
  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];

      if (field === 'email') {
        return next(
          new AppError(
            'This email is already registered. Please use a different email.',
            409
          )
        );
      } else if (field === 'username') {
        return next(
          new AppError(
            'This name is already taken. Please use a different name.',
            409
          )
        );
      } else {
        return next(
          new AppError(
            `This ${field} is already taken. Please use a different value.`,
            409
          )
        );
      }
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((error) => error.message);
      return next(new AppError(errors.join('. '), 400));
    }

    next(err); // Pass other errors to the global error handler
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist with specific error messages
  if (!email || email.trim().length === 0) {
    return next(new AppError('Email is required', 400));
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return next(new AppError('Please enter a valid email', 400));
  }

  if (!password || password.length === 0) {
    return next(new AppError('Password is required', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    '+password_hash'
  );

  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const isPasswordCorrect = await user.matchPassword(password);

  if (!isPasswordCorrect) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
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
