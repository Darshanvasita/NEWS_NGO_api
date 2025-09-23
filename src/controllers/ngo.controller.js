const { Story, Gallery, Donation, User } = require('../models');

// --- Stories ---

const createStory = async (req, res) => {
  const { title, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Image file is required.' });
  }

  try {
    const story = await Story.create({
      title,
      description,
      imageUrl: req.file.path,
    });
    res.status(201).json(story);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while creating the story.', error: error.message });
  }
};

const getAllStories = async (req, res) => {
  try {
    const stories = await Story.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while fetching stories.', error: error.message });
  }
};


// --- Gallery ---

const createGalleryItem = async (req, res) => {
  const { type, caption } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Image or video file is required.' });
  }

  if (!['photo', 'video'].includes(type)) {
    return res.status(400).json({ message: "Invalid type. Must be 'photo' or 'video'." });
  }

  try {
    const galleryItem = await Gallery.create({
      type,
      caption,
      url: req.file.path,
    });
    res.status(201).json(galleryItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while creating the gallery item.', error: error.message });
  }
};

const getAllGalleryItems = async (req, res) => {
  try {
    const galleryItems = await Gallery.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(galleryItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while fetching gallery items.', error: error.message });
  }
};

// --- Donations ---

const createDonation = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  // This is a mocked endpoint. In a real application, you would:
  // 1. Create a payment order with Razorpay/Stripe.
  // 2. Process the payment on the client-side.
  // 3. Verify the payment on the backend via a webhook.
  // 4. On successful verification, create the donation record.

  try {
    const donation = await Donation.create({
      amount: parseFloat(amount),
      userId,
      paymentId: `mock_payment_${Date.now()}`,
      status: 'success',
    });
    res.status(201).json(donation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while creating the donation.', error: error.message });
  }
};

const getAllDonations = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const { rows: donations, count: totalDonations } = await Donation.findAndCountAll({
      offset: parseInt(skip),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
    });
    res.status(200).json({
      data: donations,
      totalPages: Math.ceil(totalDonations / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while fetching donations.', error: error.message });
  }
};


module.exports = {
  createStory,
  getAllStories,
  createGalleryItem,
  getAllGalleryItems,
  createDonation,
  getAllDonations,
};
