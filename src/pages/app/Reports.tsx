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
  LinearProgress,
} from '@mui/material';
import { Alert } from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TrendingDown as DowntimeIcon,
  Psychology as AccuracyIcon,
  Savings as SavingsIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  Timer as MttrIcon,
  Schedule as MtbfIcon,
  Inventory2 as PartsIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import type { ReportsData } from '../../types';

const Reports = () => {
  const { isDark } = useThemeMode();
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [data, setData]             = useState<ReportsData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // ── Fetch /api/reports ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getReportsData();
        setData(res);
      } catch {
        setError('Failed to load reports data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [retryCount]);

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `predictive-maintenance-report-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  // ── Shared style helpers ──────────────────────────────────────────────────
  const cardSx = {
    borderRadius: 2, height: '100%',
    bgcolor: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  };
  const tooltipStyle = {
    backgroundColor: isDark ? '#283444' : '#fff',
    border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
    color: isDark ? '#e0e0e0' : '#333',
  };
  const axisTick   = { fontSize: 12, fill: isDark ? '#94a3b8' : '#666' };
  const gridStroke = isDark ? '#334155' : '#e2e8f0';

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />}
              onClick={() => setRetryCount((c) => c + 1)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
          {[1, 2].map((i) => (
            <Grid size={{ xs: 12, sm: 6 }} key={`mttr-${i}`}>
              <Skeleton variant="rounded" height={110} />
            </Grid>
          ))}
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <Skeleton variant="rounded" height={320} />
            </Grid>
          ))}
          {[1, 2].map((i) => (
            <Grid size={{ xs: 12, md: 6 }} key={`extra-${i}`}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rounded" height={260} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ── Derived chart data from real API ──────────────────────────────────────

  // Pie: preventive_vs_reactive
  const pieData = [
    { name: 'Preventive', value: data?.preventive_vs_reactive?.preventive ?? 50, color: '#22c55e' },
    { name: 'Reactive',   value: data?.preventive_vs_reactive?.reactive   ?? 50, color: '#f43f5e' },
  ];

  // Technician rows
  const technicianRows = data?.technician_performance ?? [];

  // MTTR / MTBF
  const mttr = data?.mttr_mtbf?.mttr_hours ?? 0;
  const mtbf = data?.mttr_mtbf?.mtbf_hours ?? 0;

  // Top problem machines (score used only for ranking / bar width, never shown raw)
  const topProblemMachines = data?.top_problem_machines ?? [];
  const maxScore = Math.max(...topProblemMachines.map((m) => m.score), 1);

  // Top spare parts
  const topSpareParts = data?.top_spare_parts ?? [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Reports & Analytics</Typography>
        <Button variant="contained" startIcon={<PdfIcon />} onClick={() => handleExportPDF()}>
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
                  {data?.downtime_reduction ?? 0}%
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
                  {data?.prediction_accuracy ?? 0}%
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
                  ${((data?.cost_savings ?? 0) / 1000).toFixed(0)}K
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
                  {data?.preventive_vs_reactive?.preventive ?? 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── MTTR / MTBF ──────────────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ borderRadius: 2, bgcolor: isDark ? '#2d1208' : '#fff0e6' }} elevation={0}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MttrIcon sx={{ color: '#f97316' }} />
                  <Typography variant="body2" color="text.secondary">
                    Mean Time To Repair (MTTR)
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="#f97316">
                  {mttr.toFixed(1)}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lower is better — faster repairs
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ borderRadius: 2, bgcolor: isDark ? '#0d2818' : '#e8f5e9' }} elevation={0}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MtbfIcon sx={{ color: '#22c55e' }} />
                  <Typography variant="body2" color="text.secondary">
                    Mean Time Between Failures (MTBF)
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="#22c55e">
                  {mtbf.toFixed(1)}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Higher is better — failures are rarer
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Row 1: Downtime Before/After + Cost Before/After ──────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          {/* Downtime — real monthly_downtime: before_hours / after_hours */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>Downtime Reduction Analysis</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Before vs After AI Deployment (hours)
                </Typography>
                <Chip
                  label={`Downtime reduced by ${data?.downtime_reduction ?? 0}% after AI deployment`}
                  size="small"
                  sx={{ mb: 2, bgcolor: isDark ? '#0d2818' : '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: '0.72rem' }}
                />
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.monthly_downtime ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={axisTick} />
                      <YAxis tick={axisTick} tickFormatter={(v) => `${v}h`} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => [
                          `${value}h`,
                          name === 'after_hours' ? 'After AI' : 'Before AI',
                        ]}
                      />
                      <Legend formatter={(v) => v === 'after_hours' ? 'After AI' : 'Before AI'} />
                      <Line type="monotone" dataKey="before_hours" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4, fill: '#94a3b8' }} />
                      <Line type="monotone" dataKey="after_hours"  stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost — real monthly_cost: before / after */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>Maintenance Cost Saving</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Before vs After Predictive Maintenance ($K)
                </Typography>
                <Chip
                  label={`AI-based maintenance saved $${((data?.cost_savings ?? 0) / 1000).toFixed(0)}K`}
                  size="small"
                  sx={{ mb: 2, bgcolor: isDark ? '#0d2818' : '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: '0.72rem' }}
                />
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.monthly_cost ?? []} barGap={4}>
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
                      <Legend formatter={(v) => v === 'after' ? 'After Predictive Maintenance' : 'Before Predictive Maintenance'} />
                      <Bar dataKey="before" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="after"  fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Row 2: Pie + Accuracy Trend ───────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          {/* Pie — real preventive_vs_reactive */}
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
                        cx="50%" cy="50%"
                        innerRadius={70} outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine
                      >
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Accuracy Trend — real accuracy_trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>Prediction Accuracy Trend</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Monthly AI prediction accuracy (%)
                </Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.accuracy_trend ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={axisTick} />
                      <YAxis domain={[0, 100]} tick={axisTick} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${(+value).toFixed(1)}%`, 'Accuracy']}
                      />
                      <Line
                        type="monotone" dataKey="accuracy"
                        stroke="#3b82f6" strokeWidth={2.5}
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

        {/* ── Row 3: Top Problem Machines + Top Spare Parts ─────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          {/* Top Problem Machines — score is used only to size the bar, never shown raw */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Top Problem Machines
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Machines that need the most attention
                </Typography>
                {topProblemMachines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No data available yet.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {topProblemMachines.map((m) => (
                      <Box key={m.machine_id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>{m.machine_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.work_order_count} WOs · {m.downtime_hours.toFixed(1)}h downtime
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(m.score / maxScore) * 100}
                          sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: isDark ? '#334155' : '#e2e8f0',
                            '& .MuiLinearProgress-bar': { bgcolor: '#f43f5e', borderRadius: 4 },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Spare Parts */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx} elevation={0}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PartsIcon sx={{ color: '#a855f7' }} />
                  <Typography variant="h6" fontWeight={600}>Top Spare Parts Usage</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Most frequently used parts, for inventory planning
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{
                        bgcolor: isDark ? '#283444' : '#f5f5f5',
                        '& th': {
                          color: isDark ? '#e5e5e5' : 'inherit',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
                        },
                      }}>
                        <TableCell>Part</TableCell>
                        <TableCell align="center">Used</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topSpareParts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No spare-parts data available yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        topSpareParts.map((p, i) => (
                          <TableRow key={i} sx={{
                            '&:last-child td': { border: 0 },
                            '& td': { borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9' },
                          }}>
                            <TableCell>
                              <Typography fontWeight={600}>{p.name}</Typography>
                            </TableCell>
                            <TableCell align="center">{p.usage_count}</TableCell>
                            <TableCell align="right">${p.total_cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Technician Performance Table — real data ──────────────────── */}
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
                      <TableRow sx={{
                        bgcolor: isDark ? '#283444' : '#f5f5f5',
                        '& th': {
                          color: isDark ? '#e5e5e5' : 'inherit',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
                        },
                      }}>
                        <TableCell>Technician</TableCell>
                        <TableCell align="center">Work Orders</TableCell>
                        <TableCell align="center">Avg Resolution Time</TableCell>
                        <TableCell align="center">Total Hours</TableCell>
                        <TableCell align="center">Success Rate</TableCell>
                        <TableCell align="center">Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
  {technicianRows.length === 0 ? (
    <TableRow>
      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
        No technician data available yet.
      </TableCell>
    </TableRow>
  ) : (
    technicianRows.map((tech, index) => (
      <TableRow key={index} sx={{
        '&:last-child td': { border: 0 },
        '& td': { borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9' },
      }}>

        <TableCell>
          <Typography fontWeight={600}>{tech.name}</Typography>
        </TableCell>

        <TableCell align="center">{tech.completed}</TableCell>

        <TableCell align="center">
  {Number(tech.avg_time).toFixed(2)} hr
</TableCell>

<TableCell align="center">
  {tech.total_hours != null ? Number(tech.total_hours).toFixed(2) : '—'} hr
</TableCell>

        <TableCell align="center">
          <Chip
            label={`${tech.success_rate ?? 0}%`}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: (tech.success_rate ?? 0) >= 90
                ? (isDark ? '#0d2818' : '#dcfce7')
                : (tech.success_rate ?? 0) >= 75
                  ? (isDark ? '#1c2010' : '#fef9c3')
                  : (isDark ? '#2d0f0f' : '#fee2e2'),
              color: (tech.success_rate ?? 0) >= 90
                ? '#16a34a'
                : (tech.success_rate ?? 0) >= 75
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
    ))
  )}
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