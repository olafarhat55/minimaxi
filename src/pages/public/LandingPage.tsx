import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useScrollTrigger,
  Slide,
  Fade,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Assessment as ReportIcon,
  Savings as SavingsIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  ArrowForward as ArrowForwardIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: AnalyticsIcon,
    title: 'Predictive Analytics',
    description: 'Advanced ML algorithms analyze sensor data to predict equipment failures days or weeks in advance.',
    color: '#3B82F6',
  },
  {
    icon: SpeedIcon,
    title: 'Real-time Monitoring',
    description: 'Monitor all your assets 24/7 with live sensor data, instant alerts, and performance dashboards.',
    color: '#10B981',
  },
  {
    icon: ReportIcon,
    title: 'Automated Reports',
    description: 'Generate comprehensive maintenance reports automatically with actionable insights and trends.',
    color: '#8B5CF6',
  },
  {
    icon: SavingsIcon,
    title: 'Cost Savings',
    description: 'Reduce maintenance costs significantly by preventing unplanned downtime and optimizing schedules.',
    color: '#F59E0B',
  },
];

const stats = [
  { value: '75%', label: 'Downtime Reduction', icon: TrendingDownIcon },
  { value: '95%', label: 'Prediction Accuracy', icon: CheckIcon },
  { value: '$150K', label: 'Avg. Cost Savings', icon: SavingsIcon },
  { value: '500+', label: 'Assets Monitored', icon: SpeedIcon },
];

const steps = [
  {
    number: '01',
    title: 'Connect Your Assets',
    description: 'Integrate sensors and connect your equipment to our platform in minutes.',
  },
  {
    number: '02',
    title: 'AI Analyzes Data',
    description: 'Our ML models continuously analyze patterns and detect anomalies.',
  },
  {
    number: '03',
    title: 'Get Predictions',
    description: 'Receive actionable predictions and schedule maintenance proactively.',
  },
];

const navItems = ['Home', 'Features', 'About', 'Contact'];

interface HideOnScrollProps {
  children: React.ReactElement;
}

