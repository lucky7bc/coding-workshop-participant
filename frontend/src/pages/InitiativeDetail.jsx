import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useResponsive';

const NAVY_DEEP = '#042C53';
const CHIP_BG = '#E6F1FB';
const NAVY = '#0C447C';

const SEGMENT_COLORS = ['#0C447C', '#378ADD', '#85B7EB', '#1D9E75', '#D85A30', '#7F77DD'];

const STATUS_META = {
  pending: { label: 'Pending', color: '#888780', bg: '#F1EFE8', icon: <ScheduleIcon sx={{ fontSize: 14 }} /> },
  in_progress: { label: 'In progress', color: '#185FA5', bg: '#E6F1FB', icon: <AutorenewIcon sx={{ fontSize: 14 }} /> },
  complete: { label: 'Complete', color: '#0F6E56', bg: '#E1F5EE', icon: <CheckIcon sx={{ fontSize: 14 }} /> },
  missed: { label: 'Missed', color: '#A32D2D', bg: '#FCEBEB', icon: <PriorityHighIcon sx={{ fontSize: 14 }} /> },
};
const STATUS_CYCLE = ['pending', 'in_progress', 'complete', 'missed'];

const INITIATIVE_STATUS_LABEL = {
  not_started: 'Not started',
  in_progress: 'In progress',
  at_risk: 'At risk',
  delayed: 'Delayed',
  completed: 'Completed',
};

