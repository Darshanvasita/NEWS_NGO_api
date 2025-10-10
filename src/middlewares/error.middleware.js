const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging purposes
  logger.error(`Error occurred: ${err.message}`, { 
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Create a standardized error response object
  const errorResponse = {
    success: false,
    message: 'An unexpected error occurred',
    error: {},
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    errorResponse.message = 'Resource not found';
    errorResponse.error = {
      type: 'CastError',
      field: err.path,
      value: err.value
    };
    return res.status(400).json(errorResponse);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    errorResponse.message = 'Duplicate field value entered';
    errorResponse.error = {
      type: 'DuplicateKeyError',
      field: Object.keys(err.keyValue)[0],
      value: err.keyValue[Object.keys(err.keyValue)[0]]
    };
    return res.status(400).json(errorResponse);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    errorResponse.message = 'Validation failed';
    errorResponse.error = {
      type: 'ValidationError',
      details: Object.values(err.errors).map(val => ({
        field: val.path,
        message: val.message,
        value: val.value
      }))
    };
    return res.status(400).json(errorResponse);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    errorResponse.message = 'Validation failed';
    errorResponse.error = {
      type: 'SequelizeValidationError',
      details: err.errors.map(error => ({
        field: error.path,
        message: error.message,
        value: error.value
      }))
    };
    return res.status(400).json(errorResponse);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    errorResponse.message = 'Duplicate field value entered';
    errorResponse.error = {
      type: 'SequelizeUniqueConstraintError',
      fields: err.fields
    };
    return res.status(400).json(errorResponse);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid token';
    errorResponse.error = {
      type: 'JsonWebTokenError'
    };
    return res.status(401).json(errorResponse);
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Token expired';
    errorResponse.error = {
      type: 'TokenExpiredError',
      expiredAt: err.expiredAt
    };
    return res.status(401).json(errorResponse);
  }

  // Default error response
  errorResponse.message = err.message || 'Server Error';
  errorResponse.error = {
    type: err.name || 'InternalServerError',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  res.status(err.statusCode || 500).json(errorResponse);
};

module.exports = errorHandler;