function HideOnScroll({ children }: HideOnScrollProps) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFBFC', overflowX: 'hidden' }}>
      {/* Navigation Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1000,
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.75)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
          transition: 'all 0.3s ease',
          borderBottom: scrolled
            ? '1px solid rgba(255, 255, 255, 0.3)'
            : '1px solid transparent',
          boxShadow: scrolled
            ? '0 4px 30px rgba(0, 0, 0, 0.05)'
            : 'none',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1, px: { xs: 0, sm: 2 } }} disableGutters>
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexGrow: { xs: 1, md: 0 },
                cursor: 'pointer',
              }}
              onClick={() => scrollToSection('home')}
            >
              <img
                src="/images/logo.png"
                alt="minimaxi logo"
                style={{
                  height: 36,
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: scrolled ? '#1E293B' : 'white',
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                }}
              >
                minimaxi
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
                mx: 'auto',
              }}
            >
              {navItems.map((item) => (
                <Button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  sx={{
                    color: scrolled ? '#64748B' : 'rgba(255,255,255,0.9)',
                    fontWeight: 500,
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: scrolled ? '#2E75B6' : 'white',
                      bgcolor: scrolled ? 'rgba(46, 117, 182, 0.08)' : 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {item}
                </Button>
              ))}
            </Box>

            {/* Desktop Auth Buttons */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5 }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{
                  color: scrolled ? '#1E293B' : 'white',
                  fontWeight: 600,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: scrolled ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/request-access')}
                sx={{
                  bgcolor: scrolled ? '#2E75B6' : 'white',
                  color: scrolled ? 'white' : '#2E75B6',
                  fontWeight: 600,
                  px: 3,
                  borderRadius: '10px',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: scrolled ? '#1E5A8E' : '#F1F5F9',
                    boxShadow: '0 4px 12px rgba(46, 117, 182, 0.3)',
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>

            {/* Mobile Menu Button */}
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                display: { md: 'none' },
                color: scrolled ? '#1E293B' : 'white',
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: '#FAFBFC',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&:hover': { bgcolor: 'rgba(46, 117, 182, 0.08)' },
                }}
              >
                <ListItemText
                  primary={item}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ borderRadius: '10px', py: 1.2 }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/request-access')}
              sx={{ borderRadius: '10px', py: 1.2 }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Hero Section */}
      <Box
        id="home"
        sx={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2E75B6 50%, #3B82F6 100%)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 'auto', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          pt: '60px',
          pb: { xs: 8, md: 4 },
          '@media (min-width: 768px)': {
            pt: '80px',
          },
          '@media (min-width: 1024px)': {
            pt: '120px',
          },
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `
              radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, white 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            {/* Left Content */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Fade in timeout={800}>
                <Box>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      borderRadius: '50px',
                      px: 2,
                      py: 0.75,
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#10B981',
                        animation: 'pulse 2s infinite',
                      }}
                    />
                   
                  </Box>

                  <Typography
                    variant="h1"
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                      fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                      lineHeight: 1.1,
                      mb: 3,
                      letterSpacing: '-1px',
                    }}
                  >
                    Predictive Maintenance{' '}
                    <Box
                      component="span"
                      sx={{
                        background: 'linear-gradient(90deg, #60A5FA 0%, #34D399 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Made Simple
                    </Box>
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.85)',
                      fontWeight: 400,
                      lineHeight: 1.7,
                      mb: 4,
                      maxWidth: 500,
                      fontSize: { xs: '1rem', md: '1.125rem' },
                    }}
                  >
                    Transform your maintenance strategy with AI. Predict equipment failures,
                    reduce downtime by 75%, and save thousands in repair costs.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/request-access')}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        bgcolor: 'white',
                        color: '#2E75B6',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor: '#F8FAFC',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<PlayIcon />}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        borderRadius: '12px',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      Learn More
                    </Button>
                  </Box>

                  {/* Trust Indicators */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ color: '#10B981', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Free Trial
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ color: '#10B981', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        No Credit Card
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ color: '#10B981', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Setup in Minutes
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            </Grid>

            {/* Right Content - Hero Illustration */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Fade in timeout={1200}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {/* Dashboard Mockup */}
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 550,
                      bgcolor: 'white',
                      borderRadius: '20px',
                      boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                      overflow: 'hidden',
                      transform: { xs: 'none', md: 'perspective(1000px) rotateY(-5deg)' },
                    }}
                  >
                    {/* Browser Bar */}
                    <Box
                      sx={{
                        bgcolor: '#F1F5F9',
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EF4444' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981' }} />
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: 'white',
                          borderRadius: '6px',
                          px: 2,
                          py: 0.5,
                          mx: 2,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          app.minimaxi.io/dashboard
                        </Typography>
                      </Box>
                    </Box>

                    {/* Dashboard Content */}
                    <Box sx={{ p: 3, bgcolor: '#F8FAFC' }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            Dashboard
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Equipment Health Overview
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: '#DCFCE7',
                            px: 2,
                            py: 0.5,
                            borderRadius: '20px',
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#10B981',
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                            All Systems Healthy
                          </Typography>
                        </Box>
                      </Box>

                      {/* Mini Stats */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        {[
                          { label: 'Active Assets', value: '24', color: '#3B82F6' },
                          { label: 'Predicted Failures', value: '2', color: '#F59E0B' },
                          { label: 'Efficiency', value: '94%', color: '#10B981' },
                        ].map((stat, i) => (
                          <Grid size={{ xs: 4 }} key={i}>
                            <Box
                              sx={{
                                bgcolor: 'white',
                                p: 2,
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              }}
                            >
                              <Typography
                                variant="h5"
                                sx={{ fontWeight: 700, color: stat.color }}
                              >
                                {stat.value}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: '#64748B', fontSize: '0.65rem' }}
                              >
                                {stat.label}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Chart Placeholder */}
                      <Box
                        sx={{
                          bgcolor: 'white',
                          p: 2,
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: '#64748B', fontWeight: 600 }}
                        >
                          Equipment Health Trend
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 0.5,
                            mt: 2,
                            height: 80,
                          }}
                        >
                          {[40, 65, 55, 80, 70, 90, 85, 95, 88, 92].map((h, i) => (
                            <Box
                              key={i}
                              sx={{
                                flex: 1,
                                height: `${h}%`,
                                bgcolor: i >= 7 ? '#10B981' : '#3B82F6',
                                borderRadius: '4px 4px 0 0',
                                opacity: 0.8,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Floating Alert Card */}
                 
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>

        {/* Wave Divider */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 80,
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#FAFBFC"
            />
          </svg>
        </Box>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FAFBFC' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#2E75B6',
                fontWeight: 600,
                letterSpacing: '2px',
                mb: 2,
                display: 'block',
              }}
            >
              FEATURES
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Powerful Features
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748B', maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}
            >
              Everything you need to transform reactive maintenance into a proactive,
              data-driven strategy.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px',
              justifyContent: 'center',
              '@media (min-width: 768px)': {
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '32px',
              },
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      borderColor: 'transparent',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '14px',
                        bgcolor: `${feature.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      <feature.icon sx={{ fontSize: 30, color: feature.color }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#64748B', lineHeight: 1.7 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2E75B6 100%)',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <stat.icon
                    sx={{
                      fontSize: 36,
                      color: 'rgba(255,255,255,0.8)',
                      mb: 1.5,
                    }}
                  />
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: 'white',
                      mb: 0.5,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box id="about" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FAFBFC' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#2E75B6',
                fontWeight: 600,
                letterSpacing: '2px',
                mb: 2,
                display: 'block',
              }}
            >
              HOW IT WORKS
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Simple 3-Step Process
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748B', maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}
            >
              Get started in minutes and see results immediately
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              alignItems: 'stretch',
              justifyContent: 'center',
              '@media (min-width: 768px)': {
                flexDirection: 'row',
                gap: '40px',
              },
            }}
          >
            {steps.map((step, index) => (
              <Box
                key={index}
                sx={{
                  flex: 'none',
                  width: '100%',
                  '@media (min-width: 768px)': {
                    flex: 1,
                    width: 'auto',
                  },
                }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 4,
                    position: 'relative',
                  }}
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <Box
                      sx={{
                        display: 'none',
                        position: 'absolute',
                        top: '80px',
                        right: '-50%',
                        width: '100%',
                        height: 2,
                        background: 'linear-gradient(90deg, #2E75B6 0%, #E2E8F0 100%)',
                        zIndex: 0,
                        '@media (min-width: 768px)': {
                          display: 'block',
                        },
                      }}
                    />
                  )}

                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2E75B6 0%, #3B82F6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      position: 'relative',
                      zIndex: 1,
                      boxShadow: '0 10px 30px rgba(46, 117, 182, 0.3)',
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: 'white' }}
                    >
                      {step.number}
                    </Typography>
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5 }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#64748B', lineHeight: 1.7 }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(180deg, #FAFBFC 0%, #EDF2F7 100%)',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              textAlign: 'center',
              bgcolor: 'white',
              p: { xs: 4, md: 8 },
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              border: '1px solid #E2E8F0',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                mb: 2,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
              }}
            >
              Ready to Get Started?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748B', mb: 4, maxWidth: 500, mx: 'auto', lineHeight: 1.7 }}
            >
              Join hundreds of companies already using minimaxi to transform their
              maintenance operations and save costs.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/request-access')}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#2E75B6',
                  fontWeight: 600,
                  px: 5,
                  py: 1.5,
                  fontSize: '1rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(46, 117, 182, 0.3)',
                  '&:hover': {
                    bgcolor: '#1E5A8E',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 30px rgba(46, 117, 182, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                startIcon={<LoginIcon />}
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  borderRadius: '12px',
                  '&:hover': {
                    borderColor: '#2E75B6',
                    bgcolor: 'rgba(46, 117, 182, 0.04)',
                  },
                }}
              >
                Login Now
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        id="contact"
        sx={{
          bgcolor: '#0F172A',
          color: 'white',
          pt: { xs: 6, md: 8 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Company Info */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <img
                  src="/images/logo.png"
                  alt="minimaxi logo"
                  style={{
                    height: 36,
                    width: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  minimaxi
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: '#94A3B8', lineHeight: 1.8, mb: 3, maxWidth: 300 }}
              >
                AI-powered predictive maintenance platform helping companies reduce downtime
                and optimize their maintenance operations.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[LinkedInIcon, TwitterIcon, GitHubIcon].map((Icon, i) => (
                  <IconButton
                    key={i}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: '#94A3B8',
                      '&:hover': {
                        bgcolor: '#2E75B6',
                        color: 'white',
                      },
                    }}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                ))}
              </Box>
            </Grid>

            {/* Quick Links */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 2, color: 'white' }}
              >
                Product
              </Typography>
              {['Features', 'Pricing', 'Integrations', 'API'].map((link) => (
                <Typography
                  key={link}
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    mb: 1.5,
                    cursor: 'pointer',
                    '&:hover': { color: 'white' },
                    transition: 'color 0.2s',
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 2, color: 'white' }}
              >
                Company
              </Typography>
              {['About Us', 'Careers', 'Blog', 'Press'].map((link) => (
                <Typography
                  key={link}
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    mb: 1.5,
                    cursor: 'pointer',
                    '&:hover': { color: 'white' },
                    transition: 'color 0.2s',
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 2, color: 'white' }}
              >
                Support
              </Typography>
              {['Help Center', 'Documentation', 'Contact Us', 'Status'].map((link) => (
                <Typography
                  key={link}
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    mb: 1.5,
                    cursor: 'pointer',
                    '&:hover': { color: 'white' },
                    transition: 'color 0.2s',
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 2, color: 'white' }}
              >
                Legal
              </Typography>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((link) => (
                <Typography
                  key={link}
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    mb: 1.5,
                    cursor: 'pointer',
                    '&:hover': { color: 'white' },
                    transition: 'color 0.2s',
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Grid>
          </Grid>

          {/* Copyright */}
          <Box
            sx={{
              mt: 6,
              pt: 4,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              © {new Date().getFullYear()} minimaxi. All rights reserved.
            </Typography>
            
          </Box>
        </Container>
      </Box>

      {/* Global Styles */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          html {
            scroll-behavior: smooth;
          }
        `}
      </style>
    </Box>
  );
};

export default LandingPage;
