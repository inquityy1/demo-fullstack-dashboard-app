import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";

export interface DataPoint {
  timestamp: number;
  value: number;
}
export interface Chart {
  id: number;
  name: string;
  series: DataPoint[];
  created_at: string;
  updated_at: string;
}

interface ChartsState {
  items: Chart[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: ChartsState = {
  items: [],
  status: "idle",
  error: null,
};

// 1) Fetch all charts (GET /api/charts)
export const fetchCharts = createAsyncThunk<Chart[]>(
  "charts/fetchCharts",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("/api/charts");
      return response.data as Chart[];
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Error fetching charts"
      );
    }
  }
);

// 2) Create a new chart (POST /api/charts) → admin only
export const createChart = createAsyncThunk<
  Chart,
  { name: string; series: DataPoint[] },
  { rejectValue: string }
>("charts/createChart", async (newChart, thunkAPI) => {
  try {
    const response = await axios.post("/api/charts", newChart);
    return response.data as Chart;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || "Error creating chart"
    );
  }
});

// 3) Update a chart (PUT /api/charts/:id) → admin only
export const updateChart = createAsyncThunk<
  Chart,
  { id: number; name: string; series: DataPoint[] },
  { rejectValue: string }
>("charts/updateChart", async ({ id, name, series }, thunkAPI) => {
  try {
    const response = await axios.put(`/api/charts/${id}`, { name, series });
    return response.data as Chart;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || "Error updating chart"
    );
  }
});

// 4) Delete a chart (DELETE /api/charts/:id) → admin only
export const deleteChart = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("charts/deleteChart", async (id, thunkAPI) => {
  try {
    await axios.delete(`/api/charts/${id}`);
    return id; // return the deleted chart’s id so we can remove it from state
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || "Error deleting chart"
    );
  }
});

const chartsSlice = createSlice({
  name: "charts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchCharts
      .addCase(fetchCharts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchCharts.fulfilled,
        (state, action: PayloadAction<Chart[]>) => {
          state.status = "idle";
          state.items = action.payload;
        }
      )
      .addCase(fetchCharts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // createChart
      .addCase(createChart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createChart.fulfilled, (state, action: PayloadAction<Chart>) => {
        state.status = "idle";
        state.items.unshift(action.payload); // add new chart at front
      })
      .addCase(createChart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // updateChart
      .addCase(updateChart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateChart.fulfilled, (state, action: PayloadAction<Chart>) => {
        state.status = "idle";
        const idx = state.items.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(updateChart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // deleteChart
      .addCase(deleteChart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        deleteChart.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.status = "idle";
          state.items = state.items.filter((c) => c.id !== action.payload);
        }
      )
      .addCase(deleteChart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default chartsSlice.reducer;
