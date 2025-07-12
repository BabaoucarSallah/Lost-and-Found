const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }

  // JWT verification will throw errors that catchAsync will handle
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-password_hash');

  if (!req.user) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('authorize middleware called with roles:', roles);
    console.log('user role:', req.user.role);

    if (!roles.includes(req.user.role)) {
      console.log('Authorization failed');
      return next(
        new AppError(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }

    console.log('authorize middleware passed');
    next();
  };
};

// Optional authentication - sets req.user if token is valid, but doesn't fail if no token
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password_hash');
    } catch (error) {
      // Token is invalid, but we continue without setting req.user
      req.user = null;
    }
  }

  next();
});
