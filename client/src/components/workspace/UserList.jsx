import { motion } from 'framer-motion';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Tooltip } from '../shared/Tooltip';
import { EmptyState } from '../shared/LoadingStates';

export const UserList = ({ onUserClick }) => {
  const { users } = useWorkspaceStore();

  return (
    <motion.div
      className="glass bg-bg-secondary p-4 rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Online Users ({users.length})
      </h3>

      {users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users online"
          description="Waiting for team members"
        />
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <motion.div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors"
              onClick={() => onUserClick?.(user.id)}
              whileHover={{ x: 4 }}
            >
              <Tooltip text={user.status}>
                <div
                  className={`
                    w-8 h-8 rounded-full border-2 border-primary
                    flex items-center justify-center text-xs font-bold
                    ${
                      user.status === 'focus'
                        ? 'animate-pulse-glow'
                        : ''
                    }
                  `}
                  style={{
                    backgroundColor: user.avatarColor || '#6C63FF',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Tooltip>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user.name}
                </p>
                <p className="text-xs text-text-secondary">{user.status}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
