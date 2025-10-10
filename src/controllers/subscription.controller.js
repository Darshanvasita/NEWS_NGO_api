const { Subscriber } = require("../models");
const { sendOtpEmail, sendWelcomeEmail } = require("../services/mail.service");
const crypto = require("crypto");
const { sequelize } = require("../models");

const subscribe = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Check if user is already subscribed
    const existingSubscriber = await Subscriber.findOne({ where: { email, confirmed: true } });
    if (existingSubscriber) {
      return res
        .status(409)
        .json({ message: "This email is already subscribed." });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create or update subscriber record with OTP
    const [subscriber, created] = await Subscriber.findOrCreate({
      where: { email },
      defaults: { email, otp, expires_at, confirmed: false }
    });

    if (!created) {
      // Update existing record with new OTP
      await subscriber.update({ otp, expires_at, confirmed: false });
    }

    // Send OTP email (handle email service errors gracefully)
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Don't fail the request if email sending fails
    }

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
    const subscriber = await Subscriber.findOne({ where: { email } });

    if (!subscriber) {
      return res
        .status(400)
        .json({ message: "No subscription request found for this email." });
    }

    if (subscriber.confirmed) {
      return res
        .status(400)
        .json({ message: "This email is already subscribed." });
    }

    if (subscriber.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (subscriber.expires_at < new Date()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Update subscriber as confirmed
    await subscriber.update({ confirmed: true, otp: null, expires_at: null });

    // Send welcome mail (do not block response if fails)
    sendWelcomeEmail(email).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    return res
      .status(200)
      .json({ message: "Subscription successful. Welcome aboard!" });
  } catch (error) {
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
    const subscriber = await Subscriber.findOne({ where: { email, confirmed: true } });

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