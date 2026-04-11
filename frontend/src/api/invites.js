import apiClient from './client';

/**
 * Get all pending invites for the authenticated user.
 */
export const getMyInvites = async () => {
  const { data } = await apiClient.get('/invites');
  return data; // { success, invites }
};

/**
 * Accept an invite by invite ID.
 * @param {string} inviteId
 */
export const acceptInvite = async (inviteId) => {
  const { data } = await apiClient.post(`/invites/${inviteId}/accept`);
  return data; // { success, group }
};

/**
 * Decline an invite by invite ID.
 * @param {string} inviteId
 */
export const declineInvite = async (inviteId) => {
  const { data } = await apiClient.post(`/invites/${inviteId}/decline`);
  return data; // { success }
};

/**
 * Send an invite to a user by email.
 * @param {string} groupId
 * @param {string} email
 */
export const sendInvite = async (groupId, email) => {
  const { data } = await apiClient.post('/invites', { groupId, email });
  return data; // { success, invite }
};
