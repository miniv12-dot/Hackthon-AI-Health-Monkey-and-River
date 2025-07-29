import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Fab,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

const Alerts = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch alerts with pagination and filters
  const { data: alertsData, isLoading } = useQuery(
    ['alerts', page + 1, rowsPerPage, filters],
    () => {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });
      return axios.get(`/api/alerts?${params}`).then(res => res.data);
    },
    { keepPreviousData: true }
  );

  // Mutations
  const createAlertMutation = useMutation(
    (data) => axios.post('/api/alerts', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alerts');
        queryClient.invalidateQueries('activeAlerts');
        toast.success('Alert created successfully');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create alert');
      },
    }
  );

  const updateAlertMutation = useMutation(
    ({ id, data }) => axios.put(`/api/alerts/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alerts');
        queryClient.invalidateQueries('activeAlerts');
        toast.success('Alert updated successfully');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update alert');
      },
    }
  );

  const deleteAlertMutation = useMutation(
    (id) => axios.delete(`/api/alerts/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alerts');
        queryClient.invalidateQueries('activeAlerts');
        toast.success('Alert deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete alert');
      },
    }
  );

  const acknowledgeAlertMutation = useMutation(
    (id) => axios.put(`/api/alerts/${id}/acknowledge`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alerts');
        queryClient.invalidateQueries('activeAlerts');
        toast.success('Alert acknowledged');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to acknowledge alert');
      },
    }
  );

  const resolveAlertMutation = useMutation(
    (id) => axios.put(`/api/alerts/${id}/resolve`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alerts');
        queryClient.invalidateQueries('activeAlerts');
        toast.success('Alert resolved');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to resolve alert');
      },
    }
  );

  const handleOpenDialog = (alert = null) => {
    setEditingAlert(alert);
    if (alert) {
      reset({
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        type: alert.type,
      });
    } else {
      reset({
        title: '',
        message: '',
        priority: 'medium',
        type: 'general',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAlert(null);
    reset();
  };

  const onSubmit = (data) => {
    if (editingAlert) {
      updateAlertMutation.mutate({ id: editingAlert.id, data });
    } else {
      createAlertMutation.mutate(data);
    }
  };

  const handleMenuClick = (event, alert) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlert(alert);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlert(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'error';
      case 'acknowledged': return 'warning';
      case 'resolved': return 'success';
      case 'dismissed': return 'default';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Alerts & Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your health alerts and notifications.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Alert
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FilterListIcon color="action" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="dismissed">Dismissed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="health">Health</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="diagnostic">Diagnostic</MenuItem>
                  <MenuItem value="reminder">Reminder</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alertsData?.alerts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Alert severity="info" icon={<NotificationsIcon />}>
                      No alerts found. Create your first alert to get started.
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                alertsData?.alerts?.map((alert) => (
                  <TableRow key={alert.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {alert.title}
                        </Typography>
                        {alert.message && (
                          <Typography variant="body2" color="text.secondary">
                            {alert.message.length > 100
                              ? `${alert.message.substring(0, 100)}...`
                              : alert.message}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.priority}
                        size="small"
                        color={getPriorityColor(alert.priority)}
                        className={`priority-${alert.priority}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status}
                        size="small"
                        color={getStatusColor(alert.status)}
                        className={`status-${alert.status}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, alert)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {alertsData?.pagination && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={alertsData.pagination.totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleOpenDialog(selectedAlert); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {selectedAlert?.status === 'active' && (
          <MenuItem onClick={() => { acknowledgeAlertMutation.mutate(selectedAlert.id); handleMenuClose(); }}>
            <ListItemIcon>
              <CheckIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Acknowledge</ListItemText>
          </MenuItem>
        )}
        {(selectedAlert?.status === 'active' || selectedAlert?.status === 'acknowledged') && (
          <MenuItem onClick={() => { resolveAlertMutation.mutate(selectedAlert.id); handleMenuClose(); }}>
            <ListItemIcon>
              <CheckIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Resolve</ListItemText>
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => { deleteAlertMutation.mutate(selectedAlert.id); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAlert ? 'Edit Alert' : 'Create New Alert'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              error={!!errors.title}
              helperText={errors.title?.message}
              {...register('title', {
                required: 'Title is required',
                maxLength: {
                  value: 255,
                  message: 'Title must not exceed 255 characters',
                },
              })}
            />
            <TextField
              fullWidth
              label="Message"
              margin="normal"
              multiline
              rows={3}
              error={!!errors.message}
              helperText={errors.message?.message}
              {...register('message', {
                maxLength: {
                  value: 1000,
                  message: 'Message must not exceed 1000 characters',
                },
              })}
            />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    label="Priority"
                    {...register('priority')}
                    defaultValue="medium"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    label="Type"
                    {...register('type')}
                    defaultValue="general"
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="health">Health</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                    <MenuItem value="diagnostic">Diagnostic</MenuItem>
                    <MenuItem value="reminder">Reminder</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={createAlertMutation.isLoading || updateAlertMutation.isLoading}
            startIcon={
              (createAlertMutation.isLoading || updateAlertMutation.isLoading) ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            {editingAlert ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add alert"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Alerts;
