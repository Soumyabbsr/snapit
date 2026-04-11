import { createSlice } from '@reduxjs/toolkit';

// ─── Widgets Slice ─────────────────────────────────────────────
// Manages widget configuration state persisted via redux-persist.
const widgetsSlice = createSlice({
  name: 'widgets',
  initialState: {
    config: null,       // { groupId, displayCount, refreshInterval }
    lastRefreshed: null,
    isConfigured: false,
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
  },
});

export const { setWidgetConfig, setLastRefreshed, clearWidgetConfig } = widgetsSlice.actions;
export default widgetsSlice.reducer;
