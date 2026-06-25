import { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const slideInLeft: Variants = {
  hidden:  { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// stagger container — wrap around a list to animate children one by one
export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren:  0.07,
      delayChildren:    0.1,
    },
  },
};

// stagger item — apply to each child inside staggerContainer
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// page-level transition — wrap each page's root element
export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

// card hover — use on whileHover
export const cardHover = {
  scale: 1.015,
  transition: { duration: 0.2, ease: 'easeOut' },
};

// button press — use on whileTap
export const buttonTap = { scale: 0.97 };

// number counter animation helper — pass to motionValue animate
export const numberTransition = {
  duration: 1.2,
  ease: [0.25, 0.46, 0.45, 0.94],
};

// sidebar animation
export const sidebarVariants: Variants = {
  open: {
    width: 240,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  closed: {
    width: 64,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const sidebarTextVariants: Variants = {
  open:   { opacity: 1, x: 0,   transition: { delay: 0.1, duration: 0.2 } },
  closed: { opacity: 0, x: -10, transition: {             duration: 0.15 } },
};