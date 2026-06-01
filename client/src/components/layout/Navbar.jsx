import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar, Toolbar, Box, Typography, IconButton, Badge, Menu, MenuItem,
  Avatar, Divider, ListItemIcon, ListItemText, Paper, Chip,
} from '@mui/material';
import {
  Notifications, Logout, Settings, Person, Warning, Info,
  CheckCircle, Error as ErrorIcon, Menu as MenuIcon,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications, markAllRead, markAsRead } from '../../store/slices/notificationSlice';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/helpers';

export default function Navbar({ onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount = 0, items: notifications = [] } = useSelector((s) => s.notifications) || {};
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications({ limit: 15 }))
        .unwrap()
        .catch((err) => console.error('Failed to fetch notifications:', err));
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const dashboardPath = user?.role === 'storeOwner' ? '/store' : user?.role === 'admin' ? '/admin' : '/patient';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const getNotificationIcon = (type, priority) => {
    const iconStyle = { fontSize: 20 };
    const color = priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : priority === 'medium' ? '#0d9488' : '#6b7280';
    
    switch (type) {
      case 'conflictAlert':
        return <Warning sx={{ ...iconStyle, color }} />;
      case 'lowStock':
      case 'outOfStock':
        return <ErrorIcon sx={{ ...iconStyle, color }} />;
      case 'purchaseConfirmation':
        return <CheckCircle sx={{ ...iconStyle, color: '#10b981' }} />;
      case 'healthAlert':
        return <ErrorIcon sx={{ ...iconStyle, color: '#ef4444' }} />;
      default:
        return <Info sx={{ ...iconStyle, color }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#fef2f2';
      case 'high': return '#fffbeb';
      case 'medium': return '#f0fdfa';
      default: return '#f9fafb';
    }
  };

  const getBorderColor = (priority) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#0d9488';
      default: return '#6b7280';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification._id));
    }
    setNotifAnchor(null);
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{
      bgcolor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      color: '#111827',
      zIndex: 1201,
    }}>
      <Toolbar sx={{ maxWidth: 1400, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <IconButton edge="start" onClick={onMenuToggle} sx={{ display: { lg: 'none' }, mr: 1 }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 1.5,
            bgcolor: '#0d9488', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 800 }}>P</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            pharma<span style={{ color: '#0d9488' }}>Assist</span>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={(e) => {
            setNotifAnchor(e.currentTarget);
            if (user) dispatch(fetchNotifications({ limit: 15 }));
          }}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications sx={{ color: '#6b7280' }} />
            </Badge>
          </IconButton>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0d9488', fontSize: 12 }}>
              {initials}
            </Avatar>
          </IconButton>
        </Box>

        <Menu 
          anchorEl={notifAnchor} 
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)} 
          PaperProps={{ sx: { width: 420, maxHeight: 600, overflow: 'hidden' } }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
              Notifications
              {unreadCount > 0 && (
                <Chip label={`${unreadCount} new`} size="small" color="error" sx={{ ml: 1, height: 20, fontSize: 10 }} />
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography 
                variant="caption" 
                sx={{ color: '#0d9488', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => dispatch(fetchNotifications({ limit: 50 }))}
              >
                See All
              </Typography>
              {unreadCount > 0 && (
                <Typography 
                  variant="caption" 
                  sx={{ color: '#0d9488', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => dispatch(markAllRead())}
                >
                  Mark all read
                </Typography>
              )}
            </Box>
          </Box>
          <Divider />
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: '#e5e7eb', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">No notifications yet</Typography>
              <Typography variant="caption" color="text.secondary">We'll notify you when something important happens</Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {notifications.slice(0, 10).map((n) => (
                <Box 
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    borderLeft: `3px solid ${getBorderColor(n.priority)}`,
                    bgcolor: !n.read ? getPriorityColor(n.priority) : 'transparent',
                    '&:hover': { bgcolor: !n.read ? getPriorityColor(n.priority) : '#f9fafb' },
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ mt: 0.5 }}>
                      {getNotificationIcon(n.type, n.priority)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 700, color: '#111827', lineHeight: 1.3 }}>
                          {n.title}
                        </Typography>
                        {!n.read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0d9488', ml: 1, flexShrink: 0, mt: 0.5 }} />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {n.message}
                      </Typography>
                      {n.type === 'conflictAlert' && n.data?.conflicts && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: '#fef2f2', borderRadius: 1, border: '1px solid #fecaca' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#dc2626', display: 'block', mb: 0.5 }}>
                            ⚠️ Drug Conflict Details:
                          </Typography>
                          {n.data.conflicts.slice(0, 3).map((c, i) => (
                            <Typography key={i} variant="caption" sx={{ color: '#991b1b', display: 'block', lineHeight: 1.4 }}>
                              • {c.type}: {c.message}
                            </Typography>
                          ))}
                          {n.data.conflictCount > 3 && (
                            <Typography variant="caption" sx={{ color: '#dc2626', fontStyle: 'italic' }}>
                              ...and {n.data.conflictCount - 3} more
                            </Typography>
                          )}
                        </Box>
                      )}
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5 }}>
                        {formatDateTime(n.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Menu>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)} PaperProps={{ sx: { width: 200 } }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem component={Link} to={dashboardPath} onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          <MenuItem component={Link} to={`${dashboardPath}/settings`} onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}