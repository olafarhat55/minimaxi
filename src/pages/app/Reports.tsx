import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Rating,
  Chip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TrendingDown as DowntimeIcon,
  Psychology as AccuracyIcon,
  Savings as SavingsIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import type { ReportsData } from '../../types';
import { Alert } from '@mui/material';

// ── Static chart data ────────────────────────────────────────────────────────

const downtimeData = [
  { month: 'Jan', before: 22, after: 15 },
  { month: 'Feb', before: 20, after: 14 },
  { month: 'Mar', before: 21, after: 13 },
  { month: 'Apr', before: 19, after: 12 },
  { month: 'May', before: 18, after: 11 },
  { month: 'Jun', before: 17, after: 10 },
  { month: 'Jul', before: 16, after: 9 },
];

const costData = [
  { month: 'Month 1', before: 58, after: 45 },
  { month: 'Month 2', before: 62, after: 42 },
  { month: 'Month 3', before: 59, after: 48 },
  { month: 'Month 4', before: 61, after: 44 },
  { month: 'Month 5', before: 55, after: 38 },
];

const accuracyData = [
  { month: 'Jan', accuracy: 76 },
  { month: 'Feb', accuracy: 78 },
  { month: 'Mar', accuracy: 80 },
  { month: 'Apr', accuracy: 82 },
  { month: 'May', accuracy: 85 },
  { month: 'Jun', accuracy: 87 },
  { month: 'Jul', accuracy: 89 },
];

const technicianData = [
  { name: 'Tech 01', workOrders: 30, avgTime: '3 hr',  time: '90h',  successRate: '94%', rating: 4.8 },
  { name: 'Tech 02', workOrders: 10, avgTime: '10 hr', time: '100h', successRate: '85%', rating: 4.2 },
  { name: 'Tech 03', workOrders: 25, avgTime: '5 hr',  time: '125h', successRate: '74%', rating: 3.9 },
  { name: 'Tech 04', workOrders: 30, avgTime: '2 hr',  time: '60h',  successRate: '90%', rating: 4.5 },
  { name: 'Tech 05', workOrders: 34, avgTime: '7 hr',  time: '238h', successRate: '66%', rating: 3.5 },
];

// ── Component ────────────────────────────────────────────────────────────────

