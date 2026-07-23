import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../context/AuthContext';
import { useIsDesktop } from '../hooks/useResponsive';

const NAVY = '#0C447C';
const NAVY_DEEP = '#042C53';
const BLUE_MID = '#185FA5';
const BLUE_LIGHT = '#378ADD';
const BLUE_PALE = '#B5D4F4';
const BLUE_SOFT = '#85B7EB';
const RED_ACCENT = '#E24B4A';
const GREEN_OK = '#3B6D11';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BARS = [
  { height: '38%', color: BLUE_MID },
  { height: '62%', color: BLUE_LIGHT },
  { height: '48%', color: BLUE_MID },
  { height: '85%', color: RED_ACCENT },
  { height: '70%', color: BLUE_LIGHT },
];

const underlineFieldSx = {
  '& .MuiInput-underline:before': { borderBottom: '2px solid #D3D1C7' },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: `2px solid ${BLUE_MID}` },
  '& .MuiInput-underline:after': { borderBottom: `2px solid ${NAVY}` },
  '& .MuiInputLabel-root.Mui-focused': { color: NAVY },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailLooksValid = EMAIL_PATTERN.test(email);
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
      <Box
        sx={{
          bgcolor: NAVY,
          flex: isDesktop ? 3 : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isDesktop ? 'space-between' : 'center',
          p: isDesktop ? 5 : 3,
          minHeight: isDesktop ? '100vh' : 'auto',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 13, color: BLUE_SOFT, fontWeight: 500, mb: 0.5 }}>
            CitiBank
          </Typography>
          <Typography sx={{ fontSize: 24, color: '#fff', fontWeight: 500, lineHeight: 1.3 }}>
            Initiative Tracker
          </Typography>
        </Box>

        {isDesktop && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: 110, mb: 2.25 }}>
            {BARS.map((bar, index) => (
              <Box
                key={index}
                sx={{
                  width: 34,
                  height: bar.height,
                  bgcolor: bar.color,
                  borderRadius: '4px 4px 0 0',
                }}
              />
            ))}
          </Box>
          <Typography sx={{ fontSize: 14, color: BLUE_PALE, lineHeight: 1.6 }}>
            Budgets, resources, and delivery timelines for every initiative — in one place.
          </Typography>
        </Box>
        )}

        {isDesktop && (
        <Typography sx={{ fontSize: 12, color: BLUE_SOFT }}>
          Internal tool · Authorized personnel only
        </Typography>
        )}
      </Box>

      <Box
        sx={{
          bgcolor: '#fff',
          flex: 7,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: isDesktop ? 5 : 3,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 380, mx: 'auto' }}>
          <Typography sx={{ fontSize: 19, fontWeight: 500, color: '#2C2C2A', mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#888780', mb: 3.5 }}>
            Use your workplace credentials
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, bgcolor: '#FCEBEB', color: '#791F1F', '& .MuiAlert-icon': { color: RED_ACCENT } }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              variant="standard"
              fullWidth
              required
              autoFocus
              margin="normal"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              sx={underlineFieldSx}
              InputProps={{
                endAdornment: emailLooksValid ? (
                  <InputAdornment position="end">
                    <CheckCircleOutline sx={{ fontSize: 18, color: GREEN_OK }} />
                  </InputAdornment>
                ) : null,
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="standard"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              sx={{ ...underlineFieldSx, mb: 3.5 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((visible) => !visible)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                bgcolor: NAVY,
                color: '#fff',
                height: 46,
                fontWeight: 500,
                fontSize: 15,
                textTransform: 'none',
                '&:hover': { bgcolor: NAVY_DEEP },
                '&.Mui-disabled': { bgcolor: NAVY, color: '#fff', opacity: 0.7 },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign in'}
            </Button>

            <Tooltip title="Password resets are handled by your administrator">
              <Typography
                sx={{
                  fontSize: 13,
                  color: BLUE_MID,
                  fontWeight: 500,
                  textAlign: 'center',
                  mt: 2,
                  cursor: 'default',
                }}
              >
                Forgot password? Contact your administrator
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
