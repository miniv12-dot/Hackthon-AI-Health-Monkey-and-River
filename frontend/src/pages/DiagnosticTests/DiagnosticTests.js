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
  Menu,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as ScienceIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

const DiagnosticTests = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    testType: '',
    status: '',
    isAbnormal: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [viewingTest, setViewingTest] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm();

  // Fetch diagnostic tests with pagination and filters
  const { data: testsData, isLoading } = useQuery(
    ['diagnosticTests', page + 1, rowsPerPage, filters],
    () => {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });
      return axios.get(`/api/diagnostic-tests?${params}`).then(res => res.data);
    },
    { keepPreviousData: true }
  );

  // Mutations
  const createTestMutation = useMutation(
    (data) => axios.post('/api/diagnostic-tests', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('diagnosticTests');
        queryClient.invalidateQueries('recentTests');
        toast.success('Diagnostic test created successfully');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create test');
      },
    }
  );

  const updateTestMutation = useMutation(
    ({ id, data }) => axios.put(`/api/diagnostic-tests/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('diagnosticTests');
        queryClient.invalidateQueries('recentTests');
        toast.success('Diagnostic test updated successfully');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update test');
      },
    }
  );

  const deleteTestMutation = useMutation(
    (id) => axios.delete(`/api/diagnostic-tests/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('diagnosticTests');
        queryClient.invalidateQueries('recentTests');
        toast.success('Diagnostic test deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete test');
      },
    }
  );

  const handleOpenDialog = (test = null) => {
    setEditingTest(test);
    if (test) {
      reset({
        name: test.name,
        result: test.result,
        date: new Date(test.date),
        testType: test.testType,
        status: test.status,
        normalRange: test.normalRange || '',
        units: test.units || '',
        notes: test.notes || '',
        doctorName: test.doctorName || '',
        labName: test.labName || '',
        isAbnormal: test.isAbnormal,
      });
    } else {
      reset({
        name: '',
        result: '',
        date: new Date(),
        testType: 'general',
        status: 'completed',
        normalRange: '',
        units: '',
        notes: '',
        doctorName: '',
        labName: '',
        isAbnormal: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTest(null);
    reset();
  };

  const handleViewTest = (test) => {
    setViewingTest(test);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setViewingTest(null);
  };

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      date: data.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
    };

    if (editingTest) {
      updateTestMutation.mutate({ id: editingTest.id, data: formattedData });
    } else {
      createTestMutation.mutate(formattedData);
    }
  };

  const handleMenuClick = (event, test) => {
    setAnchorEl(event.currentTarget);
    setSelectedTest(test);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTest(null);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'reviewed': return 'info';
      case 'cancelled': return 'error';
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Diagnostic Tests
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your diagnostic test results and medical records.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Test Result
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
                  <InputLabel>Test Type</InputLabel>
                  <Select
                    value={filters.testType}
                    label="Test Type"
                    onChange={(e) => handleFilterChange('testType', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="blood">Blood</MenuItem>
                    <MenuItem value="urine">Urine</MenuItem>
                    <MenuItem value="imaging">Imaging</MenuItem>
                    <MenuItem value="cardiac">Cardiac</MenuItem>
                    <MenuItem value="neurological">Neurological</MenuItem>
                    <MenuItem value="genetic">Genetic</MenuItem>
                    <MenuItem value="general">General</MenuItem>
                  </Select>
                </FormControl>
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
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="reviewed">Reviewed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Results</InputLabel>
                  <Select
                    value={filters.isAbnormal}
                    label="Results"
                    onChange={(e) => handleFilterChange('isAbnormal', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="false">Normal</MenuItem>
                    <MenuItem value="true">Abnormal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tests Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testsData?.tests?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="info" icon={<ScienceIcon />}>
                        No diagnostic tests found. Add your first test result to get started.
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  testsData?.tests?.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            {test.name}
                          </Typography>
                          {test.doctorName && (
                            <Typography variant="caption" color="text.secondary">
                              Dr. {test.doctorName}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.testType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(test.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.status}
                          size="small"
                          color={getStatusColor(test.status)}
                          className={`status-${test.status}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {test.isAbnormal ? (
                            <Chip
                              label="Abnormal"
                              size="small"
                              color="error"
                            />
                          ) : (
                            <Chip
                              label="Normal"
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, test)}
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
          
          {testsData?.pagination && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={testsData.pagination.totalItems}
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
          <MenuItem onClick={() => { handleViewTest(selectedTest); handleMenuClose(); }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleOpenDialog(selectedTest); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => { deleteTestMutation.mutate(selectedTest.id); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingTest ? 'Edit Diagnostic Test' : 'Add New Test Result'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Test Name"
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    {...register('name', {
                      required: 'Test name is required',
                      maxLength: {
                        value: 255,
                        message: 'Name must not exceed 255 characters',
                      },
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="date"
                    control={control}
                    rules={{ required: 'Date is required' }}
                    render={({ field }) => (
                      <DatePicker
                        label="Test Date"
                        value={field.value}
                        onChange={field.onChange}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            margin="normal"
                            error={!!errors.date}
                            helperText={errors.date?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Test Type</InputLabel>
                    <Select
                      label="Test Type"
                      {...register('testType')}
                      defaultValue="general"
                    >
                      <MenuItem value="blood">Blood</MenuItem>
                      <MenuItem value="urine">Urine</MenuItem>
                      <MenuItem value="imaging">Imaging</MenuItem>
                      <MenuItem value="cardiac">Cardiac</MenuItem>
                      <MenuItem value="neurological">Neurological</MenuItem>
                      <MenuItem value="genetic">Genetic</MenuItem>
                      <MenuItem value="general">General</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      {...register('status')}
                      defaultValue="completed"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="reviewed">Reviewed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Test Result"
                    margin="normal"
                    multiline
                    rows={3}
                    error={!!errors.result}
                    helperText={errors.result?.message}
                    {...register('result', {
                      required: 'Test result is required',
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Normal Range"
                    margin="normal"
                    {...register('normalRange')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Units"
                    margin="normal"
                    {...register('units')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Doctor Name"
                    margin="normal"
                    {...register('doctorName')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Lab Name"
                    margin="normal"
                    {...register('labName')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    margin="normal"
                    multiline
                    rows={2}
                    {...register('notes')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="isAbnormal"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Mark as abnormal result"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              disabled={createTestMutation.isLoading || updateTestMutation.isLoading}
              startIcon={
                (createTestMutation.isLoading || updateTestMutation.isLoading) ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {editingTest ? 'Update' : 'Add Test'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Test Dialog */}
        <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Test Details: {viewingTest?.name}
          </DialogTitle>
          <DialogContent>
            {viewingTest && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Test Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {viewingTest.testType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(viewingTest.date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={viewingTest.status}
                    size="small"
                    color={getStatusColor(viewingTest.status)}
                    className={`status-${viewingTest.status}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Result Type
                  </Typography>
                  <Chip
                    label={viewingTest.isAbnormal ? 'Abnormal' : 'Normal'}
                    size="small"
                    color={viewingTest.isAbnormal ? 'error' : 'success'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Result
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {viewingTest.result}
                  </Typography>
                </Grid>
                {viewingTest.normalRange && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Normal Range
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingTest.normalRange}
                    </Typography>
                  </Grid>
                )}
                {viewingTest.units && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Units
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingTest.units}
                    </Typography>
                  </Grid>
                )}
                {viewingTest.doctorName && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Doctor
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Dr. {viewingTest.doctorName}
                    </Typography>
                  </Grid>
                )}
                {viewingTest.labName && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Laboratory
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingTest.labName}
                    </Typography>
                  </Grid>
                )}
                {viewingTest.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingTest.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>Close</Button>
            <Button
              onClick={() => {
                handleCloseViewDialog();
                handleOpenDialog(viewingTest);
              }}
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for mobile */}
        <Fab
          color="primary"
          aria-label="add test"
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
    </LocalizationProvider>
  );
};

export default DiagnosticTests;
