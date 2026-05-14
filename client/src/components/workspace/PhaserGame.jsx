import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSocketEmit, useSocketEvent } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

export const PhaserGame = () => {
  const gameRef = useRef(null);
  const { user } = useAuth();
  const { currentUserPosition, setCurrentUserPosition } = useWorkspaceStore();
  const emit = useSocketEmit();

  useSocketEvent('avatar:moved', (data) => {
    // Update remote player position
    if (gameRef.current?.scene?.scenes[0]) {
      const scene = gameRef.current.scene.scenes[0];
      // Emit update to scene if it has a handler
      if (scene.updateRemotePlayer) {
        scene.updateRemotePlayer(data.userId, data.position);
      }
    }
  });

  useEffect(() => {
    if (!gameRef.current || !user) return;

    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: window.innerWidth - 280, // Sidebar width
      height: window.innerHeight,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload() {
          // Load assets here
        },
        create() {
          // Initialize workspace scene
          this.input.keyboard.on('keydown', (event) => {
            handleKeyboardInput(event, this);
          });
        },
        update() {
          // Update game logic
        },
      },
    };

    let game = new Phaser.Game(config);

    const handleKeyboardInput = (event, scene) => {
      const speed = 5;
      switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setCurrentUserPosition({
            x: currentUserPosition.x,
            y: currentUserPosition.y - speed,
          });
          emit('avatar:move', {
            userId: user.id,
            position: {
              x: currentUserPosition.x,
              y: currentUserPosition.y - speed,
            },
          });
          break;
        case 'arrowdown':
        case 's':
          setCurrentUserPosition({
            x: currentUserPosition.x,
            y: currentUserPosition.y + speed,
          });
          emit('avatar:move', {
            userId: user.id,
            position: {
              x: currentUserPosition.x,
              y: currentUserPosition.y + speed,
            },
          });
          break;
        case 'arrowleft':
        case 'a':
          setCurrentUserPosition({
            x: currentUserPosition.x - speed,
            y: currentUserPosition.y,
          });
          emit('avatar:move', {
            userId: user.id,
            position: {
              x: currentUserPosition.x - speed,
              y: currentUserPosition.y,
            },
          });
          break;
        case 'arrowright':
        case 'd':
          setCurrentUserPosition({
            x: currentUserPosition.x + speed,
            y: currentUserPosition.y,
          });
          emit('avatar:move', {
            userId: user.id,
            position: {
              x: currentUserPosition.x + speed,
              y: currentUserPosition.y,
            },
          });
          break;
        default:
          break;
      }
    };

    return () => {
      game.destroy(true);
    };
  }, [user, currentUserPosition, setCurrentUserPosition, emit]);

  return (
    <div
      ref={gameRef}
      className="w-full h-full bg-bg-tertiary"
      style={{ flex: 1 }}
    />
  );
};
