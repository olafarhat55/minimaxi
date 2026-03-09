import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, type Theme } from '@mui/material';

interface ThemeContextValue {
  mode: string;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Light theme palette
const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#2E75B6',
    light: '#5a9fd4',
    dark: '#1a4971',
  },
  secondary: {
    main: '#44546A',
  },
  success: {
    main: '#4caf50',
  },
  warning: {
    main: '#ff9800',
  },
  error: {
    main: '#f44336',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
  },
  divider: '#e0e0e0',
};

// Dark theme palette — premium dark UI
const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
  secondary: {
    main: '#8B5CF6',
    light: '#A855F7',
    dark: '#7C3AED',
  },
  success: {
    main: '#10B981',
    light: '#22C55E',
    dark: '#059669',
  },
  warning: {
    main: '#8B5CF6',
    light: '#A855F7',
    dark: '#7C3AED',
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
  },
  info: {
    main: '#06B6D4',
    light: '#22D3EE',
    dark: '#0891B2',
  },
  background: {
    default: '#1E2A3A',
    paper: '#283444',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    disabled: '#64748B',
  },
  divider: 'rgba(255, 255, 255, 0.1)',
  action: {
    hover: 'rgba(255, 255, 255, 0.05)',
    selected: 'rgba(59, 130, 246, 0.15)',
    disabled: 'rgba(255, 255, 255, 0.2)',
    disabledBackground: 'rgba(255, 255, 255, 0.05)',
  },
};

const createAppTheme = (mode: string): Theme => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  return createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0,0,0,0.08)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            backgroundImage: 'none',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
            ...(mode === 'dark' && {
              '&:hover': {
                backgroundColor: '#303D4F',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              },
            }),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(mode === 'dark' && {
              backgroundColor: '#1E2A3A',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }),
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            ...(mode === 'dark' && {
              backgroundColor: '#1E2A3A',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            }),
            transition: 'background-color 0.3s ease, border-color 0.3s ease, width 0.3s ease',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: mode === 'dark' ? {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          } : {},
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            ...(mode === 'dark' && {
              borderBottomColor: 'rgba(255, 255, 255, 0.05)',
            }),
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: mode === 'dark' ? {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 4,
          } : {},
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: mode === 'dark' ? {
            borderColor: 'rgba(255, 255, 255, 0.05)',
          } : {},
        },
      },
    },
  });
};

interface ThemeContextProviderProps {
  children: (theme: Theme) => React.ReactNode;
}

export const ThemeContextProvider = ({ children }: ThemeContextProviderProps) => {
  // Initialize from localStorage or default to light
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Save to localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      isDark: mode === 'dark',
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children(theme)}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  return context;
};

export default ThemeContext;
