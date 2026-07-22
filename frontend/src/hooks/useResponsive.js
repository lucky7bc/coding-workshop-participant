import { useMediaQuery } from 'react-responsive';

// Single source of truth for breakpoint values, deliberately matching
// MUI's default breakpoint scale (sm: 600, md: 900, lg: 1200) so that
// react-responsive-driven logic and any remaining MUI sx breakpoints can
// never disagree about where "mobile" ends.
export const BREAKPOINTS = {
  sm: 600,
  md: 900,
  lg: 1200,
};

export function useIsDesktop() {
  return useMediaQuery({ minWidth: BREAKPOINTS.md });
}

export function useIsMobile() {
  return useMediaQuery({ maxWidth: BREAKPOINTS.sm - 1 });
}
