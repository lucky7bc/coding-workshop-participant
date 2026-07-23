import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import GroupsIcon from '@mui/icons-material/Groups';
import BarChartIcon from '@mui/icons-material/BarChart';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useIsDesktop, useIsMobile } from '../hooks/useResponsive';

const NAVY = '#0C447C';
const NAVY_DEEP = '#042C53';
const BLUE_PALE = '#B5D4F4';
const BLUE_SOFT = '#85B7EB';
const RED_ACCENT = '#E24B4A';
const RED_DEEP = '#A32D2D';

function StatTile({ inverted, icon, count, loading, label, hint, onClick }) {
  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
      sx={{
        bgcolor: inverted ? '#fff' : NAVY,
        border: inverted ? `1.5px solid ${RED_DEEP}` : 'none',
        borderRadius: '12px',
        flex: 1,
        minWidth: 170,
        minHeight: 170,
        p: 2.75,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 3 },
        '&:focus-visible': { outline: `3px solid ${BLUE_SOFT}`, outlineOffset: 2 },
      }}
    >
      <Box sx={{ color: inverted ? RED_DEEP : BLUE_SOFT, display: 'flex' }}>{icon}</Box>
      <Box>
        {loading ? (
          <Skeleton
            width={48}
            height={42}
            sx={{ bgcolor: inverted ? undefined : 'rgba(255,255,255,0.25)' }}
          />
        ) : (
          <Typography sx={{ fontSize: 30, fontWeight: 500, color: inverted ? RED_DEEP : '#fff' }}>
            {count}
          </Typography>
        )}
        <Typography sx={{ fontSize: 14, color: inverted ? 'text.secondary' : BLUE_PALE, mt: 0.25 }}>
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: 12,
          color: inverted ? RED_DEEP : BLUE_SOFT,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {hint} <ArrowForwardIcon sx={{ fontSize: 13 }} />
      </Typography>
    </Box>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  const isAdmin = user?.role === 'admin';
  const roleLabel = isAdmin ? 'Admin' : 'Manager';

  const [counts, setCounts] = useState({ resources: null, initiatives: null, users: null });
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const requests = [api.get('/api/resources'), api.get('/api/initiatives')];
        if (isAdmin) requests.push(api.get('/api/users'));

        const results = await Promise.allSettled(requests);
        if (cancelled) return;

        const value = (index) =>
          results[index]?.status === 'fulfilled' ? results[index].value.data.length : '—';

        setCounts({
          resources: value(0),
          initiatives: value(1),
          users: isAdmin ? value(2) : null,
        });
      } finally {
        if (!cancelled) setLoadingCounts(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="static"
        elevation={0}
        color="transparent"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 500, color: 'text.primary' }}>
            CitiBank Initiative Tracker
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isMobile && (
              <Typography variant="body2" color="text.secondary">
                {user?.email}
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

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 1000,
          width: '100%',
          mx: 'auto',
          p: isDesktop ? 5 : 3,
        }}
      >
        <Typography sx={{ fontSize: isDesktop ? 34 : 28, fontWeight: 500, color: 'text.primary', lineHeight: 1.15 }}>
          Hello, {roleLabel}.
        </Typography>
        <Box sx={{ width: 52, height: 4, bgcolor: RED_ACCENT, my: 1.75 }} />
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 4.25 }}>
          {today}
          {counts.initiatives !== null && counts.initiatives !== '—' && !loadingCounts
            ? ` · ${counts.initiatives} initiative${counts.initiatives === 1 ? '' : 's'} in flight`
            : ''}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <StatTile
            icon={<GroupsIcon sx={{ fontSize: 24 }} />}
            count={counts.resources}
            loading={loadingCounts}
            label="Resources"
            hint="View people and allocations"
            onClick={() => navigate('/resources')}
          />
          <StatTile
            icon={<BarChartIcon sx={{ fontSize: 24 }} />}
            count={counts.initiatives}
            loading={loadingCounts}
            label="Initiatives"
            hint="View budgets and timelines"
            onClick={() => navigate('/initiatives')}
          />
          {isAdmin && (
            <StatTile
              inverted
              icon={<ManageAccountsIcon sx={{ fontSize: 24 }} />}
              count={counts.users}
              loading={loadingCounts}
              label="Managers"
              hint="Edit accounts and roles"
              onClick={() => navigate('/users')}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
