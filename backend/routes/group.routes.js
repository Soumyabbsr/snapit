const express = require('express');
const router = express.Router();

const {
  createGroup,
  getUserGroups,
  getGroupDetails,
  joinGroupByCode,
  leaveGroup
} = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

router.post('/', protect, createGroup);
router.get('/', protect, getUserGroups);
router.get('/:id', protect, validateObjectId, getGroupDetails);
router.post('/join', protect, joinGroupByCode);
router.post('/:id/leave', protect, validateObjectId, leaveGroup);

module.exports = router;
