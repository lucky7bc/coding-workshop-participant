import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useResponsive';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await api.get('/api/resources');
        if (!cancelled) setResources(data);
      } catch {
        if (!cancelled) setError('Could not load resources. Try refreshing the page.');
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
              Resources
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : resources.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No resources yet. Create one to get started.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Initiatives</TableCell>
                  {!isMobile && <TableCell align="right">Total hrs/week</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.numeric_id} hover>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell align="right">${resource.rate.toLocaleString()}/hr</TableCell>
                    <TableCell align="right">{resource.initiatives.length}</TableCell>
                    {!isMobile && (
                      <TableCell align="right">
                        {resource.initiatives.reduce((sum, link) => sum + link.allocated_hours, 0)}
                      </TableCell>
                    )}
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
