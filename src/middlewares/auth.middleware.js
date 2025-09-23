const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'role', 'status'],
      });
      req.user = user ? user.get({ plain: true }) : null;

      if (!req.user || req.user.status !== 'active') {
        return res.status(401).json({ message: 'Not authorized, user not found or inactive' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

const isEditor = (req, res, next) => {
  if (req.user && (req.user.role === 'editor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Editor or Admin role required.' });
  }
};

const isReporter = (req, res, next) => {
  if (req.user && (req.user.role === 'reporter' || req.user.role === 'editor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Reporter, Editor, or Admin role required.' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isEditor,
  isReporter,
};
