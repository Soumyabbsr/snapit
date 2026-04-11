const express = require('express');
const router = express.Router();
const { 
  registerWidget, 
  getWidgetData, 
  getUserWidgets, 
  deleteWidget 
} = require('../controllers/widget.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/widgets - Register or update a widget mapping
router.post('/', protect, registerWidget);

// GET /api/widgets - Get all user's widgets
router.get('/', protect, getUserWidgets);

// GET /api/widgets/data/:groupId - Get data for a specific group widget
router.get('/data/:groupId', protect, getWidgetData);

// DELETE /api/widgets/:id - Remove a widget instance
router.delete('/:id', protect, deleteWidget);

module.exports = router;
