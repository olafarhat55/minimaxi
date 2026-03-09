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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { StatusBadge, EmptyState, ConfirmDialog } from '../../components/common';
import { isAdmin } from '../../utils/permissions';
import type { WorkOrder } from '../../types';

const priorityColors = {
  critical: '#f44336',
  high: '#ff5722',
  medium: '#ff9800',
  low: '#4caf50',
};

const WorkOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    technician: '',
  });

  const rowsPerPage = 10;

  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoading(true);
      try {
        const data = await api.getWorkOrders(filters);
        setWorkOrders(data);
      } catch (error) {
        console.error('Failed to fetch work orders:', error);
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


  const handleDelete = async () => {
    try {
      await api.deleteWorkOrder(workOrderToDelete);
      setWorkOrders(workOrders.filter((wo) => wo.id !== workOrderToDelete));
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
    } catch (error) {
      console.error('Failed to delete work order:', error);
    }
  };

  const stats = {
    open: workOrders.filter((wo) => wo.status === 'open').length,
    in_progress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    completed: workOrders.filter((wo) => wo.status === 'completed').length,
  };

  const paginatedWorkOrders = workOrders.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(workOrders.length / rowsPerPage);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3].map((i) => (
            // @ts-expect-error MUI v7 Grid item prop
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Work Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/work-orders/new')}
        >
          Create Work Order
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Open</Typography>
              <Typography variant="h4" fontWeight={600} color="#1976d2">
                {stats.open}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 2, borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">In Progress</Typography>
              <Typography variant="h4" fontWeight={600} color="#ff9800">
                {stats.in_progress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
              <Typography variant="h4" fontWeight={600} color="#4caf50">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search work orders..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            label="Status"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            label="Priority"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">All Priority</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Table */}
      {workOrders.length === 0 ? (
        <EmptyState
          title="No work orders found"
          description="Create your first work order to get started."
          actionLabel="Create Work Order"
          onAction={() => navigate('/work-orders/new')}
        />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: isDark ? '#283444' : '#f5f5f5',
                    '& th': {
                      color: isDark ? '#e5e5e5' : 'inherit',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
                    },
                  }}
                >
                  <TableCell>WO Number</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedWorkOrders.map((wo) => (
                  <TableRow key={wo.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {wo.wo_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{wo.asset_id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {wo.machine_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{wo.title}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: `${priorityColors[wo.priority]}15`,
                          color: priorityColors[wo.priority],
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}
                      >
                        {wo.priority === 'critical' && '🔴'}
                        {wo.priority === 'high' && '🟠'}
                        {wo.priority === 'medium' && '🟡'}
                        {wo.priority === 'low' && '🟢'}
                        {wo.priority}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={wo.status} />
                    </TableCell>
                    <TableCell>
                      {wo.assigned_to?.name || (
                        <Typography variant="body2" color="text.secondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {wo.due_date && format(new Date(wo.due_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/work-orders/${wo.id}`)}
                        title="View Details"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/work-orders/${wo.id}/edit`)}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {isAdmin(user) && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setWorkOrderToDelete(wo.id);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Delete Confirmation Dialog */}
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
