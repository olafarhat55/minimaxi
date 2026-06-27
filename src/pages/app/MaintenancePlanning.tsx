import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Button,
  useTheme,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as CriticalIcon,
  Build as ScheduledIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  AccessTime as OverdueIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isBefore, startOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useReactToPrint } from 'react-to-print';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import type { Machine, MaintenanceEvent, WorkOrder } from '../../types';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// ─── helpers ────────────────────────────────────────────────────────────────

const getRisk = (ttf: number) =>
  ttf <= 1000 ? 'High' : ttf <= 2000 ? 'Medium' : 'Low';

const getRiskColors = (ttf: number) => ({
  bgcolor: ttf <= 1000 ? '#ffebee' : ttf <= 2000 ? '#fff3e0' : '#e8f5e9',
  color:   ttf <= 1000 ? '#f44336' : ttf <= 2000 ? '#ff9800' : '#4caf50',
  border:  ttf <= 1000 ? '#f44336' : ttf <= 2000 ? '#ff9800' : '#4caf50',
});

/** Priority → colour bucket */
const getPriorityColor = (priority: string) => {
  const p = priority?.toLowerCase();
  if (p === 'critical' || p === 'high') return { bg: '#ffebee', text: '#d32f2f', border: '#d32f2f' };
  if (p === 'medium')                   return { bg: '#fff3e0', text: '#f57c00', border: '#f57c00' };
  return                                       { bg: '#e3f2fd', text: '#1976d2', border: '#1976d2' };
};

const getPriorityLabel = (priority: string) => {
  const p = priority?.toLowerCase();
  if (p === 'critical' || p === 'high') return 'critical';
  if (p === 'medium')                   return 'warning';
  return                                       'scheduled';
};

