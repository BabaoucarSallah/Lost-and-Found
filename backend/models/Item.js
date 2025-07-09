const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    date_reported: {
      type: Date,
      default: Date.now,
    },
    date_lost_or_found: {
      type: Date,
      required: [true, 'Date lost or found is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      max_length: 200,
    },
    image_url: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'claimed', 'returned', 'archived'],
      default: 'active',
    },
    claimed_by_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster search
itemSchema.index({ title: 'text', description: 'text', location: 'text' });
itemSchema.index({ type: 1, category: 1, status: 1 });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
