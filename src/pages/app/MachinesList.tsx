import React, { useState, useEffect } from 'react';
import {
  Box,
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
  LinearProgress,
  Pagination,
  Skeleton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Assignment as WorkOrderIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { StatusBadge, EmptyState } from '../../components/common';
import { isAdmin, isTechnician } from '../../utils/permissions';
import { machineTypes } from '../../data/mockData';
import type { Machine } from '../../types';

const MachinesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
    status: '',
  });
  // Debounced search — only sent to the API after the user stops typing for 500ms.
  // Dropdown filters (type, location, status) are applied immediately.
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const rowsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getMachines({
          ...filters,
          search: debouncedSearch,
        });
        setMachines(data);
      } catch {
        setError('Failed to load assets. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, [debouncedSearch, filters.type, filters.location, filters.status, retryCount]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/machines/${id}`);
  };

  const handleCreateWorkOrder = (machine: Machine) => {
    navigate('/work-orders/new', { state: { machine } });
  };

  const getStatusColor = (probability: number) => {
    if (probability >= 70) return '#f44336';
    if (probability >= 40) return '#ff9800';
    return '#4caf50';
  };

  const paginatedMachines = machines.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(machines.length / rowsPerPage);

  if (error && !loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => setRetryCount((c) => c + 1)}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Assets
        </Typography>
        {isAdmin(user) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/machines/add')}
          >
            Add Asset
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search assets..."
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
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            label="Asset Type"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Types</MenuItem>
            {machineTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            label="Location"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Locations</MenuItem>
            <MenuItem value="Line A">Line A</MenuItem>
            <MenuItem value="Line B">Line B</MenuItem>
            <MenuItem value="Line C">Line C</MenuItem>
            <MenuItem value="Utility Room">Utility Room</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            label="Risk Level"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Levels</MenuItem>
            <MenuItem value="healthy">Healthy</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Table */}
      {machines.length === 0 ? (
        <EmptyState
          title="No assets found"
          description="Add your first asset to start monitoring."
          actionLabel={isAdmin(user) ? 'Add Asset' : undefined}
          onAction={isAdmin(user) ? () => navigate('/machines/add') : undefined}
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
                  <TableCell>Asset ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Failure Risk</TableCell>
                  <TableCell>RUL (cycles)</TableCell>
                  <TableCell>TTF</TableCell>
                  <TableCell>Last Maintenance</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMachines.map((machine) => (
                  <TableRow
                    key={machine.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetails(machine.id)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {machine.asset_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{machine.name}</TableCell>
                    <TableCell>{machine.type}</TableCell>
                    <TableCell>{machine.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={machine.status} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flexGrow: 1, maxWidth: 80 }}>
                          <LinearProgress
                            variant="determinate"
                            value={machine.prediction.failure_probability}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#eee',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getStatusColor(machine.prediction.failure_probability),
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {machine.prediction.failure_probability}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{machine.prediction.rul}</TableCell>
                    <TableCell>{machine.prediction.ttf}</TableCell>
                    <TableCell>{machine.last_maintenance}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(machine.id)}
                        title="View Details"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {!isTechnician(user) && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleCreateWorkOrder(machine)}
                            title="Create Work Order"
                          >
                            <WorkOrderIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="View History">
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </>
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
    </Box>
  );
};

export default MachinesList;
