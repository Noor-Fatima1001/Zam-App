import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tabs: [],
  activeTabId: null,
};

const tabSlice = createSlice({
  name: "tabs",
  initialState,
  reducers: {
    addTab: (state, action) => {
      const existingTabs = state.tabs.find((tab) => tab.id === action.payload.id);
      if (!existingTabs) {
        state.tabs.push({
          id: action.payload.id,
          title: action.payload.title,
          component: action.payload.initialState || [],
        });
      }
      state.activeTabId = action.payload.id;
    },

    removeTab: (state, action) => {
      state.tabs = state.tabs.filter((tab) => tab.id !== action.payload);
      if (state.activeTabId === action.payload) {
        state.activeTabId = state.tabs.length > 0 ? state.tabs[state.tabs.length - 1].id : null;
      }
    },

    setActiveTab: (state, action) => {
      state.activeTabId = action.payload;
    },
    resetTabs: () => initialState,

  },
});

export const { addTab, removeTab, setActiveTab,resetTabs } = tabSlice.actions;
export default tabSlice.reducer;
