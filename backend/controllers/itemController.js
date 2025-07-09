const Item = require('../models/Item');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create a new item (lost/found)
exports.createItem = catchAsync(async (req, res, next) => {
  // For Local Storage (Multer): check if file is present
  if (!req.file) {
    return next(new AppError('No image uploaded for the item.', 400));
  }

  // When using Multer for local storage, req.file.path contains the local path.
  // We want to store a URL that the frontend can access.
  // Assuming your server serves static files from 'public/images/items'
  // The path will be something like 'public\images\items\item-user_id-timestamp.jpeg'
  // We need to convert it to a URL like '/public/images/items/item-user_id-timestamp.jpeg'
  const image_url = `/public/images/items/${req.file.filename}`; // Or adjust based on your exact static file serving setup

  const newItem = await Item.create({
    user: req.user.id, // Reporter's user ID
    type: req.body.type,
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    date_lost_or_found: req.body.date_lost_or_found,
    location: req.body.location,
    image_url: image_url, // Use the local image URL
  });

  res.status(201).json({
    status: 'success',
    data: {
      item: newItem,
    },
  });
});

// Get all lost/found items with search and filter
exports.getAllItems = catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Build query
  let query = Item.find();

  // Filtering
  if (queryObj.type) query = query.where('type').equals(queryObj.type);
  if (queryObj.category)
    query = query.where('category').equals(queryObj.category);
  if (queryObj.status) query = query.where('status').equals(queryObj.status);
  if (queryObj.date_lost_or_found_gte)
    query = query
      .where('date_lost_or_found')
      .gte(new Date(queryObj.date_lost_or_found_gte));
  if (queryObj.date_lost_or_found_lte)
    query = query
      .where('date_lost_or_found')
      .lte(new Date(queryObj.date_lost_or_found_lte));

  // Keyword search (text index search)
  if (req.query.keyword) {
    query = query.where({ $text: { $search: req.query.keyword } });
  }

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Default sort by newest
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  const items = await query
    .populate('user', 'username email contact_info')
    .populate('category', 'name');
  const totalItems = await Item.countDocuments(queryObj); // Count without pagination

  res.status(200).json({
    status: 'success',
    results: items.length,
    totalItems,
    page,
    totalPages: Math.ceil(totalItems / limit),
    data: {
      items,
    },
  });
});

// Get a single item by ID
exports.getItem = catchAsync(async (req, res, next) => {
  const item = await Item.findById(req.params.id)
    .populate('user', 'username email contact_info')
    .populate('category', 'name');

  if (!item) {
    return next(new AppError('Item not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      item,
    },
  });
});

// Update an item (only by reporter or admin)
exports.updateItem = catchAsync(async (req, res, next) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError('Item not found', 404));
  }

  // Authorization: Only the owner or an admin can update
  if (item.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError('You are not authorized to update this item', 403)
    );
  }

  // Handle image update if a new file is uploaded
  let image_url = item.image_url;
  if (req.file) {
    // If using local storage, update the image_url based on the new file's path
    image_url = `/public/images/items/${req.file.filename}`;
  }

  const updatedItem = await Item.findByIdAndUpdate(
    req.params.id,
    { ...req.body, image_url }, // Merge new image_url with other fields
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      item: updatedItem,
    },
  });
});

// Delete an item (only by reporter or admin)
exports.deleteItem = catchAsync(async (req, res, next) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return next(new AppError('Item not found', 404));
  }

  // Authorization: Only the owner or an admin can delete
  if (item.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError('You are not authorized to delete this item', 403)
    );
  }

  await Item.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Matching Logic (Highly Recommended)
exports.suggestMatches = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const currentItem = await Item.findById(itemId).populate('category', 'name');

  if (!currentItem) {
    return next(new AppError('Item not found', 404));
  }

  // Determine the opposite type for matching
  const oppositeType = currentItem.type === 'lost' ? 'found' : 'lost';

  // Build sophisticated matching query
  const matches = await Item.find({
    type: oppositeType,
    status: 'active', // Only match with active items
    category: currentItem.category, // Match by category
    // More advanced matching could involve:
    // - Text similarity (using fuzzy search libraries or regex for simple cases)
    // - Location proximity (if you store lat/lon and use geospatial queries)
    // - Date range proximity (e.g., date_lost_or_found within a certain range)
    $or: [
      { title: { $regex: currentItem.title, $options: 'i' } }, // Case-insensitive title match
      { description: { $regex: currentItem.description, $options: 'i' } }, // Case-insensitive description match
    ],
    _id: { $ne: currentItem._id }, // Don't match with itself
  })
    .limit(10) // Limit number of suggestions
    .populate('user', 'username email contact_info')
    .populate('category', 'name');

  res.status(200).json({
    status: 'success',
    results: matches.length,
    data: {
      matches,
    },
  });
});
