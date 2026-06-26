import { useState } from 'react';
import {
  Card, CardContent, Typography, Box, Chip, LinearProgress,
  Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Autocomplete, Alert,
} from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Psychology as AIIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  AddTask as AddTaskIcon,
  Sensors as SensorIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { isEngineer } from '../../utils/permissions';
import type { AIInsight } from '../../types';
import { api } from '../../services/api';

interface SeverityConfig {
  color: string;
  bgcolorLight: string;
  bgcolorDark: string;
  borderLight: string;
  borderDark: string;
  icon: SvgIconComponent;
  label: string;
}

const severityConfig: Record<string, SeverityConfig> = {
  critical: {
    color: '#EF4444',
    bgcolorLight: '#FEF2F2',
    bgcolorDark: 'rgba(239, 68, 68, 0.1)',
    borderLight: 'rgba(239, 68, 68, 0.3)',
    borderDark: 'rgba(239, 68, 68, 0.25)',
    icon: ErrorIcon,
    label: 'CRITICAL',       // ← لو مش موجود label ضيفيه
  },
  high: {                    // ← ضيفي الـ block ده
    color: '#EF4444',
    bgcolorLight: '#FEF2F2',
    bgcolorDark: 'rgba(239, 68, 68, 0.1)',
    borderLight: 'rgba(239, 68, 68, 0.3)',
    borderDark: 'rgba(239, 68, 68, 0.25)',
    icon: ErrorIcon,
    label: 'HIGH',
  },
  warning: {
    color: '#F59E0B',
    bgcolorLight: '#FFFBEB',
    bgcolorDark: 'rgba(245, 158, 11, 0.1)',
    borderLight: 'rgba(245, 158, 11, 0.3)',
    borderDark: 'rgba(245, 158, 11, 0.25)',
    icon: WarningIcon,
    label: 'WARNING',
  },
  info: {
    color: '#3B82F6',
    bgcolorLight: '#EFF6FF',
    bgcolorDark: 'rgba(59, 130, 246, 0.1)',
    borderLight: 'rgba(59, 130, 246, 0.3)',
    borderDark: 'rgba(59, 130, 246, 0.25)',
    icon: AIIcon,
    label: 'INFO',
  },
};

interface AIInsightCardProps {
  insights: AIInsight[];
  maxVisible?: number;
}

interface ConvertForm {
  priority: string;
  dueDate: string;
  estimatedHours: string;
  assignedToUserId?: number;
}

const severityOrder: Record<string, number> = { critical: 0, high: 0, warning: 1, info: 2 };

