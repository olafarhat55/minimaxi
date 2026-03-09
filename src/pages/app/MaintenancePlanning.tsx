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
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as CriticalIcon,
  Build as ScheduledIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useReactToPrint } from 'react-to-print';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import type { Machine, MaintenanceEvent } from '../../types';

// Setup date-fns localizer for react-big-calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Function to get calendar styles based on theme
const getCalendarStyles = (isDark: boolean) => ({
  '.rbc-calendar': {
    fontFamily: 'inherit',
  },
  '.rbc-header': {
    padding: '8px 4px',
    fontWeight: 600,
    fontSize: '0.8rem',
    color: isDark ? '#a0a0a0' : '#666',
    borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
    background: isDark ? '#283444' : '#fafafa',
  },
  '.rbc-month-view': {
    border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  '.rbc-month-row': {
    minHeight: '80px',
    borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
  },
  '.rbc-day-bg': {
    backgroundColor: isDark ? '#283444' : '#fff',
  },
  '.rbc-date-cell': {
    padding: '4px 8px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: isDark ? '#e0e0e0' : 'inherit',
  },
  '.rbc-today': {
    backgroundColor: isDark ? 'rgba(90, 159, 212, 0.15)' : '#e3f2fd',
  },
  '.rbc-off-range-bg': {
    backgroundColor: isDark ? '#151515' : '#fafafa',
  },
  '.rbc-off-range': {
    color: isDark ? '#666' : '#999',
  },
  '.rbc-event': {
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.7rem',
    fontWeight: 500,
  },
  '.rbc-event-content': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '.rbc-toolbar': {
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  '.rbc-toolbar button': {
    color: isDark ? '#e0e0e0' : '#333',
    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.85rem',
    fontWeight: 500,
    background: isDark ? '#283444' : 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  '.rbc-toolbar button:hover': {
    backgroundColor: isDark ? '#3d3d3d' : '#f5f5f5',
    borderColor: isDark ? '#555' : '#bbb',
  },
  '.rbc-toolbar button.rbc-active': {
    backgroundColor: isDark ? '#5a9fd4' : '#2E75B6',
    color: 'white',
    borderColor: isDark ? '#5a9fd4' : '#2E75B6',
  },
  '.rbc-toolbar-label': {
    fontWeight: 600,
    fontSize: '1.1rem',
    color: isDark ? '#e0e0e0' : '#333',
  },
  '.rbc-row-segment': {
    padding: '0 2px',
  },
  '.rbc-show-more': {
    fontSize: '0.75rem',
    color: isDark ? '#5a9fd4' : '#2E75B6',
    fontWeight: 500,
  },
});

const MaintenancePlanning = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [predictedFailures, setPredictedFailures] = useState<Machine[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { isDark } = useThemeMode();

  // Get theme-aware calendar styles
  const calendarStyles = useMemo(() => getCalendarStyles(isDark), [isDark]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventsData, machinesData] = await Promise.all([
          api.getMaintenanceEvents(currentDate.getMonth() + 1, currentDate.getFullYear()),
          api.getMachines(),
        ]);
        setEvents(eventsData);
        setPredictedFailures(
          machinesData.filter((m) => m.prediction.failure_probability >= 50)
        );
      } catch {
        setError('Failed to load maintenance data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate, retryCount]);

  // Transform events for react-big-calendar
  const calendarEvents = useMemo(() => {
    return events.map((event, index) => ({
      id: index,
      title: `${event.count} ${event.type}`,
      start: new Date(event.date),
      end: new Date(event.date),
      allDay: true,
      type: event.type,
      count: event.count,
    }));
  }, [events]);

  // Custom event styling
  const eventStyleGetter = useCallback((event: any) => {
    let backgroundColor = '#e3f2fd';
    let color = '#1976d2';
    let borderColor = '#1976d2';

    if (event.type === 'critical') {
      backgroundColor = '#ffebee';
      color = '#d32f2f';
      borderColor = '#d32f2f';
    } else if (event.type === 'warning') {
      backgroundColor = '#fff3e0';
      color = '#f57c00';
      borderColor = '#f57c00';
    }

    return {
      style: {
        backgroundColor,
        color,
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${borderColor}`,
      },
    };
  }, []);

  // Custom event component
  const EventComponent = useCallback(({ event }: { event: any }) => {
    const Icon = event.type === 'critical'
      ? CriticalIcon
      : event.type === 'warning'
        ? WarningIcon
        : ScheduledIcon;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Icon sx={{ fontSize: 12 }} />
        <span>{event.count} {event.type}</span>
      </Box>
    );
  }, []);

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Maintenance load forecast data
  const loadForecastData = [
    { week: 'Week 1', scheduled: 5, predicted: 2 },
    { week: 'Week 2', scheduled: 3, predicted: 4 },
    { week: 'Week 3', scheduled: 7, predicted: 1 },
    { week: 'Week 4', scheduled: 4, predicted: 3 },
  ];

  // react-to-print prints the live DOM through the browser's native print engine,
  // which correctly renders the calendar, Recharts charts and MUI components
  // without cloning or off-screen rendering tricks.
  const handleExportPDF = useReactToPrint({
    contentRef,
    documentTitle: `Maintenance_Planning_Report_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .rbc-toolbar button { display: none; }
      }
    `,
  });

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

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={32} width={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Title and Export Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Maintenance Planning
        </Typography>
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={() => handleExportPDF()}
          disabled={loading}
          sx={{
            bgcolor: '#2E75B6',
            '&:hover': { bgcolor: '#1a4971' },
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Export PDF
        </Button>
      </Box>

      {/* Content Container for PDF Export */}
      <Box ref={contentRef}>
        {/* Calendar - Full Width */}
        <Card sx={{ borderRadius: 2, mb: 2 }}>
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
              components={{
                event: EventComponent,
              }}
              views={['month']}
              defaultView="month"
              popup
              selectable={false}
            />
          </Box>
          {/* Legend */}
          <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 3, borderTop: `1px solid ${isDark ? '#333' : '#f0f0f0'}`, pt: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(211, 47, 47, 0.2)' : '#ffebee', border: '1px solid #d32f2f' }} />
              <Typography variant="caption" color="text.secondary">Critical</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(245, 124, 0, 0.2)' : '#fff3e0', border: '1px solid #f57c00' }} />
              <Typography variant="caption" color="text.secondary">Warning</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: isDark ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd', border: '1px solid #1976d2' }} />
              <Typography variant="caption" color="text.secondary">Scheduled</Typography>
            </Box>
          </Box>
        </Card>

        {/* Middle Row - Side by Side Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Predicted Failures */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Predicted Failures
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Assets with high failure probability
                  </Typography>
                </Box>

                {predictedFailures.length === 0 ? (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No critical predictions
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {predictedFailures.slice(0, 4).map((machine) => (
                      <Paper
                        key={machine.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderLeft: `3px solid ${machine.prediction.failure_probability >= 70 ? '#f44336' : '#ff9800'}`,
                          borderRadius: 1,
                          transition: 'box-shadow 0.2s',
                          '&:hover': { boxShadow: 1 },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {machine.asset_id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {machine.name}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right', ml: 2 }}>
                            <Chip
                              label={`${machine.prediction.failure_probability}%`}
                              size="small"
                              sx={{
                                height: 24,
                                fontWeight: 600,
                                bgcolor: machine.prediction.failure_probability >= 70 ? '#ffebee' : '#fff3e0',
                                color: machine.prediction.failure_probability >= 70 ? '#f44336' : '#ff9800',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              TTF: {machine.prediction.ttf}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Maintenance Load Forecast */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  Maintenance Load Forecast
                </Typography>
                <Box sx={{ flex: 1, minHeight: 250, width: '100%' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={loadForecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: isDark ? '#a0a0a0' : '#666' }}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? '#333' : '#e0e0e0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: isDark ? '#a0a0a0' : '#666' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
                          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                          backgroundColor: isDark ? '#283444' : '#fff',
                          color: isDark ? '#e0e0e0' : '#333',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span style={{ color: isDark ? '#e0e0e0' : '#333' }}>{value}</span>}
                      />
                      <Bar dataKey="scheduled" fill={isDark ? '#5a9fd4' : '#2E75B6'} name="Scheduled" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="predicted" fill={isDark ? '#ffb74d' : '#ff9800'} name="Predicted" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Assets Table - Full Width */}
        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              Assets Expected to Require Maintenance
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: isDark ? '#283444' : '#f8f9fa', fontWeight: 600, py: 1.5, fontSize: '0.8rem' } }}>
                    <TableCell>Asset ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Expected</TableCell>
                    <TableCell>Recommended Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictedFailures.map((machine) => (
                    <TableRow
                      key={machine.id}
                      hover
                      sx={{
                        '& td': { py: 1.5 },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {machine.asset_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{machine.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{machine.type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{machine.location}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${machine.prediction.failure_probability}%`}
                          size="small"
                          sx={{
                            height: 24,
                            fontWeight: 600,
                            bgcolor: machine.prediction.failure_probability >= 70 ? '#ffebee' : '#fff3e0',
                            color: machine.prediction.failure_probability >= 70 ? '#f44336' : '#ff9800',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{machine.prediction.ttf}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220 }}>
                          {machine.prediction.recommendation}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {predictedFailures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No assets currently predicted to require maintenance
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default MaintenancePlanning;
