const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let code = "SERVER_ERROR";
  let statusCode = 500;

  // Log error for developers and track trace
  if (process.env.NODE_ENV !== 'production' || !(err instanceof ApiError)) {
     console.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    code = 'INVALID_ID';
    error.message = 'Invalid resource ID format';
    statusCode = 400;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    error.message = `Duplicate field value entered: ${field}`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    code = 'VALIDATION_ERROR';
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = message;
    statusCode = 422;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    code = 'INVALID_TOKEN';
    error.message = 'Invalid JSON Web Token';
    statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    code = 'TOKEN_EXPIRED';
    error.message = 'JSON Web Token expired';
    statusCode = 401;
  }

  // ApiError specific
  if (err instanceof ApiError) {
     statusCode = err.statusCode;
     code = err.code || code; // Or generate a generic code based on status code
  }
  
  // Default to err.statusCode if available
  statusCode = err.statusCode || statusCode;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: error.message || 'Server Error',
      details: error.details || null
    }
  });
};

module.exports = errorHandler;
