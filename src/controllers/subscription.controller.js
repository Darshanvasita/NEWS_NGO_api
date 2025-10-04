const { Subscription } = require('../models');

const createSubscription = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const subscription = await Subscription.create({ email });
    res.status(201).json({ message: 'Subscription successful.', subscription });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'This email is already subscribed.' });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while subscribing.', error: error.message });
  }
};

module.exports = {
  createSubscription,
};