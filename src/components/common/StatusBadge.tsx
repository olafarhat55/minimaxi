import { Chip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface StatusConfig {
  label: string;
  color: string;
  bgcolor: string;
}

const statusConfig: Record<string, StatusConfig> = {
  // Machine Status
  healthy: { label: 'Healthy', color: '#4caf50', bgcolor: '#e8f5e9' },
  warning: { label: 'Warning', color: '#ff9800', bgcolor: '#fff3e0' },
  critical: { label: 'Critical', color: '#f44336', bgcolor: '#ffebee' },
  maintenance: { label: 'Maintenance', color: '#2196f3', bgcolor: '#e3f2fd' },
  offline: { label: 'Offline', color: '#9e9e9e', bgcolor: '#f5f5f5' },

  // Work Order Status
  open: { label: 'Open', color: '#1976d2', bgcolor: '#e3f2fd' },
  in_progress: { label: 'In Progress', color: '#ff9800', bgcolor: '#fff3e0' },
  completed: { label: 'Completed', color: '#4caf50', bgcolor: '#e8f5e9' },
  cancelled: { label: 'Cancelled', color: '#9e9e9e', bgcolor: '#f5f5f5' },

  // Priority
  low: { label: 'Low', color: '#4caf50', bgcolor: '#e8f5e9' },
  medium: { label: 'Medium', color: '#ff9800', bgcolor: '#fff3e0' },
  high: { label: 'High', color: '#f44336', bgcolor: '#ffebee' },

  // Alert Severity
  info: { label: 'Info', color: '#2196f3', bgcolor: '#e3f2fd' },
  error: { label: 'Error', color: '#f44336', bgcolor: '#ffebee' },

  // User Roles
  admin: { label: 'Admin', color: '#9c27b0', bgcolor: '#f3e5f5' },
  engineer: { label: 'Engineer', color: '#1976d2', bgcolor: '#e3f2fd' },
  technician: { label: 'Technician', color: '#ff9800', bgcolor: '#fff3e0' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const StatusBadge = ({ status, size = 'small', sx = {} }: StatusBadgeProps) => {
  const config = statusConfig[status] || {
    label: status,
    color: '#9e9e9e',
    bgcolor: '#f5f5f5',
  };

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        color: config.color,
        bgcolor: config.bgcolor,
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
        ...sx,
      }}
    />
  );
};

export default StatusBadge;
