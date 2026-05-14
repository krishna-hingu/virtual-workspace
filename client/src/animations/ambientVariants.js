export const ambientVariants = {
  // Background gradient animation
  gradientShift: {
    animate: {
      background: [
        "linear-gradient(135deg, #0B1020 0%, #1a1f3a 50%, #0f172a 100%)",
        "linear-gradient(135deg, #1a1f3a 0%, #0f172a 50%, #0B1020 100%)",
        "linear-gradient(135deg, #0f172a 0%, #0B1020 50%, #1a1f3a 100%)",
        "linear-gradient(135deg, #0B1020 0%, #1a1f3a 50%, #0f172a 100%)"
      ],
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Floating particles
  particle: {
    initial: { 
      opacity: 0,
      scale: 0
    },
    animate: { 
      opacity: [0, 0.6, 0],
      scale: [0, 1, 0],
      y: [-20, -100],
      x: [0, 30, -30, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 8
      }
    }
  },

  // Glass wave motion
  glassWave: {
    animate: {
      y: [-5, 5, -5],
      scaleY: [1, 1.02, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Blur layers depth
  blurLayer: {
    animate: {
      opacity: [0.1, 0.3, 0.1],
      scale: [1, 1.1, 1],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Neon edge glow
  neonGlow: {
    animate: {
      boxShadow: [
        "0 0 20px rgba(124, 92, 255, 0.3)",
        "0 0 40px rgba(124, 92, 255, 0.6)",
        "0 0 60px rgba(124, 92, 255, 0.4)",
        "0 0 20px rgba(124, 92, 255, 0.3)"
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Ambient light orbs
  lightOrb: {
    animate: {
      x: [-50, 50, -50],
      y: [-30, 30, -30],
      opacity: [0.2, 0.5, 0.2],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 10
      }
    }
  },

  // Cinematic depth layers
  depthLayer: {
    initial: { 
      opacity: 0,
      scale: 1.1
    },
    animate: { 
      opacity: [0, 0.15, 0],
      scale: [1.1, 1, 1.1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Subtle mesh gradient
  meshGradient: {
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },

  // Floating geometric shapes
  geometricShape: {
    animate: {
      rotate: [0, 180, 360],
      y: [-20, 20, -20],
      opacity: [0.1, 0.3, 0.1],
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Ambient pulse rings
  pulseRing: {
    animate: {
      scale: [1, 1.5, 2],
      opacity: [0.4, 0.2, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  }
};
