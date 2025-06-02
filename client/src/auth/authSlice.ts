import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface AuthState {
  token: string | null;
  role: string | null;
  status: "idle" | "loading" | "failed";
  error: string | null;
}

// READ from localStorage here
const savedToken = localStorage.getItem("jwtToken");
const savedRole = localStorage.getItem("userRole");

const initialState: AuthState = {
  token: savedToken, // ← use whatever was saved, or null
  role: savedRole,
  status: "idle",
  error: null,
};

export const loginUser = createAsyncThunk<
  { token: string; role: string },
  { email: string; password: string },
  { rejectValue: string }
>("auth/loginUser", async (credentials, thunkAPI) => {
  try {
    const response = await axios.post("/api/auth/login", credentials);
    return { token: response.data.token, role: response.data.role };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || "Login failed"
    );
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.role = null;
      state.status = "idle";
      state.error = null;
      // clear from localStorage too
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("userRole");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.error = null;

        // persist to localStorage
        localStorage.setItem("jwtToken", action.payload.token);
        localStorage.setItem("userRole", action.payload.role);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to login";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
