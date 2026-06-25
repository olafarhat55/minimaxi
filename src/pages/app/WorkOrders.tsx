import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Skeleton,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { StatusBadge, EmptyState, ConfirmDialog } from '../../components/common';
import {
  canCreateWorkOrder,
  canEditWorkOrder,
  canDeleteWorkOrder,
  canCancelWorkOrder,
} from '../../utils/permissions';
import type { WorkOrder } from '../../types';

// ── Stat card config ────────────────────────────────────────────────────────
const STAT_CARDS = [
  { key: 'open',        label: 'Open',        color: '#185FA5', bg: '#E6F1FB', Icon: AssignmentIcon  },
  { key: 'in_progress', label: 'In progress', color: '#854F0B', bg: '#FAEEDA', Icon: SettingsIcon    },
  { key: 'completed',   label: 'Completed',   color: '#3B6D11', bg: '#EAF3DE', Icon: CheckCircleIcon },
  { key: 'cancelled',   label: 'Cancelled',   color: '#A32D2D', bg: '#FCEBEB', Icon: BlockIcon       },
] as const;

type StatKey = typeof STAT_CARDS[number]['key'];

// ── Priority config ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, { dot: string; label: string; text: string }> = {
  critical: { dot: '#E24B4A', label: 'Critical', text: '#A32D2D' },
  high:     { dot: '#EF9F27', label: 'High',     text: '#633806' },
  medium:   { dot: '#378ADD', label: 'Medium',   text: '#0C447C' },
  low:      { dot: '#639922', label: 'Low',      text: '#3B6D11' },
};

// ── Assignee avatar ─────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#FBEAF0', color: '#72243E' },
];
const getAvatarStyle = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// ── Action menu ─────────────────────────────────────────────────────────────
interface ActionMenuProps {
  wo: WorkOrder;
  onView: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isDark: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ wo, onView, onEdit, onCancel, onDelete, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Determine if this row has any dropdown actions at all
  const isCancellable = wo.status !== 'cancelled' && wo.status !== 'closed' && wo.status !== 'completed';
  const hasActions = !!(onEdit || (onCancel && isCancellable) || onDelete);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const menuBg     = isDark ? '#1e2a35' : '#ffffff';
  const menuBorder = isDark ? '1px solid #334155' : '0.5px solid rgba(0,0,0,0.12)';
  const hoverBg    = isDark ? '#283444' : '#f5f7fa';

  const menuItem = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    danger = false,
    warning = false,
  ) => (
    <Box
      component="button"
      onClick={() => { onClick(); setOpen(false); }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.25,
        width: '100%', px: 1.5, py: 0.9,
        border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
        borderRadius: '6px', fontSize: '13px',
        color: danger ? '#A32D2D' : warning ? '#633806' : isDark ? '#e2e8f0' : '#1e293b',
        '&:hover': { background: danger ? '#FCEBEB' : warning ? '#FAEEDA' : hoverBg },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '16px',
        color: danger ? '#A32D2D' : warning ? '#854F0B' : isDark ? '#94a3b8' : '#64748b' }}>
        {icon}
      </Box>
      {label}
    </Box>
  );

  return (
    <Box ref={ref} sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
      {/* View pill */}
      <Box
        component="button"
        onClick={onView}
        sx={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          height: 32, px: '12px', mr: hasActions ? '6px' : 0,
          border: isDark ? '0.5px solid #334155' : '0.5px solid rgba(0,0,0,0.15)',
          borderRadius: '8px', background: 'transparent', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500,
          color: isDark ? '#94a3b8' : '#475569',
          whiteSpace: 'nowrap', flexShrink: 0,
          '&:hover': { background: '#E6F1FB', borderColor: '#85B7EB', color: '#185FA5' },
        }}
      >
        <ViewIcon sx={{ fontSize: 15 }} />
        View
      </Box>

      {/* 3-dot — only rendered when there are actions to show */}
      {hasActions && (
        <Box
          component="button"
          onClick={() => setOpen((p) => !p)}
          aria-label="More actions"
          sx={{
            width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
            border: isDark ? '0.5px solid #334155' : '0.5px solid rgba(0,0,0,0.15)',
            background: open ? (isDark ? '#283444' : '#f1f5f9') : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b',
            '&:hover': { background: isDark ? '#283444' : '#f1f5f9' },
          }}
        >
          <MoreVertIcon sx={{ fontSize: 18 }} />
        </Box>
      )}

      {/* Dropdown — only rendered when there are actions to show */}
      {hasActions && open && (
        <Box sx={{
          position: 'absolute', right: 0, top: 36, zIndex: 1300,
          background: menuBg, border: menuBorder, borderRadius: '10px',
          p: '4px', minWidth: 175,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.10)',
        }}>
          {onEdit && menuItem('Edit work order', <EditIcon sx={{ fontSize: 15 }} />, onEdit)}
          {onCancel && isCancellable && menuItem('Cancel work order', <CancelIcon sx={{ fontSize: 15 }} />, onCancel, false, true)}
          {(onEdit || (onCancel && isCancellable)) && onDelete && (
            <Box sx={{ height: '0.5px', background: isDark ? '#334155' : 'rgba(0,0,0,0.08)', my: '4px' }} />
          )}
          {onDelete && menuItem('Delete', <DeleteIcon sx={{ fontSize: 15 }} />, onDelete, true)}
        </Box>
      )}
    </Box>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
const WorkOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useThemeMode();

  const [loading, setLoading]                     = useState(true);
  const [workOrders, setWorkOrders]               = useState<WorkOrder[]>([]);
  const [page, setPage]                           = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen]   = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen]   = useState(false);
  const [workOrderToCancel, setWorkOrderToCancel] = useState<number | null>(null);
  const [cancelling, setCancelling]               = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', technician: '' });

  const rowsPerPage = 10;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await api.getWorkOrders(filters);
        const list = Array.isArray(data) ? data : (data as any)?.content ?? [];
        setWorkOrders(list);
      } catch { setWorkOrders([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleDelete = async () => {
    if (!workOrderToDelete) return;
    try {
      await api.deleteWorkOrder(workOrderToDelete);
      setWorkOrders((prev) => prev.filter((wo) => wo.id !== workOrderToDelete));
    } catch { /* handled */ }
    finally { setDeleteDialogOpen(false); setWorkOrderToDelete(null); }
  };

  const handleCancel = async () => {
    if (!workOrderToCancel) return;
    setCancelling(true);
    try {
      await api.updateWorkOrder(workOrderToCancel, { status: 'cancelled' });
      setWorkOrders((prev) =>
        prev.map((wo) => wo.id === workOrderToCancel ? { ...wo, status: 'cancelled' } : wo),
      );
    } catch { /* handled */ }
    finally { setCancelling(false); setCancelDialogOpen(false); setWorkOrderToCancel(null); }
  };

  const counts: Record<StatKey, number> = {
    open:        workOrders.filter((wo) => wo.status === 'open').length,
    in_progress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    completed:   workOrders.filter((wo) => wo.status === 'completed').length,
    cancelled:   workOrders.filter((wo) => wo.status === 'cancelled' || wo.status === 'closed').length,
  };

  const paginatedWorkOrders = workOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages          = Math.ceil(workOrders.length / rowsPerPage);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1,2,3,4].map((i) => (
            // @ts-expect-error MUI v7 Grid item prop
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={92} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  // ── Shared tokens ─────────────────────────────────────────────────────────
  const cardBg     = isDark ? '#1e2a35' : '#ffffff';
  const cardBorder = isDark ? '0.5px solid #334155' : '0.5px solid rgba(0,0,0,0.10)';
  const headBg     = isDark ? '#182231' : '#f8fafc';
  const headColor  = isDark ? '#94a3b8' : '#64748b';
  const rowHover   = isDark ? '#1a2636' : '#f8fafc';

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={500}>Work orders</Typography>
          <Typography variant="caption" color="text.secondary">
            {workOrders.length} total across all assets
          </Typography>
        </Box>
        {canCreateWorkOrder(user) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/work-orders/new')}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500, px: 2.5, height: 40 }}
          >
            Create work order
          </Button>
        )}
      </Box>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STAT_CARDS.map(({ key, label, color, bg, Icon }) => (
          // @ts-expect-error MUI v7 Grid item prop
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              elevation={0}
              sx={{
                borderRadius: '14px',
                border: cardBorder,
                background: cardBg,
                height: '100%',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                '&:hover': {
                  borderColor: isDark ? '#3d4f63' : 'rgba(0,0,0,0.16)',
                  boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 14px rgba(15,23,42,0.07)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <CardContent sx={{ p: '18px 20px !important', display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Icon */}
                <Box sx={{
                  width: 44, height: 44, borderRadius: '11px', flexShrink: 0,
                  background: isDark ? `${color}22` : bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon sx={{ fontSize: 22, color }} />
                </Box>

                {/* Value + label */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {counts[key]}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Filters toolbar ────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center',
        mb: 2, p: '10px 14px',
        background: cardBg, border: cardBorder, borderRadius: '10px',
      }}>
        <TextField
          size="small"
          placeholder="Search by title, asset, or WO number…"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '7px', fontSize: 14 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select size="small" name="status" value={filters.status} onChange={handleFilterChange}
          label="Status" sx={{ minWidth: 135, '& .MuiOutlinedInput-root': { borderRadius: '7px', fontSize: 14 } }}
        >
          <MenuItem value="">All status</MenuItem>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="in_progress">In progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
        <TextField
          select size="small" name="priority" value={filters.priority} onChange={handleFilterChange}
          label="Priority" sx={{ minWidth: 135, '& .MuiOutlinedInput-root': { borderRadius: '7px', fontSize: 14 } }}
        >
          <MenuItem value="">All priority</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
      </Box>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {workOrders.length === 0 ? (
        <EmptyState
          title="No work orders found"
          description="No work orders match your current filters."
          actionLabel={canCreateWorkOrder(user) ? 'Create Work Order' : undefined}
          onAction={canCreateWorkOrder(user) ? () => navigate('/work-orders/new') : undefined}
        />
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: '12px', border: cardBorder, background: cardBg, overflow: 'auto' }}
        >
          <Table sx={{ tableLayout: 'fixed', width: '100%', minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ background: headBg }}>
                {[
                  { label: 'WO #',        w: '9%'  },
                  { label: 'Asset',       w: '15%' },
                  { label: 'Title',       w: '24%' },
                  { label: 'Priority',    w: '11%' },
                  { label: 'Status',      w: '13%' },
                  { label: 'Assigned to', w: '15%' },
                  { label: 'Actions',     w: '13%', align: 'right' as const },
                ].map((col) => (
                  <TableCell
                    key={col.label}
                    align={col.align}
                    sx={{
                      width: col.w,
                      fontSize: '11px', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '.05em',
                      color: headColor,
                      borderBottom: isDark ? '0.5px solid #334155' : '0.5px solid rgba(0,0,0,0.08)',
                      py: '11px', px: '16px', whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedWorkOrders.map((wo) => {
                const prio         = PRIORITY_CONFIG[wo.priority] ?? PRIORITY_CONFIG.medium;
                const assigneeName = wo.assigned_to?.name ?? '';
                const avatarStyle  = assigneeName ? getAvatarStyle(assigneeName) : null;

                return (
                  <TableRow
                    key={wo.id}
                    sx={{
                      '&:last-child td': { border: 0 },
                      '& td': {
                        borderBottom: isDark ? '0.5px solid #1e2d3d' : '0.5px solid rgba(0,0,0,0.06)',
                        py: '13px', px: '16px',
                        verticalAlign: 'top',
                      },
                      '&:hover td': { background: rowHover },
                    }}
                  >
                    {/* WO # */}
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#185FA5' }}>
                        {wo.wo_number}
                      </Typography>
                    </TableCell>

                    {/* Asset */}
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, wordBreak: 'break-word' }}>
                        {wo.asset_id}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '2px', wordBreak: 'break-word' }}>
                        {wo.machine_name}
                      </Typography>
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 14,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={wo.title}
                      >
                        {wo.title}
                      </Typography>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: prio.dot, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: prio.text }}>
                          {prio.label}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={wo.status} />
                    </TableCell>

                    {/* Assigned to */}
                    <TableCell>
                      {assigneeName ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: avatarStyle?.bg, color: avatarStyle?.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {getInitials(assigneeName)}
                          </Box>
                          <Typography sx={{ fontSize: 14, wordBreak: 'break-word' }}>{assigneeName}</Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: 13, color: 'text.disabled', fontStyle: 'italic' }}>
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" sx={{ pr: '16px !important' }}>
                      <ActionMenu
                        wo={wo}
                        isDark={isDark}
                        onView={() => navigate(`/work-orders/${wo.id}`)}
                        onEdit={canEditWorkOrder(user) ? () => navigate(`/work-orders/${wo.id}/edit`) : undefined}
                        onCancel={
                          canCancelWorkOrder(user)
                            ? () => { setWorkOrderToCancel(wo.id); setCancelDialogOpen(true); }
                            : undefined
                        }
                        onDelete={
                          canDeleteWorkOrder(user)
                            ? () => { setWorkOrderToDelete(wo.id); setDeleteDialogOpen(true); }
                            : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Footer */}
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            px: '16px', py: '11px',
            borderTop: isDark ? '0.5px solid #334155' : '0.5px solid rgba(0,0,0,0.08)',
            background: headBg,
          }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Showing {Math.min((page - 1) * rowsPerPage + 1, workOrders.length)}–
              {Math.min(page * rowsPerPage, workOrders.length)} of {workOrders.length} work orders
            </Typography>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                size="small"
                onChange={(_e: React.ChangeEvent<unknown>, value: number) => setPage(value)}
                color="primary"
                sx={{ '& .MuiPaginationItem-root': { fontSize: 13, minWidth: 30, height: 30, borderRadius: '6px' } }}
              />
            )}
          </Box>
        </TableContainer>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancel work order"
        message="Are you sure you want to cancel this work order? This will set its status to Cancelled."
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, cancel'}
        confirmColor="warning"
        onConfirm={handleCancel}
        onCancel={() => { setCancelDialogOpen(false); setWorkOrderToCancel(null); }}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete work order"
        message="Are you sure you want to delete this work order? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setWorkOrderToDelete(null); }}
      />
    </Box>
  );
};

export default WorkOrders;