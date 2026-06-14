import React, { useState, useRef } from 'react';
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
  Grid,
  TablePagination,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PrecisionManufacturing as MachineIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { machineTypes } from '../../data/mockData';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';

// ✅ criticality added
const initialMachineState = {
  name: '',
  type: '',
  location: '',
  serial_number: '',
  criticality: 'MEDIUM',
};

const criticalityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

interface AddMachinesProps {
  machines: any[];
  onUpdate: (data: any[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// View states: 'initial' | 'form' | 'table'
const AddMachines = ({ machines, onUpdate, onNext, onBack }: AddMachinesProps) => {
  const { isDark } = useThemeMode();
  const [machineList, setMachineList] = useState(machines || []);
  const [viewState, setViewState] = useState(machineList.length > 0 ? 'table' : 'initial');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialMachineState);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleShowForm = (index?: number | null) => {
    if (index != null) {
      setFormData({ ...initialMachineState, ...machineList[index] });
      setEditIndex(index);
    } else {
      setFormData(initialMachineState);
      setEditIndex(null);
    }
    setViewState('form');
  };

  const handleCancel = () => {
    setFormData(initialMachineState);
    setEditIndex(null);
    setViewState(machineList.length > 0 ? 'table' : 'initial');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveMachine = async (addAnother?: boolean) => {
    if (!formData.name.trim() || !formData.type) return;
    setLoading(true);
    try {
      let updatedList = [...machineList];

      if (editIndex !== null) {
        // Edit: update locally
        updatedList[editIndex] = formData;
        setMachineList(updatedList);
        onUpdate(updatedList); // ✅ persist immediately
        showSnackbar('Machine updated successfully.', 'success');
      } else {
        // ✅ Create via API
        const newMachine = await api.createMachine(formData);
        updatedList = [...updatedList, newMachine];
        setMachineList(updatedList);
        onUpdate(updatedList); // ✅ persist immediately so Back doesn't wipe it
        showSnackbar('Machine added successfully.', 'success');
      }

      if (addAnother) {
        setFormData(initialMachineState);
        setEditIndex(null);
        // stay on form
      } else {
        setFormData(initialMachineState);
        setEditIndex(null);
        setViewState('table');
      }
    } catch (error: any) {
      console.error('Failed to save machine:', error);
      const msg =
        error?.message ??
        error?.error ??
        'Failed to save machine. Please try again.';
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMachine = (index: number) => {
    const updated = machineList.filter((_, i) => i !== index);
    setMachineList(updated);
    if (updated.length === 0) setViewState('initial');
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length === 0) {
        showSnackbar('CSV file is empty.', 'error');
        return;
      }

      // Check if first line is a header row
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('name') && firstLine.includes('type') ? 1 : 0;
      const dataLines = lines.slice(startIndex);

      if (dataLines.length === 0) {
        showSnackbar('CSV file has no data rows.', 'error');
        return;
      }

      const errors: string[] = [];
      const validMachines: typeof machineList = [];

      dataLines.forEach((line, i) => {
        const rowNum = i + startIndex + 1;
        const cols = line.split(',').map((col) => col.trim());

        if (cols.length < 2) {
          errors.push(`Row ${rowNum}: needs at least name and type.`);
          return;
        }

        const name = cols[0];
        const type = cols[1];
        const location = cols[2] || '';
        const serial_number = cols[3] || '';
        // ✅ col[4] = criticality, default MEDIUM if missing/invalid
        const rawCrit = (cols[4] || 'MEDIUM').toUpperCase();
        const criticality = criticalityOptions.includes(rawCrit) ? rawCrit : 'MEDIUM';

        if (!name) {
          errors.push(`Row ${rowNum}: machine name is required.`);
          return;
        }
        if (!type) {
          errors.push(`Row ${rowNum}: machine type is required.`);
          return;
        }
        if (!machineTypes.includes(type)) {
          errors.push(`Row ${rowNum}: invalid type "${type}". Valid types: ${machineTypes.join(', ')}.`);
          return;
        }

        validMachines.push({ name, type, location, serial_number, criticality });
      });

      if (errors.length > 0) {
        showSnackbar(
          `${errors.length} error(s): ${errors.slice(0, 3).join(' ')}${errors.length > 3 ? ` ...and ${errors.length - 3} more.` : ''}`,
          'error'
        );
        return;
      }

      // ✅ send each machine to API
      setLoading(true);
      const created: any[] = [];
      const failedRows: string[] = [];

      for (const machine of validMachines) {
        try {
          const result = await api.createMachine(machine);
          created.push(result);
        } catch {
          failedRows.push(machine.name);
        }
      }

      const updated = [...machineList, ...created];
      setMachineList(updated);
      onUpdate(updated);
      setViewState('table');
      setLoading(false);

      if (failedRows.length > 0) {
        showSnackbar(
          `Imported ${created.length} machine(s). Failed: ${failedRows.join(', ')}`,
          created.length > 0 ? 'success' : 'error'
        );
      } else {
        showSnackbar(`Successfully imported ${created.length} machine${created.length !== 1 ? 's' : ''}.`, 'success');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNext = () => {
    onUpdate(machineList);
    onNext();
  };

  // Hidden file input + Snackbar (shared across all view states)
  const sharedElements = (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleCsvImport}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );

  // ── Initial State ────────────────────────────────────────────────────────────
  if (viewState === 'initial') {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {sharedElements}
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Add Machines
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Add your critical machines so we can set monitoring and predicting failures.
        </Typography>

        <Card
          variant="outlined"
          sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', borderStyle: 'dashed', mb: 4 }}
        >
          <CardContent>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#e3f2fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <MachineIcon sx={{ fontSize: 40, color: '#2E75B6' }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Add Machines Manually
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your machine details one by one
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleShowForm()}>
                Add
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Import CSV
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onBack} variant="outlined">Back</Button>
          <Button variant="contained" onClick={handleNext}>Next</Button>
        </Box>
      </Paper>
    );
  }

  // ── Form State ───────────────────────────────────────────────────────────────
  if (viewState === 'form') {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {sharedElements}
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Machines Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {editIndex !== null ? 'Edit machine details' : 'Enter machine details'}
        </Typography>

        {/* Row 1: Machine Name + Machine Type */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
            <TextField fullWidth label="Machine Name *" name="name" value={formData.name} onChange={handleChange} />
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
            <Autocomplete
              options={machineTypes}
              value={formData.type || null}
              onChange={(_, newValue) => setFormData((prev) => ({ ...prev, type: newValue || '' }))}
              renderInput={(params) => <TextField {...params} fullWidth label="Machine Type *" />}
            />
          </Box>
        </Box>

        {/* Row 2: Location + Serial Number */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
            <TextField fullWidth label="Location / Production Line" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Line A, Building 1" />
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
            <TextField fullWidth label="Serial Number" name="serial_number" value={formData.serial_number} onChange={handleChange} />
          </Box>
        </Box>

        {/* Row 3: Criticality */}
        <Box sx={{ mb: 4, width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
          <TextField select fullWidth label="Criticality *" name="criticality" value={formData.criticality} onChange={handleChange}>
            {criticalityOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt.charAt(0) + opt.slice(1).toLowerCase()}</MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={handleCancel}>Cancel</Button>
          <Button variant="outlined" onClick={() => handleSaveMachine(true)} disabled={!formData.name || !formData.type || loading}>
            Save & Add Another
          </Button>
          <Button variant="contained" onClick={() => handleSaveMachine(false)} disabled={!formData.name || !formData.type || loading}>
            {loading ? 'Saving...' : 'Save Machine'}
          </Button>
        </Box>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button variant="outlined" onClick={onBack}>Back</Button>
          <Button variant="contained" onClick={handleNext}>Next</Button>
        </Box>
      </Paper>
    );
  }

  // ── Table State ──────────────────────────────────────────────────────────────
  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      {sharedElements}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Machines Table
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {machineList.length} machine{machineList.length !== 1 ? 's' : ''} added
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleShowForm()}>
            Add Machine
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
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
              <TableCell>Machine Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Serial No.</TableCell>
              <TableCell>Criticality</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {machineList
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((machine, index) => {
                const actualIndex = page * rowsPerPage + index;
                return (
                  <TableRow key={actualIndex}>
                    <TableCell>{machine.name}</TableCell>
                    <TableCell>{machine.type}</TableCell>
                    <TableCell>{machine.location || '-'}</TableCell>
                    <TableCell>{machine.serial_number || '-'}</TableCell>
                    <TableCell>{machine.criticality || 'MEDIUM'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleShowForm(actualIndex)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteMachine(actualIndex)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        {machineList.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={machineList.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
          />
        )}
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">Back</Button>
        <Button variant="contained" onClick={handleNext}>Next</Button>
      </Box>
    </Paper>
  );
};

export default AddMachines;