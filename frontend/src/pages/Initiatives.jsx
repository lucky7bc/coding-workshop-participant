import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useResponsive';

const STATUS_COLOR = {
  not_started: 'default',
  in_progress: 'info',
  at_risk: 'warning',
  delayed: 'error',
  completed: 'success',
};

function formatStatus(status) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Initiatives() {
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await api.get('/api/initiatives');
        if (!cancelled) setInitiatives(data);
      } catch {
        if (!cancelled) setError('Could not load initiatives. Try refreshing the page.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="static"
        elevation={0}
        color="transparent"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton aria-label="Back to dashboard" onClick={() => navigate('/dashboard')} size="small">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              Initiatives
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && !isMobile && (
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            )}
            <Button onClick={handleLogout} size="small">
              Sign out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
          Initiatives
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : initiatives.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No initiatives yet. Create one to get started.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Budget</TableCell>
                  {!isMobile && <TableCell align="right">Week</TableCell>}
                  {!isMobile && <TableCell align="right">Resources</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {initiatives.map((initiative) => (
                  <TableRow
                    key={initiative.numeric_id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/initiatives/${initiative.numeric_id}`)}
                  >
                    <TableCell>{initiative.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={formatStatus(initiative.status)}
                        color={STATUS_COLOR[initiative.status] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">${initiative.budget.toLocaleString()}</TableCell>
                    {!isMobile && (
                      <TableCell align="right">
                        {initiative.current_week} / {initiative.time_allocated}
                      </TableCell>
                    )}
                    {!isMobile && <TableCell align="right">{initiative.resources.length}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
