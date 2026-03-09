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

const initialMachineState = {
  name: '',
  type: '',
  location: '',
  serial_number: '',
};

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
  const [editIndex, setEditIndex] = useState(null);
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

  const handleShowForm = (index?: number | null) => {
    if (index != null) {
      setFormData(machineList[index]);
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
    setLoading(true);
    try {
      if (editIndex !== null) {
        const updated = [...machineList];
        updated[editIndex] = formData;
        setMachineList(updated);
      } else {
        const newMachine = await api.createMachine(formData);
        setMachineList([...machineList, newMachine]);
      }

      if (addAnother) {
        setFormData(initialMachineState);
        setEditIndex(null);
      } else {
        setFormData(initialMachineState);
        setEditIndex(null);
        setViewState('table');
      }
    } catch (error) {
      console.error('Failed to save machine:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMachine = (index: number) => {
    const updated = machineList.filter((_, i) => i !== index);
    setMachineList(updated);
    if (updated.length === 0) {
      setViewState('initial');
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length === 0) {
        setSnackbar({ open: true, message: 'CSV file is empty.', severity: 'error' });
        return;
      }

      // Check if first line is a header row
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('name') && firstLine.includes('type') ? 1 : 0;
      const dataLines = lines.slice(startIndex);

      if (dataLines.length === 0) {
        setSnackbar({ open: true, message: 'CSV file has no data rows.', severity: 'error' });
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

        validMachines.push({
          name,
          type,
          location: cols[2] || '',
          model: cols[3] || '',
          serial_number: cols[4] || '',
        });
      });

      if (errors.length > 0) {
        setSnackbar({
          open: true,
          message: `${errors.length} error(s): ${errors.slice(0, 3).join(' ')}${errors.length > 3 ? ` ...and ${errors.length - 3} more.` : ''}`,
          severity: 'error',
        });
        return;
      }

      const updated = [...machineList, ...validMachines];
      setMachineList(updated);
      setViewState('table');
      setSnackbar({
        open: true,
        message: `Successfully imported ${validMachines.length} machine${validMachines.length !== 1 ? 's' : ''}.`,
        severity: 'success',
      });
    };

    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleNext = () => {
    onUpdate(machineList);
    onNext();
  };

  // Hidden file input for CSV import
  const csvInput = (
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

  // Initial State - Card with Add button
  if (viewState === 'initial') {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {csvInput}
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Add Machines
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Add your critical machines so we can set monitoring and predicting failures.
        </Typography>

        <Card
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: '#fafafa',
            borderStyle: 'dashed',
            mb: 4,
          }}
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
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleShowForm()}
              >
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
          <Button onClick={onBack} variant="outlined">
            Back
          </Button>
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        </Box>
      </Paper>
    );
  }

  // Form State
  if (viewState === 'form') {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {csvInput}
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Machines Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {editIndex !== null ? 'Edit machine details' : 'Enter machine details'}
        </Typography>

        <Grid container spacing={3}>
          {/* Row 1 - Machine Name & Machine Type */}
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Machine Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={machineTypes}
              value={formData.type || null}
              onChange={(_, newValue) =>
                setFormData((prev) => ({ ...prev, type: newValue || '' }))
              }
              renderInput={(params) => (
                <TextField {...params} fullWidth label="Machine Type *" />
              )}
            />
          </Grid>

          {/* Row 2 - Location & Serial Number */}
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location / Production Line"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Line A, Building 1"
            />
          </Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Serial Number"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
            />
          </Grid>

          {/* Row 3 - Action Buttons في المنتصف */}
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSaveMachine(true)}
                disabled={!formData.name || !formData.type || loading}
              >
                Save & Add Another
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSaveMachine(false)}
                disabled={!formData.name || !formData.type || loading}
              >
                Save Machine
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Navigation Buttons */}
        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button variant="outlined" onClick={onBack}>
            Back
          </Button>
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        </Box>
      </Paper>
    );
  }

  // Table State
  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      {csvInput}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleShowForm()}
          >
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
              <TableCell>Location</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Serial No.</TableCell>
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
                    <TableCell>{machine.location || '-'}</TableCell>
                    <TableCell>{machine.type}</TableCell>
                    <TableCell>{machine.serial_number || '-'}</TableCell>
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
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
          />
        )}
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button variant="contained" onClick={handleNext}>
          Next
        </Button>
      </Box>
    </Paper>
  );
};

export default AddMachines;