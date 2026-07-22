import { createTheme } from '@mui/material/styles';

// Deliberately not MUI's default blue (#1976d2) — a deep slate navy reads
// as steadier and more enterprise-appropriate for a budget/timeline
// tracking tool, and doesn't collide with the five semantic status-chip
// colors already in use (grey/blue/orange/red/green — see
// Initiatives.jsx's STATUS_COLOR map). Secondary is a muted gold, used
// sparingly, not the cliché warm-clay/terracotta family.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2D3B55',
    },
    secondary: {
      main: '#B8862E',
    },
    background: {
      default: '#F7F8FA',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    h5: {
      letterSpacing: '-0.01em',
    },
    h6: {
      letterSpacing: '-0.01em',
    },
  },
});

export default theme;