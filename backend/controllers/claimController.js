const Claim = require('../models/Claim');
const Item = require('../models/Item');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create a new claim
exports.createClaim = catchAsync(async (req, res, next) => {
  const { itemId, claimDetails } = req.body;

  const item = await Item.findById(itemId);
  if (!item) {
    return next(new AppError('Item not found', 404));
  }

  // Prevent claiming your own reported item of the same type (optional logic)
  // If it's a 'found' item you reported, you shouldn't claim it.
  // If it's a 'lost' item you reported, you shouldn't claim it (you're the owner).
  if (item.user.toString() === req.user.id) {
    return next(new AppError('You cannot claim an item you reported.', 400));
  }

  // Prevent claiming an item that's already claimed
  if (item.status !== 'active') {
    return next(new AppError('This item is not available for claiming.', 400));
  }

  // Check if user already has a pending claim for this item
  const existingClaim = await Claim.findOne({
    item: itemId,
    claimer_user: req.user.id,
    status: 'pending',
  });
  if (existingClaim) {
    return next(
      new AppError('You already have a pending claim for this item.', 400)
    );
  }

  const newClaim = await Claim.create({
    item: itemId,
    claimer_user: req.user.id,
    claim_details: claimDetails,
    status: 'pending',
  });

  // Optionally update item status to 'pending'
  item.status = 'pending';
  await item.save({ validateBeforeSave: false }); // Don't re-validate all item fields

  res.status(201).json({
    status: 'success',
    data: {
      claim: newClaim,
    },
  });
});

// Get all claims (Admin/Item Owner can view relevant claims)
exports.getAllClaims = catchAsync(async (req, res, next) => {
  let query = {};
  // Admin can see all claims
  if (req.user.role !== 'admin') {
    // User can see claims they made OR claims on their reported items
    query = {
      $or: [
        { claimer_user: req.user.id },
        { 'item.user': req.user.id }, // This requires populate below to work effectively
      ],
    };
  }

  const claims = await Claim.find(query)
    .populate('item', 'title description user') // Populate item and its user
    .populate('claimer_user', 'username email contact_info');

  // Further filter for item owner: only show claims for items *they* reported
  let filteredClaims = claims;
  if (req.user.role !== 'admin') {
    filteredClaims = claims.filter(
      (claim) =>
        claim.claimer_user._id.toString() === req.user.id ||
        (claim.item &&
          claim.item.user &&
          claim.item.user.toString() === req.user.id)
    );
  }

  res.status(200).json({
    status: 'success',
    results: filteredClaims.length,
    data: {
      claims: filteredClaims,
    },
  });
});

// Get a single claim by ID
exports.getClaim = catchAsync(async (req, res, next) => {
  const claim = await Claim.findById(req.params.id)
    .populate('item', 'title description user')
    .populate('claimer_user', 'username email contact_info');

  if (!claim) {
    return next(new AppError('Claim not found', 404));
  }

  // Authorization: Only admin, claimer, or item owner can view
  if (
    req.user.role !== 'admin' &&
    claim.claimer_user._id.toString() !== req.user.id &&
    claim.item &&
    claim.item.user &&
    claim.item.user.toString() !== req.user.id
  ) {
    return next(new AppError('You are not authorized to view this claim', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      claim,
    },
  });
});

// Update claim status (Item owner or Admin)
exports.updateClaimStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return next(
      new AppError(
        'Invalid claim status. Must be "approved" or "rejected".',
        400
      )
    );
  }

  const claim = await Claim.findById(req.params.id).populate('item');

  if (!claim) {
    return next(new AppError('Claim not found', 404));
  }

  // Authorization: Only the item's reporter or an admin can update claim status
  if (req.user.role !== 'admin' && claim.item.user.toString() !== req.user.id) {
    return next(
      new AppError('You are not authorized to update this claim status', 403)
    );
  }

  // Ensure item status is updated accordingly
  if (status === 'approved') {
    claim.item.status = 'returned'; // Or 'claimed'
    claim.item.claimed_by_user = claim.claimer_user;
    claim.item.claimed_at = Date.now();
    await claim.item.save({ validateBeforeSave: false }); // Bypass validation
  } else if (status === 'rejected' && claim.item.status === 'pending') {
    // If the item was marked pending by this claim, revert to active
    claim.item.status = 'active';
    claim.item.claimed_by_user = null;
    claim.item.claimed_at = null;
    await claim.item.save({ validateBeforeSave: false });
  }

  claim.status = status;
  claim.resolved_at = Date.now();
  await claim.save();

  res.status(200).json({
    status: 'success',
    data: {
      claim,
    },
  });
});

// Delete a claim (Admin or Claimer if pending)
exports.deleteClaim = catchAsync(async (req, res, next) => {
  const claim = await Claim.findById(req.params.id);

  if (!claim) {
    return next(new AppError('Claim not found', 404));
  }

  // Authorization: Admin can delete any. Claimer can delete if pending.
  if (
    req.user.role !== 'admin' &&
    (claim.claimer_user.toString() !== req.user.id ||
      claim.status !== 'pending')
  ) {
    return next(
      new AppError('You are not authorized to delete this claim', 403)
    );
  }

  await Claim.findByIdAndDelete(req.params.id);

  // If the item was pending due to this claim, revert its status
  if (claim.item && claim.item.status === 'pending') {
    const item = await Item.findById(claim.item);
    if (item) {
      item.status = 'active';
      await item.save({ validateBeforeSave: false });
    }
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
