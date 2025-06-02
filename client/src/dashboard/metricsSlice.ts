import { createSlice } from "@reduxjs/toolkit";

interface DataPoint {
  timestamp: number; // Unix ms
  value: number;
}

interface MetricsState {
  series: DataPoint[];
}

const initialState: MetricsState = {
  // Dummy “time‐series” data for the last 7 days
  series: [
    { timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, value: 10 },
    { timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, value: 15 },
    { timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, value: 12 },
    { timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, value: 20 },
    { timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, value: 18 },
    { timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, value: 25 },
    { timestamp: Date.now(), value: 22 },
  ],
};

const metricsSlice = createSlice({
  name: "metrics",
  initialState,
  reducers: {
    // In a real app, you might have actions to push new points or replace series
    setSeries(state, action: { payload: DataPoint[] }) {
      state.series = action.payload;
    },
  },
});

export const { setSeries } = metricsSlice.actions;
export default metricsSlice.reducer;
