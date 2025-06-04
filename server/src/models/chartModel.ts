import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface ChartRow {
  id: number;
  name: string;
  series: DataPoint[];
  created_at: string;
  updated_at: string;
}

// 1) Create a new chart
export async function createChart(
  name: string,
  series: DataPoint[]
): Promise<ChartRow> {
  const result = await pool.query<ChartRow>(
    `INSERT INTO charts (name, series) 
     VALUES ($1, $2) 
     RETURNING id, name, series, created_at, updated_at`,
    [name, JSON.stringify(series)]
  );
  return result.rows[0];
}

// 2) Fetch all charts
export async function getAllCharts(): Promise<ChartRow[]> {
  const result = await pool.query<ChartRow>(`
    SELECT id, name, series, created_at, updated_at
    FROM charts
    ORDER BY created_at DESC
  `);
  return result.rows;
}

// 3) Fetch one chart by id
export async function getChartById(id: number): Promise<ChartRow | null> {
  const result = await pool.query<ChartRow>(
    `SELECT id, name, series, created_at, updated_at
     FROM charts
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// 4) Update a chart (replace name+series)
export async function updateChart(
  id: number,
  name: string,
  series: DataPoint[]
): Promise<ChartRow | null> {
  const result = await pool.query<ChartRow>(
    `UPDATE charts 
     SET name = $2, series = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, series, created_at, updated_at`,
    [id, name, JSON.stringify(series)]
  );
  return result.rows[0] || null;
}

// 5) Delete a chart by id
export async function deleteChart(id: number): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM charts WHERE id = $1 RETURNING id`,
    [id]
  );

  if (result.rowCount === null) {
    return false;
  }

  return result.rowCount > 0;
}
