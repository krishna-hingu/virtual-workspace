/**
 * Centralized Transition Duration Constants
 * 
 * Ensures consistent UI feel across the system.
 * Use these constants instead of magic numbers.
 * 
 * Duration Guidelines:
 * - FAST: Hover states, micro-interactions
 * - NORMAL: Modals, panels, standard transitions
 * - SLOW: Page transitions, significant state changes
 * - LOADER: Loading screen fade in/out
 */

export const TRANSITION = {
  FAST: 0.15,    // Hover states, dropdowns
  NORMAL: 0.2,   // Modals, panels, standard UI transitions
  SLOW: 0.3,     // Page transitions, significant state changes
  LOADER: 0.5,   // Loading screen fade in/out
  SPRING: 0.25,  // Spring-based animations (modal enter/exit)
};
