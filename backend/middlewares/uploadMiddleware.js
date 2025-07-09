const multer = require('multer');
const AppError = require('../utils/appError');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Make sure this directory exists!
    cb(null, 'public/images/items'); // Store images in public/images/items
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    // Ensure req.user exists from authentication middleware before this.
    // If not, you might use a generic name or generate a UUID.
    const userId = req.user ? req.user.id : 'anonymous';
    cb(null, `item-${userId}-${Date.now()}.${ext}`);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

exports.uploadItemImage = upload.single('image'); // 'image' is the field name from the form
