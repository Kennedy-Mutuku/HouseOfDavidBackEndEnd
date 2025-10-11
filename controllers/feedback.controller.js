const Feedback = require('../models/Feedback.model');

// @desc    Get user's conversations
// @route   GET /api/feedback/my-conversations
// @access  Private
exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await Feedback.find({ user: req.user._id })
      .sort('-lastMessageAt');

    // Format conversations
    const formattedConversations = conversations.map(conv => ({
      _id: conv._id,
      type: conv.type,
      subject: conv.subject,
      status: conv.status,
      lastMessage: conv.messages[conv.messages.length - 1]?.message || '',
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount,
      messages: conv.messages
    }));

    res.status(200).json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Private
exports.createFeedback = async (req, res) => {
  try {
    const { type, subject, message } = req.body;

    const feedback = await Feedback.create({
      user: req.user._id,
      type,
      subject,
      messages: [{
        sender: req.user._id,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        message
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Feedback sent successfully',
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reply to conversation
// @route   POST /api/feedback/:id/reply
// @access  Private
exports.replyToConversation = async (req, res) => {
  try {
    const { message } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (feedback.user.toString() !== req.user._id.toString() &&
        req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    feedback.messages.push({
      sender: req.user._id,
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      message
    });

    feedback.lastMessageAt = Date.now();

    // Increment unread count if replying user is not the original user
    if (feedback.user.toString() !== req.user._id.toString()) {
      feedback.unreadCount += 1;
    }

    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all feedback (SuperAdmin)
// @route   GET /api/feedback
// @access  Private (SuperAdmin)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('user', 'firstName lastName email group')
      .sort('-lastMessageAt');

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update feedback status
// @route   PATCH /api/feedback/:id/status
// @access  Private (SuperAdmin)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
