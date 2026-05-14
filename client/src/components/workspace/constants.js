// Workspace Design Tokens and Constants - Modern Cinematic Style
export const C = {
  // Core palette
  bg: 0x0B1020,
  surface: 0x131A2A,
  surface2: 0x1B2436,
  
  // Accent colors
  purple: 0x7C5CFF,
  cyan: 0x00D4FF,
  teal: 0x00D4AA,
  pink: 0xFF4FD8,
  amber: 0xFFB84D,
  
  // Text and UI
  text: 0xEAF2FF,
  muted: 0x7B8CA8,
  
  // Environment
  path: 0x161B27,
  wall: 0x2A3347,
  wallLine: 0x3A4560,
  table: 0x253044,
  sofa: 0x243040,
  plant: 0x1E3A2F,
  
  // Legacy support
  danger: 0xFF5B5B,
  border: 0xFFFFFF,
  grey: 0x8899AA,
  skin: 0xF1C8A4,
  skinDark: 0xC99A77,
  hair: 0x2B2438,
  shirt: 0x3D4863,
  
  // Glow and effects
  glowPurple: 0x7C5CFF40,
  glowCyan: 0x00D4FF40,
  glowTeal: 0x00D4AA40,
  neonBorder: 0x7C5CFF80,
};

// World Dimensions
export const W = 4000;
export const H = 4000;

// Center Points
export const CX = 2000;
export const CY = 2000;

// Path Width (corridors)
export const PATH_W = 200;

// Zone Boundaries
export const LEFT_X1 = 0;
export const LEFT_X2 = CX - PATH_W / 2;
export const RIGHT_X1 = CX + PATH_W / 2;
export const RIGHT_X2 = W;

export const TOP_Y1 = 0;
export const TOP_Y2 = CY - PATH_W / 2;
export const BOT_Y1 = CY + PATH_W / 2;
export const BOT_Y2 = H;
