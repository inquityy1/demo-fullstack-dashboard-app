import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: string;
}

// Find a user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0] || null;
}

// Create a new user
export async function createUser(
  email: string,
  password_hash: string
): Promise<User> {
  const result = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
    [email, password_hash]
  );
  return result.rows[0];
}
