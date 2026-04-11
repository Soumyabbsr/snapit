import apiClient from './client';

export const createGroup = async (name, icon = '') => {
  const { data } = await apiClient.post('/groups', { name, icon });
  return data;
};

export const getUserGroups = async () => {
  const { data } = await apiClient.get('/groups');
  return data;
};

export const getGroupDetails = async (groupId) => {
  const { data } = await apiClient.get(`/groups/${groupId}`);
  return data;
};

export const joinGroupByCode = async (code) => {
  const { data } = await apiClient.post('/groups/join', { code });
  return data;
};

export const leaveGroup = async (groupId) => {
  const { data } = await apiClient.post(`/groups/${groupId}/leave`);
  return data;
};
