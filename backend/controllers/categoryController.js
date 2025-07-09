const Category = require('../models/Category');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create a new category (Admin only)
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return next(new AppError('Category name is required', 400));
  }
  const category = await Category.create({ name });
  res.status(201).json({
    status: 'success',
    data: {
      category,
    },
  });
});

// Get all categories
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: {
      categories,
    },
  });
});

// Get a single category by ID
exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

// Update a category (Admin only)
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return next(new AppError('Category name is required', 400));
  }
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

// Delete a category (Admin only)
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
