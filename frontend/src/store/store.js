import { configureStore } from "@reduxjs/toolkit";
import tabReducer from "./tabSlice";
import storage from "redux-persist/lib/storage"; // localStorage use karega
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
  key: "tabs",
  storage,
};

const persistedTabReducer = persistReducer(persistConfig, tabReducer);

export const store = configureStore({
  reducer: {
    tabs: persistedTabReducer,
  },
});

export const persistor = persistStore(store);
