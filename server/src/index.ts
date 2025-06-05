import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import http from "http";
import { Server as IOServer } from "socket.io";
import chartRoutes from "./routes/chartRoutes";
import authRoutes from "./routes/authRoutes";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool
  .query("SELECT NOW()")
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ DB connection error:", err));

// Mount auth endpoints:
app.use("/api/auth", authRoutes);

app.use("/api/charts", chartRoutes);

// (Optional) health-check
app.get("/api/health", (req: Request, res: Response) => {
  return res.json({ status: "ok" });
});

// Create a Node HTTP server wrapping Express
const httpServer = http.createServer(app);

// Attach a Socket.IO server to the HTTP server
const io = new IOServer(httpServer, {
  cors: {
    origin: "http://localhost:5173", // adjust if your frontend is served elsewhere
    methods: ["GET", "POST"],
  },
});

// When a client connects, log it and optionally send an initial “hello”
io.on("connection", (socket) => {
  console.log(`🟢 Client connected [id=${socket.id}]`);

  // (Optional) send a welcome message
  socket.emit("welcome", { message: "Connected to real-time feed" });

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected [id=${socket.id}]`);
  });
});

// For demo: periodically broadcast a new random data point for each chart
setInterval(async () => {
  // 1) Query the DB for all charts (so we know which IDs to update)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query(`SELECT id, series FROM charts;`);

  // 2) For each chart, pick a random new data point (or use real logic)
  result.rows.forEach((row: { id: number; series: any }) => {
    // Suppose each “series” is an array of { timestamp, value } entries
    const newPoint = {
      timestamp: Date.now(),
      value: Math.floor(Math.random() * 100), // random demo value
    };

    // 3) Append to the database’s series JSON (optional)
    //    (In a real app, you’d push new data when users submit updates, etc.)
    const updatedSeries = [...row.series, newPoint];
    pool
      .query(`UPDATE charts SET series = $2 WHERE id = $1;`, [
        row.id,
        JSON.stringify(updatedSeries),
      ])
      .catch((err) => console.error("Error updating DB:", err));

    // 4) Broadcast the new point to everyone listening to “chart_update”
    io.emit("chart_update", {
      id: row.id,
      point: newPoint,
    });
  });
}, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
