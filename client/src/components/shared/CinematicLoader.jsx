import React from 'react';
import { motion } from 'framer-motion';
import { Z_INDEX } from '../../constants/zIndex';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

/**
 * CinematicLoader - A shared presentational component for all loading states.
 * 
 * GOLDEN VISUAL REFERENCE: WorkHistoryPage.jsx
 * This component provides the standardized atmospheric background, 
 * cinematic gradients, and the unified spinner/typography system.
 * 
 * IMPORTANT: This component is PRESENTATIONAL ONLY. It does not contain 
 * any lifecycle logic, socket connections, or auth state.
 */
const CinematicLoader = ({ text = 'Loading...', zIndex = Z_INDEX.SYSTEM_OVERLAY }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed inset-0 flex items-center justify-center ${CINEMATIC.PRESETS.SYSTEM_OVERLAY}`}
      style={{ zIndex }}
    >
      {/* Environmental atmospheric layers - Standardized Cinematic Depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary atmospheric glow - Animated pulse for "living" feel */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-violet-900/20 via-transparent to-cyan-900/10 animate-pulse" 
          style={{ animationDuration: '8s' }} 
        />
        
        {/* Deep cinematic vignette for focal concentration */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/60" />
        
        {/* Subtle atmospheric diffusion layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-purple-900/5" />
      </div>

      {/* Content Container */}
      <div className="relative flex flex-col items-center gap-5">
        {/* Standardized Cinematic Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
        />
        
        {/* Standardized Loading Typography */}
        <div className="text-white/80 text-sm font-medium tracking-wide">
          {text}
        </div>
      </div>
    </motion.div>
  );
};

export default CinematicLoader;
