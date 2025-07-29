import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Avatar,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Preferences form
  const {
    register: registerPreferences,
    handleSubmit: handlePreferencesSubmit,
    watch: watchPreferences,
    setValue: setPreferenceValue,
  } = useForm({
    defaultValues: {
      notificationThreshold: user?.preferences?.notificationThreshold || 'medium',
      emailNotifications: user?.preferences?.emailNotifications || true,
      theme: user?.preferences?.theme || 'light',
      language: user?.preferences?.language || 'en',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm();

  // Mutations
  const updateProfileMutation = useMutation(
    (data) => axios.put('/api/users/profile', data),
    {
      onSuccess: (response) => {
        updateUser(response.data.user);
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries('userStats');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  const updatePreferencesMutation = useMutation(
    (data) => axios.put('/api/users/preferences', data),
    {
      onSuccess: (response) => {
        updateUser({ preferences: response.data.preferences });
        toast.success('Preferences updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update preferences');
      },
    }
  );

  const changePasswordMutation = useMutation(
    (data) => axios.put('/api/users/password', data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        resetPassword();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      },
    }
  );

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onPreferencesSubmit = (data) => {
    updatePreferencesMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile & Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Manage your account information and preferences.
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Summary Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Member since {user?.createdAt ? 
                  new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Tabs */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="profile tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<PersonIcon />} label="Profile" />
              <Tab icon={<SettingsIcon />} label="Preferences" />
              <Tab icon={<LockIcon />} label="Security" />
            </Tabs>

            {/* Profile Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      error={!!profileErrors.name}
                      helperText={profileErrors.name?.message}
                      {...registerProfile('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!profileErrors.email}
                      helperText={profileErrors.email?.message}
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        updateProfileMutation.isLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      disabled={updateProfileMutation.isLoading}
                    >
                      {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Preferences Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box component="form" onSubmit={handlePreferencesSubmit(onPreferencesSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Notification Threshold</InputLabel>
                      <Select
                        label="Notification Threshold"
                        {...registerPreferences('notificationThreshold')}
                        value={watchPreferences('notificationThreshold')}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        label="Theme"
                        {...registerPreferences('theme')}
                        value={watchPreferences('theme')}
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        label="Language"
                        {...registerPreferences('language')}
                        value={watchPreferences('language')}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={watchPreferences('emailNotifications')}
                          onChange={(e) => setPreferenceValue('emailNotifications', e.target.checked)}
                        />
                      }
                      label="Email Notifications"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Receive email notifications for important alerts and updates
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        updatePreferencesMutation.isLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      disabled={updatePreferencesMutation.isLoading}
                    >
                      {updatePreferencesMutation.isLoading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={activeTab} index={2}>
              <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      For your security, please enter your current password to make changes.
                    </Alert>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type="password"
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword?.message}
                      {...registerPassword('currentPassword', {
                        required: 'Current password is required',
                      })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword?.message}
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword?.message}
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your new password',
                        validate: (value, { newPassword }) =>
                          value === newPassword || 'Passwords do not match',
                      })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="error"
                      startIcon={
                        changePasswordMutation.isLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <LockIcon />
                        )
                      }
                      disabled={changePasswordMutation.isLoading}
                    >
                      {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