const Reports = () => {
  const { isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [data, setData] = useState<ReportsData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const reportsData = await api.getReportsData();
        setData(reportsData);
      } catch {
        setError('Failed to load reports data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, [retryCount]);

  // react-to-print prints the live DOM through the browser's native print engine,
  // which correctly renders Recharts SVGs and MUI components without any cloning
  // or off-screen tricks.
  const handleExportPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `predictive-maintenance-report-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  // ── Shared style helpers ──────────────────────────────────────────────────

  const cardSx = {
    borderRadius: 2,
    height: '100%',
    bgcolor: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  };

  const tooltipStyle = {
    backgroundColor: isDark ? '#283444' : '#fff',
    border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
    color: isDark ? '#e0e0e0' : '#333',
  };

  const axisTick = { fontSize: 12, fill: isDark ? '#94a3b8' : '#666' };
  const gridStroke = isDark ? '#334155' : '#e2e8f0';

  // ── Error state ───────────────────────────────────────────────────────────

  if (error && !loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => setRetryCount((c) => c + 1)}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rounded" height={240} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const pieData = [
    { name: 'Preventive', value: data?.preventive_vs_reactive?.preventive || 75, color: '#22c55e' },
    { name: 'Reactive',   value: data?.preventive_vs_reactive?.reactive   || 25, color: '#f43f5e' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Reports & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={() => handleExportPDF()}
        >
          Export PDF
        </Button>
      </Box>

      <Box ref={reportRef}>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, bgcolor: isDark ? '#0d2818' : '#e8f5e9' }} elevation={0}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DowntimeIcon sx={{ color: '#22c55e' }} />
                  <Typography variant="body2" color="text.secondary">Downtime Reduction</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="#22c55e">
                  {data?.downtime_reduction || 28}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, bgcolor: isDark ? '#0d1f3d' : '#e3f2fd' }} elevation={0}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccuracyIcon sx={{ color: '#3b82f6' }} />
                  <Typography variant="body2" color="text.secondary">Prediction Accuracy</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="#3b82f6">
                  {data?.prediction_accuracy || 89}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, bgcolor: isDark ? '#2d1f0a' : '#fff3e0' }} elevation={0}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SavingsIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="body2" color="text.secondary">Cost Savings</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="#f59e0b">
                  ${(data?.cost_savings ? data.cost_savings / 1000 : 120).toFixed(0)}K
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, bgcolor: isDark ? '#1f0d2d' : '#f3e5f5' }} elevation={0}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MaintenanceIcon sx={{ color: '#a855f7' }} />
                  <Typography variant="body2" color="text.secondary">Preventive Rate</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="#a855f7">
                  {data?.preventive_vs_reactive?.preventive || 75}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Charts Row 1: Downtime Analysis + Cost Savings ────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          {/* Downtime Reduction Analysis */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>
                  Downtime Reduction Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Before vs After AI Deployment
                </Typography>
                <Chip
                  label="Downtime reduced by 28% after AI deployment"
                  size="small"
                  sx={{
                    mb: 2,
                    bgcolor: isDark ? '#0d2818' : '#dcfce7',
                    color: '#16a34a',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                  }}
                />
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={downtimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={axisTick} />
                      <YAxis domain={[0, 25]} tick={axisTick} tickFormatter={(v) => `${v}h`} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => [
                          `${value}h`,
                          name === 'after' ? 'After AI' : 'Before AI',
                        ]}
                      />
                      <Legend
                        formatter={(value) => value === 'after' ? 'After AI prediction' : 'Before AI prediction'}
                      />
                      <Line
                        type="monotone"
                        dataKey="before"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#94a3b8' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="after"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#22c55e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Maintenance Cost Saving */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>
                  Maintenance Cost Saving
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Before vs After Predictive Maintenance
                </Typography>
                <Chip
                  label="AI-based maintenance saved $120K this quarter"
                  size="small"
                  sx={{
                    mb: 2,
                    bgcolor: isDark ? '#0d2818' : '#dcfce7',
                    color: '#16a34a',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                  }}
                />
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={axisTick} />
                      <YAxis tick={axisTick} tickFormatter={(v) => `$${v}K`} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => [
                          `$${value}K`,
                          name === 'after' ? 'After Predictive Maintenance' : 'Before Predictive Maintenance',
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'after' ? 'After Predictive Maintenance' : 'Before Predictive Maintenance'
                        }
                      />
                      <Bar dataKey="before" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="after"  fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Charts Row 2: Donut + Accuracy Trend ─────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          {/* Maintenance Type Distribution */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Maintenance Type Distribution
                </Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={true}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${value}%`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Prediction Accuracy Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>
                  Prediction Accuracy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Accuracy improved from 76% to 89% over 6 months
                </Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={axisTick} />
                      <YAxis
                        domain={[60, 100]}
                        tick={axisTick}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${value}%`, 'Accuracy']}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Technician Performance Table ──────────────────────────────── */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Technician Performance
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: isDark ? '#283444' : '#f5f5f5',
                          '& th': {
                            color: isDark ? '#e5e5e5' : 'inherit',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
                          },
                        }}
                      >
                        <TableCell>Technician</TableCell>
                        <TableCell align="center">Work Orders</TableCell>
                        <TableCell align="center">Avg Resolution Time</TableCell>
                        <TableCell align="center">Total Time</TableCell>
                        <TableCell align="center">Success Rate</TableCell>
                        <TableCell align="center">Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {technicianData.map((tech, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:last-child td': { border: 0 },
                            '& td': {
                              borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
                            },
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={600}>{tech.name}</Typography>
                          </TableCell>
                          <TableCell align="center">{tech.workOrders}</TableCell>
                          <TableCell align="center">{tech.avgTime}</TableCell>
                          <TableCell align="center">{tech.time}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={tech.successRate}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: parseFloat(tech.successRate) >= 90
                                  ? (isDark ? '#0d2818' : '#dcfce7')
                                  : parseFloat(tech.successRate) >= 75
                                    ? (isDark ? '#1c2010' : '#fef9c3')
                                    : (isDark ? '#2d0f0f' : '#fee2e2'),
                                color: parseFloat(tech.successRate) >= 90
                                  ? '#16a34a'
                                  : parseFloat(tech.successRate) >= 75
                                    ? '#ca8a04'
                                    : '#dc2626',
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <Rating value={tech.rating} precision={0.1} readOnly size="small" />
                              <Typography variant="body2" fontWeight={500}>{tech.rating}</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box>
    </Box>
  );
};

export default Reports;
