export const loadingVariants = {
  // Phase 1 - Boot
  boot: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 2.5,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      transition: { 
        duration: 1.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Logo animation
  logo: {
    initial: { 
      opacity: 0,
      scale: 0.8,
      filter: "blur(20px)"
    },
    animate: { 
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { 
        duration: 2,
        ease: [0.4, 0, 0.2, 1],
        delay: 0.5
      }
    }
  },

  // Logo glow pulse
  logoGlow: {
    animate: {
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.05, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Phase 2 - Ambient Environment
  ambient: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 3,
        ease: [0.4, 0, 0.2, 1],
        delay: 1
      }
    }
  },

  // Phase 3 - System Initialization
  systemInit: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 1.5,
        ease: [0.4, 0, 0.2, 1],
        delay: 2
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { 
        duration: 1,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Loading message transitions
  message: {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { 
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Phase 4 - Workspace Entry
  workspaceEntry: {
    initial: { opacity: 1 },
    animate: { 
      opacity: 0,
      scale: 1.05,
      transition: { 
        duration: 2.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Loading progress
  progressBar: {
    initial: { width: "0%" },
    animate: { 
      width: "100%",
      transition: { 
        duration: 8,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Floating elements
  floating: {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Subtle rotation
  rotating: {
    animate: {
      rotate: [0, 360],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  }
};
