const Group = require('../models/Group');
const Invite = require('../models/Invite');
const generateCode = require('./generateCode');

const generateRandomString = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, O, 1, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a unique 6-digit alphanumeric invite code.
 */
const generateUniqueInviteCode = async () => generateCode(
  6,
  true,
  async (code) => {
    const [existingGroup, existingInvite] = await Promise.all([
      Group.exists({ inviteCode: code }),
      Invite.exists({ code }),
    ]);

    return Boolean(existingGroup || existingInvite);
  }
);

module.exports = { generateUniqueInviteCode };
