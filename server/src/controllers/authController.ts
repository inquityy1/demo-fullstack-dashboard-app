import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from "../models/userModel";

const JWT_SECRET = process.env.JWT_SECRET || "Password123";
const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: "User already exists" });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = await createUser(email, password_hash);
  return res.status(201).json({ id: newUser.id, email: newUser.email });
}

export async function login(req: Request, res: Response) {
  console.log(">>>> /api/auth/login called, req.body:", req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  return res.json({ token, role: user.role });
}
