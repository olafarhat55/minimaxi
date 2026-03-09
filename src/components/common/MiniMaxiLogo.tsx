import { Box, Typography } from '@mui/material';
import { useThemeMode } from '../../context/ThemeContext';

interface MiniMaxiLogoProps {
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
  onClick?: () => void;
}

const MiniMaxiLogo = ({
  size = 36,
  showText = true,
  showTagline = false,
  onClick,
}: MiniMaxiLogoProps) => {
  const { isDark } = useThemeMode();

  const primaryColor = isDark ? '#64B5F6' : '#2E75B6';
  const taglineColor = isDark ? '#90CAF9' : '#44546A';

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        padding: '4px 8px',
        borderRadius: 1,
        transition: 'opacity 0.2s ease',
        '&:hover': onClick ? { opacity: 0.85 } : {},
      }}
    >
      <img
        src="/images/logo.png"
        alt="minimaxi logo"
        style={{
          height: size,
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
      {showText && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: `${size * 0.45}px`,
              color: primaryColor,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              transition: 'color 0.3s ease',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            minimaxi
          </Typography>
          {showTagline && (
            <Typography
              component="span"
              sx={{
                fontSize: `${size * 0.18}px`,
                color: taglineColor,
                letterSpacing: '0.1em',
                lineHeight: 1.3,
                fontWeight: 500,
                textTransform: 'uppercase',
                transition: 'color 0.3s ease',
              }}
            >
              Predictive Maintenance
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MiniMaxiLogo;
