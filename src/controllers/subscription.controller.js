const { log } = require("console");
const { Subscriber, SubscriptionTemp } = require("../models");
const { sendOtpEmail, sendWelcomeEmail } = require("../services/mail.service");
const crypto = require("crypto");

const subscribe = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Check if user is already subscribed
    const existingSubscriber = await Subscriber.findOne({ where: { email } });
    if (existingSubscriber) {
      return res
        .status(409)
        .json({ message: "This email is already subscribed." });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store OTP in temp table
    await SubscriptionTemp.create({ email, otp, expires_at });

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      message:
        "OTP sent to your email. Please verify to complete your subscription.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while subscribing.",
      error: error.message,
    });
  }
};
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    const tempSub = await SubscriptionTemp.findOne({ where: { email } });

    if (!tempSub) {
      return res
        .status(400)
        .json({ message: "No OTP request found for this email." });
    }

    if (tempSub.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (tempSub.expires_at < new Date()) {
      // auto-clean expired
      await tempSub.destroy();
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Transaction: move to Subscriber
    await sequelize.transaction(async (t) => {
      await Subscriber.create({ email }, { transaction: t });
      await tempSub.destroy({ transaction: t });
    });

    // Send welcome mail (do not block response if fails)
    sendWelcomeEmail(email).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    return res
      .status(201)
      .json({ message: "Subscription successful. Welcome aboard!" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "This email is already subscribed." });
    }
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong during verification.",
      error: error.message,
    });
  }
};

const unsubscribe = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const subscriber = await Subscriber.findOne({ where: { email } });

    if (!subscriber) {
      return res
        .status(404)
        .json({ message: "Email not found in our subscriber list." });
    }

    await subscriber.destroy();

    res
      .status(200)
      .json({ message: "You have been successfully unsubscribed." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while unsubscribing.",
      error: error.message,
    });
  }
};

module.exports = {
  subscribe,
  verifyOtp,
  unsubscribe,
};
