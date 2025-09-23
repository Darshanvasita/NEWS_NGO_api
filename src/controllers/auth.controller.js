const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active',
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token, userId: user.id, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const acceptInvite = async (req, res) => {
  const { token } = req.params;
  const { name, password } = req.body;

  try {
    // Verify the invitation token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'invite') {
      return res.status(400).json({ message: 'Invalid token type.' });
    }

    // Find user by ID from token
    const user = await User.findByPk(decoded.userId);

    // Check if user exists and is pending
    if (!user || user.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid invitation or user already active.' });
    }

    // Hash password and update user
    const hashedPassword = await bcrypt.hash(password, 10);
    user.name = name;
    user.password = hashedPassword;
    user.status = 'active';
    const updatedUser = await user.save();

    // Optionally, log the user in immediately
    const sessionToken = jwt.sign({ id: updatedUser.id, role: updatedUser.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'Account activated successfully!', token: sessionToken });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid or expired invitation link.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const logout = (req, res) => {
  // For stateless JWT, logout is typically handled client-side by deleting the token.
  // This endpoint is provided for completeness and can be extended for token blocklisting.
  res.status(200).json({ message: 'Logout successful.' });
};

module.exports = {
  register,
  login,
  acceptInvite,
  logout,
};
