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
  Tooltip,
  Chip,
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
  FilterList as FilterIcon,
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

// ─── fade-up keyframe (CSS-in-JS via sx) ────────────────────────────────────
const fadeUp = {
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to:   { opacity: 1, transform: 'translateY(0)' },
  },
};

const MachinesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', type: '', location: '', status: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dependencyInfo, setDependencyInfo] = useState<{ workOrdersCount: number; issuesCount: number } | null>(null);

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
        const data = await api.getMachines({ ...filters, search: debouncedSearch });
        setMachines(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (machines.length === 0) setError('Failed to load assets. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [debouncedSearch, filters.type, filters.location, filters.status, retryCount]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (!lines.length) return;
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
      for (const line of lines.slice(startIndex)) {
        const cols = line.split(',').map((c) => c.trim());
        if (cols.length < 2) continue;
        try {
          await api.createMachine({
            name: cols[0], type: cols[1], location: cols[2] || '',
            serial_number: cols[3] || '',
            criticality: (['LOW','MEDIUM','HIGH','CRITICAL'].includes((cols[4]||'').toUpperCase()) ? cols[4].toUpperCase() : 'MEDIUM'),
          });
        } catch { /* skip */ }
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
          (typeof responseData?.message === 'string' && responseData.message.includes('foreign key constraint')));
      if (!force && isForeignKeyError) {
        setDependencyInfo({ workOrdersCount: responseData.workOrdersCount ?? 0, issuesCount: responseData.issuesCount ?? 0 });
      } else if (force) {
        await new Promise((res) => setTimeout(res, 2000));
        try {
          await api.getMachineById(idToDelete);
        } catch (checkError: any) {
          if (checkError?.response?.status === 404) setMachines((prev) => prev.filter((m) => m.id !== idToDelete));
        }
        resetDeleteState();
      } else {
        resetDeleteState();
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const buildDeleteMessage = (): string => {
    if (!dependencyInfo) return 'Are you sure you want to delete this asset? This action cannot be undone.';
    const parts: string[] = [];
    if (dependencyInfo.workOrdersCount > 0) parts.push(`${dependencyInfo.workOrdersCount} work order${dependencyInfo.workOrdersCount > 1 ? 's' : ''}`);
    if (dependencyInfo.issuesCount > 0) parts.push(`${dependencyInfo.issuesCount} issue${dependencyInfo.issuesCount > 1 ? 's' : ''}`);
    return `This asset has ${parts.join(' and ')} linked to it. Deleting will permanently remove them all. This action cannot be undone.`;
  };

  const paginatedMachines = machines.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(machines.length / rowsPerPage);

  // ── colours ────────────────────────────────────────────────────────────────
  const bg     = isDark ? '#0f172a' : '#f8fafc';
  const paper  = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const headBg = isDark ? '#162032' : '#f1f5f9';
  const rowHover = isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)';

  // ── error / loading ────────────────────────────────────────────────────────
  if (error && !loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => setRetryCount((c) => c + 1)}>
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
      <Box sx={{ p: 0 }}>
        <Skeleton variant="rounded" height={52} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={56} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={440} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ ...fadeUp }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          animation: 'fadeUp .35s ease both',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.3px' }}>
            Assets
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {machines.length} asset{machines.length !== 1 ? 's' : ''} total
          </Typography>
        </Box>

        {canManageAssets(user) && (
          <>
            <input type="file" ref={csvInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleCsvImport} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              endIcon={<ArrowDownIcon />}
              onClick={(e) => setAddMenuAnchor(e.currentTarget)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                '&:hover': { boxShadow: '0 4px 16px rgba(99,102,241,0.45)' },
                transition: 'box-shadow .2s',
              }}
            >
              Add Asset
            </Button>
            <Menu
              anchorEl={addMenuAnchor}
              open={Boolean(addMenuAnchor)}
              onClose={() => setAddMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' } }}
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

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          alignItems: 'center',
          mb: 2.5,
          p: 2,
          bgcolor: paper,
          border: `1px solid ${border}`,
          borderRadius: 2.5,
          animation: 'fadeUp .4s ease both',
        }}
      >
        <FilterIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
        <TextField
          size="small"
          placeholder="Search assets…"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          sx={{ flexGrow: 1, minWidth: 180 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 1.5 },
          }}
        />
        {[
          { name: 'type', label: 'Type', options: machineTypes.map((t) => ({ value: t, label: t })) },
          { name: 'location', label: 'Location', options: [
            { value: 'Line A', label: 'Line A' },
            { value: 'Line B', label: 'Line B' },
            { value: 'Line C', label: 'Line C' },
            { value: 'Utility Room', label: 'Utility Room' },
          ]},
          { name: 'status', label: 'Risk', options: [
            { value: 'healthy', label: 'Healthy' },
            { value: 'warning', label: 'Warning' },
            { value: 'critical', label: 'Critical' },
          ]},
        ].map((f) => (
          <TextField
            key={f.name}
            select
            size="small"
            name={f.name}
            value={filters[f.name as keyof typeof filters]}
            onChange={handleFilterChange}
            label={f.label}
            sx={{ minWidth: 130 }}
            SelectProps={{ MenuProps: { PaperProps: { sx: { borderRadius: 2 } } } }}
            InputProps={{ sx: { borderRadius: 1.5 } }}
          >
            <MenuItem value="">All {f.label}s</MenuItem>
            {f.options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        ))}
      </Box>

      {/* ── Table / Empty ──────────────────────────────────────────────────── */}
      {machines.length === 0 ? (
        <EmptyState
          title="No assets found"
          description="Add your first asset to start monitoring."
          actionLabel={canManageAssets(user) ? 'Add Asset' : undefined}
          onAction={canManageAssets(user) ? () => navigate('/machines/add') : undefined}
        />
      ) : (
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${border}`,
              mb: 3,
              overflow: 'hidden',
              animation: 'fadeUp .45s ease both',
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: headBg,
                    '& th': {
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      py: 1.5,
                      borderBottom: `1px solid ${border}`,
                    },
                  }}
                >
                  <TableCell sx={{ pl: 3 }}>Asset ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedMachines.map((machine, idx) => (
                  <TableRow
                    key={machine.id}
                    hover
                    onClick={() => navigate(`/machines/${machine.id}`)}
                    sx={{
                      cursor: 'pointer',
                      animation: `fadeUp ${0.3 + idx * 0.04}s ease both`,
                      transition: 'background .15s',
                      '&:hover': { bgcolor: rowHover },
                      '& td': {
                        py: 1.75,
                        borderBottom: `1px solid ${border}`,
                        fontSize: '0.95rem',
                      },
                      '&:last-child td': { borderBottom: 'none' },
                    }}
                  >
                    {/* Asset ID */}
                    <TableCell sx={{ pl: 3 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.88rem',
                          bgcolor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
                          color: 'primary.main',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          display: 'inline-block',
                        }}
                      >
                        {machine.asset_id}
                      </Typography>
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{machine.name}</Typography>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Chip
                        label={machine.type}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          border: `1px solid ${border}`,
                        }}
                      />
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{machine.location}</Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={machine.status} />
                    </TableCell>

                    {/* Actions — horizontal row, right-aligned */}
                    <TableCell align="right" sx={{ pr: 2.5 }} onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/machines/${machine.id}`)}
                            sx={{ '&:hover': { color: 'primary.main', bgcolor: 'primary.main' + '18' } }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View History" arrow>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/machines/${machine.id}/history`)}
                            sx={{ '&:hover': { color: 'info.main', bgcolor: 'info.main' + '18' } }}
                          >
                            <HistoryIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        {canCreateWorkOrder(user) && (
                          <Tooltip title="Create Work Order" arrow>
                            <IconButton
                              size="small"
                              onClick={() => navigate('/work-orders/new', { state: { machine } })}
                              sx={{ '&:hover': { color: 'success.main', bgcolor: 'success.main' + '18' } }}
                            >
                              <WorkOrderIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canDeleteAsset(user) && (
                          <Tooltip title="Delete Asset" arrow>
                            <IconButton
                              size="small"
                              onClick={() => { setMachineToDelete(machine.id); setDependencyInfo(null); setDeleteDialogOpen(true); }}
                              sx={{ '&:hover': { color: 'error.main', bgcolor: 'error.main' + '18' } }}
                            >
                              <DeleteIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, machines.length)} of {machines.length}
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, v) => setPage(v)}
                color="primary"
                shape="rounded"
                size="small"
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