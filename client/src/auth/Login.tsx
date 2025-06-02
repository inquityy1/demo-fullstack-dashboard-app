import React, { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { loginUser } from "./authSlice";
import styled from "@emotion/styled";

//
// 1) Outer container that absolutely fills the viewport
//    and uses Flexbox to center its child.
//
const FullScreenContainer = styled(Box)`
  width: 100vw;
  height: 100vh;
  margin: 0; /* no extra margin */
  padding: 0; /* no extra padding */
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%);
`;

//
// 2) The “card” that wraps the form. 400px max width, nicely styled.
//
const FormCard = styled(Paper)`
  width: 100%;
  max-width: 400px;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

export function Login() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    dispatch(loginUser({ email: cleanEmail, password: cleanPassword }));
  };

  return (
    <FullScreenContainer>
      <FormCard elevation={3}>
        {/* Header / Logo */}
        <Box textAlign="center" mb={2}>
          <Typography variant="h5" component="h1" gutterBottom>
            My App
          </Typography>
          <Divider />
        </Box>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Box mb={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Box>

          <Box mb={2}>
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Box>

          {auth.error && (
            <Typography color="error" variant="body2" mb={2}>
              {auth.error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={auth.status === "loading"}
            sx={{ py: 1.5, fontWeight: 600 }}
          >
            {auth.status === "loading" ? "Logging in…" : "Log In"}
          </Button>
        </form>

        {/* Footer / “Sign Up” link */}
        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="textSecondary">
            Don’t have an account? <a href="#register">Sign up</a>
          </Typography>
        </Box>
      </FormCard>
    </FullScreenContainer>
  );
}
