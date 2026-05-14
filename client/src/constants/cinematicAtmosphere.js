/**
 * CINEMATIC HUD ATMOSPHERE SYSTEM
 * 
 * Standardized visual atmosphere for all UI surfaces
 * Creates cohesive cinematic operating system feel
 * 
 * DO NOT MODIFY unless updating entire system
 */

// ====== PURE CONSTANTS ======
// Declared first to avoid initialization issues

// ====== BACKGROUND SYSTEM ======
// Consistent dark cinematic backgrounds
const BACKGROUND = {
  // Primary panel background - rich dark with subtle warmth
  PANEL: 'bg-[#161B27]/90',
  
  // Modal background - slightly cooler for depth
  MODAL: 'bg-[#161B25]/95',
  
  // System overlay background - deepest for critical elements
  SYSTEM: 'bg-[#0F1117]/98',
  
  // Tooltip background - lightweight but visible
  TOOLTIP: 'bg-[#1A1F2E]/95',
  
  // Empty state background - subtle
  EMPTY: 'bg-[#1A1F2E]/30',
};

// ====== BLUR HIERARCHY ======
// Spatial depth through blur intensity
const BLUR = {
  // Near surfaces - panels, chat, notifications
  NEAR: 'backdrop-blur-lg',
  
  // Mid surfaces - modals, dropdowns
  MID: 'backdrop-blur-xl',
  
  // Deep surfaces - system overlays, backdrop
  DEEP: 'backdrop-blur-2xl',
  
  // Subtle surfaces - tooltips, micro-HUD
  SUBTLE: 'backdrop-blur-sm',
};

// ====== BORDER LANGUAGE ======
// Single cinematic border system
const BORDER = {
  // Primary borders - main panels, modals
  PRIMARY: 'border-white/10',
  
  // Secondary borders - internal sections, dividers
  SECONDARY: 'border-white/5',
  
  // Accent borders - interactive elements, highlights
  ACCENT: 'border-violet-500/20',
  
  // System borders - critical elements
  SYSTEM: 'border-white/15',
  
  // Micro borders - tooltips, small elements
  MICRO: 'border-white/8',
};

// ====== SHADOW SYSTEM ======
// Ambient depth through consistent shadows
const SHADOW = {
  // Panel shadows - floating panels
  PANEL: 'shadow-2xl shadow-black/40',
  
  // Modal shadows - elevated surfaces
  MODAL: 'shadow-2xl shadow-black/60',
  
  // System shadows - deepest elements
  SYSTEM: 'shadow-3xl shadow-black/80',
  
  // Subtle shadows - tooltips, micro elements
  SUBTLE: 'shadow-lg shadow-black/20',
  
  // Glow shadows - interactive states
  GLOW: 'shadow-lg shadow-violet-500/20',
  
  // Hover shadows - interactive feedback
  HOVER: 'shadow-xl shadow-black/30',
};

// ====== RADIUS SYSTEM ======
// Consistent corner rounding
const RADIUS = {
  // Large panels, modals
  XL: 'rounded-2xl',
  
  // Medium panels, cards
  LG: 'rounded-xl',
  
  // Small elements, buttons
  MD: 'rounded-lg',
  
  // Micro elements, tooltips
  SM: 'rounded-md',
};

// ====== INTERACTIVE STATES ======
// Consistent hover and active states
const STATES = {
  // Hover state for panels
  PANEL_HOVER: 'hover:shadow-xl hover:border-white/15 hover:bg-[#161B27]/95',
  
  // Hover state for interactive elements
  INTERACTIVE_HOVER: 'hover:bg-white/10 hover:border-white/20 hover:shadow-lg',
  
  // Active state for pressed elements
  ACTIVE: 'active:scale-95 active:bg-white/5',
  
  // Focus state for inputs
  FOCUS: 'focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20',
};

// ====== DIVIDER SYSTEM ======
// Consistent section dividers
const DIVIDER = {
  // Primary dividers - main sections
  PRIMARY: 'border-white/10',
  
  // Secondary dividers - subsections
  SECONDARY: 'border-white/5',
  
  // Accent dividers - highlighted sections
  ACCENT: 'border-violet-500/20',
};

// ====== PRESET COMBINATIONS ======
// Ready-to-use atmosphere presets
// References only the constants declared above
const PRESETS = {
  // ====== PANELS ======
  CHAT_PANEL: [
    BACKGROUND.PANEL,
    BLUR.NEAR,
    BORDER.PRIMARY,
    SHADOW.PANEL,
    RADIUS.XL,
  ].join(' '),

  NOTIFICATION_PANEL: [
    BACKGROUND.PANEL,
    BLUR.NEAR,
    BORDER.PRIMARY,
    SHADOW.PANEL,
    RADIUS.XL,
  ].join(' '),

  TASK_BOARD: [
    BACKGROUND.PANEL,
    BLUR.NEAR,
    BORDER.PRIMARY,
    SHADOW.PANEL,
    RADIUS.XL,
  ].join(' '),

  // ====== MODALS ======
  SETTINGS_MODAL: [
    BACKGROUND.MODAL,
    BLUR.MID,
    BORDER.PRIMARY,
    SHADOW.MODAL,
    RADIUS.XL,
  ].join(' '),

  CREATE_TASK_MODAL: [
    BACKGROUND.MODAL,
    BLUR.MID,
    BORDER.PRIMARY,
    SHADOW.MODAL,
    RADIUS.XL,
  ].join(' '),

  // ====== MICRO ELEMENTS ======
  TOOLTIP: [
    BACKGROUND.TOOLTIP,
    BLUR.SUBTLE,
    BORDER.MICRO,
    SHADOW.SUBTLE,
    RADIUS.MD,
  ].join(' '),

  EMPTY_STATE: [
    BACKGROUND.EMPTY,
    BLUR.SUBTLE,
    BORDER.MICRO,
    SHADOW.SUBTLE,
    RADIUS.LG,
  ].join(' '),

  // ====== SYSTEM OVERLAYS ======
  BACKDROP: [
    'bg-black/60',
    BLUR.DEEP,
  ].join(' '),

  SYSTEM_OVERLAY: [
    BACKGROUND.SYSTEM,
    BLUR.DEEP,
    BORDER.SYSTEM,
    SHADOW.SYSTEM,
    RADIUS.XL,
  ].join(' '),
};

// ====== MAIN EXPORT ======
// Only export after all constants are declared
export const CINEMATIC = {
  BACKGROUND,
  BLUR,
  BORDER,
  SHADOW,
  RADIUS,
  STATES,
  DIVIDER,
  PRESETS,
};

// ====== UTILITY FUNCTIONS ======

/**
 * Get complete atmosphere class string for a component type
 */
export const getCinematicAtmosphere = (componentType) => {
  return CINEMATIC.PRESETS[componentType] || CINEMATIC.PRESETS.CHAT_PANEL;
};

/**
 * Get individual atmosphere property
 */
export const getAtmosphereProperty = (category, property) => {
  return CINEMATIC[category]?.[property] || '';
};

/**
 * Get interactive state classes
 */
export const getInteractiveStates = (...states) => {
  return states.map(state => CINEMATIC.STATES[state]).filter(Boolean).join(' ');
};

export default CINEMATIC;
