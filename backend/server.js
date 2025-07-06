const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger'); // We'll create this later

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes'); // Optional
const messageRoutes = require('./routes/messageRoutes'); // Optional
const userRoutes = require('./routes/userRoutes'); // Admin routes

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logger

// Serve static files (especially for uploaded images)
// This makes files in 'public' directory accessible via '/public' URL path
app.use('/public', express.static('public')); // This means: anything in 'public' folder will be available under /public URL path

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/claims', claimRoutes); // Optional
app.use('/api/v1/messages', messageRoutes); // Optional
app.use('/api/v1/users', userRoutes); // Admin panel user management

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
