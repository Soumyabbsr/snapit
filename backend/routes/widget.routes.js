const express = require('express');
const router = express.Router();
const { 
  registerWidget, 
  getWidgetGroups,
  getWidgetData, 
  refreshWidget,
  getUserWidgets, 
  deleteWidget 
} = require('../controllers/widget.controller');
const { protect } = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// POST /api/widgets - Register or update a widget mapping
router.post('/', protect, registerWidget);

// Static paths MUST be registered before GET '/' so they are not shadowed.
// GET /api/widgets/groups - Get groups available for widget setup
router.get('/groups', protect, getWidgetGroups);

// GET /api/widgets - Get all user's widgets
router.get('/', protect, getUserWidgets);

// GET /api/widgets/data/:groupId - Get data for a specific group widget
router.get('/data/:groupId', protect, validateObjectId, getWidgetData);

// POST /api/widgets/refresh/:groupId - Refresh widget data
router.post('/refresh/:groupId', protect, validateObjectId, refreshWidget);

// DELETE /api/widgets/:id - Remove a widget instance
router.delete('/:id', protect, validateObjectId, deleteWidget);

module.exports = router;
