import React, { useState } from 'react';
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
  Alert,
  Chip,
  TablePagination,
  Snackbar,
  Link,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';

const roles = [
  { value: 'engineer', label: 'Engineer' },
  { value: 'technician', label: 'Technician' },
];

interface AddUsersProps {
  users: any[];
  onUpdate: (data: any[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddUsers = ({ users, onUpdate, onNext, onBack }: AddUsersProps) => {
  const { isDark } = useThemeMode();
  const [userList, setUserList] = useState(users || []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'engineer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastInvitedUser, setLastInvitedUser] = useState(null);
  const [showCopySnackbar, setShowCopySnackbar] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (userList.some((u) => u.email === formData.email)) {
      setError('This email is already invited');
      return false;
    }
    return true;
  };

  const handleInviteUser = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    try {
      const newUser = await api.inviteUser(formData);
      const userWithStatus = { ...newUser, status: 'invited' };
      setUserList([...userList, userWithStatus]);
      setLastInvitedUser({
        ...userWithStatus,
        activationLink: `/activate?token=demo-${formData.role}-token`,
      });
      setFormData({ name: '', email: '', role: 'engineer' });
      setSuccess(`Invitation sent to ${newUser.email}`);
    } catch (err) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (index: number) => {
    const updated = userList.filter((_, i) => i !== index);
    setUserList(updated);
  };

  const handleNext = () => {
    onUpdate(userList);
    onNext();
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(window.location.origin + link);
    setShowCopySnackbar(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'engineer':
        return { bgcolor: '#e3f2fd', color: '#1976d2' };
      case 'technician':
        return { bgcolor: '#f3e5f5', color: '#7b1fa2' };
      default:
        return { bgcolor: '#f5f5f5', color: '#757575' };
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Add Users to Your Organization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Invite engineers and technicians to start using the platform.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && lastInvitedUser && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => {
            setSuccess('');
            setLastInvitedUser(null);
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {success}
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              bgcolor: '#f5f5f5',
              borderRadius: 1,
              fontSize: '0.85rem',
            }}
          >
            <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
              Demo Mode: Activation link for {lastInvitedUser.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Link
                href={lastInvitedUser.activationLink}
                target="_blank"
                sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              >
                {lastInvitedUser.activationLink}
              </Link>
              <IconButton
                size="small"
                onClick={() => handleCopyLink(lastInvitedUser.activationLink)}
                title="Copy link"
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {lastInvitedUser.role === 'engineer'
                ? 'Engineers are redirected to /login after activation, then to /dashboard'
                : 'Technicians are redirected to /login after activation, then to /my-work-orders'}
            </Typography>
          </Box>
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Side - Form */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Invite User
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                size="small"
                required
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                size="small"
                required
              />

              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                size="small"
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Status"
                value="Invited"
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: '#f5f5f5' }}
              />

              <Button
                fullWidth
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleInviteUser}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                + Add User
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Table */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={7}>
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
                              label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              size="small"
                              sx={getRoleColor(user.role)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Invited"
                              size="small"
                              sx={{ bgcolor: '#fff3e0', color: '#ff9800' }}
                            />
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
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[10]}
                />
              )}
            </TableContainer>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: '#fafafa',
              }}
            >
              <Typography color="text.secondary">
                No users invited yet. Use the form to invite team members.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button variant="contained" onClick={handleNext}>
          Next
        </Button>
      </Box>

      <Snackbar
        open={showCopySnackbar}
        autoHideDuration={2000}
        onClose={() => setShowCopySnackbar(false)}
        message="Activation link copied to clipboard!"
      />
    </Paper>
  );
};

export default AddUsers;
