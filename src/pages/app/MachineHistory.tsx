import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Skeleton, IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';

const MachineHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const [activeTab, setActiveTab] = useState(0);
  const [issues, setIssues] = useState<any[]>([]);
  const [machineWorkOrders, setMachineWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [machineName, setMachineName] = useState('');

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const data = await api.getMachineById(id);
        setMachineName(data.name ?? '');
      } catch {}
    };
    fetchMachine();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 0) {
          // Past Failures uses /api/machines/{id}/notes
          const data = await api.getMachineNotes(id);
          setIssues(Array.isArray(data) ? data : []);
        }
        if (activeTab === 1) {
          const data = await api.getMachineWorkOrders(id);
          setMachineWorkOrders(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [activeTab, id]);

  const tableHeadSx = {
    bgcolor: isDark ? '#283444' : '#f5f5f5',
    '& th': {
      color: isDark ? '#e5e5e5' : 'inherit',
      fontWeight: 600,
      fontSize: '0.875rem',
      borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
    },
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(`/machines/${id}`)}>
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={600}>Asset History</Typography>
          {machineName && (
            <Typography variant="body2" color="text.secondary">{machineName}</Typography>
          )}
        </Box>
      </Box>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Maintenance Records" />
            <Tab label="Work Orders" />
          </Tabs>

          {loading && <Skeleton variant="rounded" height={200} />}

          {/* Past Failures - from /api/machines/{id}/notes */}
          {!loading && activeTab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={tableHeadSx}>
                    <TableCell>Date</TableCell>
                    <TableCell>Work Order</TableCell>
                    <TableCell>Action Taken</TableCell>
                    <TableCell>Root Cause</TableCell>
                    <TableCell>Additional Notes</TableCell>
                    <TableCell>Time Spent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No maintenance records found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    issues.map((issue: any, i: number) => (
                      <TableRow key={issue.id ?? i} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {issue.completed_at
                            ? new Date(issue.completed_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {issue.work_order_title ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {issue.action_taken ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {issue.root_cause ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {issue.additional_notes ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {issue.time_spent_minutes != null
                            ? `${issue.time_spent_minutes} min`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Work Orders */}
          {!loading && activeTab === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={tableHeadSx}>
                    <TableCell>WO Number</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {machineWorkOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No work orders for this asset</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    machineWorkOrders.map((wo: any, i: number) => (
                      <TableRow
                        key={wo.id ?? i}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/work-orders/${wo.id}`)}
                      >
                        <TableCell>{wo.wo_number ?? wo.id}</TableCell>
                        <TableCell>{wo.title ?? '—'}</TableCell>
                        <TableCell>
                          <Chip label={wo.status} size="small" sx={{ textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell>
                          {wo.created_at
                            ? new Date(wo.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                              })
                            : wo.date ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MachineHistory;