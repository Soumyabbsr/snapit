const multer = require('multer');

// ─── Memory storage (buffer passed to Cloudinary) ─────────
const storage = multer.memoryStorage();

// ─── File filter ───────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// ─── Multer instance ───────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max (frontend compresses first)
    files: 1,
  },
});

// ─── Middleware exports ────────────────────────────────────

/** Single file on field "image" */
const uploadSingle = upload.single('image');

/** Wrapper with better error messages */
const handleUpload = (field = 'image') => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size is 10 MB.',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    // Custom filter error
    return res.status(415).json({ success: false, message: err.message });
  });
};

module.exports = { uploadSingle, handleUpload };
