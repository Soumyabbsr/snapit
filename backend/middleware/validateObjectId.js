const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  // Check any param that might be an id (e.g. id, groupId, photoId, memberId, widgetId)
  const idParams = ['id', 'groupId', 'photoId', 'memberId', 'widgetId'];
  
  for (const param of idParams) {
    if (req.params[param] && !mongoose.Types.ObjectId.isValid(req.params[param])) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'INVALID_ID', 
          message: 'Invalid resource ID format' 
        } 
      });
    }
  }
  
  next();
};

module.exports = validateObjectId;
