const { ENewspaper, User } = require('../models');
const { Op } = require('sequelize');
const cloudinary = require('cloudinary').v2;

// Helper function to extract public_id from Cloudinary URL
const getPublicId = (url) => {
  const parts = url.split('/');
  const versionIndex = parts.findIndex(part => part.startsWith('v'));
  if (versionIndex === -1) return null;
  const publicIdWithFormat = parts.slice(versionIndex + 1).join('/');
  const publicId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.')) || publicIdWithFormat;
  return publicId;
};

// Upload a new E-Newspaper
exports.uploadENewspaper = async (req, res) => {
  try {
    const { publishDate } = req.body;
    const userId = req.user.id;
    const filePath = req.file.path;

    if (!publishDate || !filePath) {
      return res.status(400).json({ message: 'Publish date and file are required' });
    }

    const enewspaper = await ENewspaper.create({
      filePath,
      publishDate,
      userId,
    });

    res.status(201).json(enewspaper);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading E-Newspaper', error: error.message });
  }
};

// Get all E-Newspapers (for admin/editor)
exports.getAllENewspapers = async (req, res) => {
  try {
    const enewspapers = await ENewspaper.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['publishDate', 'DESC']],
    });
    res.json(enewspapers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching E-Newspapers', error: error.message });
  }
};

// Get a single E-Newspaper by ID
exports.getENewspaperById = async (req, res) => {
  try {
    const { id } = req.params;
    const enewspaper = await ENewspaper.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    });

    if (!enewspaper) {
      return res.status(404).json({ message: 'E-Newspaper not found' });
    }

    res.json(enewspaper);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching E-Newspaper', error: error.message });
  }
};

// Update an E-Newspaper
exports.updateENewspaper = async (req, res) => {
    try {
        const { id } = req.params;
        const { publishDate } = req.body;

        const enewspaper = await ENewspaper.findByPk(id);

        if (!enewspaper) {
            return res.status(404).json({ message: 'E-Newspaper not found' });
        }

        if (publishDate) {
            enewspaper.publishDate = publishDate;
        }

        await enewspaper.save();
        res.json(enewspaper);
    } catch (error) {
        res.status(500).json({ message: 'Error updating E-Newspaper', error: error.message });
    }
};

// Delete an E-Newspaper
exports.deleteENewspaper = async (req, res) => {
    try {
        const { id } = req.params;
        const enewspaper = await ENewspaper.findByPk(id);

        if (!enewspaper) {
            return res.status(404).json({ message: 'E-Newspaper not found' });
        }

        // Delete file from Cloudinary
        const publicId = getPublicId(enewspaper.filePath);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }

        await enewspaper.destroy();
        res.status(200).json({ message: 'E-Newspaper deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting E-Newspaper', error: error.message });
    }
};


// Get all published E-Newspapers for the public
exports.getPublishedENewspapers = async (req, res) => {
  try {
    const { date } = req.query;
    const where = {
      publishDate: {
        [Op.lte]: new Date(),
      },
    };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      where.publishDate = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    }

    const enewspapers = await ENewspaper.findAll({
        where,
        order: [['publishDate', 'DESC']],
    });
    res.json(enewspapers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching published E-Newspapers', error: error.message });
  }
};