const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// ─── Enhanced Enterprise Security Headers ───
const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

// ─── NoSQL Injection Prevention ───
const dataSanitization = mongoSanitize();

// ─── Rate Limiting (DDoS Protection) ───
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 auth requests per hour
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 photo uploads per hour
  message: { success: false, message: 'Upload limit reached (30/hr). Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  securityHeaders,
  dataSanitization,
  globalLimiter,
  authLimiter,
  uploadLimiter
};
