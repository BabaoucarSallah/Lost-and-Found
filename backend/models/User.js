const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Full name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [50, 'Full name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function (password) {
          // Only validate on creation or when password is being modified
          if (!this.isModified('password_hash')) return true;

          // Check for uppercase letter
          if (!/[A-Z]/.test(password)) return false;
          // Check for lowercase letter
          if (!/[a-z]/.test(password)) return false;
          // Check for number
          if (!/\d/.test(password)) return false;
          // Check for special character
          if (!/[!@#$%^&*]/.test(password)) return false;

          return true;
        },
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)',
      },
    },
    contact_info: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (phone) {
          // Allow empty phone (not required)
          if (!phone || phone.length === 0) return true;
          // Validate phone format: numbers, spaces, dashes, parentheses, plus signs
          const phoneRegex = /^[\d\s\-()+]+$/;
          return phoneRegex.test(phone) && phone.length >= 7;
        },
        message: 'Please enter a valid phone number (minimum 7 digits)',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
