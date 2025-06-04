import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../auth/authSlice";
import metricsReducer from "../dashboard/metricsSlice";
import chartsReducer from "../dashboard/chartsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    metrics: metricsReducer,
    charts: chartsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
