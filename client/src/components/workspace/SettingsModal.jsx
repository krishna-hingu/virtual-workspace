import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { Z_INDEX } from '../../constants/zIndex';
import { TRANSITION } from '../../constants/transitions';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';
import { useWorkspaceStore } from '../../store/workspaceStore';
import modalManager from '../../utils/modalManager';

export function SettingsModal() {
  const { setActivePanel } = useUIStore();
  const { user, logout } = useAuth();
  const { users } = useWorkspaceStore();
  
  const [settings, setSettings] = useState({
    sound: true,
    notifications: true,
    animations: true,
    performanceMode: false,
  });

  const modalId = 'settings-modal';

  useEffect(() => {
    // Register modal with modal manager
    modalManager.registerModal(modalId, () => setActivePanel(null));

    // Load settings from localStorage
    const loadedSettings = {
      sound: localStorage.getItem('vw_sound') === 'true',
      notifications: localStorage.getItem('vw_notifications') === 'true',
      animations: localStorage.getItem('vw_animations') === 'true',
      performanceMode: localStorage.getItem('vw_performanceMode') === 'true',
    };
    setSettings(loadedSettings);

    return () => {
      modalManager.unregisterModal(modalId);
    };
  }, [modalId, setActivePanel]);

  const handleLogout = () => {
    logout();
    setActivePanel(null);
  };

  const handleLeaveWorkspace = () => {
    // TODO: Implement leave workspace logic
    console.log('Leave workspace clicked');
    setActivePanel(null);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`vw_${key}`, value.toString());
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 flex items-center justify-center ${CINEMATIC.PRESETS.BACKDROP}`}
      style={{ zIndex: Z_INDEX.MODAL }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ duration: TRANSITION.SPRING, type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md md:max-w-xl lg:max-w-2xl mx-4 md:mx-6 p-4 md:p-6 max-h-[85vh] overflow-y-auto ${CINEMATIC.PRESETS.SETTINGS_MODAL}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button 
            onClick={() => setActivePanel(null)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Account Section */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-semibold text-slate-300 uppercase tracking-wider">Account</h3>
            <div className={`flex items-center gap-4 p-4 rounded-xl bg-white/5 ${CINEMATIC.BORDER.MICRO}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{user.name || 'Unknown User'}</p>
                <p className="text-slate-400 text-sm">{user.email || 'No email'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-slate-500">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Section */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-semibold text-slate-300 uppercase tracking-wider">Workspace</h3>
            <div className="space-y-2 md:space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg bg-white/5 ${CINEMATIC.BORDER.MICRO} ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}>
                <div>
                  <p className="text-white font-medium">Sound Effects</p>
                  <p className="text-slate-400 text-[11px] md:text-xs">Enable workspace sounds</p>
                </div>
                <button
                  onClick={() => handleSettingChange('sound', !settings.sound)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.sound ? 'bg-violet-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.sound ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg bg-white/5 ${CINEMATIC.BORDER.MICRO} ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}>
                <div>
                  <p className="text-white font-medium">Notifications</p>
                  <p className="text-slate-400 text-[11px] md:text-xs">Show desktop notifications</p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', !settings.notifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications ? 'bg-violet-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg bg-white/5 ${CINEMATIC.BORDER.MICRO} ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}>
                <div>
                  <p className="text-white font-medium">Animations</p>
                  <p className="text-slate-400 text-[11px] md:text-xs">Enable UI animations</p>
                </div>
                <button
                  onClick={() => handleSettingChange('animations', !settings.animations)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.animations ? 'bg-violet-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.animations ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg bg-white/5 ${CINEMATIC.BORDER.MICRO} ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}>
                <div>
                  <p className="text-white font-medium">Performance Mode</p>
                  <p className="text-slate-400 text-[11px] md:text-xs">Reduce visual effects</p>
                </div>
                <button
                  onClick={() => handleSettingChange('performanceMode', !settings.performanceMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.performanceMode ? 'bg-violet-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.performanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Session Section */}
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-semibold text-slate-300 uppercase tracking-wider">Session</h3>
            <div className="space-y-2 md:space-y-3">
              <button
                onClick={handleLeaveWorkspace}
                className={`w-full p-3 rounded-lg bg-white/5 ${CINEMATIC.BORDER.MICRO} text-left ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}
              >
                <p className="text-white font-medium">Leave Workspace</p>
                <p className="text-slate-400 text-[11px] md:text-xs">Exit current workspace</p>
              </button>

              <button
                onClick={handleLogout}
                className={`w-full p-3 rounded-lg bg-red-500/10 ${CINEMATIC.BORDER.ACCENT} text-left hover:bg-red-500/20 transition-colors`}
              >
                <p className="text-red-400 font-medium">Logout</p>
                <p className="text-red-400/60 text-[11px] md:text-xs">Sign out of your account</p>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
