import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspaceStore } from '../../store/workspaceStore';
import CinematicLoader from '../../components/shared/CinematicLoader';

const WorkspaceLoader = () => {
  const workspaceLoaded = useWorkspaceStore((state) => state.workspaceLoaded);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // When workspace is ready, hide loader after minimum time
    if (workspaceLoaded && isLoading) {
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  }, [workspaceLoaded, isLoading]);

  // Don't render loader if workspace is loaded
  if (workspaceLoaded && !isLoading) {
    return null;
  }

  return <CinematicLoader text="Initializing workspace..." />;
};

export default WorkspaceLoader;
