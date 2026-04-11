const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const ApiError = require('../utils/ApiError');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer to Cloudinary using a stream.
 * @param {Buffer} fileBuffer
 * @param {Object} options Options passed to Cloudinary uploader
 * @returns {Promise} Resolves with Cloudinary upload result
 */
const streamUpload = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const uploadPhoto = async (fileBuffer, groupId, userId) => {
  try {
    const result = await streamUpload(fileBuffer, {
      folder: `snapit/photos/${groupId}`,
      format: 'jpg', // Optional: format enforcement
    });
    return result;
  } catch (error) {
    throw new ApiError(500, 'Cloudinary photo upload failed');
  }
};

const generateThumbnailUrl = (publicId) => {
  return cloudinary.url(publicId, {
    width: 200,
    height: 200,
    crop: 'fill',
    secure: true
  });
};

const uploadAvatar = async (fileBuffer, userId) => {
  try {
    const result = await streamUpload(fileBuffer, {
      folder: 'snapit/avatars',
      public_id: `avatar_${userId}`,
      overwrite: true,
      format: 'jpg',
    });
    return result;
  } catch (error) {
    throw new ApiError(500, 'Cloudinary avatar upload failed');
  }
};

const deletePhoto = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // swallow not_found errors silently
    console.error('Cloudinary deletion issue: ', error.message);
  }
};

module.exports = {
  uploadPhoto,
  generateThumbnailUrl,
  uploadAvatar,
  deletePhoto
};