const getCalendarStyles = (isDark: boolean) => ({
  '.rbc-calendar': { fontFamily: 'inherit' },
  '.rbc-header': {
    padding: '8px 4px', fontWeight: 600, fontSize: '0.8rem',
    color: isDark ? '#a0a0a0' : '#666',
    borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
    background: isDark ? '#283444' : '#fafafa',
  },
  '.rbc-month-view': {
    border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
    borderRadius: '8px', overflow: 'hidden',
  },
  '.rbc-month-row':    { minHeight: '80px', borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}` },
  '.rbc-day-bg':       { backgroundColor: isDark ? '#283444' : '#fff' },
  '.rbc-date-cell':    { padding: '4px 8px', fontSize: '0.85rem', fontWeight: 500, color: isDark ? '#e0e0e0' : 'inherit' },
  '.rbc-today':        { backgroundColor: isDark ? 'rgba(90, 159, 212, 0.15)' : '#e3f2fd' },
  '.rbc-off-range-bg': { backgroundColor: isDark ? '#151515' : '#fafafa' },
  '.rbc-off-range':    { color: isDark ? '#666' : '#999' },
  '.rbc-event':        { borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 500 },
  '.rbc-event-content':{ overflow: 'hidden', textOverflow: 'ellipsis' },
  '.rbc-toolbar':      { marginBottom: '12px', flexWrap: 'wrap', gap: '8px' },
  '.rbc-toolbar button': {
    color: isDark ? '#e0e0e0' : '#333',
    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
    borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem',
    fontWeight: 500, background: isDark ? '#283444' : 'white', cursor: 'pointer',
  },
  '.rbc-toolbar button:hover':   { backgroundColor: isDark ? '#3d3d3d' : '#f5f5f5' },
  '.rbc-toolbar button.rbc-active': { backgroundColor: isDark ? '#5a9fd4' : '#2E75B6', color: 'white', borderColor: isDark ? '#5a9fd4' : '#2E75B6' },
  '.rbc-toolbar-label':          { fontWeight: 600, fontSize: '1.1rem', color: isDark ? '#e0e0e0' : '#333' },
  '.rbc-row-segment':            { padding: '0 2px' },
  '.rbc-show-more':              { fontSize: '0.75rem', color: isDark ? '#5a9fd4' : '#2E75B6', fontWeight: 500 },
});

// ─── types ──────────────────────────────────────────────────────────────────

type PriorityFilter = 'all' | 'critical' | 'warning' | 'scheduled';

// ─── component ──────────────────────────────────────────────────────────────

const MaintenancePlanning = () => {
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [retryCount, setRetryCount]             = useState(0);
  const [currentDate, setCurrentDate]           = useState(new Date());
  const [events, setEvents]                     = useState<MaintenanceEvent[]>([]);
  const [workOrders, setWorkOrders]             = useState<WorkOrder[]>([]);
  const [upcomingAssets, setUpcomingAssets]   = useState<any[]>([]);
const [expectedAssets, setExpectedAssets]   = useState<any[]>([]);
const [loadForecast,   setLoadForecast]     = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter]     = useState<PriorityFilter>('all');
  const [selectedDayOrders, setSelectedDayOrders] = useState<WorkOrder[]>([]);
  const [dayModalOpen, setDayModalOpen]         = useState(false);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const { isDark } = useThemeMode();
  const theme = useTheme();

  const calendarStyles = useMemo(() => getCalendarStyles(isDark), [isDark]);

  // ── fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
       const [eventsData, upcomingData, expectedData, forecastData, workOrdersData] = await Promise.all([
  api.getMaintenanceEvents(currentDate.getMonth() + 1, currentDate.getFullYear()),
  api.getMaintenanceUpcoming(),
  api.getMaintenanceExpected(),
  api.getMaintenanceLoadForecast(4),
  api.getWorkOrders({}),
]);
setEvents(eventsData);
setUpcomingAssets(upcomingData);
setExpectedAssets(expectedData);
setLoadForecast(forecastData);
setWorkOrders(workOrdersData);
      } catch {
        setError('Failed to load maintenance data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentDate, retryCount]);

  // ── derived data ─────────────────────────────────────────────────────────

  /** Work orders grouped by date string "YYYY-MM-DD" */
  const workOrdersByDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    workOrders.forEach((wo) => {
      const key = wo.due_date?.slice(0, 10);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(wo);
    });
    return map;
  }, [workOrders]);

  /** Summary counts for the current month */
  const monthlySummary = useMemo(() => {
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthOrders = workOrders.filter((wo) => wo.due_date?.startsWith(monthStr));
    const today = startOfDay(new Date());
    return {
      scheduled: monthOrders.filter((wo) => wo.status !== 'completed').length,
      critical:  monthOrders.filter((wo) => ['critical', 'high'].includes(wo.priority?.toLowerCase())).length,
      completed: monthOrders.filter((wo) => wo.status === 'completed').length,
      overdue:   monthOrders.filter(
        (wo) => wo.status !== 'completed' && wo.due_date && isBefore(new Date(wo.due_date), today)
      ).length,
    };
  }, [workOrders, currentDate]);

  /** Overdue work orders */
  const overdueOrders = useMemo(() => {
    const today = startOfDay(new Date());
    return workOrders.filter(
      (wo) => wo.status !== 'completed' && wo.due_date && isBefore(new Date(wo.due_date), today)
    );
  }, [workOrders]);

  /** Calendar events built from work orders */
  const calendarEvents = useMemo(() => {
    const result: any[] = [];
    Object.entries(workOrdersByDate).forEach(([dateStr, orders]) => {
      // Group by label bucket
      const buckets: Record<string, number> = { critical: 0, warning: 0, scheduled: 0 };
      orders.forEach((wo) => {
        const label = getPriorityLabel(wo.priority);
        buckets[label] = (buckets[label] || 0) + 1;
      });

      Object.entries(buckets).forEach(([type, count]) => {
        if (count === 0) return;
        // Apply filter
        if (priorityFilter !== 'all' && type !== priorityFilter) return;
        result.push({
          title: `${count} ${type}`,
          start: new Date(dateStr + 'T00:00:00'),
          end:   new Date(dateStr + 'T00:00:00'),
          allDay: true,
          type,
          count,
          dateStr,
          orders: orders.filter((wo) => getPriorityLabel(wo.priority) === type),
        });
      });
    });
    return result;
  }, [workOrdersByDate, priorityFilter]);

  /** Maintenance Load Forecast — built from real work orders */
  const loadForecastData = useMemo(() => {
    const now   = new Date();
    const today = startOfDay(now);

    return [1, 2, 3, 4].map((weekNum) => {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (weekNum - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekOrders = workOrders.filter((wo) => {
        if (!wo.due_date) return false;
        const d = new Date(wo.due_date);
        return d >= weekStart && d <= weekEnd;
      });

      // Scheduled = has a work order already
      const scheduled = weekOrders.filter((wo) => wo.status !== 'completed').length;

      // Predicted = assets whose TTF (÷ 8 hrs/day) lands in this week, but no WO yet
      return { week: `Week ${weekNum}`, scheduled, predicted: 0 };
    });
  }, [workOrders]);

  // ── calendar interactions ─────────────────────────────────────────────────

  const eventStyleGetter = useCallback((event: any) => {
    const colors = getPriorityColor(
      event.type === 'critical' ? 'critical' :
      event.type === 'warning'  ? 'medium'   : 'low'
    );
    return {
      style: {
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${colors.border}`,
      },
    };
  }, []);

  const EventComponent = useCallback(({ event }: { event: any }) => {
    const Icon =
      event.type === 'critical' ? CriticalIcon :
      event.type === 'warning'  ? WarningIcon  : ScheduledIcon;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Icon sx={{ fontSize: 12 }} />
        <span>{event.count} {event.type}</span>
      </Box>
    );
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedDayOrders(event.orders ?? []);
    setSelectedDayLabel(format(event.start, 'MMMM d, yyyy'));
    setDayModalOpen(true);
  }, []);

  const handleNavigate = useCallback((date: Date) => setCurrentDate(date), []);

  const handleExportPDF = useReactToPrint({
    contentRef,
    documentTitle: `Maintenance_Planning_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; } .rbc-toolbar button { display: none; } }
    `,
  });

  // ── loading / error states ────────────────────────────────────────────────

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

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={32} width={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={80}  sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={200} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={200} /></Grid>
          <Grid size={{ xs: 12 }}><Skeleton variant="rounded" height={200} /></Grid>
        </Grid>
      </Box>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Maintenance Planning</Typography>
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={() => handleExportPDF()}
          sx={{ bgcolor: '#2E75B6', '&:hover': { bgcolor: '#1a4971' }, textTransform: 'none', fontWeight: 500 }}
        >
          Export PDF
        </Button>
      </Box>

      <Box ref={contentRef}>

        {/* ── Summary Bar ─────────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: 'Scheduled',  value: monthlySummary.scheduled, color: '#1976d2', bg: '#e3f2fd', Icon: ScheduleIcon },
            { label: 'Critical',   value: monthlySummary.critical,  color: '#d32f2f', bg: '#ffebee', Icon: CriticalIcon },
            { label: 'Completed',  value: monthlySummary.completed, color: '#388e3c', bg: '#e8f5e9', Icon: CompletedIcon },
            { label: 'Overdue',    value: monthlySummary.overdue,   color: '#f57c00', bg: '#fff3e0', Icon: OverdueIcon },
          ].map(({ label, value, color, bg, Icon }) => (
            <Grid key={label} size={{ xs: 6, sm: 3 }}>
              <Card sx={{ borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: `4px solid ${color}` }}>
                <Box sx={{ bgcolor: bg, borderRadius: 1.5, p: 0.8, display: 'flex' }}>
                  <Icon sx={{ fontSize: 22, color }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color={color} lineHeight={1}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary">{label} this month</Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Calendar ────────────────────────────────────────────────────── */}
        <Card sx={{ borderRadius: 2, mb: 2 }}>
          <Box sx={{ px: 2, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
              Filter by priority
            </Typography>
            <ToggleButtonGroup
              value={priorityFilter}
              exclusive
              onChange={(_, val) => val && setPriorityFilter(val)}
              size="small"
            >
              {(['all', 'critical', 'warning', 'scheduled'] as PriorityFilter[]).map((f) => (
                <ToggleButton key={f} value={f} sx={{ textTransform: 'capitalize', fontSize: '0.75rem', px: 1.5 }}>
                  {f}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ p: 2, ...calendarStyles }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 450 }}
              date={currentDate}
              onNavigate={handleNavigate}
              eventPropGetter={eventStyleGetter}
              components={{ event: EventComponent }}
              views={['month']}
              defaultView="month"
              popup
              selectable
              onSelectEvent={handleSelectEvent}
            />
          </Box>

          {/* Legend */}
          <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 3, borderTop: `1px solid ${isDark ? '#333' : '#f0f0f0'}`, pt: 1.5 }}>
            {[
              { label: 'Critical / High', bg: '#ffebee', border: '#d32f2f' },
              { label: 'Medium',          bg: '#fff3e0', border: '#f57c00' },
              { label: 'Low / Scheduled', bg: '#e3f2fd', border: '#1976d2' },
            ].map(({ label, bg, border }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: isDark ? `${border}33` : bg, border: `1px solid ${border}` }} />
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Box>
            ))}
          </Box>
        </Card>

        {/* ── Overdue Work Orders ──────────────────────────────────────────── */}
       {overdueOrders.length > 0 && (
  <Card sx={{ borderRadius: 2, mb: 2, border: '1px solid #ffcc80' }}>
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <OverdueIcon sx={{ color: '#f57c00', fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={600} color="#e65100">
          Overdue Work Orders ({overdueOrders.length})
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary', borderBottom: '1px solid #ffe0b2' } }}>
              <TableCell>WO Number</TableCell>
              <TableCell>Asset</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Assigned To</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {overdueOrders.map((wo) => {
              const colors = getPriorityColor(wo.priority);
              return (
                <TableRow key={wo.id} sx={{ '& td': { py: 1, fontSize: '0.82rem' }, '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">{wo.wo_number}</Typography>
                  </TableCell>
                  <TableCell>{wo.asset_id}</TableCell>
                  <TableCell>{wo.title}</TableCell>
                  <TableCell>
                    <Chip label={wo.priority} size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: colors.bg, color: colors.text, textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell sx={{ color: '#d32f2f', fontWeight: 500 }}>
                    {format(new Date(wo.due_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{wo.assigned_to?.name ?? '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  </Card>
)}

        {/* ── Middle Row ──────────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 2 }}>

          {/* Upcoming Maintenance */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>Upcoming Maintenance</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Assets with scheduled work orders (TTF ≤ 2000 hrs)
                  </Typography>
                </Box>

               {upcomingAssets.length === 0 ? (
  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">No assets require immediate maintenance</Typography>
  </Box>
) : (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {upcomingAssets.slice(0, 4).map((asset) => {
      const c = getRiskColors(asset.ttf_hours);
      return (
        <Paper key={asset.asset_id} variant="outlined"
          sx={{ p: 1.5, borderLeft: `3px solid ${c.border}`, borderRadius: 1, '&:hover': { boxShadow: 1 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{asset.asset_id}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{asset.name}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right', ml: 2 }}>
              <Chip label={getRisk(asset.ttf_hours)} size="small"
                sx={{ height: 24, fontWeight: 600, bgcolor: c.bgcolor, color: c.color }} />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                TTF: {asset.ttf_hours?.toLocaleString()} hrs
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    })}
  </Box>
)}
               
              </Box>
            </Card>
          </Grid>

          {/* Maintenance Load Forecast */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>Maintenance Load Forecast</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Scheduled work orders vs AI-predicted needs — next 4 weeks
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={loadForecast}margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: isDark ? '#a0a0a0' : '#666' }} tickLine={false} axisLine={{ stroke: isDark ? '#333' : '#e0e0e0' }} />
                      <YAxis tick={{ fontSize: 11, fill: isDark ? '#a0a0a0' : '#666' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{
                          fontSize: 12, borderRadius: 8,
                          border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
                          backgroundColor: isDark ? '#283444' : '#fff',
                          color: isDark ? '#e0e0e0' : '#333',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 8 }} iconType="circle" iconSize={8}
                        formatter={(v) => <span style={{ color: isDark ? '#e0e0e0' : '#333' }}>{v}</span>} />
                      <Bar dataKey="scheduled" name="Scheduled" fill={isDark ? '#5a9fd4' : '#2E75B6'} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="predicted"  name="Predicted"  fill={isDark ? '#ffb74d' : '#ff9800'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* ── Assets Table ─────────────────────────────────────────────────── */}
        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>Assets Without Scheduled Maintenance</Typography>
              <Typography variant="caption" color="text.secondary">
                Assets nearing failure with no active work order — action required
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: isDark ? '#283444' : '#f8f9fa', fontWeight: 600, py: 1.5, fontSize: '0.8rem' } }}>
                    <TableCell>Asset ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>TTF (hrs)</TableCell>
                   
                  </TableRow>
                </TableHead>
                <TableBody>
  {expectedAssets.map((asset) => {
    const colors = {
      bgcolor: asset.risk_level === 'high' ? '#ffebee' : '#fff3e0',
      color:   asset.risk_level === 'high' ? '#f44336' : '#ff9800',
    };
    return (
      <TableRow key={asset.asset_id} hover sx={{ '& td': { py: 1.5 }, '&:last-child td': { borderBottom: 0 } }}>
        <TableCell>
          <Typography variant="body2" fontWeight={600} color="primary">{asset.asset_id}</Typography>
        </TableCell>
        <TableCell><Typography variant="body2">{asset.name}</Typography></TableCell>
        <TableCell><Typography variant="body2" color="text.secondary">{asset.type}</Typography></TableCell>
        <TableCell><Typography variant="body2" color="text.secondary">{asset.location}</Typography></TableCell>
        <TableCell>
          <Chip
            label={asset.risk_level}
            size="small"
            sx={{ height: 24, fontWeight: 600, bgcolor: colors.bgcolor, color: colors.color, textTransform: 'capitalize' }}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500}>{asset.ttf_hours?.toLocaleString()}</Typography>
        </TableCell>
      </TableRow>
    );
  })}
  {expectedAssets.length === 0 && (
    <TableRow>
      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">No assets currently require maintenance</Typography>
      </TableCell>
    </TableRow>
  )}
</TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      </Box>

      {/* ── Day Detail Modal ──────────────────────────────────────────────── */}
      <Dialog open={dayModalOpen} onClose={() => setDayModalOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>Work Orders</Typography>
            <Typography variant="caption" color="text.secondary">{selectedDayLabel}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setDayModalOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {selectedDayOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No work orders for this day.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {selectedDayOrders.map((wo) => {
                const colors = getPriorityColor(wo.priority);
                return (
                  <Paper key={wo.id} variant="outlined"
                    sx={{ p: 1.5, borderLeft: `3px solid ${colors.border}`, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{wo.wo_number}</Typography>
                        <Typography variant="body2" color="text.secondary">{wo.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{wo.machine_name} · {wo.asset_id}</Typography>
                      </Box>
                      <Chip label={wo.priority} size="small"
                        sx={{ height: 22, fontWeight: 600, bgcolor: colors.bg, color: colors.text, textTransform: 'capitalize' }} />
                    </Box>
                    {wo.assigned_to && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Assigned to: {wo.assigned_to.name}
                      </Typography>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDayModalOpen(false)} variant="outlined" size="small">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenancePlanning;