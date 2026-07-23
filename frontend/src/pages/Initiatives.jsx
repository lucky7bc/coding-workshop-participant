import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
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
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useResponsive';

const NAVY = '#0C447C';
const NAVY_DEEP = '#042C53';

const STATUS_STYLE = {
  not_started: { label: 'Not started', bg: '#F1EFE8', color: '#5F5E5A' },
  in_progress: { label: 'In progress', bg: '#E6F1FB', color: '#0C447C' },
  at_risk: { label: 'At risk', bg: '#FAEEDA', color: '#854F0B' },
  delayed: { label: 'Delayed', bg: '#FCEBEB', color: '#A32D2D' },
  completed: { label: 'Completed', bg: '#EAF3DE', color: '#3B6D11' },
};

const EMPTY_FORM = { name: '', budget: '', time_allocated: '' };

function money(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

// Spend is computed client-side from data the list already has:
// per-allocation hours/week × the resource's rate × weeks elapsed
// (capped at the plan) — the same formula the backend budget endpoint
// uses, without an extra API call per card.
function computeSpend(initiative, ratesById) {
  const weeks = Math.min(initiative.current_week, initiative.time_allocated);
  return initiative.resources.reduce(
    (sum, link) => sum + link.allocated_hours * weeks * (ratesById[link.resource_id] ?? 0),
    0
  );
}

function barColor(pct) {
  if (pct >= 90) return '#A32D2D';
  if (pct >= 75) return '#BA7517';
  return NAVY;
}

export default function Initiatives() {
  const [initiatives, setInitiatives] = useState([]);
  const [ratesById, setRatesById] = useState({});
  const [milestoneCounts, setMilestoneCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const [initRes, resourceRes] = await Promise.all([
        api.get('/api/initiatives'),
        api.get('/api/resources'),
      ]);
      setInitiatives(initRes.data);
      setRatesById(
        Object.fromEntries(resourceRes.data.map((r) => [r.numeric_id, r.rate]))
      );
      setError('');

      // Milestone counts need one timeline call per initiative — batched,
      // and purely additive: a failed fetch just omits that card's count.
      const timelines = await Promise.allSettled(
        initRes.data.map((i) => api.get(`/api/initiatives/${i.numeric_id}/timeline`))
      );
      setMilestoneCounts(
        Object.fromEntries(
          timelines
            .map((t, index) =>
              t.status === 'fulfilled'
                ? [initRes.data[index].numeric_id, t.value.data.milestones.length]
                : null
            )
            .filter(Boolean)
        )
      );
    } catch {
      setError('Could not load initiatives. Try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    setSaving(true);
    setError('');
    try {
      await api.post('/api/initiatives', {
        name: form.name,
        budget: Number(form.budget),
        time_allocated: Number(form.time_allocated),
      });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create initiative.');
      setCreateOpen(false);
    } finally {
      setSaving(false);
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
        {isAdmin && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New initiative
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
        ) : initiatives.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No initiatives yet.{isAdmin ? ' Create one to get started.' : ''}
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
            {initiatives.map((initiative) => {
              const spend = computeSpend(initiative, ratesById);
              const pct = initiative.budget > 0 ? (spend / initiative.budget) * 100 : 0;
              const status = STATUS_STYLE[initiative.status] ?? STATUS_STYLE.not_started;
              const milestoneCount = milestoneCounts[initiative.numeric_id];
              return (
                <Paper
                  key={initiative.numeric_id}
                  variant="outlined"
                  onClick={() => navigate(`/initiatives/${initiative.numeric_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      navigate(`/initiatives/${initiative.numeric_id}`);
                    }
                  }}
                  sx={{
                    borderRadius: '12px',
                    p: 2,
                    cursor: 'pointer',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                    '&:focus-visible': { outline: `2px solid ${NAVY}`, outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.25 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: '#2C2C2A', pr: 1 }}>
                      {initiative.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={status.label}
                      sx={{ bgcolor: status.bg, color: status.color, fontWeight: 500, fontSize: 11 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: '#888780' }}>
                      {money(spend)} of {money(initiative.budget)}
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: pct >= 90 ? '#A32D2D' : '#5F5E5A' }}>
                      {Math.round(pct)}%
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#F1EFE8', borderRadius: '4px', height: 8, overflow: 'hidden', mb: 1.5 }}>
                    <Box sx={{ bgcolor: barColor(pct), width: `${Math.min(100, pct)}%`, height: '100%' }} />
                  </Box>
                  <Typography sx={{ fontSize: 12, color: '#888780' }}>
                    Week {initiative.current_week} of {initiative.time_allocated} ·{' '}
                    {initiative.resources.length} resource{initiative.resources.length === 1 ? '' : 's'}
                    {milestoneCount !== undefined
                      ? ` · ${milestoneCount} milestone${milestoneCount === 1 ? '' : 's'}`
                      : ''}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New initiative</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            label="Budget"
            type="number"
            fullWidth
            margin="normal"
            value={form.budget}
            onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
          />
          <TextField
            label="Duration (weeks)"
            type="number"
            fullWidth
            margin="normal"
            value={form.time_allocated}
            onChange={(event) => setForm((prev) => ({ ...prev, time_allocated: event.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={
              saving ||
              !form.name ||
              form.budget === '' ||
              Number(form.budget) <= 0 ||
              form.time_allocated === '' ||
              Number(form.time_allocated) <= 0
            }
          >
            {saving ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
