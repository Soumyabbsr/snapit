import { createSlice } from '@reduxjs/toolkit';

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState: {
    config: null,
    lastRefreshed: null,
    isConfigured: false,
    widgets: [],
  },
  reducers: {
    setWidgetConfig: (state, action) => {
      state.config = action.payload;
      state.isConfigured = true;
    },
    setLastRefreshed: (state, action) => {
      state.lastRefreshed = action.payload;
    },
    clearWidgetConfig: (state) => {
      state.config = null;
      state.isConfigured = false;
      state.lastRefreshed = null;
    },
    updateWidgetPhoto: (state, action) => {
      const { groupId, photo } = action.payload;
      const gid = groupId != null && groupId.toString ? groupId.toString() : String(groupId);
      const idx = state.widgets.findIndex(
        (w) => w.groupId != null && w.groupId.toString() === gid
      );
      if (idx === -1) return;
      const url = photo.cdnUrl || photo.imageUrl || photo.thumbnailUrl;
      state.widgets[idx].currentPhotoUrl = url;
      state.widgets[idx].currentPhotoUploader = photo.uploadedBy?.name;
      state.widgets[idx].refreshedAt = new Date().toISOString();
    },
  },
});

export const { setWidgetConfig, setLastRefreshed, clearWidgetConfig, updateWidgetPhoto } =
  widgetsSlice.actions;
export default widgetsSlice.reducer;
