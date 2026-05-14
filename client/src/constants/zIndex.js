/**
 * Centralized Z-Index Hierarchy
 * 
 * Prevents z-index wars and overlay conflicts.
 * Use these constants instead of magic numbers.
 * 
 * Hierarchy:
 * - BASE: Default content layer
 * - PANEL: Floating panels (chat, notifications)
 * - MODAL: Modal dialogs
 * - DROPDOWN: Dropdown menus
 * - TOOLTIP: Tooltips and popovers
 * - SYSTEM_OVERLAY: Critical system overlays (workspace loader, etc.)
 */

export const Z_INDEX = {
  BASE: 1,
  PANEL: 50,
  MODAL: 100,
  DROPDOWN: 200,
  TOOLTIP: 500,
  SYSTEM_OVERLAY: 1000,
};
