// Security middleware to add additional protection layers

const logger = require('../config/logger');

// Middleware to prevent XSS attacks by sanitizing user input
const xssProtection = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
    });
  }

  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
    });
  }

  next();
};

// Middleware to add security headers
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Middleware to limit repeated failed requests (brute force protection)
const failedLoginAttempts = {};

const rateLimitByIP = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Clean up old entries
  Object.keys(failedLoginAttempts).forEach(key => {
    if (now - failedLoginAttempts[key].timestamp > 15 * 60 * 1000) { // 15 minutes
      delete failedLoginAttempts[key];
    }
  });
  
  // Check if IP has too many failed attempts
  if (failedLoginAttempts[ip] && failedLoginAttempts[ip].count >= 5) {
    const timeSinceFirstAttempt = now - failedLoginAttempts[ip].timestamp;
    if (timeSinceFirstAttempt < 15 * 60 * 1000) { // 15 minutes
      logger.warn(`IP ${ip} blocked due to too many failed login attempts`);
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please try again later.'
      });
    } else {
      // Reset counter after 15 minutes
      delete failedLoginAttempts[ip];
    }
  }
  
  // Attach function to increment failed attempts
  req.incrementFailedAttempts = () => {
    if (!failedLoginAttempts[ip]) {
      failedLoginAttempts[ip] = {
        count: 1,
        timestamp: now
      };
    } else {
      failedLoginAttempts[ip].count++;
    }
  };
  
  next();
};

// Middleware to reset failed attempts on successful login
const resetFailedAttempts = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (failedLoginAttempts[ip]) {
    delete failedLoginAttempts[ip];
  }
  next();
};

module.exports = {
  xssProtection,
  securityHeaders,
  rateLimitByIP,
  resetFailedAttempts
};