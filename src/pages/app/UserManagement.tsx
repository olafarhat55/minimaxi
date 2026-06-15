import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Skeleton,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as DeactivateIcon,
  PersonAdd as InviteIcon,
  CheckCircle as ActivateIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { api, getCompanyId } from '../../services/api';
import { StatusBadge, EmptyState, ConfirmDialog } from '../../components/common';
import { useThemeMode } from '../../context/ThemeContext';
import type { User } from '../../types';
import { useRef } from 'react';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';


// Roles must match backend UserRole enum exactly (case-sensitive)
const roles = [
  { value: 'ENGINEER',   label: 'Engineer' },
  { value: 'TECHNICIAN', label: 'Technician' },
];

// What the backend may return → display label mapping
const roleLabels: Record<string, string> = {
  ENGINEER:     'Engineer',
  TECHNICIAN:   'Technician',
  SYSTEM_ADMIN: 'Company Admin',
  system_admin: 'Company Admin',
  engineer:     'Engineer',
  technician:   'Technician',
};

const normalizeUser = (raw: any): User => ({
  id:          raw.id,
  name:        raw.name,
  email:       raw.email,
  role:        raw.role,
  avatar:      raw.avatar ?? null,
  first_login: raw.first_login ?? raw.firstLogin ?? false,
  company_id:  raw.company_id ?? raw.companyId ?? raw.organizationId,
  created_at:  raw.created_at ?? raw.createdAt ?? '',
  status:      raw.status ?? 'active',
});

const resortUsers = (users: User[]): User[] => [
  ...users.filter((u) => u.status !== 'disabled' && u.status !== 'DISABLED'),
  ...users.filter((u) => u.status === 'disabled' || u.status === 'DISABLED'),
];

