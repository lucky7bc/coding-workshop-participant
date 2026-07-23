import { createTheme } from '@mui/material/styles';

export default function buildTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#85B7EB' : '#2D3B55',
      },
      secondary: {
        main: '#B8862E',
      },
      ...(mode === 'light'
        ? { background: { default: '#F7F8FA' } }
        : {}),
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      h5: { letterSpacing: '-0.01em' },
      h6: { letterSpacing: '-0.01em' },
    },
  });
}
