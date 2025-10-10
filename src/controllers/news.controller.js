const { News, User, NewsVersion } = require('../models');
const cloudinary = require('cloudinary').v2;
const logger = require('../config/logger');

// Helper function to extract public_id from Cloudinary URL
const getPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const versionIndex = parts.findIndex(part => part.startsWith('v'));
  if (versionIndex === -1) return null;
  const publicIdWithFormat = parts.slice(versionIndex + 1).join('/');
  const publicId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.')) || publicIdWithFormat;
  return publicId;
};

const createNews = async (req, res) => {
  const { title, content, tags } = req.body;
  const authorId = req.user.id;

  try {
    const news = await News.create({
      title,
      content,
      authorId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      pdfUrl: req.file ? req.file.path : null,
      status: 'draft',
    });
    
    logger.info(`News article created: ${title} (ID: ${news.id}) by user ${authorId}`);
    res.status(201).json(news);
  } catch (error) {
    logger.error(`Error creating news article: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while creating news.', error: error.message });
  }
};

const getAllNews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const { rows: news, count: totalNews } = await News.findAndCountAll({
      where: { status: 'published' },
      offset: parseInt(skip),
      limit: parseInt(limit),
      order: [['publishedAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['name'] }],
    });
    
    logger.info(`Fetched ${news.length} news articles (page ${page}, limit ${limit})`);
    res.status(200).json({
      data: news,
      totalPages: Math.ceil(totalNews / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    logger.error(`Error fetching news articles: ${error.message}`, { stack: error.stack });
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
      logger.warn(`News article not found: ${id}`);
      return res.status(404).json({ message: 'News not found.' });
    }

    if (newsItem.status === 'published') {
      newsItem.viewCount += 1;
      await newsItem.save();
    }

    logger.info(`Fetched news article: ${newsItem.title} (ID: ${id})`);
    res.status(200).json(newsItem);
  } catch (error) {
    logger.error(`Error fetching news article ${id}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while fetching the news item.', error: error.message });
  }
};

const updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const newsItem = await News.findByPk(parseInt(id));

    if (!newsItem) {
      logger.warn(`News article not found for update: ${id}`);
      return res.status(404).json({ message: 'News not found.' });
    }

    if (userRole === 'reporter' && (newsItem.authorId !== userId || !['draft', 'rejected'].includes(newsItem.status))) {
      logger.warn(`Unauthorized update attempt by user ${userId} on news ${id}`);
      return res.status(403).json({ message: 'Access denied. You can only edit your own news in draft or rejected status.' });
    }

    const latestVersion = await NewsVersion.findOne({
      where: { newsId: newsItem.id },
      order: [['version', 'DESC']],
    });

    const currentVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    await NewsVersion.create({
      newsId: newsItem.id,
      title: newsItem.title,
      content: newsItem.content,
      pdfUrl: newsItem.pdfUrl,
      tags: newsItem.tags,
      version: currentVersionNumber,
    });

    newsItem.title = title || newsItem.title;
    newsItem.content = content || newsItem.content;
    newsItem.tags = tags || newsItem.tags;

    if (newsItem.status === 'published' || newsItem.status === 'rejected') {
      newsItem.status = 'draft';
    }

    await newsItem.save();

    logger.info(`News article updated: ${newsItem.title} (ID: ${id}) by user ${userId}`);
    res.status(200).json({ message: 'News updated successfully.', news: newsItem });
  } catch (error) {
    logger.error(`Error updating news article ${id}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while updating the news.', error: error.message });
  }
};

const deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const newsItem = await News.findByPk(parseInt(id));

    if (!newsItem) {
      logger.warn(`News article not found for deletion: ${id}`);
      return res.status(404).json({ message: 'News not found.' });
    }

    if (newsItem.pdfUrl) {
      const publicId = getPublicId(newsItem.pdfUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      }
    }

    await News.destroy({ where: { id: parseInt(id) } });

    logger.info(`News article deleted: ${newsItem.title} (ID: ${id}) by user ${req.user.id}`);
    res.status(200).json({ message: 'News deleted successfully.' });
  } catch (error) {
    logger.error(`Error deleting news article ${id}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while deleting the news.', error: error.message });
  }
};

