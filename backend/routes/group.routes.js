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

router.post('/', protect, createGroup);
router.get('/', protect, getUserGroups);
router.get('/:id', protect, getGroupDetails);
router.post('/join', protect, joinGroupByCode);
router.post('/:id/leave', protect, leaveGroup);

module.exports = router;
