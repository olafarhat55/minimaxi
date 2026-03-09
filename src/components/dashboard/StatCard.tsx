import { Card, CardContent, Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: SvgIconComponent;
  color?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  subtitle?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = '#2E75B6',
  trend,
  trendValue,
  subtitle,
}: StatCardProps) => {
  const isPositiveTrend = trend === 'up';

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top row: label + icon */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 24, color }} />
            </Box>
          )}
        </Box>

        {/* Value */}
        <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1.1, mb: 0.5 }}>
          {value}
        </Typography>

        {/* Trend or subtitle */}
        {trend && trendValue ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {isPositiveTrend ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: '#10B981' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: '#EF4444' }} />
            )}
            <Typography
              variant="caption"
              sx={{ color: isPositiveTrend ? '#10B981' : '#EF4444', fontWeight: 600 }}
            >
              {trendValue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs last month
            </Typography>
          </Box>
        ) : subtitle ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default StatCard;
