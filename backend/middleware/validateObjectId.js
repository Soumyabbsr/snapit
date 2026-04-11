const mongoose = require('mongoose');

/**
 * Validates Mongo ObjectIds for route params like :groupId, :photoId, :widgetId, :memberId, :inviteId, :id.
 * Params that are not ObjectIds (e.g. invite :code) must not end with `Id` / be named `id`.
 */
const validateObjectId = (req, res, next) => {
  const idParams = Object.keys(req.params || {}).filter(
    (paramName) => paramName === 'id' || /Id$/i.test(paramName)
  );

  for (const paramName of idParams) {
    const value = req.params[paramName];
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid ID format',
        },
      });
    }
  }

  next();
};

module.exports = validateObjectId;
