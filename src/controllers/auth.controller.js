const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      status: "active",
    });

    logger.info(`New user registered: ${email} (ID: ${user.id})`);
    res
      .status(201)
      .json({ message: "User created successfully", userId: user.id });
  } catch (error) {
    logger.error(`Error during registration: ${error.message}`, { stack: error.stack });
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      // Increment failed attempts
      if (req.incrementFailedAttempts) {
        req.incrementFailedAttempts();
      }
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "active") {
      logger.warn(`Login attempt with inactive user: ${email}`);
      // Increment failed attempts
      if (req.incrementFailedAttempts) {
        req.incrementFailedAttempts();
      }
      return res.status(403).json({ message: "User account is not active" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      logger.warn(`Invalid password attempt for user: ${email}`);
      // Increment failed attempts
      if (req.incrementFailedAttempts) {
        req.incrementFailedAttempts();
      }
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    logger.info(`User logged in: ${email} (ID: ${user.id})`);
    // Reset failed attempts on successful login
    if (req.resetFailedAttempts) {
      req.resetFailedAttempts();
    }
    res.status(200).json({ token, userId: user.id, role: user.role });
  } catch (error) {
    logger.error(`Error during login: ${error.message}`, { stack: error.stack });
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const acceptInvite = async (req, res) => {
  const { token } = req.params;
  const { name, password } = req.body;

  try {
    // Verify the invitation token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "invite") {
      logger.warn(`Invalid token type for invite acceptance: ${token}`);
      return res.status(400).json({ message: "Invalid token type." });
    }

    // Find user by ID from token
    const user = await User.findByPk(decoded.userId);

    // Check if user exists and is pending
    if (!user || user.status !== "pending") {
      logger.warn(`Invalid invitation or user already active: ${decoded.userId}`);
      return res
        .status(400)
        .json({ message: "Invalid invitation or user already active." });
    }

    // Hash password and update user
    const hashedPassword = await bcrypt.hash(password, 10);
    user.name = name;
    user.password = hashedPassword;
    user.status = "active";
    const updatedUser = await user.save();

    // Optionally, log the user in immediately
    const sessionToken = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    logger.info(`User accepted invite: ${user.email} (ID: ${user.id})`);
    res.status(200).json({
      message: "Account activated successfully!",
      token: sessionToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Invalid or expired invitation link: ${token}`);
      return res
        .status(401)
        .json({ message: "Invalid or expired invitation link." });
    }
    logger.error(`Error during invite acceptance: ${error.message}`, { stack: error.stack });
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const logout = (req, res) => {
  // For stateless JWT, logout is typically handled client-side by deleting the token.
  // This endpoint is provided for completeness and can be extended for token blocklisting.
  logger.info("User logged out");
  res.status(200).json({ message: "Logout successful." });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn(`Password reset request for non-existent user: ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "active") {
      logger.warn(`Password reset request for inactive user: ${email}`);
      return res.status(400).json({ message: "User account is not active" });
    }

    // Create password reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Reset token valid for 1 hour
    );

    // In a real application, you would send this via email
    // For now, we'll return it in the response (remove this in production)
    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/reset-password/${resetToken}`;

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(email, resetLink);

    logger.info(`Password reset requested for user: ${email} (ID: ${user.id})`);
    res.status(200).json({
      message: "Password reset email sent",
      // Remove this line in production - only for development
      resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined,
    });
  } catch (error) {
    logger.error(`Error during password reset request: ${error.message}`, { stack: error.stack });
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "password-reset") {
      logger.warn(`Invalid token type for password reset: ${token}`);
      return res.status(400).json({ message: "Invalid token type." });
    }

    // Find user by ID from token
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      logger.warn(`Invalid reset token for non-existent user: ${decoded.userId}`);
      return res.status(400).json({ message: "Invalid reset token." });
    }

    if (user.status !== "active") {
      logger.warn(`Password reset attempt for inactive user: ${user.email}`);
      return res.status(400).json({ message: "User account is not active" });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    logger.info(`Password reset successful for user: ${user.email} (ID: ${user.id})`);
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Invalid or expired reset token: ${token}`);
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }
    logger.error(`Error during password reset: ${error.message}`, { stack: error.stack });
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = {
  register,
  login,
  acceptInvite,
  logout,
  forgotPassword,
  resetPassword,
};