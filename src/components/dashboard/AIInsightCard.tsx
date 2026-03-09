import { Card, CardContent, Typography, Box, Chip, LinearProgress, Button, Stack } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Psychology as AIIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';
import type { AIInsight } from '../../types';

interface SeverityConfig {
  color: string;
  bgcolorLight: string;
  bgcolorDark: string;
  borderLight: string;
  borderDark: string;
  icon: SvgIconComponent;
}

const severityConfig: Record<string, SeverityConfig> = {
  critical: {
    color: '#EF4444',
    bgcolorLight: '#FEF2F2',
    bgcolorDark: 'rgba(239, 68, 68, 0.1)',
    borderLight: 'rgba(239, 68, 68, 0.3)',
    borderDark: 'rgba(239, 68, 68, 0.25)',
    icon: ErrorIcon,
  },
  warning: {
    color: '#F59E0B',
    bgcolorLight: '#FFFBEB',
    bgcolorDark: 'rgba(245, 158, 11, 0.1)',
    borderLight: 'rgba(245, 158, 11, 0.3)',
    borderDark: 'rgba(245, 158, 11, 0.25)',
    icon: WarningIcon,
  },
  info: {
    color: '#3B82F6',
    bgcolorLight: '#EFF6FF',
    bgcolorDark: 'rgba(59, 130, 246, 0.1)',
    borderLight: 'rgba(59, 130, 246, 0.3)',
    borderDark: 'rgba(59, 130, 246, 0.25)',
    icon: AIIcon,
  },
};

interface AIInsightCardProps {
  insights: AIInsight[];
  maxVisible?: number;
}

const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };

const AIInsightCard = ({ insights, maxVisible }: AIInsightCardProps) => {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();

  const sortedInsights = [...insights].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3),
  );
  const visibleInsights = maxVisible ? sortedInsights.slice(0, maxVisible) : sortedInsights;
  const hasMore = maxVisible !== undefined && insights.length > maxVisible;

  const handleViewMachine = (machineId: number) => {
    navigate(`/machines/${machineId}`);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AIIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            AI Insights
          </Typography>
          <Chip
            label="AI-Powered"
            size="small"
            sx={{
              ml: 'auto',
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
              color: '#3B82F6',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Box>

        {/* Insights stack */}
        <Stack spacing={2}>
          {visibleInsights.map((insight) => {
            const config = severityConfig[insight.severity] || severityConfig.info;
            const SeverityIcon = config.icon;

            return (
              <Box
                key={insight.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isDark ? config.bgcolorDark : config.bgcolorLight,
                  border: `1px solid ${isDark ? config.borderDark : config.borderLight}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                {/* Severity icon */}
                <SeverityIcon sx={{ color: config.color, fontSize: 22, flexShrink: 0, mt: 0.25 }} />

                {/* Main content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: config.color }}>
                      {insight.asset_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {insight.machine_name}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 1.5 }}>
                    {insight.insight}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      Confidence
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={insight.confidence}
                      sx={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        '& .MuiLinearProgress-bar': { bgcolor: config.color, borderRadius: 3 },
                      }}
                    />
                    <Typography variant="caption" fontWeight={600} sx={{ flexShrink: 0 }}>
                      {insight.confidence}%
                    </Typography>
                  </Box>
                </Box>

                {/* View button */}
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={() => handleViewMachine(insight.machine_id)}
                  sx={{
                    flexShrink: 0,
                    color: config.color,
                    borderColor: `${config.color}60`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '&:hover': { borderColor: config.color, bgcolor: `${config.color}10` },
                  }}
                >
                  View
                </Button>
              </Box>
            );
          })}
        </Stack>

      </CardContent>
    </Card>
  );
};

export default AIInsightCard;
