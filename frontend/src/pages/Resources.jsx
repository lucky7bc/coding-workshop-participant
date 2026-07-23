import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WorkIcon from '@mui/icons-material/Work';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useIsMobile } from '../hooks/useResponsive';

const NAVY = '#0C447C';
const BLUE_MID = '#185FA5';
const BLUE_PALE = '#B5D4F4';
const BLUE_SOFT = '#85B7EB';
const CHIP_BG = '#E6F1FB';
const MAX_HOURS = 40;

const EMPTY_FORM = { name: '', rate: '' };

function initiativeLevel(count) {
  if (count >= 6) return 'overloaded';
  if (count >= 4) return 'risky';
  return 'good';
}

function hoursLevel(totalHours) {
  const pct = (totalHours / MAX_HOURS) * 100;
  if (pct >= 90) return 'overloaded';
  if (pct >= 75) return 'risky';
  return 'good';
}

function overallLevel(count, totalHours) {
  const levels = ['good', 'risky', 'overloaded'];
  const a = levels.indexOf(initiativeLevel(count));
  const b = levels.indexOf(hoursLevel(totalHours));
  return levels[Math.max(a, b)];
}

const LEVEL_STYLES = {
  good: {
    headerBg: NAVY,
    avatarBg: BLUE_MID,
    avatarColor: BLUE_PALE,
    subtitleColor: BLUE_SOFT,
    cardBorder: '#e0e0e0',
    badgeBg: '#E1F5EE',
    badgeColor: '#0F6E56',
    barColor: '#1D9E75',
    pctColor: '#3B6D11',
    warningText: null,
  },
  risky: {
    headerBg: NAVY,
    avatarBg: BLUE_MID,
    avatarColor: BLUE_PALE,
    subtitleColor: BLUE_SOFT,
    cardBorder: '#e0e0e0',
    badgeBg: '#FAEEDA',
    badgeColor: '#854F0B',
    barColor: '#BA7517',
    pctColor: '#854F0B',
    warningText: null,
  },
  overloaded: {
    headerBg: '#7E1F1F',
    avatarBg: '#A32D2D',
    avatarColor: '#F7C1C1',
    subtitleColor: '#F7C1C1',
    cardBorder: '#A32D2D',
    badgeBg: '#FCEBEB',
    badgeColor: '#A32D2D',
    barColor: '#A32D2D',
    pctColor: '#A32D2D',
    warningText: 'Over-allocated — review needed',
  },
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [initiativeNames, setInitiativeNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggle } = useColorMode();
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

  const visibleResources = resources.filter((resource) =>
    resource.name.toLowerCase().includes(search.toLowerCase())
  );

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
                        <IconButton
              aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              size="small"
              onClick={toggle}
            >
              {mode === 'light' ? <Brightness4Icon fontSize="small" /> : <Brightness7Icon fontSize="small" />}
            </IconButton>
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

        <TextField size="small" placeholder="Search resources" value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mb: 2, width: '100%', maxWidth: 320 }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>) }} />

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
        ) : visibleResources.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No resources match your search.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2 }}>
            {visibleResources.map((resource) => {
              const totalHours = resource.initiatives.reduce((sum, link) => sum + link.allocated_hours, 0);
              const count = resource.initiatives.length;
              const level = overallLevel(count, totalHours);
              const styles = LEVEL_STYLES[level];
              const hoursPct = Math.min((totalHours / MAX_HOURS) * 100, 100);

              return (
                <Paper
                  key={resource.numeric_id}
                  variant="outlined"
                  sx={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    borderColor: styles.cardBorder,
                    borderWidth: level === 'overloaded' ? 2 : 1,
                  }}
                >
                  <Box sx={{ bgcolor: styles.headerBg, p: 1.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: styles.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PersonIcon sx={{ fontSize: 20, color: styles.avatarColor }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{resource.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: styles.subtitleColor }}>${resource.rate.toLocaleString()}/hr · ID {resource.numeric_id}</Typography>
                    </Box>
                    <Tooltip title={`${count} initiative${count === 1 ? '' : 's'}`}>
                      <Box sx={{ bgcolor: styles.badgeBg, borderRadius: '20px', px: 1, py: 0.25, display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
                        {level === 'overloaded'
                          ? <WarningAmberIcon sx={{ fontSize: 12, color: styles.badgeColor }} />
                          : <WorkIcon sx={{ fontSize: 12, color: styles.badgeColor }} />}
                        <Typography sx={{ fontSize: 11, fontWeight: 500, color: styles.badgeColor }}>{count}</Typography>
                      </Box>
                    </Tooltip>
                  </Box>

                  <Box sx={{ px: 1.75, pt: 1, pb: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary' }}>{totalHours} / {MAX_HOURS} hrs/week</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, color: styles.pctColor }}>{Math.round(hoursPct)}%{totalHours > MAX_HOURS ? ' — over' : ''}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: '#F1EFE8', borderRadius: '4px', height: 6, overflow: 'hidden' }}>
                      <Box sx={{ bgcolor: styles.barColor, width: `${hoursPct}%`, height: '100%' }} />
                    </Box>
                  </Box>

                  {styles.warningText && (
                    <Box sx={{ px: 1.75, pt: 0.75 }}>
                      <Typography sx={{ fontSize: 11, color: '#A32D2D', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <WarningAmberIcon sx={{ fontSize: 13 }} />{styles.warningText}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ p: 1.75 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 1 }}>Allocations</Typography>
                    {resource.initiatives.length === 0 ? (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>None yet</Typography>
                    ) : (
                      resource.initiatives.map((link) => {
                        const name = initiativeNames[link.initiative_id] ?? `Initiative ${link.initiative_id}`;
                        return (
                          <Box key={link.initiative_id} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, py: 0.75, '&:not(:last-child)': { borderBottom: '0.5px solid', borderColor: 'divider' } }}>
                            <Tooltip title={name}>
                              <Typography sx={{ fontSize: 13, color: 'text.primary', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {name}
                              </Typography>
                            </Tooltip>
                            <Box component="span" sx={{ bgcolor: CHIP_BG, color: NAVY, fontSize: 11, fontWeight: 500, px: 1, py: 0.25, borderRadius: '8px', whiteSpace: 'nowrap', mt: '1px' }}>
                              {link.allocated_hours}h
                            </Box>
                          </Box>
                        );
                      })
                    )}
                  </Box>

                  {isAdmin && (
                    <Box sx={{ borderTop: 1, borderColor: 'divider', px: 1, py: 0.5, display: 'flex', gap: 0.5 }}>
                      <Button size="small" startIcon={<EditIcon sx={{ fontSize: 15 }} />} onClick={() => openEdit(resource)}>Edit</Button>
                      <Button size="small" color="error" startIcon={<DeleteOutlineIcon sx={{ fontSize: 15 }} />} onClick={() => handleDelete(resource)}>Delete</Button>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add resource'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <TextField label="Hourly rate" type="number" fullWidth margin="normal" value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: event.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || form.rate === '' || Number(form.rate) < 0}>
            {saving ? <CircularProgress size={20} /> : editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
