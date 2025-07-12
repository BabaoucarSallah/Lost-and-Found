const mongoose = require('mongoose');
const Category = require('./models/Category');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGO_URI || 'mongodb://localhost:27017/lost-and-found',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const categories = [
  { name: 'Electronics' },
  { name: 'Documents' },
  { name: 'Jewelry' },
  { name: 'Clothing' },
  { name: 'Other' },
];

async function seedCategories() {
  try {
    // Check if categories already exist
    const existingCategories = await Category.find();

    if (existingCategories.length > 0) {
      console.log('Categories already exist in database');
      console.log(
        'Existing categories:',
        existingCategories.map((cat) => cat.name)
      );
      process.exit(0);
    }

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories seeded successfully:');
    createdCategories.forEach((cat) => {
      console.log(`- ${cat.name} (ID: ${cat._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
