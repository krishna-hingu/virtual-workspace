export const loadingMessages = [
  {
    id: 'init',
    message: 'Initializing workspace systems',
    duration: 2000,
    phase: 'system'
  },
  {
    id: 'sync',
    message: 'Synchronizing realtime environment',
    duration: 2500,
    phase: 'system'
  },
  {
    id: 'collab',
    message: 'Rendering collaborative office',
    duration: 2000,
    phase: 'system'
  },
  {
    id: 'render',
    message: 'Preparing immersive workspace',
    duration: 2500,
    phase: 'system'
  },
  {
    id: 'connect',
    message: 'Establishing neural connections',
    duration: 1800,
    phase: 'system'
  },
  {
    id: 'optimize',
    message: 'Calibrating spatial systems',
    duration: 1500,
    phase: 'system'
  },
  {
    id: 'ready',
    message: 'Workspace awakening complete',
    duration: 1000,
    phase: 'final'
  }
];

export const getTotalLoadingTime = () => {
  return loadingMessages.reduce((total, msg) => total + msg.duration, 0);
};

export const getMessagesByPhase = (phase) => {
  return loadingMessages.filter(msg => msg.phase === phase);
};
