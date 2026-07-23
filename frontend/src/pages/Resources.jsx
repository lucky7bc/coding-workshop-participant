import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useResponsive';

const NAVY = '#0C447C';
const BLUE_MID = '#185FA5';
const BLUE_PALE = '#B5D4F4';
const BLUE_SOFT = '#85B7EB';
const CHIP_BG = '#E6F1FB';

const EMPTY_FORM = { name: '', rate: '' };

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [initiativeNames, setInitiativeNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const [resourceRes, initiativeRes] = await Promise.all([
        api.get('/api/resources'),
        api.get('/api/initiatives'),
      ]);
      setResources(resourceRes.data);
      setInitiativeNames(
        Object.fromEntries(initiativeRes.data.map((i) => [i.numeric_id, i.name]))
      );
      setError('');
    } catch {
      setError('Could not load resources. Try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(resource) {
    setEditing(resource);
    setForm({ name: resource.name, rate: String(resource.rate) });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, rate: Number(form.rate) };
      if (editing) {
        await api.put(`/api/resources/${editing.numeric_id}`, payload);
      } else {
        await api.post('/api/resources', payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save resource.');
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resource) {
    if (!window.confirm(`Delete ${resource.name}? This can't be undone.`)) return;
    setError('');
    try {
      await api.delete(`/api/resources/${resource.numeric_id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete resource.');
    }
  }

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
        {isAdmin && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={openCreate}>
              Add resource
            </Button>
          </Box>
        )}

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
            <Typography color="text.secondary">
              No resources yet.{isAdmin ? ' Add one to get started.' : ''}
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 2,
            }}
          >
            {resources.map((resource) => (
              <Paper key={resource.numeric_id} variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: NAVY, p: 1.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      bgcolor: BLUE_MID,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 20, color: BLUE_PALE }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
                      {resource.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: BLUE_SOFT }}>
                      ${resource.rate.toLocaleString()}/hr · ID {resource.numeric_id}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 1.75 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#5F5E5A', mb: 1 }}>
                    Allocations
                  </Typography>
                  {resource.initiatives.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: '#888780' }}>None yet</Typography>
                  ) : (
                    resource.initiatives.map((link) => {
                      const name = initiativeNames[link.initiative_id] ?? `Initiative ${link.initiative_id}`;
                      return (
                        <Box
                          key={link.initiative_id}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 1,
                            py: 0.75,
                            '&:not(:last-child)': { borderBottom: '0.5px solid', borderColor: 'divider' },
                          }}
                        >
                          <Tooltip title={name}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: '#2C2C2A',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {name}
                            </Typography>
                          </Tooltip>
                          <Box
                            component="span"
                            sx={{
                              bgcolor: CHIP_BG,
                              color: NAVY,
                              fontSize: 11,
                              fontWeight: 500,
                              px: 1,
                              py: 0.25,
                              borderRadius: '8px',
                              whiteSpace: 'nowrap',
                              mt: '1px',
                            }}
                          >
                            {link.allocated_hours}h
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
                {isAdmin && (
                  <Box sx={{ borderTop: 1, borderColor: 'divider', px: 1, py: 0.5, display: 'flex', gap: 0.5 }}>
                    <Button size="small" startIcon={<EditIcon sx={{ fontSize: 15 }} />} onClick={() => openEdit(resource)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineIcon sx={{ fontSize: 15 }} />}
                      onClick={() => handleDelete(resource)}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add resource'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            label="Hourly rate"
            type="number"
            fullWidth
            margin="normal"
            value={form.rate}
            onChange={(event) => setForm((prev) => ({ ...prev, rate: event.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name || form.rate === '' || Number(form.rate) < 0}
          >
            {saving ? <CircularProgress size={20} /> : editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