const submitNews = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const newsItem = await News.findByPk(parseInt(id));

    if (!newsItem) {
      logger.warn(`News article not found for submission: ${id}`);
      return res.status(404).json({ message: 'News not found.' });
    }

    if (newsItem.authorId !== userId || !['draft', 'rejected'].includes(newsItem.status)) {
      logger.warn(`Unauthorized submission attempt by user ${userId} on news ${id}`);
      return res.status(403).json({ message: 'Access denied. You can only submit your own news in draft or rejected status.' });
    }

    newsItem.status = 'pending_approval';
    await newsItem.save();

    logger.info(`News article submitted for approval: ${newsItem.title} (ID: ${id}) by user ${userId}`);
    res.status(200).json({ message: 'News submitted for approval successfully.', news: newsItem });
  } catch (error) {
    logger.error(`Error submitting news article ${id}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while submitting the news.', error: error.message });
  }
};

const approveNews = async (req, res) => {
  const { id } = req.params;
  const { publishedAt } = req.body || {};

  try {
    const newsItem = await News.findByPk(parseInt(id));

    if (!newsItem) {
      logger.warn(`News article not found for approval: ${id}`);
      return res.status(404).json({ message: 'News not found.' });
    }

    if (newsItem.status !== 'pending_approval') {
      logger.warn(`News article ${id} is not pending approval (status: ${newsItem.status})`);
      return res.status(400).json({ message: 'News is not pending approval.' });
    }

    if (publishedAt) {
      const publishDate = new Date(publishedAt);
      if (publishDate > new Date()) {
        newsItem.status = 'scheduled';
        newsItem.publishedAt = publishDate;
        await newsItem.save();
        logger.info(`News article scheduled for publication: ${newsItem.title} (ID: ${id})`);
        return res.status(200).json({ message: 'News scheduled for publication.', news: newsItem });
      }
    }

    newsItem.status = 'published';
    newsItem.publishedAt = new Date();
    await newsItem.save();

    logger.info(`News article approved and published: ${newsItem.title} (ID: ${id})`);
    res.status(200).json({ message: 'News approved and published successfully.', news: newsItem });
  } catch (error) {
    logger.error(`Error approving news article ${id}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while approving the news.', error: error.message });
  }
};

const rejectNews = async (req, res) => {
  const { id } = req.params;

  try {
    const newsItem = await News.findByPk(parseInt(id));

    if (!newsItem) {
      logger.warn(`News article not found for rejection: ${id}`);
      return res.status(404).json({ message: 'News not found.' });
    }

    if (newsItem.status !== 'pending_approval') {
      logger.warn(`News article ${id} is not pending approval (status: ${newsItem.status})`);
      return res.status(400).json({ message: 'News is not pending approval.' });
    }

    newsItem.status = 'rejected';
    await newsItem.save();

    logger.info(`News article rejected: ${newsItem.title} (ID: ${id})`);
    res.status(200).json({ message: 'News rejected successfully.', news: newsItem });
  } catch (error) {
    logger.error(`Error rejecting news article ${id}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while rejecting the news.', error: error.message });
  }
};

const getNewsVersions = async (req, res) => {
  const { id } = req.params;

  try {
    const versions = await NewsVersion.findAll({
      where: { newsId: parseInt(id) },
      order: [['version', 'DESC']],
    });

    if (!versions) {
      logger.warn(`No versions found for news article: ${id}`);
      return res.status(404).json({ message: 'No versions found for this news article.' });
    }

    logger.info(`Fetched ${versions.length} versions for news article: ${id}`);
    res.status(200).json(versions);
  } catch (error) {
    logger.error(`Error fetching versions for news article ${id}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while fetching news versions.', error: error.message });
  }
};

const rollbackNews = async (req, res) => {
  const { id, versionId } = req.params;

  try {
    const newsItem = await News.findByPk(parseInt(id));
    if (!newsItem) {
      logger.warn(`News article not found for rollback: ${id}`);
      return res.status(404).json({ message: 'News not found.' });
    }

    const targetVersion = await NewsVersion.findByPk(parseInt(versionId));
    if (!targetVersion || targetVersion.newsId !== newsItem.id) {
      logger.warn(`Version not found for rollback on news ${id}: ${versionId}`);
      return res.status(404).json({ message: 'Version not found for this news article.' });
    }

    const latestVersion = await NewsVersion.findOne({
      where: { newsId: newsItem.id },
      order: [['version', 'DESC']],
    });

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    await NewsVersion.create({
      newsId: newsItem.id,
      title: newsItem.title,
      content: newsItem.content,
      pdfUrl: newsItem.pdfUrl,
      tags: newsItem.tags,
      version: newVersionNumber,
    });

    newsItem.title = targetVersion.title;
    newsItem.content = targetVersion.content;
    newsItem.pdfUrl = targetVersion.pdfUrl;
    newsItem.tags = targetVersion.tags;
    newsItem.status = 'draft';

    await newsItem.save();

    logger.info(`News article rolled back to version ${versionId}: ${newsItem.title} (ID: ${id})`);
    res.status(200).json({ message: 'News rolled back successfully.', news: newsItem });
  } catch (error) {
    logger.error(`Error rolling back news article ${id} to version ${versionId}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while rolling back the news.', error: error.message });
  }
};

const addNews = async (req, res) => {
  const { title, description, link } = req.body;

  if (!title || !description || !link) {
    logger.warn('Missing required fields for adding news');
    return res.status(400).json({ message: 'Title, description, and link are required.' });
  }

  try {
    const news = await News.create({
      title,
      description,
      link,
      status: 'published',
      publishedAt: new Date(),
    });
    
    logger.info(`News article added: ${title} (ID: ${news.id}) by user ${req.user.id}`);
    res.status(201).json({ message: 'News added successfully.', news });
  } catch (error) {
    logger.error(`Error adding news article: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Something went wrong while adding news.', error: error.message });
  }
};

module.exports = {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  submitNews,
  approveNews,
  rejectNews,
  getNewsVersions,
  rollbackNews,
  addNews,
};