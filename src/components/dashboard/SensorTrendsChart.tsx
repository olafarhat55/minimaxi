import { useState, useEffect, useMemo } from 'react';
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

// Palette for dynamic sensors
const COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

// Known units for sensor keys (partial match)
const guessUnit = (key: string): string => {
  const k = key.toLowerCase();
  if (k.includes('temp'))       return '°C';
  if (k.includes('vibr') || k.includes('amplitude') || k.includes('oscillat')) return 'mm/s';
  if (k.includes('pressure') || k.includes('ratio')) return 'BAR';
  if (k.includes('rpm') || k.includes('speed') || k.includes('rotation')) return 'RPM';
  if (k.includes('flow') || k.includes('air'))  return 'm³/h';
  if (k.includes('effic') || k.includes('stress') || k.includes('load') || k.includes('dissip')) return '';
  return '';
};

const toLabel = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ── Mock fallback (temperature / vibration / pressure only) ──────────────────
const generateMockData = () => {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const t = i / 5;
    const time = new Date(now.getTime() - (29 - i) * 2000).toLocaleTimeString('en-US', {
      hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    return {
      time,
      temperature: 75 + Math.sin(t * 0.8) * 10 + Math.random() * 5,
      vibration:   2.5 + Math.sin(t * 1.2) * 1.5 + Math.random() * 0.5,
      pressure:    95  + Math.sin(t * 0.6) * 8  + Math.random() * 4,
    };
  });
};

interface SensorTrendsChartProps {
  data: SensorTrendItem[];
  title?: string;
  lastUpdated?: string;
}

const SensorTrendsChart = ({ data, title = 'Sensor Trends', lastUpdated }: SensorTrendsChartProps) => {
  const { isDark } = useThemeMode();
  const [mockData, setMockData] = useState(generateMockData);

  // Refresh mock data every 3 s
  useEffect(() => {
    const id = setInterval(() => setMockData(generateMockData()), 3000);
    return () => clearInterval(id);
  }, []);

  // ── Detect sensor keys from real data ───────────────────────────────────────
  const sensorKeys = useMemo(() => {
    if (!data || data.length === 0) return ['temperature', 'vibration', 'pressure'];
    const sample = data[0] as unknown as Record<string, unknown>;
    return Object.keys(sample).filter(
      (k) => k !== 'time' && k !== 'timestamp' && typeof sample[k] === 'number',
    );
  }, [data]);

  // Default: first 3 sensors selected
  const [activeSensors, setActiveSensors] = useState<string[]>([]);
  useEffect(() => {
    setActiveSensors(sensorKeys.slice(0, 3));
  }, [sensorKeys]);

  const handleToggle = (_: React.MouseEvent<HTMLElement>, next: string[]) => {
    if (next.length) setActiveSensors(next);
  };

  const chartData = data && data.length >= 5 ? data : mockData;
  const gridColor  = isDark ? '#334155' : '#e5e7eb';
  const tickColor  = isDark ? '#94a3b8' : '#64748b';

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
      }}
    >
      <CardContent sx={{ p: 2, pb: '12px !important' }}>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>{title}</Typography>
            <Chip
              icon={<CircleIcon sx={{ fontSize: '9px !important', color: '#EF4444 !important', animation: 'sensorPulse 1.5s infinite' }} />}
              label="Live"
              size="small"
              sx={{ bgcolor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2', color: '#EF4444', fontWeight: 600, fontSize: '0.72rem' }}
            />
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">Updated {lastUpdated}</Typography>
            )}
          </Box>

          {/* ── Sensor toggles (dynamic) ── */}
          <ToggleButtonGroup value={activeSensors} onChange={handleToggle} size="small" sx={{
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': { px: 1, py: 0.25, fontSize: '0.7rem', textTransform: 'none', borderColor: isDark ? '#334155' : '#e2e8f0', color: tickColor },
          }}>
            {sensorKeys.map((key, idx) => {
              const color = COLORS[idx % COLORS.length];
              return (
                <ToggleButton key={key} value={key} sx={{
                  '&.Mui-selected': { bgcolor: `${color}18`, color, borderColor: `${color}40 !important`, '&:hover': { bgcolor: `${color}28` } },
                }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, mr: 0.5 }} />
                  {toLabel(key)}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>

        {/* ── Chart ── */}
        <Box sx={{ height: 280 }}>
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
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor }} tickMargin={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 8,
                  padding: 12,
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 8, color: isDark ? '#f1f5f9' : '#1f2937' }}
                formatter={(value: any, name: string) => {
                  const unit = guessUnit(name);
                  return [`${Number(value).toFixed(2)}${unit ? ' ' + unit : ''}`, toLabel(name)];
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: '0.75rem' }}
                iconType="line"
                formatter={(value) => (
                  <span style={{ color: tickColor, fontSize: '0.83rem', fontWeight: 500 }}>{toLabel(value)}</span>
                )}
              />
              {activeSensors.map((key, idx) => {
                const colorIdx = sensorKeys.indexOf(key);
                const color = COLORS[colorIdx >= 0 ? colorIdx % COLORS.length : idx % COLORS.length];
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    animationDuration={300}
                     isAnimationActive={false} 
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>

      <style>{`
        @keyframes sensorPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </Card>
  );
};

export default SensorTrendsChart;
