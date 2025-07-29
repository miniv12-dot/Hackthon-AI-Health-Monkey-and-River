import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Paper,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery(
    'userStats',
    () => axios.get('/api/users/stats').then(res => res.data.stats),
    { refetchInterval: 30000 }
  );

  const { data: activeAlerts, isLoading: alertsLoading } = useQuery(
    'activeAlerts',
    () => axios.get('/api/alerts/active').then(res => res.data.alerts),
    { refetchInterval: 30000 }
  );

  const { data: recentTests, isLoading: testsLoading } = useQuery(
    'recentTests',
    () => axios.get('/api/diagnostic-tests/recent?days=7').then(res => res.data.tests),
    { refetchInterval: 30000 }
  );

  const { data: alertStats } = useQuery(
    'alertStats',
    () => axios.get('/api/alerts/stats/summary').then(res => res.data.summary)
  );

  const { data: testStats } = useQuery(
    'testStats',
    () => axios.get('/api/diagnostic-tests/stats/summary').then(res => res.data.summary)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your health data and recent activity.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover-card">
            <CardContent className="stat-card">
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <NotificationsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
              <Typography className="stat-number">
                {alertStats?.total || 0}
              </Typography>
              <Typography className="stat-label">
                Total Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {alertStats?.byStatus?.active || 0} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover-card">
            <CardContent className="stat-card">
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <ScienceIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
              <Typography className="stat-number">
                {testStats?.total || 0}
              </Typography>
              <Typography className="stat-label">
                Diagnostic Tests
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {testStats?.recent || 0} this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover-card">
            <CardContent className="stat-card">
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
              <Typography className="stat-number">
                {testStats?.abnormal || 0}
              </Typography>
              <Typography className="stat-label">
                Abnormal Results
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Require attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="hover-card">
            <CardContent className="stat-card">
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
              <Typography className="stat-number">
                {stats?.memberSince ? 
                  Math.floor((new Date() - new Date(stats.memberSince)) / (1000 * 60 * 60 * 24)) 
                  : 0}
              </Typography>
              <Typography className="stat-label">
                Days Active
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Member since {stats?.memberSince ? 
                  new Date(stats.memberSince).toLocaleDateString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Active Alerts
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/alerts')}
                  color="primary"
                >
                  View All
                </Button>
              </Box>

              {alertsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : activeAlerts?.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  No active alerts. You're all caught up!
                </Alert>
              ) : (
                <List>
                  {activeAlerts?.slice(0, 5).map((alert) => (
                    <ListItem key={alert.id} divider>
                      <ListItemIcon>
                        <NotificationsIcon color={getPriorityColor(alert.priority)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {alert.message}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip
                                label={alert.priority}
                                size="small"
                                color={getPriorityColor(alert.priority)}
                                className={`priority-${alert.priority}`}
                              />
                              <Chip
                                label={alert.status}
                                size="small"
                                color={getStatusColor(alert.status)}
                                className={`status-${alert.status}`}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Tests (7 days)
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/diagnostic-tests')}
                  color="primary"
                >
                  View All
                </Button>
              </Box>

              {testsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : recentTests?.length === 0 ? (
                <Alert severity="info" icon={<ScheduleIcon />}>
                  No recent tests. Schedule your next check-up!
                </Alert>
              ) : (
                <List>
                  {recentTests?.slice(0, 5).map((test) => (
                    <ListItem key={test.id} divider>
                      <ListItemIcon>
                        <ScienceIcon 
                          color={test.isAbnormal ? 'error' : 'success'} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={test.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {test.result}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip
                                label={test.testType}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={test.status}
                                size="small"
                                color={test.status === 'completed' ? 'success' : 'warning'}
                                className={`status-${test.status}`}
                              />
                              {test.isAbnormal && (
                                <Chip
                                  label="Abnormal"
                                  size="small"
                                  color="error"
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(test.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ScienceIcon />}
              onClick={() => navigate('/diagnostic-tests')}
              sx={{ py: 1.5 }}
            >
              Add Test Result
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<NotificationsIcon />}
              onClick={() => navigate('/alerts')}
              sx={{ py: 1.5 }}
            >
              View Alerts
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrendingUpIcon />}
              onClick={() => navigate('/profile')}
              sx={{ py: 1.5 }}
            >
              Update Profile
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => window.open('/api/health', '_blank')}
              sx={{ py: 1.5 }}
            >
              System Health
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
