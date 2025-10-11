const Announcement = require('../models/Announcement.model');
const Devotion = require('../models/Devotion.model');
const News = require('../models/News.model');

// ANNOUNCEMENTS
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = Announcement.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt');

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const announcements = await query;

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const announcement = await Announcement.create(req.body);

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DEVOTIONS
exports.getAllDevotions = async (req, res) => {
  try {
    const devotions = await Devotion.find({ isActive: true })
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      count: devotions.length,
      data: devotions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createDevotion = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const devotion = await Devotion.create(req.body);

    res.status(201).json({
      success: true,
      data: devotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// NEWS
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find({ isActive: true })
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createNews = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const news = await News.create(req.body);

    res.status(201).json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
