import axios from "axios";

// This interceptor runs before every Axios request.
axios.interceptors.request.use((config) => {
  // 1) Read the token from localStorage
  const token = localStorage.getItem("jwtToken");

  // 2) If a token exists, add it to the Authorization header
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
