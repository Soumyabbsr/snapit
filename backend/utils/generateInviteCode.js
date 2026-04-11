const Group = require('../models/Group');
const Invite = require('../models/Invite');

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
const generateUniqueInviteCode = async () => {
  let isUnique = false;
  let code = '';
  let safety = 0;

  while (!isUnique && safety < 10) {
    code = generateRandomString(6);
    const existingGroup = await Group.findOne({ inviteCode: code });
    const existingInvite = await Invite.findOne({ code });

    if (!existingGroup && !existingInvite) {
      isUnique = true;
    }
    safety++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate a unique invite code');
  }

  return code;
};

module.exports = { generateUniqueInviteCode };