const UserManagement = () => {
  const { isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name:  '',
    phone: '',
    role:  'TECHNICIAN',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'TECHNICIAN' });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false, message: '', severity: 'success',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ── 1. GET /api/users ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await api.getUsers();
        const list = Array.isArray(data) ? data : [];
        const normalized = list.map(normalizeUser);
        const sorted = [
          ...normalized.filter((u) => u.status !== 'disabled' && u.status !== 'DISABLED'),
          ...normalized.filter((u) => u.status === 'disabled' || u.status === 'DISABLED'),
        ];
        setUsers(sorted);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ── Open Edit dialog ───────────────────────────────────────────────────────
  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    const roleUpper = user.role?.toUpperCase() ?? 'TECHNICIAN';
    const safeRole = roles.some((r) => r.value === roleUpper) ? roleUpper : 'TECHNICIAN';
    setFormData({
      name:  user.name,
      phone: (user as any).phone ?? '',
      role:  safeRole,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditUser(null);
    setFormData({ name: '', phone: '', role: 'TECHNICIAN' });
    setFormErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── 4. PUT /api/users/{id} ─────────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!validateForm() || !editUser) return;

    const body = {
      name:   formData.name,
      phone:  formData.phone,
      role:   formData.role,
      status: editUser.status,
    };

    try {
      const raw = await api.updateUser(editUser.id, body);
      const updated: User =
        raw && raw.id
          ? normalizeUser(raw)
          : { ...editUser, ...body, role: body.role as any };

      setUsers((prev) =>
        resortUsers(prev.map((u) => (u.id === editUser.id ? updated : u)))
      );
      handleCloseDialog();
      showSnackbar('User updated successfully.');
    } catch (error) {
      console.error('Failed to update user:', error);
      showSnackbar('Failed to update user.', 'error');
    }
  };

  // ── 7. DELETE /api/users/{id} ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete);
      setUsers((prev) =>
        resortUsers(prev.map((u) =>
          u.id === userToDelete ? { ...u, status: 'disabled' } : u
        ))
      );
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // ── Toggle Status — active ↔ inactive ────────────────────────────────────
  const handleToggleStatus = async (userId: number) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const status = target.status?.toLowerCase();

    if (status === 'invited') {
      showSnackbar('Cannot change status of an invited user before they activate their account.', 'warning');
      return;
    }

    const newStatus = status === 'active' ? 'inactive' : 'active';

    const body = {
      name:   target.name,
      phone:  (target as any).phone ?? '',
      role:   target.role,
      status: newStatus,
    };

    try {
      const raw = await api.updateUser(userId, body);
      const updated: User =
        raw && raw.id
          ? normalizeUser(raw)
          : { ...target, status: newStatus };

      setUsers((prev) =>
        resortUsers(prev.map((u) => (u.id === userId ? updated : u)))
      );
      showSnackbar(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      showSnackbar(error?.message || 'Failed to update user status.', 'error');
    }
  };

  // ── 5. POST /api/users/invite ─────────────────────────────────────────────
  const validateInvite = () => {
    const errors: Record<string, string> = {};
    if (!inviteData.name.trim())  errors.name  = 'Name is required';
    if (!inviteData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteData.email))
      errors.email = 'Invalid email format';
    setInviteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInviteSubmit = async () => {
    if (!validateInvite()) return;
    try {
      await api.inviteUser({
        name:           inviteData.name,
        email:          inviteData.email,
        role:           inviteData.role,
        organizationId: getCompanyId(),
      });
      setInviteDialogOpen(false);
      setInviteData({ name: '', email: '', role: 'TECHNICIAN' });
      showSnackbar('Invitation sent successfully.');
    } catch (error) {
      console.error('Failed to invite user:', error);
      showSnackbar('Failed to send invitation.', 'error');
    }
  };

  // ── CSV Import ────────────────────────────────────────────────────────────
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validRoles = ['ENGINEER', 'TECHNICIAN'];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length === 0) {
        showSnackbar('CSV file is empty.', 'error');
        return;
      }
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('name') && firstLine.includes('email') ? 1 : 0;
      const dataLines = lines.slice(startIndex);
      if (dataLines.length === 0) {
        showSnackbar('CSV file has no data rows.', 'error');
        return;
      }
      const errors: string[] = [];
      const validUsers: { name: string; email: string; role: string }[] = [];
      const existingEmails = new Set(users.map((u) => u.email));
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
        if (!name) { errors.push(`Row ${rowNum}: name is required.`); return; }
        if (!email) { errors.push(`Row ${rowNum}: email is required.`); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Row ${rowNum}: invalid email "${email}".`); return;
        }
        if (existingEmails.has(email)) {
          errors.push(`Row ${rowNum}: email "${email}" already exists.`); return;
        }
        existingEmails.add(email);
        validUsers.push({ name, email, role });
      });
      if (errors.length > 0) {
        showSnackbar(
          `${errors.length} error(s): ${errors.slice(0, 3).join(' ')}${errors.length > 3 ? ` ...and ${errors.length - 3} more.` : ''}`,
          'error'
        );
        return;
      }
      const invited: any[] = [];
      const failedRows: string[] = [];
      for (const user of validUsers) {
        try {
          await api.inviteUser({
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: getCompanyId(),
          });
          invited.push(user.email);
        } catch {
          failedRows.push(user.email);
        }
      }
      const data = await api.getUsers();
      const list = Array.isArray(data) ? data : [];
      setUsers(resortUsers(list.map(normalizeUser)));
      if (failedRows.length > 0) {
        showSnackbar(
          `Invited ${invited.length} user(s). Failed: ${failedRows.join(', ')}`,
          invited.length > 0 ? 'success' : 'error'
        );
      } else {
        showSnackbar(`Successfully invited ${invited.length} user(s).`, 'success');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleCsvImport}
        />
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Import CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<InviteIcon />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite User
        </Button>
      </Box>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Invite users to get started."
          actionLabel="Invite User"
          onAction={() => setInviteDialogOpen(true)}
        />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
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
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const status = user.status?.toLowerCase();
                const isInvited  = status === 'invited';
                const isDisabled = status === 'disabled';
                const isActive   = status === 'active';

                return (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.avatar ?? undefined} sx={{ bgcolor: '#2E75B6' }}>
                          {!user.avatar && user.name?.charAt(0)}
                        </Avatar>
                        <Typography fontWeight={500}>{user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={roleLabels[user.role] ?? user.role} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status ?? 'active'}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor:
                            status === 'active'   ? '#22c55e' :
                            status === 'inactive' ? '#3b82f6' :
                            status === 'disabled' ? '#ef4444' :
                            status === 'invited'  ? '#eab308' :
                            '#9ca3af',
                          color:
                            status === 'active'   ? '#22c55e' :
                            status === 'inactive' ? '#3b82f6' :
                            status === 'disabled' ? '#ef4444' :
                            status === 'invited'  ? '#eab308' :
                            '#9ca3af',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {user.created_at && format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" title="Edit" onClick={() => handleOpenEdit(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        title={
                          isInvited  ? 'Cannot change — user not activated yet' :
                          isDisabled ? 'User is deleted' :
                          isActive   ? 'Deactivate' :
                          'Activate'
                        }
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={isDisabled}
                        sx={{
                          color:
                            isInvited  ? '#eab308' :
                            isActive   ? '#ef4444' :
                            '#22c55e',
                        }}
                      >
                        {isActive
                          ? <DeactivateIcon fontSize="small" />
                          : <ActivateIcon fontSize="small" />
                        }
                      </IconButton>

                      <IconButton
                        size="small"
                        title="Delete"
                        onClick={() => {
                          setUserToDelete(user.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Roles Overview ── */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Roles & Permissions</Typography>
            <Typography variant="caption" color="text.secondary">Overview of access levels in your organization</Typography>
          </Box>
          <Chip label={`${users.length} total users`} size="small" variant="outlined" />
        </Box>

        <Grid container spacing={2}>
          {[
            {
              role: 'Company Admin',
              key: 'Company Admin',
              color: '#2E75B6',
              gradient: isDark ? 'linear-gradient(135deg, #0d1f3d 0%, #1a3a6b 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              icon: '🛡️',
              permissions: [
                { label: 'Full access to all modules', icon: '✦' },
                { label: 'Manage users & invitations', icon: '✦' },
                { label: 'View all reports & analytics', icon: '✦' },
                { label: 'Configure company settings', icon: '✦' },
              ],
            },
            {
              role: 'Engineer',
              key: 'Engineer',
              color: '#16a34a',
              gradient: isDark ? 'linear-gradient(135deg, #0d2818 0%, #1a4d2e 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              icon: '⚙️',
              permissions: [
                { label: 'View & manage assets', icon: '✦' },
                { label: 'Create & assign work orders', icon: '✦' },
                { label: 'Access dashboard & reports', icon: '✦' },
                { label: 'Monitor sensor data', icon: '✦' },
              ],
            },
            {
              role: 'Technician',
              key: 'Technician',
              color: '#9333ea',
              gradient: isDark ? 'linear-gradient(135deg, #1f0d2d 0%, #3b1a5a 100%)' : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
              icon: '🔧',
              permissions: [
                { label: 'View assigned work orders only', icon: '✦' },
                { label: 'Update work order status', icon: '✦' },
                { label: 'Access assigned asset details', icon: '✦' },
                { label: 'Add notes to work orders', icon: '✦' },
              ],
            },
          ].map((item) => {
            const count = users.filter((u) => (roleLabels[u.role] ?? u.role) === item.key).length;
            return (
              <Grid size={{ xs: 12, md: 4 }} key={item.role}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    overflow: 'hidden',
                    border: `1px solid ${item.color}25`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${item.color}20`,
                    },
                  }}
                >
                  {/* Card Header */}
                  <Box
                    sx={{
                      background: item.gradient,
                      px: 2.5, pt: 2.5, pb: 2,
                      borderBottom: `1px solid ${item.color}20`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: 2,
                            bgcolor: item.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                            boxShadow: `0 4px 12px ${item.color}40`,
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography fontWeight={700} fontSize="0.95rem" color={item.color}>
                            {item.role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {count} {count === 1 ? 'user' : 'users'} assigned
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          bgcolor: `${item.color}15`,
                          border: `2px solid ${item.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Typography fontSize={13} fontWeight={700} color={item.color}>{count}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Permissions List */}
                  <Box sx={{ px: 2.5, py: 2, bgcolor: isDark ? '#0f172a' : '#fff' }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Permissions
                    </Typography>
                    <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {item.permissions.map((perm) => (
                        <Box key={perm.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Box
                            sx={{
                              width: 20, height: 20, borderRadius: 1,
                              bgcolor: `${item.color}15`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: item.color }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                            {perm.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* ── Edit Dialog ── */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {/* @ts-expect-error MUI v7 Grid item prop */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Name" name="name"
                value={formData.name} onChange={handleChange}
                error={!!formErrors.name} helperText={formErrors.name} required
              />
            </Grid>
            {/* @ts-expect-error MUI v7 Grid item prop */}
            <Grid item xs={12}>
              <TextField
                fullWidth select label="Role" name="role"
                value={formData.role} onChange={handleChange}
              >
                {roles.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* ── Invite Dialog ── */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite User</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {/* @ts-expect-error MUI v7 Grid item prop */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Name"
                value={inviteData.name}
                onChange={(e) => setInviteData((p) => ({ ...p, name: e.target.value }))}
                error={!!inviteErrors.name} helperText={inviteErrors.name} required
              />
            </Grid>
            {/* @ts-expect-error MUI v7 Grid item prop */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Email" type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData((p) => ({ ...p, email: e.target.value }))}
                error={!!inviteErrors.email} helperText={inviteErrors.email} required
              />
            </Grid>
            {/* @ts-expect-error MUI v7 Grid item prop */}
            <Grid item xs={12}>
              <TextField
                fullWidth select label="Role"
                value={inviteData.role}
                onChange={(e) => setInviteData((p) => ({ ...p, role: e.target.value }))}
              >
                {roles.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInviteSubmit}>Send Invite</Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
      />

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;