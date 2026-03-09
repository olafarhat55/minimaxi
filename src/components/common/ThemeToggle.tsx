import { Box, Tooltip, keyframes } from '@mui/material';
import { useThemeMode } from '../../context/ThemeContext';

const twinkle = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useThemeMode();

  // Star positions (visible on the left side of the track when slider is on the right in dark mode)
  const stars = [
    { top: 7, left: 10, size: 2, delay: '0s' },
    { top: 16, left: 20, size: 1.5, delay: '0.6s' },
    { top: 22, left: 11, size: 1.5, delay: '1.2s' },
    { top: 9, left: 24, size: 2, delay: '0.3s' },
    { top: 19, left: 6, size: 1, delay: '0.9s' },
  ];

  // Sun ray angles for the SVG icon
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Box
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
          }
        }}
        sx={{
          position: 'relative',
          width: 60,
          height: 30,
          borderRadius: '15px',
          backgroundColor: isDark ? '#1a3a5c' : '#E0E0E0',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease',
          overflow: 'hidden',
          flexShrink: 0,
          mr: 1,
          '&:hover': {
            boxShadow: isDark
              ? '0 0 10px rgba(100, 181, 246, 0.35)'
              : '0 0 10px rgba(255, 183, 77, 0.35)',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: isDark ? '#64B5F6' : '#2E75B6',
            outlineOffset: 2,
          },
        }}
      >
        {/* Stars decoration (dark mode) */}
        {stars.map((star, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: '#fff',
              opacity: isDark ? 0.7 : 0,
              transition: 'opacity 0.4s ease 0.15s',
              animation: isDark
                ? `${twinkle} 2.5s ease-in-out ${star.delay} infinite`
                : 'none',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Sliding circle */}
        <Box
          sx={{
            position: 'absolute',
            top: 3,
            left: isDark ? 33 : 3,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition:
              'left 0.3s ease-in-out, background-color 0.3s ease, box-shadow 0.3s ease',
            boxShadow: isDark
              ? '0 1px 4px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(100,181,246,0.15)'
              : '0 1px 4px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          {/* Sun icon (visible in light mode) */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: 'absolute',
              opacity: isDark ? 0 : 1,
              transform: isDark ? 'rotate(-45deg) scale(0.4)' : 'rotate(0deg) scale(1)',
              transition: 'opacity 0.25s ease, transform 0.35s ease',
            }}
          >
            <circle cx="12" cy="12" r="4.5" fill="#F59E0B" />
            {rayAngles.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <line
                  key={angle}
                  x1={12 + 7 * Math.cos(rad)}
                  y1={12 + 7 * Math.sin(rad)}
                  x2={12 + 9.5 * Math.cos(rad)}
                  y2={12 + 9.5 * Math.sin(rad)}
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Moon icon (visible in dark mode) */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: 'absolute',
              opacity: isDark ? 1 : 0,
              transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(45deg) scale(0.4)',
              transition: 'opacity 0.25s ease, transform 0.35s ease',
            }}
          >
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              fill="#93C5FD"
            />
          </svg>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default ThemeToggle;
