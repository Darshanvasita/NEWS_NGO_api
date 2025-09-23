const { News, User } = require('../models');
const cloudinary = require('cloudinary').v2;

// Helper function to extract public_id from Cloudinary URL
const getPublicId = (url) => {
  // Example URL: http://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
  // We need to extract "folder/public_id"
  const parts = url.split('/');
  const versionIndex = parts.findIndex(part => part.startsWith('v'));
  if (versionIndex === -1) return null;
  // Get the part of the URL after the version number, then remove the extension
  const publicIdWithFormat = parts.slice(versionIndex + 1).join('/');
  const publicId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.')) || publicIdWithFormat;
  return publicId;
}

const createNews = async (req, res) => {
  const { title, date } = req.body;
  const authorId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'PDF file is required.' });
  }

  try {
    const news = await News.create({
      title,
      date: new Date(date),
      pdfUrl: req.file.path,
      authorId,
    });
    res.status(201).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while creating news.', error: error.message });
  }
};

const getAllNews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const { rows: news, count: totalNews } = await News.findAndCountAll({
      offset: parseInt(skip),
      limit: parseInt(limit),
      order: [['date', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['name'] }],
    });
    res.status(200).json({
      data: news,
      totalPages: Math.ceil(totalNews / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while fetching news.', error: error.message });
  }
};

const getNewsById = async (req, res) => {
  const { id } = req.params;

  try {
    const newsItem = await News.findByPk(parseInt(id), {
      include: [{ model: User, as: 'author', attributes: ['name'] }],
    });

    if (!newsItem) {
      return res.status(404).json({ message: 'News not found.' });
    }

    res.status(200).json(newsItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while fetching the news item.', error: error.message });
  }
};

const deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    // First, find the news item to get its PDF URL
    const newsItem = await News.findByPk(parseInt(id));

    if (!newsItem) {
      return res.status(404).json({ message: 'News not found.' });
    }

    // Delete the file from Cloudinary
    const publicId = getPublicId(newsItem.pdfUrl);
    if (publicId) {
      // Use 'raw' for resource_type for non-image/video files like PDFs
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    // Then, delete the news item from the database
    await News.destroy({ where: { id: parseInt(id) } });

    res.status(200).json({ message: 'News deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while deleting the news.', error: error.message });
  }
};


module.exports = {
  createNews,
  getAllNews,
  getNewsById,
  deleteNews,
};
