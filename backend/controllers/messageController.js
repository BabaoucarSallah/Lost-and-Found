const Message = require('../models/Message');
const User = require('../models/User'); // To validate receiver
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Send a new message
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { receiverId, itemId, content } = req.body;

  if (!receiverId || !content) {
    return next(new AppError('Receiver and content are required', 400));
  }

  // Ensure receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new AppError('Receiver user not found', 404));
  }

  const newMessage = await Message.create({
    sender: req.user.id,
    receiver: receiverId,
    item: itemId || null, // Optional: associate with an item
    content: content,
  });

  res.status(201).json({
    status: 'success',
    data: {
      message: newMessage,
    },
  });
});

// Get messages for the authenticated user (inbox/sent)
exports.getConversations = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const messages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .populate('sender', 'username')
    .populate('receiver', 'username')
    .populate('item', 'title')
    .sort('-sent_at'); // Sort by newest first

  // Group messages by conversation (e.g., with another user, or per item)
  // This is a simple grouping. For full conversation threads, you might need more complex logic
  // or a dedicated conversation model.
  const conversationsMap = new Map();

  messages.forEach((msg) => {
    const participantId =
      msg.sender._id.toString() === userId
        ? msg.receiver._id.toString()
        : msg.sender._id.toString();
    if (!conversationsMap.has(participantId)) {
      conversationsMap.set(participantId, {
        participant:
          msg.sender._id.toString() === userId ? msg.receiver : msg.sender,
        messages: [],
        lastMessageAt: msg.sent_at,
      });
    }
    conversationsMap.get(participantId).messages.push(msg);
    if (msg.sent_at > conversationsMap.get(participantId).lastMessageAt) {
      conversationsMap.get(participantId).lastMessageAt = msg.sent_at;
    }
  });

  const conversations = Array.from(conversationsMap.values()).sort(
    (a, b) => b.lastMessageAt - a.lastMessageAt
  );

  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: {
      conversations,
    },
  });
});

// Get messages for a specific conversation (between two users or about an item)
exports.getConversationWithUser = catchAsync(async (req, res, next) => {
  const { participantId } = req.params; // The other user in the conversation
  const userId = req.user.id;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: participantId },
      { sender: participantId, receiver: userId },
    ],
  })
    .populate('sender', 'username')
    .populate('receiver', 'username')
    .populate('item', 'title')
    .sort('sent_at'); // Oldest first for a thread

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      messages,
    },
  });
});

// Get a specific message by ID
exports.getMessageById = catchAsync(async (req, res, next) => {
  const message = await Message.findById(req.params.id)
    .populate('sender', 'username')
    .populate('receiver', 'username')
    .populate('item', 'title');

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  // Only sender or receiver can view the message
  if (
    message.sender._id.toString() !== req.user.id &&
    message.receiver._id.toString() !== req.user.id
  ) {
    return next(
      new AppError('You are not authorized to view this message', 403)
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      message,
    },
  });
});

// Update a message
exports.updateMessage = catchAsync(async (req, res, next) => {
  const { content } = req.body;

  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  // Only sender can update the message
  if (message.sender.toString() !== req.user.id) {
    return next(
      new AppError('You are not authorized to update this message', 403)
    );
  }

  // Update the message content
  if (content) {
    message.content = content;
  }

  await message.save();

  // Populate the updated message
  await message.populate('sender', 'username');
  await message.populate('receiver', 'username');
  await message.populate('item', 'title');

  res.status(200).json({
    status: 'success',
    data: {
      message,
    },
  });
});

// Delete a message
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  // Only sender can delete the message
  if (message.sender.toString() !== req.user.id) {
    return next(
      new AppError('You are not authorized to delete this message', 403)
    );
  }

  await Message.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Mark message as read
exports.markMessageAsRead = catchAsync(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  // Only receiver can mark as read
  if (message.receiver.toString() !== req.user.id) {
    return next(
      new AppError('You are not authorized to mark this message as read', 403)
    );
  }

  if (!message.read_at) {
    message.read_at = Date.now();
    await message.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: 'success',
    data: {
      message,
    },
  });
});
