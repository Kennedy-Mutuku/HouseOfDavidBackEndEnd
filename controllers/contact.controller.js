const ContactRequest = require('../models/ContactRequest.model');

// @desc    Create contact request
// @route   POST /api/contact-requests
// @access  Public
exports.createContactRequest = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name and phone number'
      });
    }

    const contactRequest = await ContactRequest.create({
      fullName,
      phone
    });

    res.status(201).json({
      success: true,
      message: 'Your request has been submitted. An admin will contact you soon.',
      data: contactRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all contact requests
// @route   GET /api/contact-requests
// @access  Private (Admin/SuperAdmin)
exports.getAllContactRequests = async (req, res) => {
  try {
    const contactRequests = await ContactRequest.find()
      .populate('processedBy', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: contactRequests.length,
      data: contactRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending contact requests
// @route   GET /api/contact-requests/pending
// @access  Private (Admin/SuperAdmin)
exports.getPendingContactRequests = async (req, res) => {
  try {
    const contactRequests = await ContactRequest.find({ status: 'pending' })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: contactRequests.length,
      data: contactRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update contact request status
// @route   PATCH /api/contact-requests/:id
// @access  Private (Admin/SuperAdmin)
exports.updateContactRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const contactRequest = await ContactRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        processedBy: req.user._id,
        processedAt: Date.now()
      },
      { new: true }
    );

    if (!contactRequest) {
      return res.status(404).json({
        success: false,
        message: 'Contact request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact request updated successfully',
      data: contactRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete contact request
// @route   DELETE /api/contact-requests/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteContactRequest = async (req, res) => {
  try {
    const contactRequest = await ContactRequest.findByIdAndDelete(req.params.id);

    if (!contactRequest) {
      return res.status(404).json({
        success: false,
        message: 'Contact request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact request deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
