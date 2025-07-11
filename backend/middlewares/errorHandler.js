const AppError = require('../utils/appError');
const logger = require('../utils/logger'); // Assuming logger.js is still console-only for now

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  console.log(
    'Error Handler: Inside handleDuplicateFieldsDB - Processing duplicate key error.'
  );
  const value = err.keyValue ? Object.values(err.keyValue)[0] : '';
  const message = `Duplicate field value: "${value}". Please use another value!`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

exports.notFound = (req, res, next) => {
  console.log('Error Handler: Not Found middleware triggered');
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

exports.errorHandler = (err, req, res, next) => {
  // Log the original error object to understand its structure before any modifications
  // This will show all enumerable and non-enumerable properties of the error object
  console.log(
    'Error Handler: Global error handler triggered. Original error object (full properties):',
    JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
  );
  console.log(
    'Error Handler: Original error name:',
    err.name,
    'Original error code:',
    err.code
  );

  // Initialize statusCode and status based on the error
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Something went very wrong!'; // Default message

  // Create a mutable error object for transformation
  let error = { ...err };
  error.message = message; // Ensure message is present on the mutable copy

  // --- Error Type Handling ---
  // Mongoose CastError (e.g., invalid ID format)
  if (err.name === 'CastError') {
    error = handleCastErrorDB(err); // Pass original err to handler
  }
  // Mongoose Duplicate Key Error (code 11000)
  else if (err.code === 11000) {
    console.log(
      'Error Handler: Matched original error code 11000 for duplicate field.'
    );
    error = handleDuplicateFieldsDB(err); // Pass original err to handler
  }
  // Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    error = handleValidationErrorDB(err); // Pass original err to handler
  }
  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  // If it's an AppError already (e.g., from controllers), use its properties
  else if (err instanceof AppError) {
    error = err; // Use the AppError directly
  }
  // Fallback for any other unhandled errors (programming errors)
  else {
    // For unhandled programming errors, ensure it's marked non-operational
    // and provide a generic message in production.
    error.statusCode = 500;
    error.status = 'error';
    error.message = 'Something went very wrong!';
    error.isOperational = false;
  }

  // Update statusCode and status from the (potentially transformed) error object
  statusCode = error.statusCode;
  status = error.status;
  message = error.message;

  if (process.env.NODE_ENV === 'development') {
    // In development, still send clean format but log detailed info to console
    console.log('Error Handler: DEV error details:', {
      status: status,
      message: message,
      stack: error.stack,
      error: error,
    });

    res.status(statusCode).json({
      status: status,
      message: message,
    });
    console.log('Error Handler: DEV error response sent successfully.');
  } else if (process.env.NODE_ENV === 'production') {
    // In production, only send operational errors with the simplified format
    if (error.isOperational) {
      res.status(statusCode).json({
        status: status,
        message: message,
      });
    } else {
      // For programming errors, send a generic message with error status
      logger.error('ERROR 💥 UNHANDLED PROGRAMMING ERROR:', err); // Log original error for internal review
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
    console.log('Error Handler: PROD error response sent successfully.');
  } else {
    // Fallback for any other NODE_ENV values - use production-like format
    if (error.isOperational) {
      res.status(statusCode).json({
        status: status,
        message: message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
};
