import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Assignment as WorkOrderIcon,
  Refresh as RefreshIcon,
  UploadFile as UploadFileIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api, axiosInstance } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { StatusBadge, EmptyState } from '../../components/common';
import { ConfirmDialog } from '../../components/common';
import { machineTypes } from '../../data/mockData';
import type { Machine } from '../../types';
import { canCreateWorkOrder, canManageAssets, canDeleteAsset } from '../../utils/permissions';

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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Add Asset menu
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dependencyInfo, setDependencyInfo] = useState<{
    workOrdersCount: number;
    issuesCount: number;
  } | null>(null);

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
        setMachines(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (machines.length === 0) {
          setError('Failed to load assets. Please check your connection and try again.');
        }
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

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length === 0) return;
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('name') && firstLine.includes('type') ? 1 : 0;
      const dataLines = lines.slice(startIndex);
      for (const line of dataLines) {
        const cols = line.split(',').map((c) => c.trim());
        if (cols.length < 2) continue;
        try {
          await api.createMachine({
            name: cols[0],
            type: cols[1],
            location: cols[2] || '',
            serial_number: cols[3] || '',
            criticality: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes((cols[4] || '').toUpperCase())
              ? cols[4].toUpperCase()
              : 'MEDIUM'),
          });
        } catch { /* skip failed rows */ }
      }
      setRetryCount((c) => c + 1);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const resetDeleteState = () => {
    setDeleteDialogOpen(false);
    setMachineToDelete(null);
    setDependencyInfo(null);
  };

  const handleDeleteMachine = async (force = false) => {
    if (!machineToDelete) return;
    const idToDelete = machineToDelete;
    setDeleteLoading(true);
    try {
      if (force) {
        await axiosInstance.delete(`/machines/${idToDelete}?force=true`);
      } else {
        await api.deleteMachine(idToDelete);
      }
      setMachines((prev) => prev.filter((m) => m.id !== idToDelete));
      resetDeleteState();
    } catch (error: any) {
      const responseData = error?.response?.data ?? error;
      const status = error?.response?.status ?? responseData?.status;

   const isForeignKeyError =
  (status === 400 || status === 409) &&
  (responseData?.code === 'MACHINE_HAS_DEPENDENCIES' ||
    (typeof responseData?.message === 'string' &&
      responseData.message.includes('foreign key constraint')));

if (!force && isForeignKeyError) {
        // Show confirmation with dependency counts — dialog stays open
        setDependencyInfo({
          workOrdersCount: responseData.workOrdersCount ?? 0,
          issuesCount: responseData.issuesCount ?? 0,
        });
      } else if (force) {
  await new Promise(res => setTimeout(res, 2000));
  try {
    await api.getMachineById(idToDelete);
    console.error('Machine still exists, delete may still be processing');
  } catch (checkError: any) {
    if (checkError?.response?.status === 404) {
      setMachines((prev) => prev.filter((m) => m.id !== idToDelete));
    }
  }
  resetDeleteState();
} else {
        console.error('Failed to delete machine:', error);
        resetDeleteState();
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const buildDeleteMessage = (): string => {
    if (!dependencyInfo) {
      return 'Are you sure you want to delete this asset? This action cannot be undone.';
    }
    const parts: string[] = [];
    if (dependencyInfo.workOrdersCount > 0) {
      parts.push(`${dependencyInfo.workOrdersCount} work order${dependencyInfo.workOrdersCount > 1 ? 's' : ''}`);
    }
    if (dependencyInfo.issuesCount > 0) {
      parts.push(`${dependencyInfo.issuesCount} issue${dependencyInfo.issuesCount > 1 ? 's' : ''}`);
    }
    return `This asset has ${parts.join(' and ')} linked to it. Deleting will permanently remove them all. This action cannot be undone.`;
  };

  const getStatusColor = (severity: string) => {
  if (severity === 'critical') return '#f44336';
  if (severity === 'high' || severity === 'medium') return '#ff9800';
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

        {canManageAssets(user) && (
          <>
            <input
              type="file"
              ref={csvInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCsvImport}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              endIcon={<ArrowDownIcon />}
              onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            >
              Add Asset
            </Button>
            <Menu
              anchorEl={addMenuAnchor}
              open={Boolean(addMenuAnchor)}
              onClose={() => setAddMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => { setAddMenuAnchor(null); navigate('/machines/add'); }}>
                <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Add Manually</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setAddMenuAnchor(null); csvInputRef.current?.click(); }}>
                <ListItemIcon><UploadFileIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Import CSV</ListItemText>
              </MenuItem>
            </Menu>
          </>
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
          actionLabel={canManageAssets(user) ? 'Add Asset' : undefined}
          onAction={canManageAssets(user) ? () => navigate('/machines/add') : undefined}
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
                    
                   
                    
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
    <IconButton
      size="small"
      onClick={() => handleViewDetails(machine.id)}
      title="View Details"
    >
      <ViewIcon fontSize="small" />
    </IconButton>
    <IconButton
      size="small"
      onClick={() => navigate(`/machines/${machine.id}/history`)}
      title="View History"
    >
      <HistoryIcon fontSize="small" />
    </IconButton>
    {canCreateWorkOrder(user) && (
      <IconButton
        size="small"
        onClick={() => handleCreateWorkOrder(machine)}
        title="Create Work Order"
      >
        <WorkOrderIcon fontSize="small" />
      </IconButton>
    )}
    {canDeleteAsset(user) && (
      <IconButton
        size="small"
        title="Delete Asset"
        sx={{ color: 'error.main' }}
        onClick={() => {
          setMachineToDelete(machine.id);
          setDependencyInfo(null);
          setDeleteDialogOpen(true);
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    )}
  </Box>
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

      <ConfirmDialog
        open={deleteDialogOpen}
        title={dependencyInfo ? 'Delete Asset and All Related Data' : 'Delete Asset'}
        message={buildDeleteMessage()}
        confirmLabel={dependencyInfo ? 'Delete All' : 'Delete'}
        confirmColor="error"
        onConfirm={() => handleDeleteMachine(!!dependencyInfo)}
        onCancel={resetDeleteState}
      />
    </Box>
  );
};

export default MachinesList;