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
  Alert,
  Chip,
  TablePagination,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';

import { useThemeMode } from '../../context/ThemeContext';
import { api, getCompanyId } from '../../services/api';

const roles = [
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'TECHNICIAN', label: 'Technician' },
];

const validRoles = roles.map((r) => r.value);

interface AddUsersProps {
  users: any[];
  onUpdate: (data: any[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// View states: 'initial' | 'form' | 'table'
const AddUsers = ({ users, onUpdate, onNext, onBack }: AddUsersProps) => {
  const { isDark } = useThemeMode();
  const [userList, setUserList] = useState(users || []);
  const [viewState, setViewState] = useState(userList.length > 0 ? 'table' : 'initial');
  const [formData, setFormData] = useState({ name: '', email: '', role: 'ENGINEER' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email';
    if (userList.some((u) => u.email === formData.email)) return 'This email is already invited';
    return null;
  };

  const handleInviteUser = async () => {
    const err = validateForm();
    if (err) { showSnackbar(err, 'error'); return; }

    setLoading(true);
    try {
      const newUser = await api.inviteUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        organizationId: getCompanyId(),
      });
      const userWithStatus = { ...newUser, status: 'invited' };
      const updated = [...userList, userWithStatus];
      setUserList(updated);
      onUpdate(updated);
      setFormData({ name: '', email: '', role: 'ENGINEER' });
      setViewState('table');
      showSnackbar(`Invitation sent to ${newUser.email}`, 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to invite user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (index: number) => {
    const updated = userList.filter((_, i) => i !== index);
    setUserList(updated);
    if (updated.length === 0) setViewState('initial');
  };

  const handleNext = () => {
    onUpdate(userList);
    onNext();
  };

  // ── CSV Import ──────────────────────────────────────────────────────────────
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

      // Skip header row if present
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('name') && firstLine.includes('email') ? 1 : 0;
      const dataLines = lines.slice(startIndex);

      if (dataLines.length === 0) {
        showSnackbar('CSV file has no data rows.', 'error');
        return;
      }

      const errors: string[] = [];
      const validUsers: { name: string; email: string; role: string }[] = [];
      const existingEmails = new Set(userList.map((u) => u.email));

      dataLines.forEach((line, i) => {
        const rowNum = i + startIndex + 1;
        const cols = line.split(',').map((col) => col.trim());

        if (cols.length < 2) {
          errors.push(`Row ${rowNum}: needs at least name and email.`);
          return;
        }

        const name = cols[0];
        const email = cols[1];
        const rawRole = (cols[2] || 'ENGINEER').toUpperCase();
        const role = validRoles.includes(rawRole) ? rawRole : 'ENGINEER';

        if (!name) {
          errors.push(`Row ${rowNum}: name is required.`);
          return;
        }
        if (!email) {
          errors.push(`Row ${rowNum}: email is required.`);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Row ${rowNum}: invalid email "${email}".`);
          return;
        }
        if (existingEmails.has(email)) {
          errors.push(`Row ${rowNum}: email "${email}" already invited.`);
          return;
        }

        existingEmails.add(email); // prevent duplicates within the CSV itself
        validUsers.push({ name, email, role });
      });

      if (errors.length > 0) {
        showSnackbar(
          `${errors.length} error(s): ${errors.slice(0, 3).join(' ')}${errors.length > 3 ? ` ...and ${errors.length - 3} more.` : ''}`,
          'error'
        );
        return;
      }

      // Send each user to API
      setLoading(true);
      const invited: any[] = [];
      const failedRows: string[] = [];

      for (const user of validUsers) {
        try {
          const result = await api.inviteUser({
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: getCompanyId(),
          });
          invited.push({ ...result, status: 'invited' });
        } catch {
          failedRows.push(user.email);
        }
      }

      const updated = [...userList, ...invited];
      setUserList(updated);
      onUpdate(updated);
      setViewState('table');
      setLoading(false);

      if (failedRows.length > 0) {
        showSnackbar(
          `Invited ${invited.length} user(s). Failed: ${failedRows.join(', ')}`,
          invited.length > 0 ? 'success' : 'error'
        );
      } else {
        showSnackbar(`Successfully invited ${invited.length} user${invited.length !== 1 ? 's' : ''}.`, 'success');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ENGINEER':   return { bgcolor: '#e3f2fd', color: '#1976d2' };
      case 'TECHNICIAN': return { bgcolor: '#f3e5f5', color: '#7b1fa2' };
      default:           return { bgcolor: '#f5f5f5', color: '#757575' };
    }
  };

  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Shared elements
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
          Add Users to Your Organization
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Invite engineers and technicians to start using the platform.
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
              <GroupIcon sx={{ fontSize: 40, color: '#2E75B6' }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Invite Users
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add users manually or import from a CSV file
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setViewState('form')}
              >
                Add User
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

        {/* CSV format hint */}
        <Alert severity="info" sx={{ mb: 3 }}>
          CSV format: <strong>name, email, role</strong> — role is optional (defaults to ENGINEER). Valid roles: ENGINEER, TECHNICIAN.
        </Alert>

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
          Add Users to Your Organization
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Invite engineers and technicians to start using the platform.
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Left - Form */}
          <Box sx={{ width: '340px', flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Invite User
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth label="Name *" name="name"
                  value={formData.name} onChange={handleChange}
                  size="small"
                />
                <TextField
                  fullWidth label="Email *" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  size="small"
                />
                <TextField
                  fullWidth select label="Role" name="role"
                  value={formData.role} onChange={handleChange} size="small"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                  ))}
                </TextField>
                <Button
                  fullWidth variant="contained" startIcon={<PersonAddIcon />}
                  onClick={handleInviteUser} disabled={loading} sx={{ mt: 1 }}
                >
                  {loading ? 'Inviting...' : '+ Add User'}
                </Button>
                <Button
                  fullWidth variant="outlined" startIcon={<UploadFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import CSV
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Right - Table */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Invited Users ({userList.length})
            </Typography>

            {userList.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
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
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userList
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user, index) => {
                        const actualIndex = page * rowsPerPage + index;
                        return (
                          <TableRow key={actualIndex}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.role?.charAt(0).toUpperCase() + user.role?.slice(1).toLowerCase()}
                                size="small"
                                sx={getRoleColor(user.role)}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label="Invited" size="small" sx={{ bgcolor: '#fff3e0', color: '#ff9800' }} />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleDeleteUser(actualIndex)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
                {userList.length > rowsPerPage && (
                  <TablePagination
                    component="div" count={userList.length} page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage} rowsPerPageOptions={[10]}
                  />
                )}
              </TableContainer>
            ) : (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa' }}>
                <Typography color="text.secondary">
                  No users invited yet. Use the form to invite team members.
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={onBack} variant="outlined">Back</Button>
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
            Users Table
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userList.length} user{userList.length !== 1 ? 's' : ''} invited
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
            startIcon={<PersonAddIcon />}
            onClick={() => setViewState('form')}
          >
            Add User
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userList
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user, index) => {
                const actualIndex = page * rowsPerPage + index;
                return (
                  <TableRow key={actualIndex}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role?.charAt(0).toUpperCase() + user.role?.slice(1).toLowerCase()}
                        size="small"
                        sx={getRoleColor(user.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="Invited" size="small" sx={{ bgcolor: '#fff3e0', color: '#ff9800' }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleDeleteUser(actualIndex)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        {userList.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={userList.length}
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

export default AddUsers;