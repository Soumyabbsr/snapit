const crypto = require('crypto');

/**
 * Generates a random alphanumeric code of specified length.
 * @param {number} length - The length of the code.
 * @param {boolean} uppercaseOnly - If true, the code will contain only uppercase letters and numbers.
 * @returns {string} - The generated code.
 */
const generateCode = (length = 6, uppercaseOnly = true) => {
  const code = crypto.randomBytes(length).toString('hex').slice(0, length);
  return uppercaseOnly ? code.toUpperCase() : code;
};

module.exports = generateCode;
