import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  photosByGroup: {}, // { groupId: [photo1, photo2] }
  isLoading: false,
  error: null,
};

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setPhotos: (state, action) => {
      const { groupId, photos, page } = action.payload;
      if (page === 1 || !state.photosByGroup[groupId]) {
        state.photosByGroup[groupId] = photos;
      } else {
        // Append unique photos
        const existingIds = new Set(state.photosByGroup[groupId].map(p => p._id));
        const newPhotos = photos.filter(p => !existingIds.has(p._id));
        state.photosByGroup[groupId] = [...state.photosByGroup[groupId], ...newPhotos];
      }
    },
    prependPhoto: (state, action) => {
      const { groupId, photo } = action.payload;
      if (!state.photosByGroup[groupId]) {
        state.photosByGroup[groupId] = [];
      }
      // avoid duplicates exactly early bound
      if (!state.photosByGroup[groupId].some(p => p._id === photo._id)) {
        state.photosByGroup[groupId].unshift(photo);
      }
    },
    updatePhotoReactions: (state, action) => {
      const { photoId, groupId, reactions } = action.payload;
      if (state.photosByGroup[groupId]) {
        const photoIndex = state.photosByGroup[groupId].findIndex(p => p._id === photoId);
        if (photoIndex !== -1) {
          state.photosByGroup[groupId][photoIndex].reactions = reactions;
        }
      }
    },
    markPhotoDeleted: (state, action) => {
      const { photoId, groupId } = action.payload;
      if (state.photosByGroup[groupId]) {
        state.photosByGroup[groupId] = state.photosByGroup[groupId].filter(p => p._id !== photoId);
      }
    }
  }
});

export const { setPhotos, prependPhoto, updatePhotoReactions, markPhotoDeleted } = photosSlice.actions;
export default photosSlice.reducer;
