import React, { useState, useEffect } from 'react';
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
  IconButton,
  Pagination,
  Skeleton,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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

const priorityColors: Record<string, string> = {
  critical: '#f44336',
  high:     '#ff5722',
  medium:   '#ff9800',
  low:      '#4caf50',
};

// ── Stat card config ──────────────────────────────────────────────────────────
const STAT_CARDS = [
  { key: 'open',        label: 'Open',        color: '#1976d2' },
  { key: 'in_progress', label: 'In Progress', color: '#ff9800' },
  { key: 'completed',   label: 'Completed',   color: '#4caf50' },
  { key: 'cancelled',   label: 'Cancelled',   color: '#f44336' },
] as const;

type StatKey = typeof STAT_CARDS[number]['key'];



const WorkOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useThemeMode();

  const [loading, setLoading]                         = useState(true);
  const [workOrders, setWorkOrders]                   = useState<WorkOrder[]>([]);
  const [page, setPage]                               = useState(1);

  // ── Delete state ─────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen]       = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete]     = useState<number | null>(null);

  // ── Cancel state ─────────────────────────────────────────────────────────
  const [cancelDialogOpen, setCancelDialogOpen]       = useState(false);
  const [workOrderToCancel, setWorkOrderToCancel]     = useState<number | null>(null);
  const [cancelling, setCancelling]                   = useState(false);

  const [filters, setFilters] = useState({ search: '', status: '', priority: '', technician: '' });

  const rowsPerPage = 10;

  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoading(true);
      try {
        const data = await api.getWorkOrders(filters);
        const list = Array.isArray(data) ? data : (data as any)?.content ?? [];
        setWorkOrders(list);
      } catch (error) {
        console.error('Failed to fetch work orders:', error);
        setWorkOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrders();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!workOrderToDelete) return;
    try {
      await api.deleteWorkOrder(workOrderToDelete);
      setWorkOrders((prev) => prev.filter((wo) => wo.id !== workOrderToDelete));
    } catch (error) {
      console.error('Failed to delete work order:', error);
    } finally {
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
    }
  };

  // ── Cancel handler — PUT /work-orders/{id} with status CANCELLED ──────────
  const handleCancel = async () => {
    if (!workOrderToCancel) return;
    setCancelling(true);
    try {
      await api.updateWorkOrder(workOrderToCancel, { status: 'cancelled' });
      // optimistic update — no need to re-fetch
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === workOrderToCancel ? { ...wo, status: 'cancelled' } : wo
        )
      );
    } catch (error) {
      console.error('Failed to cancel work order:', error);
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
      setWorkOrderToCancel(null);
    }
  };

  // ── Count per status ──────────────────────────────────────────────────────
  const counts: Record<StatKey, number> = {
    open:        workOrders.filter((wo) => wo.status === 'open').length,
    in_progress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    completed:   workOrders.filter((wo) => wo.status === 'completed').length,
    cancelled:   workOrders.filter(
      (wo) => wo.status === 'cancelled' || wo.status === 'closed'
    ).length,
  };

  const paginatedWorkOrders = workOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages          = Math.ceil(workOrders.length / rowsPerPage);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            // @ts-expect-error MUI v7 Grid item prop
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={96} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Work Orders</Typography>

        {canCreateWorkOrder(user) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/work-orders/new')}
          >
            Create Work Order
          </Button>
        )}
      </Box>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STAT_CARDS.map(({ key, label, color }) => (
          // @ts-expect-error MUI v7 Grid item prop
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              sx={{
                borderRadius: 2,
                borderLeft: `4px solid ${color}`,
                height: 96,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <CardContent
                sx={{
                  width: '100%',
                  py: '16px !important',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {label}
                </Typography>
                <Typography variant="h4" fontWeight={700} color={color} lineHeight={1}>
                  {counts[key]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search work orders..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            sx={{ minWidth: 220, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select size="small" name="status"
            value={filters.status} onChange={handleFilterChange}
            label="Status" sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField
            select size="small" name="priority"
            value={filters.priority} onChange={handleFilterChange}
            label="Priority" sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All Priority</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {workOrders.length === 0 ? (
        <EmptyState
          title="No work orders found"
          description="No work orders match your current filters."
          actionLabel={canCreateWorkOrder(user) ? 'Create Work Order' : undefined}
          onAction={canCreateWorkOrder(user) ? () => navigate('/work-orders/new') : undefined}
        />
      ) : (
        <>
         <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2, overflow: 'hidden' }}>
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
  <TableRow sx={{
    bgcolor: isDark ? '#283444' : '#f5f5f5',
    '& th': {
      color: isDark ? '#e5e5e5' : 'inherit',
      fontWeight: 600,
      fontSize: '0.875rem',
      borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
      whiteSpace: 'nowrap',
      py: 1,
    },
  }}>
  <TableCell sx={{ width: '10%' }}>WO#</TableCell>
<TableCell sx={{ width: '16%' }}>Asset</TableCell>
<TableCell sx={{ width: '24%' }}>Title</TableCell>
<TableCell sx={{ width: '11%' }}>Status</TableCell>
<TableCell sx={{ width: '13%' }}>Assigned To</TableCell>
<TableCell sx={{ width: '12%' }}>Due Date</TableCell>
<TableCell align="center" sx={{ width: '14%' }}>Actions</TableCell>
  </TableRow>
</TableHead>
              <TableBody>
                {paginatedWorkOrders.map((wo) => {
                  const isCancelled = wo.status === 'cancelled' || wo.status === 'closed';

                  return (
                    <TableRow key={wo.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{wo.wo_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{wo.asset_id}</Typography>
                        <Typography variant="caption" color="text.secondary">{wo.machine_name}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" noWrap>{wo.title}</Typography>
                      </TableCell>
                      
                      <TableCell>
                        <StatusBadge status={wo.status} />
                      </TableCell>
                      <TableCell>
                        {wo.assigned_to?.name || (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {wo.due_date ? format(new Date(wo.due_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                     <TableCell align="center" sx={{ whiteSpace: 'nowrap', minWidth: 130 }}>
                        {/* View — everyone */}
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/work-orders/${wo.id}`)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Edit — Engineer only */}
                        {canEditWorkOrder(user) && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/work-orders/${wo.id}/edit`)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Cancel — Engineer only, hidden if already cancelled/completed */}
                        {canCancelWorkOrder(user) && wo.status !== 'cancelled' && wo.status !== 'closed' && wo.status !== 'completed' && (
                          <Tooltip title="Cancel Work Order">
                            <IconButton
                              size="small"
                              sx={{ color: 'warning.main' }}
                              onClick={() => {
                                setWorkOrderToCancel(wo.id);
                                setCancelDialogOpen(true);
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Delete — Engineer only */}
                        {canDeleteWorkOrder(user) && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              sx={{ color: 'error.main' }}
                              onClick={() => {
                                setWorkOrderToDelete(wo.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e: React.ChangeEvent<unknown>, value: number) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* ── Cancel Confirmation ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancel Work Order"
        message="Are you sure you want to cancel this work order? This will set its status to Cancelled."
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel'}
        confirmColor="warning"
        onConfirm={handleCancel}
        onCancel={() => {
          setCancelDialogOpen(false);
          setWorkOrderToCancel(null);
        }}
      />

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Work Order"
        message="Are you sure you want to delete this work order? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setWorkOrderToDelete(null);
        }}
      />
    </Box>
  );
};

export default WorkOrders;