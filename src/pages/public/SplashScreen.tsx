import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [phase, setPhase] = useState(0);

 useEffect(() => {
  const t1 = setTimeout(() => setPhase(1), 300);
  const t2 = setTimeout(() => setPhase(2), 1600);   // كانت 2000
  const t3 = setTimeout(() => setPhase(3), 3200);   // كانت 4000
  const t4 = setTimeout(() => onFinish(), 4000);    // كانت 5000
  return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
}, [onFinish]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0F2040 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        opacity: phase === 3 ? 0 : 1,
        transition: phase === 3 ? 'opacity 0.8s ease' : 'none',
        pointerEvents: phase === 3 ? 'none' : 'all',
      }}
    >
      {/* Particles */}
      {[...Array(20)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 4,
            height: i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 4,
            borderRadius: '50%',
            bgcolor: i % 4 === 0 ? '#60A5FA' : i % 4 === 1 ? '#34D399' : i % 4 === 2 ? '#A78BFA' : '#F59E0B',
            left: `${5 + (i * 37) % 90}%`,
            top: `${10 + (i * 53) % 80}%`,
            opacity: phase >= 1 ? 0.7 : 0,
            transition: `opacity 1s ease ${i * 0.08}s`,
            animation: phase >= 1 ? `particleFloat${i % 3} ${3 + (i % 3)}s ease-in-out infinite ${i * 0.2}s` : 'none',
          }}
        />
      ))}

      {/* Floating gears */}
      {[
        { x: '6%', y: '12%', size: 70, speed: '8s', delay: '0s', color: '#2E75B6' },
        { x: '84%', y: '18%', size: 55, speed: '10s', delay: '1s', color: '#1E5A8E' },
        { x: '4%', y: '68%', size: 60, speed: '9s', delay: '0.5s', color: '#2E75B6' },
        { x: '87%', y: '72%', size: 65, speed: '7s', delay: '1.5s', color: '#1E5A8E' },
        { x: '14%', y: '44%', size: 40, speed: '11s', delay: '0.3s', color: '#3B82F6' },
        { x: '79%', y: '48%', size: 45, speed: '9s', delay: '0.8s', color: '#3B82F6' },
      ].map((gear, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: gear.x,
            top: gear.y,
            opacity: phase >= 1 ? 0.35 : 0,
            transition: `opacity 1s ease ${i * 0.15}s`,
            animation: phase >= 1 ? `spin ${gear.speed} linear infinite ${gear.delay}` : 'none',
          }}
        >
          <svg width={gear.size} height={gear.size} viewBox="0 0 50 50">
            <path
              d="M25 15 L27 10 L23 10 Z M35 17 L39 13 L36 16 Z M38 25 L43 23 L43 27 Z M35 33 L39 37 L36 34 Z M25 35 L27 40 L23 40 Z M15 33 L11 37 L14 34 Z M12 25 L7 23 L7 27 Z M15 17 L11 13 L14 16 Z"
              fill={gear.color}
            />
            <circle cx="25" cy="25" r="10" fill="none" stroke={gear.color} strokeWidth="3"/>
            <circle cx="25" cy="25" r="5" fill={gear.color} opacity="0.5"/>
          </svg>
        </Box>
      ))}

      {/* Glowing rings */}
      {[280, 380, 480].map((size, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid rgba(96,165,250,${0.18 - i * 0.04})`,
            opacity: phase >= 1 ? 1 : 0,
            transition: `opacity 1s ease ${i * 0.2}s`,
            animation: phase >= 1 ? `ringPulse 3s ease-in-out infinite ${i * 0.5}s` : 'none',
          }}
        />
      ))}

      {/* Robot */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.8)',
          transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: phase >= 1 && phase < 3 ? 'robotFloat 3s ease-in-out infinite' : 'none',
          mb: 3,
        }}
      >
        <Box
          component="img"
          src="/images/robot.png"
          alt="MiniMaxi Robot"
          sx={{
            width: { xs: 300, sm: 380, md: 440 },
            height: 'auto',
            filter: 'drop-shadow(0 0 50px rgba(59,130,246,0.6)) drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
          }}
        />

        {/* Floating stat badges */}
        {[
          { label: 'Health Score', value: '92%', color: '#10B981', x: '-160px', y: '40px' },
          { label: 'Prediction', value: '95%', color: '#3B82F6', x: '125px', y: '50px' },
          { label: 'Uptime', value: '99.9%', color: '#A78BFA', x: '-140px', y: '200px' },
        ].map((badge, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              left: badge.x,
              top: badge.y,
              bgcolor: 'rgba(15, 30, 60, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${badge.color}50`,
              borderRadius: '14px',
              px: 2.5,
              py: 1.5,
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'translateX(0)' : `translateX(${i % 2 === 0 ? '-20px' : '20px'})`,
              transition: `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s`,
              animation: phase >= 2 ? `badgeFloat 4s ease-in-out infinite ${i * 0.7}s` : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography sx={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1, mb: 0.5 }}>
              {badge.label}
            </Typography>
            <Typography sx={{ fontSize: '22px', fontWeight: 700, color: badge.color, lineHeight: 1.3 }}>
              {badge.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Logo + text */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
        }}
      >
        <img src="/images/logo.png" alt="minimaxi" style={{ height: 48, width: 'auto' }} />
        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
          minimaxi
        </Typography>
      </Box>

      {/* Tagline */}
      <Box
        sx={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s',
          textAlign: 'center',
          mb: 4,
        }}
      >
        
      </Box>

      {/* Loading bar */}
      <Box
        sx={{
          width: { xs: 260, md: 340 },
          height: 4,
          bgcolor: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <Box
          sx={{
            height: '100%',
            background: 'linear-gradient(90deg, #3B82F6, #10B981)',
            borderRadius: 2,
            width: phase === 0 ? '0%' : phase === 1 ? '40%' : phase === 2 ? '80%' : '100%',
            transition: 'width 0.8s ease',
          }}
        />
      </Box>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes robotFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes badgeFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes ringPulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes particleFloat0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes particleFloat1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes particleFloat2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
      `}</style>
    </Box>
  );
};

export default SplashScreen;