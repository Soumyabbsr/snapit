const crypto = require('crypto');
const ApiError = require('./ApiError');

/**
 * Generates a random alphanumeric code of specified length.
 * @param {number} length - The length of the code.
 * @param {boolean} uppercaseOnly - If true, the code will contain only uppercase letters and numbers.
 * @returns {string} - The generated code.
 */
const generateCode = async (length = 6, uppercaseOnly = true, existsFn = async () => false) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomBytes(length).toString('hex').slice(0, length);
    const normalizedCode = uppercaseOnly ? code.toUpperCase() : code;

    if (!(await existsFn(normalizedCode))) {
      return normalizedCode;
    }
  }

  throw new ApiError(500, 'Failed to generate unique code, please try again');
};

module.exports = generateCode;
