import { useState, useRef, useEffect, type ChangeEvent } from "react";
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

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  // ─── SEARCH & DEBOUNCE STATE ───
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the searchTerm by 1 second
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  // ─────────────────────────────────

  // ─── SORT STATE ───
  // 'asc' = A→Z, 'desc' = Z→A
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  // ────────────────────────

  // Pull user role and token from auth
  const role = useAppSelector((state: any) => state.auth.role);
  const token = useAppSelector((state: any) => state.auth.token);

  // Pull charts from Redux
  const allCharts = useAppSelector((state: any) => state.charts.items);

  // 1) Filter by debouncedSearch:
  const filteredCharts = allCharts.filter((c: any) =>
    c.name.toLowerCase().includes(debouncedSearch)
  );

  // 2) Sort the filtered list by name, ascending or descending:
  const processedCharts = [...filteredCharts].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (sortOrder === "asc") {
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    } else {
      return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
    }
  });

  // On mount, fetch charts
  useEffect(() => {
    if (token) {
      dispatch(fetchCharts());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!token) return;
    const intervalId = setInterval(() => {
      dispatch(fetchCharts());
    }, 5000);
    return () => clearInterval(intervalId);
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
    lg: processedCharts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 8,
      h: 8,
    })),
    md: processedCharts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 6,
      h: 8,
    })),
    sm: processedCharts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 4,
      h: 8,
    })),
    xs: processedCharts.map((c, idx) => ({
      i: c.id.toString(),
      x: 0,
      y: idx * 10,
      w: 2,
      h: 8,
    })),
    xxs: processedCharts.map((c, idx) => ({
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

  // ─── CSV EXPORT HANDLER ───
  function downloadCsv(chart: Chart) {
    // Build a header row
    const header = "timestamp,value\n";

    // Build each data row as “timestamp,value\n”
    const rows = chart.series
      .map((pt) => `${pt.timestamp},${pt.value}\n`)
      .join("");

    // Concatenate header + rows
    const csv = header + rows;

    // Trigger a browser download
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${chart.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // ────────────────────────────

  // ─── PDF EXPORT HANDLER ───
  // Captures the chart’s container via html2canvas and then embeds into jsPDF
  async function downloadPdf(chart: Chart) {
    const element = document.getElementById(`chart-container-${chart.id}`);
    if (!element) return;

    // Use html2canvas to snapshot the element
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Create a landscape PDF page (A4 size)
      const pdf = new jsPDF({ orientation: "landscape" });
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Compute image dimensions to preserve aspect ratio
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      // Add the image to the PDF and save
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${chart.name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  }
  // ────────────────────────────

  // Pull the live series map from Redux:
  const seriesByChart = useAppSelector(
    (state: any) => state.metrics.seriesByChart
  );

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
            alignItems: "center",
            gap: 2,
          }}
        >
          <HoverTitle variant="h5">Dashboard</HoverTitle>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            {/* ─── SEARCH BOX ─── */}
            <TextField
              size="small"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              sx={{ minWidth: 200 }}
            />

            {/* ─── SORT BUTTON ─── */}
            <Button size="small" variant="outlined" onClick={toggleSortOrder}>
              {sortOrder === "asc" ? "Sort: A→Z" : "Sort: Z→A"}
            </Button>

            {/* ─── ADD CHART (admin only) ─── */}
            {role === "admin" && (
              <Button variant="contained" color="primary" onClick={openAdd}>
                Add Chart
              </Button>
            )}

            {/* ─── LOG OUT ─── */}
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
            {processedCharts.map((chart) => {
              // 1) Determine this chart’s “type” as before:
              const type: ChartType = chartTypes[chart.id.toString()] || "line";

              // 2) Get the live array from Redux (or [] if not yet present):
              const rawSeries: DataPoint[] = seriesByChart[chart.id] || [];

              // 3) Build optionsForThisChart exactly the same, except:
              //    for pie, map labels from rawSeries instead of chart.series.
              let optionsForThisChart = {
                ...chartOptions,
                title: { ...chartOptions.title, text: chart.name },
              };
              let seriesForThisChart: any[];

              if (type === "pie") {
                // Pie: labels is an array of formatted dates from rawSeries
                optionsForThisChart = {
                  ...optionsForThisChart,
                  labels: rawSeries.map((pt) =>
                    new Date(pt.timestamp).toLocaleDateString()
                  ),
                };
                // seriesForThisChart is just the array of values
                seriesForThisChart = rawSeries.map((pt) => pt.value);
              } else {
                // Line/Bar: we need an array of { name, data: [[x,y],…] }
                seriesForThisChart = [
                  {
                    name: chart.name,
                    data: rawSeries.map((pt) => [pt.timestamp, pt.value]),
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
                    <div
                      id={`chart-container-${chart.id}`}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <ApexChart
                        options={optionsForThisChart}
                        series={seriesForThisChart}
                        type={type}
                        height="100%"
                      />
                    </div>
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

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 100,
                        display: "flex",
                        gap: 2,
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => downloadCsv(chart)}
                      >
                        CSV
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => downloadPdf(chart)}
                      >
                        PDF
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