function money(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

export default function InitiativeDetail() {
  const { id } = useParams();
  const [initiative, setInitiative] = useState(null);
  const [budget, setBudget] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeek, setNewWeek] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [allResources, setAllResources] = useState([]);
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocResourceId, setAllocResourceId] = useState('');
  const [allocHours, setAllocHours] = useState('');
  const [editHoursFor, setEditHoursFor] = useState(null);
  const [editHoursValue, setEditHoursValue] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get(`/api/initiatives/${id}`),
      api.get(`/api/initiatives/${id}/budget`),
      api.get(`/api/initiatives/${id}/timeline`),
      api.get('/api/resources'),
    ]);
    const [init, budg, timeline, res] = results;
    if (init.status === 'fulfilled') setInitiative(init.value.data);
    if (budg.status === 'fulfilled') setBudget(budg.value.data);
    if (timeline.status === 'fulfilled') setMilestones(timeline.value.data.milestones);
    if (res.status === 'fulfilled') setAllResources(res.value.data);
    if (init.status === 'rejected') {
      setError(init.reason?.response?.data?.error || 'Could not load this initiative.');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddMilestone() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/initiatives/${id}/milestones`, {
        name: newName,
        target_week: Number(newWeek),
      });
      setAddOpen(false);
      setNewName('');
      setNewWeek('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add milestone.');
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(milestone) {
    if (!isAdmin) return;
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(milestone.status) + 1) % STATUS_CYCLE.length];
    setError('');
    try {
      await api.put(`/api/initiatives/${id}/milestones/${milestone._id}`, { status: next });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update milestone.');
    }
  }

  async function handleDeleteMilestone(milestone) {
    if (!window.confirm(`Delete milestone "${milestone.name}"?`)) return;
    setError('');
    try {
      await api.delete(`/api/initiatives/${id}/milestones/${milestone._id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete milestone.');
    }
  }

  async function handleAllocate() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/initiatives/${id}/resources`, {
        resource_id: Number(allocResourceId),
        allocated_hours: Number(allocHours),
      });
      setAllocOpen(false);
      setAllocResourceId('');
      setAllocHours('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not allocate resource.');
      setAllocOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateHours() {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/api/initiatives/${id}/resources/${editHoursFor.resource_id}`, {
        allocated_hours: Number(editHoursValue),
      });
      setEditHoursFor(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update hours.');
      setEditHoursFor(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveAllocation(link) {
    const name = allResources.find((r) => r.numeric_id === link.resource_id)?.name || `Resource ${link.resource_id}`;
    if (!window.confirm(`Remove ${name} from this initiative?`)) return;
    setError('');
    try {
      await api.delete(`/api/initiatives/${id}/resources/${link.resource_id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove allocation.');
    }
  }

  async function changeInitiativeStatus(next) {
    setStatusAnchor(null);
    setError('');
    try {
      await api.put(`/api/initiatives/${id}`, { status: next });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update status.');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const spendPct = budget && budget.budget > 0 ? Math.min(100, (budget.total_spend / budget.budget) * 100) : 0;

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
            <IconButton aria-label="Back to initiatives" onClick={() => navigate('/initiatives')} size="small">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              {initiative ? initiative.name : 'Initiative'}
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

      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !initiative ? null : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 20, fontWeight: 500, color: NAVY_DEEP }}>
                  {initiative.name}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#888780' }}>
                  Week {initiative.current_week} of {initiative.time_allocated} ·{' '}
                  {initiative.resources.length} resource{initiative.resources.length === 1 ? '' : 's'} allocated
                </Typography>
              </Box>
              <Box>
                <Tooltip title={isAdmin ? 'Click to change status' : ''}>
                  <Chip
                    size="small"
                    label={INITIATIVE_STATUS_LABEL[initiative.status] ?? initiative.status}
                    onClick={isAdmin ? (event) => setStatusAnchor(event.currentTarget) : undefined}
                    sx={{ bgcolor: CHIP_BG, color: NAVY, fontWeight: 500, cursor: isAdmin ? 'pointer' : 'default' }}
                  />
                </Tooltip>
                <Menu anchorEl={statusAnchor} open={Boolean(statusAnchor)} onClose={() => setStatusAnchor(null)}>
                  {Object.entries(INITIATIVE_STATUS_LABEL).map(([value, label]) => (
                    <MenuItem
                      key={value}
                      selected={value === initiative.status}
                      onClick={() => changeInitiativeStatus(value)}
                    >
                      {label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            </Box>

            {budget && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#5F5E5A' }}>
                    Spend by resource
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                    {money(budget.total_spend)} · {Math.round(spendPct)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', bgcolor: '#F1EFE8', borderRadius: '6px', height: 16, overflow: 'hidden' }}>
                  {budget.breakdown.map((item, index) => (
                    <Tooltip key={item.resource_id} title={`${item.resource_name}: ${money(item.cost)}`}>
                      <Box
                        sx={{
                          bgcolor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                          width: budget.budget > 0 ? `${(item.cost / budget.budget) * 100}%` : 0,
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 2.25, mt: 1, flexWrap: 'wrap' }}>
                  {budget.breakdown.map((item, index) => (
                    <Typography key={item.resource_id} sx={{ fontSize: 12, color: '#5F5E5A', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: SEGMENT_COLORS[index % SEGMENT_COLORS.length], borderRadius: '2px' }} />
                      {item.resource_name} {money(item.cost)}
                    </Typography>
                  ))}
                  <Typography sx={{ fontSize: 12, color: '#888780', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: '#F1EFE8', border: '0.5px solid #D3D1C7', borderRadius: '2px' }} />
                    Remaining {money(budget.remaining)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: budget.projected_at_completion > budget.budget ? '#A32D2D' : '#888780', mt: 1 }}>
                  {money(budget.weekly_burn)}/week burn · projected {money(budget.projected_at_completion)} by week {initiative.time_allocated}
                  {budget.projected_at_completion > budget.budget ? ' — over budget at this pace' : ''}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 500, color: NAVY_DEEP }}>Allocated resources</Typography>
              {isAdmin && (
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setAllocOpen(true)}>
                  Allocate resource
                </Button>
              )}
            </Box>
            <Box sx={{ mb: 4 }}>
              {initiative.resources.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: '#888780' }}>
                  No resources allocated.{isAdmin ? ' Allocate one to start tracking spend.' : ''}
                </Typography>
              ) : (
                initiative.resources.map((link) => {
                  const resource = allResources.find((r) => r.numeric_id === link.resource_id);
                  return (
                    <Box
                      key={link.resource_id}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '0.5px solid', borderColor: 'divider' }}
                    >
                      <Typography sx={{ fontSize: 14 }}>
                        {resource ? resource.name : `Resource ${link.resource_id}`}
                        <Box component="span" sx={{ color: '#888780', fontSize: 13 }}>
                          {' '}· {link.allocated_hours} hrs/week{resource ? ` · $${resource.rate.toLocaleString()}/hr` : ''}
                        </Box>
                      </Typography>
                      {isAdmin && (
                        <Box>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditHoursFor(link);
                              setEditHoursValue(String(link.allocated_hours));
                            }}
                          >
                            Edit hours
                          </Button>
                          <IconButton
                            aria-label="Remove allocation"
                            size="small"
                            onClick={() => handleRemoveAllocation(link)}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 500, color: NAVY_DEEP }}>Milestones</Typography>
              {isAdmin && (
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                  Add milestone
                </Button>
              )}
            </Box>

            {milestones.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: '#888780' }}>
                No milestones yet.{isAdmin ? ' Add the first one.' : ''}
              </Typography>
            ) : (
              <Box>
                {milestones.map((milestone, index) => {
                  const meta = STATUS_META[milestone.status] ?? STATUS_META.pending;
                  const isLast = index === milestones.length - 1;
                  return (
                    <Box key={milestone._id} sx={{ display: 'flex', gap: 1.75 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Tooltip title={isAdmin ? 'Click to change status' : meta.label}>
                          <Box
                            onClick={() => cycleStatus(milestone)}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: meta.bg,
                              color: meta.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: isAdmin ? 'pointer' : 'default',
                            }}
                          >
                            {meta.icon}
                          </Box>
                        </Tooltip>
                        {!isLast && <Box sx={{ width: '2px', flex: 1, bgcolor: '#D3D1C7', minHeight: 20 }} />}
                      </Box>
                      <Box sx={{ pb: isLast ? 0 : 2.25, display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>
                            {milestone.name}{' '}
                            <Box component="span" sx={{ fontWeight: 400, color: '#888780' }}>
                              · week {milestone.target_week}
                            </Box>
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: meta.color, mt: 0.25 }}>{meta.label}</Typography>
                        </Box>
                        {isAdmin && (
                          <IconButton
                            aria-label={`Delete milestone ${milestone.name}`}
                            size="small"
                            onClick={() => handleDeleteMilestone(milestone)}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Box>

      <Dialog open={allocOpen} onClose={() => setAllocOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Allocate resource</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Resource"
            fullWidth
            margin="normal"
            value={allocResourceId}
            onChange={(event) => setAllocResourceId(event.target.value)}
          >
            {allResources
              .filter((r) => !initiative?.resources.some((link) => link.resource_id === r.numeric_id))
              .map((r) => (
                <MenuItem key={r.numeric_id} value={r.numeric_id}>
                  {r.name} (${r.rate.toLocaleString()}/hr)
                </MenuItem>
              ))}
          </TextField>
          <TextField
            label="Hours per week"
            type="number"
            fullWidth
            margin="normal"
            value={allocHours}
            onChange={(event) => setAllocHours(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAllocate}
            disabled={saving || allocResourceId === '' || allocHours === '' || Number(allocHours) <= 0}
          >
            {saving ? <CircularProgress size={20} /> : 'Allocate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editHoursFor)} onClose={() => setEditHoursFor(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit hours per week</DialogTitle>
        <DialogContent>
          <TextField
            label="Hours per week"
            type="number"
            fullWidth
            margin="normal"
            value={editHoursValue}
            onChange={(event) => setEditHoursValue(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditHoursFor(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateHours}
            disabled={saving || editHoursValue === '' || Number(editHoursValue) <= 0}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add milestone</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            placeholder="Ran demo test"
            fullWidth
            margin="normal"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <TextField
            label="Target week"
            type="number"
            fullWidth
            margin="normal"
            value={newWeek}
            onChange={(event) => setNewWeek(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMilestone}
            disabled={saving || !newName || newWeek === '' || Number(newWeek) < 0}
          >
            {saving ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
