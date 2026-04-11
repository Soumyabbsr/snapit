import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
    addGroup: (state, action) => {
      // Avoid duplicates
      if (!state.groups.some(g => g._id === action.payload._id)) {
        state.groups.unshift(action.payload);
      }
    },
    updateGroup: (state, action) => {
      const index = state.groups.findIndex(g => g._id === action.payload._id);
      if (index !== -1) {
        state.groups[index] = { ...state.groups[index], ...action.payload };
      }
      if (state.currentGroup && state.currentGroup._id === action.payload._id) {
         state.currentGroup = { ...state.currentGroup, ...action.payload };
      }
    },
    removeGroup: (state, action) => {
      state.groups = state.groups.filter(g => g._id !== action.payload);
      if (state.currentGroup && state.currentGroup._id === action.payload) {
        state.currentGroup = null;
      }
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
    updateGroupPhotoTrigger: (state, action) => {
      const { groupId, lastPhotoAt } = action.payload;
      const index = state.groups.findIndex(g => g._id === groupId);
      if (index !== -1) {
        state.groups[index].lastPhotoAt = lastPhotoAt;
        state.groups[index].photoCount = (state.groups[index].photoCount || 0) + 1;
        // Re-sort groups
        state.groups.sort((a, b) => {
          if (!a.lastPhotoAt && !b.lastPhotoAt) return 0;
          if (!a.lastPhotoAt) return 1;
          if (!b.lastPhotoAt) return -1;
          return new Date(b.lastPhotoAt) - new Date(a.lastPhotoAt);
        });
      }
    }
  }
});

export const { setGroups, addGroup, updateGroup, removeGroup, setCurrentGroup, updateGroupPhotoTrigger } = groupsSlice.actions;
export default groupsSlice.reducer;
