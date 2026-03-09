import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Circle as CircleIcon } from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';
import type { SensorTrendItem } from '../../types';

interface SensorConfigEntry {
  color: string;
  unit: string;
  label: string;
}

const sensorConfig: Record<string, SensorConfigEntry> = {
  temperature: { color: '#EF4444', unit: '°C',   label: 'Temperature' },
  vibration:   { color: '#3B82F6', unit: 'mm/s', label: 'Vibration'   },
  pressure:    { color: '#10B981', unit: 'BAR',  label: 'Pressure'    },
};


const generateSensorData = () => {
  const now = new Date();
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const t = (29 - i) / 5;
    const time = new Date(now.getTime() - i * 2000);
    const timeStr = time.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const realVibration = 2.5 + Math.sin(t * 1.2) * 1.5 + Math.random() * 0.5; // 0–5 mm/s
    result.push({
      time: timeStr,
      temperature: 75 + Math.sin(t * 0.8) * 10 + Math.random() * 5,  // 60–90 °C
      vibration: realVibration * 15,                                    // scaled 0–75 for visibility
      _vibrationReal: realVibration,
      pressure: 95 + Math.sin(t * 0.6) * 8 + Math.random() * 4,       // 85–110 BAR
    });
  }
  return result;
};


interface SensorTrendsChartProps {
  data: SensorTrendItem[];
  title?: string;
  lastUpdated?: string;
}

const SensorTrendsChart = ({ data, title = 'Sensor Trends', lastUpdated }: SensorTrendsChartProps) => {
  const { isDark } = useThemeMode();
  const [activeSensors, setActiveSensors] = useState<string[]>(['temperature', 'vibration', 'pressure']);
  const [localData, setLocalData] = useState(generateSensorData);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalData(generateSensorData());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSensorToggle = (_event: React.MouseEvent<HTMLElement>, newSensors: string[]) => {
    if (newSensors.length) setActiveSensors(newSensors);
  };

  const chartData = data.length >= 10 ? data : localData;
  const gridColor = isDark ? '#334155' : '#e5e7eb';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
      }}
    >
      <CardContent sx={{ p: 2, pb: '12px !important', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            <Chip
              icon={
                <CircleIcon
                  sx={{
                    fontSize: '9px !important',
                    color: '#EF4444 !important',
                    animation: 'sensorPulse 1.5s infinite',
                  }}
                />
              }
              label="Live"
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                color: '#EF4444',
                fontWeight: 600,
                fontSize: '0.72rem',
                '& .MuiChip-icon': { ml: 0.5 },
              }}
            />
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Updated {lastUpdated}
              </Typography>
            )}
          </Box>

          {/* Sensor toggles */}
          <ToggleButtonGroup
            value={activeSensors}
            onChange={handleSensorToggle}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 1,
                py: 0.25,
                fontSize: '0.7rem',
                textTransform: 'none',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                color: tickColor,
              },
            }}
          >
            {Object.entries(sensorConfig).map(([key, cfg]) => (
              <ToggleButton
                key={key}
                value={key}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: `${cfg.color}18`,
                    color: cfg.color,
                    borderColor: `${cfg.color}40 !important`,
                    '&:hover': { bgcolor: `${cfg.color}28` },
                  },
                }}
              >
                <Box
                  sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, mr: 0.5 }}
                />
                {cfg.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Chart */}
        <Box sx={{ minHeight: 280, mb: 0.5 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: tickColor, angle: -30, textAnchor: 'end' } as any}
                tickMargin={5}
                interval={2}
                height={50}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                tickMargin={10}
                domain={[0, 120]}
                ticks={[0, 30, 60, 90, 120]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 8,
                  padding: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelStyle={{
                  fontWeight: 600,
                  marginBottom: 8,
                  color: isDark ? '#f1f5f9' : '#1f2937',
                }}
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'vibration') {
                    const real = props?.payload?._vibrationReal ?? Number(value) / 15;
                    return [`${real.toFixed(2)} mm/s`, 'Vibration'];
                  }
                  const cfg = sensorConfig[name];
                  return [`${Number(value).toFixed(1)} ${cfg?.unit ?? ''}`, cfg?.label ?? name];
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: '0.75rem' }}
                iconType="line"
                formatter={(value) => (
                  <span style={{ color: tickColor, fontSize: '0.83rem', fontWeight: 500 }}>
                    {sensorConfig[value]?.label ?? value}
                  </span>
                )}
              />
              {activeSensors.includes('temperature') && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke={sensorConfig.temperature.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  animationDuration={300}
                />
              )}
              {activeSensors.includes('vibration') && (
                <Line
                  type="monotone"
                  dataKey="vibration"
                  stroke={sensorConfig.vibration.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  animationDuration={300}
                />
              )}
              {activeSensors.includes('pressure') && (
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke={sensorConfig.pressure.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  animationDuration={300}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.68rem' }}>
          * Vibration scaled for visibility — hover for actual mm/s readings
        </Typography>
      </CardContent>

      <style>
        {`
          @keyframes sensorPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </Card>
  );
};

export default SensorTrendsChart;
