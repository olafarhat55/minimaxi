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
  Avatar,
} from '@mui/material';
import { Alert } from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TrendingDown as DowntimeIcon,
  Psychology as AccuracyIcon,
  Savings as SavingsIcon,
  Speed as PreventiveIcon,
  Refresh as RefreshIcon,
  Timer as MttrIcon,
  Schedule as MtbfIcon,
  Inventory2 as PartsIcon,
  Build as MachineIcon,
  Groups as TechIcon,
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
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';

const AVATAR_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#f43f5e', '#06b6d4'];

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

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
  @page { 
    size: A4; 
    margin: 15mm;
    margin-header: 0;
    margin-footer: 0;
  }
  @media print { 
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
  }
`,
  });

  // ── Image export ──────────────────────────────────────────────────────────
  const handleExportImage = async () => {
    if (!reportRef.current) return;
    await new Promise(resolve => setTimeout(resolve, 800));
    const canvas = await html2canvas(reportRef.current, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: isDark ? '#0d1117' : '#ffffff',
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // ── Shared style helpers ──────────────────────────────────────────────────
const surface = isDark ? '#11151c' : '#fff';
const border  = isDark ? '#262d3a' : '#e8eaee';
  const muted   = isDark ? '#7b8497' : '#8a93a3';

  const cardSx = {
    borderRadius: 2.5,
    height: '100%',
    bgcolor: surface,
    border: `1px solid ${border}`,
    boxShadow: 'none',
  };

  const tooltipStyle = {
    backgroundColor: isDark ? '#1b2230' : '#fff',
    border: `1px solid ${border}`,
    color: isDark ? '#e5e9f0' : '#333',
    fontSize: 12,
    borderRadius: 8,
  };
  const axisTick   = { fontSize: 11, fill: muted };
  const gridStroke = isDark ? '#222a37' : '#eef0f4';

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: muted,
        lineHeight: 1.5,
        display: 'block',
        mb: 1.25,
      }}
    >
      {children}
    </Typography>
  );

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
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
         {[1, 2, 3, 4].map((i) => (
  <Grid size={{ xs: 6, sm: 6, md: 3 }} key={i}>
    <Skeleton variant="rounded" height={120} />
  </Grid>
))}
        </Grid>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 6, md: 6 }} key={i}>
              <Skeleton variant="rounded" height={250} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={1.5}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 4, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={240} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // ── Derived chart data from real API ──────────────────────────────────────

  // Pie: preventive_vs_reactive
  const preventivePct = data?.preventive_vs_reactive?.preventive ?? 50;
  const reactivePct   = data?.preventive_vs_reactive?.reactive   ?? 50;
  const pieData = [
    { name: 'Preventive', value: preventivePct, color: '#22c55e' },
    { name: 'Reactive',   value: reactivePct,   color: '#f43f5e' },
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

  // KPI strip config — drives the 6 compact metric cards
  const kpis = [
  {
    icon: DowntimeIcon,
    label: 'Downtime reduction',
    value: `${data?.downtime_reduction ?? 0}%`,
    color: '#22c55e',
    bg: isDark ? 'rgba(34,197,94,0.12)' : '#e8f5e9',
  },
  {
    icon: AccuracyIcon,
    label: 'Prediction accuracy',
    value: `${data?.prediction_accuracy ?? 0}%`,
    color: '#3b82f6',
    bg: isDark ? 'rgba(59,130,246,0.12)' : '#e3f2fd',
  },
  {
    icon: MttrIcon,
    label: 'MTTR – Mean Time To Repair',
    value: `${mttr.toFixed(1)}h`,
    color: '#f97316',
    bg: isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed',
  },
  {
    icon: MtbfIcon,
    label: 'MTBF – Mean Time Between Failures',
    value: `${mtbf.toFixed(1)}h`,
    color: '#22c55e',
    bg: isDark ? 'rgba(34,197,94,0.12)' : '#f0fdf4',
  },
  ];
  
 

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15 }}>Reports & Analytics</Typography>
          <Typography sx={{ fontSize: 13, color: muted, mt: 0.25 }}>
            
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportImage}
            sx={{ borderRadius: 5, textTransform: 'none', px: 2, fontSize: 13 }}
          >
            Export Image
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PdfIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleExportPDF()}
            sx={{ borderRadius: 5, textTransform: 'none', px: 2, fontSize: 13 }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Box ref={reportRef}>

        {/* PDF Title */}
<Box sx={{
  display: 'none',
  '@media print': { display: 'block', textAlign: 'center', mb: 4, pb: 2, borderBottom: '2px solid #e2e8f0' }
}}>
  <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
    Proactive Maintenance Report
  </Typography>
  <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.5 }}>
    MiniMaxi — Proactive Maintenance Platform
  </Typography>
</Box>

        {/* ── KEY METRICS ───────────────────────────────────────────────── */}
        <SectionLabel>Key metrics</SectionLabel>
<Grid container spacing={1.5} sx={{ mb: 3 }}>
  {kpis.map((kpi, i) => (
    <Grid size={{ xs: 6, sm: 6, md: 3 }} key={i}>
      <Card sx={cardSx} elevation={0}>
        <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 1.5,
              bgcolor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <kpi.icon sx={{ fontSize: 22, color: kpi.color }} />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: muted, lineHeight: 1.25 }}>
              {kpi.label}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1.1 }}>
            {kpi.value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>

      {/* ── TRENDS ────────────────────────────────────────────────────── */}
<SectionLabel>Trends</SectionLabel>
<Grid container spacing={1.5} sx={{ mb: 3 }}>

  {/* Pie — real preventive_vs_reactive  */}
  <Grid size={{ xs: 6, md: 6 }}>
    <Card sx={cardSx} elevation={0}>
      <CardContent sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Maintenance type distribution</Typography>
        <Typography sx={{ fontSize: 13, color: muted, mb: 1.5 }}>
          Preventive vs reactive
        </Typography>
        <Box sx={{ height: 220, display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={78}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pr: 1 }}>
            {pieData.map((entry, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13 }}>
                  {entry.name} <b>{entry.value}%</b>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  </Grid>

  {/* Cost — real monthly_cost: before / after (زي ما هو، تاني) */}
  <Grid size={{ xs: 6, md: 6 }}>
    <Card sx={cardSx} elevation={0}>
      <CardContent sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Maintenance cost saving</Typography>
        <Typography sx={{ fontSize: 13, color: muted, mb: 1.5 }}>
          Before vs after Proactive maintenance ($K)
        </Typography>
        <Box sx={{ height: 220 }}>
          <ResponsiveContainer width="100%"height={220}>
            <BarChart
              data={(data?.monthly_cost ?? []).filter(d => d.before > 0 || d.after > 0)}
              barGap={4}
              margin={{ left: -15, right: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" tick={axisTick} />
              <YAxis tick={axisTick} tickFormatter={(v) => `$${v}K`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  `$${value}K`,
                  name === 'after' ? 'After Proactive maintenance' : 'Before Proactive maintenance',
                ]}
              />
              <Legend
                formatter={(v) => v === 'after' ? 'After' : 'Before'}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="before" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="after"  fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Grid>

  {/* Downtime — real monthly_downtime: before_hours / after_hours (كان قبل كده الكارد الأول) */}
  <Grid size={{ xs: 6, md: 6 }}>
    <Card sx={cardSx} elevation={0}>
      <CardContent sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Downtime reduction analysis</Typography>
        <Typography sx={{ fontSize: 13, color: muted, mb: 1.5 }}>
          Before vs after AI deployment (hours)
        </Typography>
        <Box sx={{ height: 220 }}>
          <ResponsiveContainer width="100%"height={220}>
            <LineChart
              data={(data?.monthly_downtime ?? []).filter(d => d.before_hours > 0 || d.after_hours > 0)}
              margin={{ left: -15, right: 8 }}
            >
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
              <Legend
                formatter={(v) => v === 'after_hours' ? 'After AI' : 'Before AI'}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="before_hours" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3, fill: '#94a3b8' }} />
              <Line type="monotone" dataKey="after_hours"  stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Grid>

  {/* Accuracy Trend — real accuracy_trend (زي ما هو، رابع) */}
  <Grid size={{ xs: 6, md: 6 }}>
    <Card sx={cardSx} elevation={0}>
      <CardContent sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Prediction accuracy trend</Typography>
        <Typography sx={{ fontSize: 13, color: muted, mb: 1.5 }}>
          Monthly AI prediction accuracy (%)
        </Typography>
        <Box sx={{ height: 220 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={(data?.accuracy_trend ?? []).filter(d => d.accuracy != null && d.accuracy > 0)}
              margin={{ left: -15, right: 8 }}
            >
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
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  </Grid>
</Grid>

       
       {/* ── DETAILS ───────────────────────────────────────────────────── */}
<SectionLabel>Details</SectionLabel>
<Grid container spacing={1.5}>

  {/* Technician Performance */}
  <Grid size={{ xs: 12, md: 12 }}>
    <Card sx={cardSx} elevation={0}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TechIcon sx={{ fontSize: 22, color: '#3b82f6' }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Technician performance</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: muted, mb: 1.75 }}>
          Completed work orders
        </Typography>
        {technicianRows.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: muted, textAlign: 'center', py: 3 }}>
            No data available yet.
          </Typography>
        ) : (
          <TableContainer sx={{ bgcolor: 'transparent' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? '#1b2230' : '#f5f6f8' }}>
                  <TableCell sx={{ border: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Technician</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ border: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Work Orders</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ border: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Avg Resolution Time</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ border: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Total Hours</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ border: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Rating</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {technicianRows.map((tech, index) => (
                  <TableRow key={index} sx={{
                    '& td': { borderBottom: isDark ? '1px solid #262d3a' : '1px solid #f1f5f9' },
                    '&:last-child td': { border: 0 },
                  }}>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{tech.name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 14 }}>{tech.completed}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 14 }}>{Number(tech.avg_time).toFixed(2)} hr</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: 14 }}>
                        {tech.total_hours != null ? Number(tech.total_hours).toFixed(2) : '—'} hr
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Rating value={tech.rating} precision={0.1} readOnly size="small" />
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{tech.rating}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  </Grid>

  {/* Top Problem Machines */}
  <Grid size={{ xs: 6, md: 6 }}>
    <Card sx={cardSx} elevation={0}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MachineIcon sx={{ fontSize: 22, color: '#f43f5e' }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Top problem machines</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: muted, mb: 1.75 }}>
          By work orders &amp; downtime
        </Typography>
        {topProblemMachines.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: muted, textAlign: 'center', py: 3 }}>
            No data available yet.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {topProblemMachines.slice(0, 5).map((m) => (
              <Box key={m.machine_id}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5 }}>
                  {m.machine_name}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(m.score / maxScore) * 100}
                  sx={{
                    height: 7, borderRadius: 3,
                    bgcolor: isDark ? '#262d3a' : '#eef0f4',
                    '& .MuiLinearProgress-bar': { bgcolor: '#f43f5e', borderRadius: 3 },
                  }}
                />
                <Typography sx={{ fontSize: 12, color: muted, mt: 0.5, display: 'block' }}>
                  {m.work_order_count} WOs · {m.downtime_hours.toFixed(1)}h
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  </Grid>

  {/* Top Spare Parts */}
  <Grid size={{ xs: 6, md: 6 }}>
    <Card sx={cardSx} elevation={0}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PartsIcon sx={{ fontSize: 22, color: '#a855f7' }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Top spare parts usage</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: muted, mb: 1.25 }}>
          For inventory planning
        </Typography>
        <TableContainer sx={{ bgcolor: 'transparent' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ border: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Part</Typography>
                </TableCell>
                <TableCell align="center" sx={{ border: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Used</Typography>
                </TableCell>
                <TableCell align="right" sx={{ border: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: muted }}>Cost</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topSpareParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3, border: 0 }}>
                    <Typography sx={{ fontSize: 13, color: muted }}>No data available yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                topSpareParts.slice(0, 5).map((p, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ border: 0, px: 0.5, py: 0.8, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{p.name}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ border: 0, px: 0.5, py: 0.8 }}>
                      <Typography sx={{ fontSize: 14 }}>{p.usage_count}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ border: 0, px: 0.5, py: 0.8 }}>
                      <Typography sx={{ fontSize: 14 }}>${p.total_cost.toFixed(0)}</Typography>
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

        {/* PDF Footer */}
<Box sx={{
  display: 'none',
  '@media print': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mt: 4,
    pt: 2,
    borderTop: '1px solid #e2e8f0',
  }
}}>
  <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
    MiniMaxi — Proactive Maintenance Platform
  </Typography>
  <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
    Generated: {new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })}
  </Typography>
</Box>
      </Box>
    </Box>
  );
};

export default Reports;