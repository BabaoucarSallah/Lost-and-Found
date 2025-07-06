const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    claimer_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claim_details: {
      type: String,
      required: [true, 'Claim details are required'],
      trim: true,
      max_length: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    claimed_at: {
      type: Date,
      default: Date.now,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Claim = mongoose.model('Claim', claimSchema);
module.exports = Claim;