// ── small helper: one labeled row ───────────────────────────────────────────
const InfoRow = ({
  label,
  value,
  valueColor,
  isDark,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  isDark: boolean;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
    <Typography
      variant="caption"
      sx={{
        color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
        fontWeight: 500,
        flexShrink: 0,
        width: 90,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="caption"
      fontWeight={600}
      sx={{
        color: valueColor ?? (isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'),
        fontSize: '0.78rem',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </Typography>
  </Box>
);

const AIInsightCard = ({ insights, maxVisible }: AIInsightCardProps) => {
  const navigate    = useNavigate();
  const { isDark }  = useThemeMode();
  const { user }    = useAuth();
  const canCreateWO = isEngineer(user);

  const [openModal, setOpenModal]       = useState(false);
  const [selectedInsight, setSelected]  = useState<AIInsight | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [convertedIds, setConvertedIds] = useState<Set<number>>(new Set());
  const [technicians, setTechnicians]   = useState<{ id: number; name: string }[]>([]);
  const [errorMsg, setErrorMsg]         = useState('');
  const [form, setForm] = useState<ConvertForm>({
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    assignedToUserId: undefined,
  });

  const sortedInsights  = [...insights].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3),
  );
  const visibleInsights = maxVisible ? sortedInsights.slice(0, maxVisible) : sortedInsights;

  const handleViewMachine = (machineId: number) => navigate(`/machines/${machineId}`);

  const handleOpenModal = async (insight: AIInsight) => {
    setSelected(insight);
    setErrorMsg('');
    setForm({ priority: 'medium', dueDate: '', estimatedHours: '', assignedToUserId: undefined });
    setOpenModal(true);
    try {
      const users = await api.getUsers();
      const ul = Array.isArray(users) ? users : (users as any)?.content ?? [];
      setTechnicians(
        ul
          .filter((u: any) => u.role === 'technician')
          .map((u: any) => ({ id: u.id, name: u.name })),
      );
    } catch { /* ignore */ }
  };

  const handleConvert = async () => {
    if (!selectedInsight) return;
    const currentInsight = selectedInsight;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await (api as any).convertIssueToWorkOrder(currentInsight.id, {
        priority:         form.priority,
        dueDate:          form.dueDate || undefined,
        estimatedHours:   form.estimatedHours ? Number(form.estimatedHours) : undefined,
        assignedToUserId: form.assignedToUserId,
      });
      setConvertedIds(prev => new Set(prev).add(currentInsight.id));
      setOpenModal(false);
    } catch (err: any) {
      const msg = err?.message ?? err?.error ?? err?.detail ?? '';
      if (msg.toLowerCase().includes('already converted') || msg.toLowerCase().includes('already')) {
        setConvertedIds(prev => new Set(prev).add(currentInsight.id));
        setOpenModal(false);
      } else {
        setErrorMsg(msg || 'Failed to create work order');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card elevation={0} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>

          {/* ── Header ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AIIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>AI Insights</Typography>
            <Chip
              label="AI-Powered" size="small"
              sx={{
                ml: 'auto',
                bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
                color: '#3B82F6', fontWeight: 600, fontSize: '0.7rem',
              }}
            />
          </Box>

          {/* ── Insights stack ── */}
          <Stack spacing={2}>
            {visibleInsights.map((insight) => {
              const config       = severityConfig[insight.severity] || severityConfig.info;
              const SeverityIcon = config.icon;
              const isConverted  = convertedIds.has(insight.id);
              const hasStructured = insight.sensorName || insight.currentValue != null || insight.issueType;

              // confidence 0-1 → percent
              const confidencePct = insight.confidence > 1
                ? insight.confidence
                : Math.round(insight.confidence * 100);

              return (
                <Box
                  key={insight.id}
                  sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: isDark ? config.bgcolorDark : config.bgcolorLight,
                    border: `1px solid ${isDark ? config.borderDark : config.borderLight}`,
                  }}
                >
                  {/* ── Top row: severity badge + machine + buttons ── */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Left: icon + content */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                      <SeverityIcon sx={{ color: config.color, fontSize: 20, flexShrink: 0, mt: 0.2 }} />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Severity label + asset id */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                          <Chip
                            label={config.label}
                            size="small"
                            sx={{
                              bgcolor: `${config.color}20`,
                              color: config.color,
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              height: 20,
                              letterSpacing: '0.05em',
                            }}
                          />
                          <Typography variant="caption" fontWeight={700} sx={{ color: config.color }}>
                            {insight.asset_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            · {insight.machine_name}
                          </Typography>
                        </Box>

                        {/* ── Structured rows (if backend sends them) ── */}
                        {hasStructured ? (
                          <Stack spacing={0.6} sx={{ mb: 1.5 }}>
                            {insight.sensorName && (
                              <InfoRow
                                label="Sensor"
                                value={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <SensorIcon sx={{ fontSize: 13, color: config.color }} />
                                    {insight.sensorName}
                                  </Box>
                                }
                                isDark={isDark}
                              />
                            )}
                            {insight.urgency && (
                              <InfoRow
                                label="Urgency"
                                value={insight.urgency}
                                valueColor={config.color}
                                isDark={isDark}
                              />
                            )}
                            {insight.issueType && (
                              <InfoRow
                                label="Issue Type"
                                value={`Issue Type = ${insight.issueType}`}
                                isDark={isDark}
                              />
                            )}
                            {insight.currentValue != null && (
                              <InfoRow
                                label="Reading"
                                value={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <SpeedIcon sx={{ fontSize: 13, color: config.color }} />
                                    {insight.currentValue.toLocaleString()}
                                  </Box>
                                }
                                isDark={isDark}
                              />
                            )}
                            {(insight.normalMin != null && insight.normalMax != null) && (
                              <InfoRow
                                label="Normal Range"
                                value={`(${insight.normalMin} – ${insight.normalMax})`}
                                valueColor={config.color}
                                isDark={isDark}
                              />
                            )}
                          </Stack>
                        ) : (
                          /* fallback: plain text insight */
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.5, mb: 1.5, fontSize: '0.8rem' }}
                          >
                            {insight.insight}
                          </Typography>
                        )}

                        {/* ── Confidence bar ── */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.7rem' }}>
                            Confidence
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={confidencePct}
                            sx={{
                              flex: 1, height: 5, borderRadius: 3,
                              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                              '& .MuiLinearProgress-bar': { bgcolor: config.color, borderRadius: 3 },
                            }}
                          />
                          <Typography variant="caption" fontWeight={700} sx={{ flexShrink: 0, color: config.color, fontSize: '0.72rem' }}>
                            {confidencePct}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Right: buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                      <Button
                        size="small" variant="outlined"
                        endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => handleViewMachine(insight.machine_id)}
                        sx={{
                          color: config.color, borderColor: `${config.color}60`,
                          fontWeight: 600, fontSize: '0.75rem',
                          '&:hover': { borderColor: config.color, bgcolor: `${config.color}10` },
                        }}
                      >
                        View
                      </Button>

                      {canCreateWO && (
                        <Button
                          size="small" variant="contained"
                          startIcon={<AddTaskIcon sx={{ fontSize: '14px !important' }} />}
                          disabled={isConverted}
                          onClick={() => handleOpenModal(insight)}
                          sx={{
                            fontWeight: 600, fontSize: '0.75rem',
                            bgcolor: isConverted ? '#94a3b8' : config.color,
                            '&:hover': { bgcolor: config.color, opacity: 0.9 },
                            '&.Mui-disabled': { bgcolor: '#94a3b8', color: '#fff' },
                          }}
                        >
                          {isConverted ? 'Created' : 'Create WO'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>

        </CardContent>
      </Card>

      {/* ── Convert to WO Modal ── */}
      <Dialog
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Create Work Order
          {selectedInsight && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selectedInsight.asset_id} — {selectedInsight.machine_name}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {errorMsg && (
              <Alert severity="error" onClose={() => setErrorMsg('')}>{errorMsg}</Alert>
            )}
            <TextField
              select fullWidth label="Priority"
              value={form.priority}
              onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
            >
              {['low', 'medium', 'high', 'critical'].map(p => (
                <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
              ))}
            </TextField>
            <Autocomplete
              options={technicians}
              getOptionLabel={o => o.name}
              noOptionsText="No technicians found"
              onChange={(_e, v) => setForm(p => ({ ...p, assignedToUserId: v?.id }))}
              renderInput={params => (
                <TextField {...params} fullWidth label="Assign to Technician (optional)" />
              )}
            />
            <TextField
              fullWidth type="date" label="Due Date"
              InputLabelProps={{ shrink: true }}
              value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
            />
            <TextField
              fullWidth type="number" label="Estimated Hours"
              inputProps={{ min: 0, step: 0.5 }}
              value={form.estimatedHours}
              onChange={e => setForm(p => ({ ...p, estimatedHours: e.target.value }))}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenModal(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConvert}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddTaskIcon />}
          >
            {submitting ? 'Creating...' : 'Create Work Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AIInsightCard;