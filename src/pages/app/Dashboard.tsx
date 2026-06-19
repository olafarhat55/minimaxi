import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  PrecisionManufacturing as MachineIcon,
  Warning as WarningIcon,
  Assignment as WorkOrderIcon,
  TrendingDown as PredictionIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import {
  StatCard,
  HealthPieChart,
  TrendLineChart,
  AIInsightCard,
  SensorTrendsChart,
} from '../../components/dashboard';
import type { DashboardStats, HealthDistributionItem, FailureTrendItem, SensorTrendItem, AIInsight } from '../../types';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [healthData, setHealthData] = useState<HealthDistributionItem[]>([]);
  const [failureTrend, setFailureTrend] = useState<FailureTrendItem[]>([]);
  const [trendPeriod, setTrendPeriod] = useState('monthly');
  const [sensorTrends, setSensorTrends] = useState<SensorTrendItem[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [lastUpdated, setLastUpdated] = useState('0s ago');
 
  // retryCount increments to force a re-fetch on manual retry
  const [retryCount, setRetryCount] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use allSettled so a single failing endpoint doesn't blank the whole
      // dashboard — each section renders with whatever data resolved.
      const [statsData, health, trend, sensors, insights] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getHealthDistribution(),
        api.getFailureTrend('monthly'),
        api.getSensorTrends(),
        api.getAIInsights(),
      ]);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (health.status === 'fulfilled') setHealthData(health.value);
      if (trend.status === 'fulfilled') setFailureTrend(trend.value);
      if (sensors.status === 'fulfilled') setSensorTrends(sensors.value);
      if (insights.status === 'fulfilled') setAIInsights(insights.value);

      // Only surface a blocking error if every endpoint failed; partial
      // failures load silently with the sections that succeeded.
      const results = [statsData, health, trend, sensors, insights];
      if (results.every((r) => r.status === 'rejected')) {
        setError('Failed to load dashboard data. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  useEffect(() => {
    fetchDashboardData();

    const socket = connectSocket();

    socket.on('machine_update', (data: any) => {
      setSensorTrends((prev) => {
        const newData = [...prev];
        if (newData.length > 10) newData.shift();
        newData.push({
          time: new Date().toLocaleTimeString(),
          temperature: data.sensors.temperature,
          vibration: data.sensors.vibration,
          pressure: data.sensors.pressure,
        });
        return newData;
      });
      setLastUpdated('0s ago');
    });

    const interval = setInterval(() => {
      setLastUpdated((prev) => {
        const seconds = parseInt(prev) || 0;
        return `${seconds + 3}s ago`;
      });
    }, 3000);

    return () => {
      disconnectSocket();
      clearInterval(interval);
    };
  }, [fetchDashboardData]);


  const handleTrendPeriodChange = async (newPeriod: string) => {
    setTrendPeriod(newPeriod);
    try {
      const trend = await api.getFailureTrend(newPeriod);
      setFailureTrend(trend);
    } catch (error) {
      console.error('Failed to fetch failure trend data:', error);
    }
  };

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
        <Skeleton variant="rounded" height={40} sx={{ mb: 3, width: 200 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rounded" height={260} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

 

  

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
  <Typography variant="h5" fontWeight={700}>
    Dashboard
  </Typography>
</Box>

      <Grid container spacing={3}>
        {/* ── KPI Cards ── */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Assets"
            value={stats?.total_assets || 0}
            icon={MachineIcon}
            color="#2E75B6"
            trend="up"
            trendValue="+5%"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="At Risk"
            value={(stats?.warning ?? 0) + (stats?.critical ?? 0)}
            icon={WarningIcon}
            color="#F59E0B"
            subtitle={`${stats?.warning} warning, ${stats?.critical} critical`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Work Orders"
            value={stats?.active_work_orders || 0}
            icon={WorkOrderIcon}
            color="#10B981"
            trend="down"
            trendValue="-12%"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Predicted Failures"
            value={stats?.predicted_failures || 0}
            icon={PredictionIcon}
            color="#EF4444"
            subtitle="Next 7 days"
          />
        </Grid>

        {/* ── Charts ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <HealthPieChart data={healthData} title="Asset Health Distribution" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrendLineChart
            data={failureTrend}
            title="Failure Probability Trend"
            lines={[{ dataKey: 'probability', color: '#EF4444', name: 'Failure %' }]}
            xAxisKey="label"
            showPeriodFilter
            onPeriodChange={handleTrendPeriodChange}
            defaultPeriod={trendPeriod}
          />
        </Grid>

        {/* ── AI Insights ── */}
        <Grid size={{ xs: 12 }}>
          <AIInsightCard insights={aiInsights} />
        </Grid>

        {/* ── Live Sensor Trends ── */}
        <Grid size={{ xs: 12 }}>
          <SensorTrendsChart
            data={sensorTrends}
            title="Live Sensor Trends"
            lastUpdated={lastUpdated}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
