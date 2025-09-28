// Centralized mock for the sequelize config to use SQLite for all tests.
// This ensures that from the very beginning, any code that imports sequelize
// gets the mocked version, preventing race conditions.
jest.mock('../src/config/sequelize.js', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

// Centralized mock for the Cloudinary middleware used in file uploads.
jest.mock('../src/config/cloudinary.js', () => {
  const multer = require('multer');
  const upload = multer(); // Use multer's default parsers for multipart forms
  return {
    single: (fieldName) => (req, res, next) => {
      upload.any()(req, res, (err) => {
        if (err) return next(err);
        // Manually add a mock file object after parsing
        req.file = {
          path: `https://fake.cloudinary.com/uploads/test-${Date.now()}.pdf`,
          filename: `test-${Date.now()}`,
        };
        next();
      });
    },
  };
});

// Centralized mock for the cloudinary library itself for operations like delete.
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      destroy: jest.fn((publicId, options, callback) => {
        // Support both callback and promise-based calls
        if (callback) callback(null, { result: 'ok' });
        return Promise.resolve({ result: 'ok' });
      }),
    },
  },
}));

// Mock the scheduler service to prevent it from running during tests.
jest.mock('../src/services/scheduler.service.js', () => ({
  startScheduler: jest.fn(),
}));

// Load test-specific environment variables
require('dotenv').config({ path: 'config.env.test' });