const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/appError');

// Ensure upload directory exists
const uploadDir = 'public/images/items';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      const ext = file.mimetype.split('/')[1];
      const userId = req.user ? req.user.id : 'anonymous';
      const filename = `item-${userId}-${Date.now()}.${ext}`;
      cb(null, filename);
    } catch (error) {
      cb(new AppError('Error generating filename', 500), null);
    }
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow 1 file
  },
  onError: (err, next) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File too large. Maximum size is 5MB.', 400));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError('Too many files. Only 1 file allowed.', 400));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError('Unexpected field name. Use "image" field.', 400)
        );
      }
    }
    next(new AppError('File upload error', 500));
  },
});

exports.uploadItemImage = upload.single('image');

// Middleware to handle multer errors
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum size is 5MB.', 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Only 1 file allowed.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(
        new AppError('Unexpected field name. Use "image" field.', 400)
      );
    }
    if (err.code === 'LIMIT_FIELD_KEY') {
      return next(new AppError('Field name too long.', 400));
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return next(new AppError('Field value too long.', 400));
    }
    if (err.code === 'LIMIT_FIELD_COUNT') {
      return next(new AppError('Too many fields.', 400));
    }
    return next(new AppError('File upload error.', 400));
  }
  next(err);
};
