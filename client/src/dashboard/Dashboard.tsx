import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { logout } from "../auth/authSlice";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ApexChart from "react-apexcharts";
import { Responsive, WidthProvider, type Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Wrap the grid so it measures its container’s width
const ResponsiveGridLayout = WidthProvider(Responsive);

// Styled “Dashboard” title with a hover effect using MUI’s styled
const HoverTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  cursor: "pointer",
  transition: "color 0.2s ease-in-out",
  "&:hover": {
    color: theme.palette.primary.light,
  },
}));

// A simple Card wrapper for the chart, also using MUI’s styled
const ChartCard = styled(Box)(() => ({
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
}));

export function Dashboard() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  // Pull dummy data from Redux
  const series = useAppSelector((state) => state.metrics.series);
  const chartSeries = [
    {
      name: "Metric A",
      data: series.map((pt) => [pt.timestamp, pt.value]),
    },
  ];

  // ApexCharts options
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

  // Define how the chart behaves at different breakpoints (narrower widths)
  const defaultLayouts: Layouts = {
    lg: [{ i: "chart1", x: 0, y: 0, w: 4, h: 8 }],
    md: [{ i: "chart1", x: 0, y: 0, w: 4, h: 8 }],
    sm: [{ i: "chart1", x: 0, y: 0, w: 4, h: 8 }],
    xs: [{ i: "chart1", x: 0, y: 0, w: 2, h: 8 }],
    xxs: [{ i: "chart1", x: 0, y: 0, w: 1, h: 8 }],
  };

  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  return (
    // Full grey background
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: theme.palette.grey[200],
      }}
    >
      {/* AppBar with Dashboard title and Log Out */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            px: { xs: 2, md: 4 },
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <HoverTitle variant="h5">Dashboard</HoverTitle>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => dispatch(logout())}
          >
            Log Out
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main content full width */}
      <Box sx={{ width: "100%", px: { xs: 2, md: 4 }, py: 4 }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 960, sm: 600, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 }}
          rowHeight={40}
          isDraggable={true}
          isResizable={true}
          measureBeforeMount={true}
          useCSSTransforms={true}
          margin={[24, 24]}
          containerPadding={[0, 0]}
          onLayoutChange={(_current, all) => setLayouts(all)}
          compactType={null}
        >
          {/* Chart panel */}
          <div key="chart1">
            <ChartCard>
              <ApexChart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height="100%"
              />
            </ChartCard>
          </div>
        </ResponsiveGridLayout>
      </Box>
    </Box>
  );
}
