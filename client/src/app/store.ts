import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../auth/authSlice";
import metricsReducer from "../dashboard/metricsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    metrics: metricsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
