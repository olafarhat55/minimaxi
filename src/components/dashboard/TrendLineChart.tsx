import { useState } from 'react';
import { Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
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
import { useThemeMode } from '../../context/ThemeContext';

interface ChartLine {
  dataKey: string;
  color: string;
  name: string;
}

interface TrendLineChartProps {
  data: any[];
  title?: string;
  lines?: ChartLine[];
  xAxisKey?: string;
  height?: number;
  showPeriodFilter?: boolean;
  onPeriodChange?: (period: string) => void;
  defaultPeriod?: string;
}

const TrendLineChart = ({
  data,
  title = 'Trend',
  lines = [{ dataKey: 'value', color: '#2E75B6', name: 'Value' }],
  xAxisKey = 'name',
  height = 300,
  showPeriodFilter = false,
  onPeriodChange,
  defaultPeriod = 'monthly',
}: TrendLineChartProps) => {
  const { isDark } = useThemeMode();
  const [period, setPeriod] = useState(defaultPeriod);

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: string | null) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
      if (onPeriodChange) onPeriodChange(newPeriod);
    }
  };

  const gridColor  = isDark ? '#334155' : '#e5e7eb';
  const tickColor  = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg  = isDark ? '#1e293b' : '#fff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: tooltipBg,
            p: 1.5,
            borderRadius: 1.5,
            border: `1px solid ${tooltipBorder}`,
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
              <Typography variant="body2" color="text.secondary">
                {entry.name}:{' '}
                <strong style={{ color: isDark ? '#e2e8f0' : 'inherit' }}>
                  {entry.value}%
                </strong>
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 400,
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          {showPeriodFilter && (
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.4,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: tickColor,
                  '&.Mui-selected': {
                    bgcolor: isDark ? '#3b82f680' : '#2E75B6',
                    color: '#fff',
                    '&:hover': { bgcolor: isDark ? '#3b82f699' : '#1a5a96' },
                  },
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                },
              }}
            >
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="yearly">Yearly</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        <Box sx={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                domain={[0, 'auto']}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              {lines.length > 1 && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: tickColor, fontSize: '0.83rem' }}>{value}</span>
                  )}
                />
              )}
              {lines.map((line, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: line.color }}
                  activeDot={{ r: 5, fill: line.color }}
                  name={line.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrendLineChart;
