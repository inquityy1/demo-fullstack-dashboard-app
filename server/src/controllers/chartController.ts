import { Request, Response } from "express";
import {
  createChart,
  getAllCharts,
  updateChart,
  deleteChart,
  DataPoint,
} from "../models/chartModel";

// Helper to check "admin" role
function requireAdmin(req: Request): boolean {
  console.log(req.user?.role);
  return req.user?.role === "admin";
}

// 1) GET /api/charts
export async function fetchCharts(req: Request, res: Response) {
  try {
    const charts = await getAllCharts();
    return res.json(charts);
  } catch (err) {
    console.error("Error fetching charts:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// 2) POST /api/charts  (admin only)
export async function createNewChart(req: Request, res: Response) {
  if (!requireAdmin(req)) {
    return res.status(403).json({ message: "Forbidden: admins only" });
  }
  const { name, series } = req.body as {
    name: string;
    series: DataPoint[];
  };
  if (!name || !Array.isArray(series)) {
    return res.status(400).json({ message: "Name and series required" });
  }
  try {
    const newChart = await createChart(name, series);
    return res.status(201).json(newChart);
  } catch (err) {
    console.error("Error creating chart:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// 3) PUT /api/charts/:id  (admin only)
export async function editChart(req: Request, res: Response) {
  if (!requireAdmin(req)) {
    return res.status(403).json({ message: "Forbidden: admins only" });
  }
  const chartId = parseInt(req.params.id, 10);
  const { name, series } = req.body as {
    name: string;
    series: DataPoint[];
  };
  if (!name || !Array.isArray(series)) {
    return res.status(400).json({ message: "Name and series required" });
  }
  try {
    const updated = await updateChart(chartId, name, series);
    if (!updated) {
      return res.status(404).json({ message: "Chart not found" });
    }
    return res.json(updated);
  } catch (err) {
    console.error("Error updating chart:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// 4) DELETE /api/charts/:id  (admin only)
export async function removeChart(req: Request, res: Response) {
  if (!requireAdmin(req)) {
    return res.status(403).json({ message: "Forbidden: admins only" });
  }
  const chartId = parseInt(req.params.id, 10);
  try {
    const success = await deleteChart(chartId);
    if (!success) {
      return res.status(404).json({ message: "Chart not found" });
    }
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting chart:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
