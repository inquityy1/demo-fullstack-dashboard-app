import { useState, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { logout } from "../auth/authSlice";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  FormControl,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import ApexChart from "react-apexcharts";
import { Responsive, type Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import {
  fetchCharts,
  createChart,
  updateChart,
  deleteChart,
  type Chart,
  type DataPoint,
} from "./chartsSlice"; // the slice we just wrote

// We’ll show 2 grids: one for existing charts, and a dialog for Add/Edit.
const ResponsiveGridLayout = Responsive;

const HoverTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  cursor: "pointer",
  transition: "color 0.2s ease-in-out",
  "&:hover": {
    color: theme.palette.primary.light,
  },
}));

const ChartCard = styled(Box)(() => ({
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  position: "relative",
}));

export function Dashboard() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  // Char Options
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      id: "dashboard-metric",
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false },
      axisBorder: { show: true, color: theme.palette.divider },
      axisTicks: { show: true, color: theme.palette.divider },
    },
    yaxis: {
      title: { text: "Value" },
      labels: { style: { colors: theme.palette.text.primary } },
      axisBorder: { show: true, color: theme.palette.divider },
      axisTicks: { show: true, color: theme.palette.divider },
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    title: {
      text: "Last 7 Days Metric",
      align: "left",
      style: {
        fontSize: "18px",
        fontWeight: 600,
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      x: { format: "dd MMM, yyyy" },
    },
    colors: [theme.palette.primary.main],
  };

  // Pull user role and token from auth
  const role = useAppSelector((state) => state.auth.role);
  const token = useAppSelector((state) => state.auth.token);

  // Pull charts from Redux
  const charts = useAppSelector((state) => state.charts.items);

  // On mount, fetch charts
  useEffect(() => {
    if (token) {
      dispatch(fetchCharts());
    }
  }, [dispatch, token]);

  // State to manage “Add / Edit” dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<Chart | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [seriesInput, setSeriesInput] = useState<DataPoint[]>([]);

  // CharType logic
  type ChartType = "line" | "pie" | "bar";

  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>(
    () => {
      try {
        const saved = localStorage.getItem("chartTypes");
        if (!saved) return {};

        // Parse the saved object and rekey as string->ChartType
        const parsed = JSON.parse(saved) as Record<string, ChartType>;
        const normalized: Record<string, ChartType> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          normalized[key] = val;
        });
        return normalized;
      } catch {
        return {};
      }
    }
  );

  const chartTypeOrder: ChartType[] = ["line", "pie", "bar"];

  useEffect(() => {
    localStorage.setItem("chartTypes", JSON.stringify(chartTypes));
  }, [chartTypes]);

  function toggleChartType(id: number) {
    const key = id.toString();
    const current = chartTypes[key] || "line";
    const nextIndex =
      (chartTypeOrder.indexOf(current) + 1) % chartTypeOrder.length;
    const nextType = chartTypeOrder[nextIndex];

    setChartTypes((prev) => ({
      ...prev,
      [key]: nextType,
    }));
  }

  // Handlers for opening “Add” vs “Edit”
  function openAdd() {
    setEditingChart(null);
    setNameInput("");
    setSeriesInput([{ timestamp: Date.now(), value: 0 }]); // start with one point
    setDialogOpen(true);
  }
  function openEdit(chart: Chart) {
    setEditingChart(chart);
    setNameInput(chart.name);
    setSeriesInput(chart.series);
    setDialogOpen(true);
  }
  function closeDialog() {
    setDialogOpen(false);
  }

  // Save button: dispatch createChart or updateChart based on editingChart
  function handleSave() {
    if (editingChart) {
      dispatch(
        updateChart({
          id: editingChart.id,
          name: nameInput,
          series: seriesInput,
        })
      );
    } else {
      dispatch(createChart({ name: nameInput, series: seriesInput }));
    }
    setDialogOpen(false);
  }

  // onDelete
  function handleDelete(id: number) {
    if (window.confirm("Are you sure you want to delete this chart?")) {
      dispatch(deleteChart(id));
    }
  }

  // Layout logic: one row per chart
  const defaultLayouts: Layouts = {
    lg: charts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 8,
      h: 8,
    })),
    md: charts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 6,
      h: 8,
    })),
    sm: charts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 4,
      h: 8,
    })),
    xs: charts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 2,
      h: 8,
    })),
    xxs: charts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 1,
      h: 8,
    })),
  };

  // Track measured width (same pattern as before)
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    function measure() {
      if (gridContainerRef.current) {
        setContainerWidth(gridContainerRef.current.offsetWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: theme.palette.grey[200],
      }}
    >
      {/* AppBar with Dashboard title and “Add Chart” + “Log Out” */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            px: { xs: 2, md: 4 },
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <HoverTitle variant="h5">Dashboard</HoverTitle>
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* “Add Chart” is available for any logged‐in user; but you could also check role === 'admin' */}
            {role === "admin" && (
              <Button variant="contained" color="primary" onClick={openAdd}>
                Add Chart
              </Button>
            )}
            <Button
              variant="contained"
              color="secondary"
              onClick={() => dispatch(logout())}
            >
              Log Out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Grid container */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
        <div ref={gridContainerRef} style={{ width: "100%" }}>
          <ResponsiveGridLayout
            className="layout"
            layouts={defaultLayouts}
            width={containerWidth}
            breakpoints={{ lg: 1200, md: 960, sm: 600, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 }}
            rowHeight={40}
            margin={[24, 24]}
            containerPadding={[0, 0]}
            isDraggable={true}
            isResizable={true}
            compactType={null}
            useCSSTransforms={true}
          >
            {charts.map((chart) => {
              // Determine this chart’s current type (default "line"):
              const type: ChartType = chartTypes[chart.id] || "line";

              // Build options + series differently for “pie” vs. “line”/“bar”:
              let optionsForThisChart = {
                ...chartOptions,
                title: { ...chartOptions.title, text: chart.name },
              };
              let seriesForThisChart: any[];

              if (type === "pie") {
                // Pie expects series=array of numbers + labels:
                optionsForThisChart = {
                  ...optionsForThisChart,
                  labels: chart.series.map((pt) =>
                    new Date(pt.timestamp).toLocaleDateString()
                  ),
                };
                seriesForThisChart = chart.series.map((pt) => pt.value);
              } else {
                // For both "line" and "bar", we keep the [x, y] format:
                seriesForThisChart = [
                  {
                    name: chart.name,
                    data: chart.series.map((pt) => [pt.timestamp, pt.value]),
                  },
                ];
              }

              return (
                <div key={chart.id.toString()}>
                  <ChartCard>
                    {/* Chart Title */}
                    <Typography variant="h6" gutterBottom>
                      {chart.name}
                    </Typography>

                    {/* ApexChart with dynamic type and data */}
                    <ApexChart
                      options={optionsForThisChart}
                      series={seriesForThisChart}
                      type={type}
                      height="100%"
                    />

                    {/* ─── Toggle‐Type Button at bottom‐left ─── */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 16,
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => toggleChartType(chart.id)}
                      >
                        {(() => {
                          // Show the next chart type label (uppercased)
                          const nextIdx =
                            (chartTypeOrder.indexOf(type) + 1) %
                            chartTypeOrder.length;
                          return `→ ${chartTypeOrder[nextIdx].toUpperCase()}`;
                        })()}
                      </Button>
                    </Box>

                    {/* Only show Edit/Delete if role === "admin" */}
                    {role === "admin" && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          right: 16,
                          display: "flex",
                          gap: 1,
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openEdit(chart)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(chart.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    )}
                  </ChartCard>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </Box>

      {/* 11) Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingChart ? "Edit Chart" : "Add Chart"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Chart Name */}
            <TextField
              label="Chart Name"
              fullWidth
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />

            {/* For demo purposes, we’ll let the user edit the series as a raw JSON array */}
            <FormControl fullWidth>
              <InputLabel shrink>Series (JSON Array)</InputLabel>
              <TextField
                multiline
                minRows={3}
                value={JSON.stringify(seriesInput, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed)) {
                      setSeriesInput(parsed);
                    }
                  } catch {
                    // ignore parse errors for now
                  }
                }}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingChart ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
