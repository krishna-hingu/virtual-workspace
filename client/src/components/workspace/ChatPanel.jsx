import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';
import socket from "../../socket/socket";
import { Z_INDEX } from '../../constants/zIndex';
import { TRANSITION } from '../../constants/transitions';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

export const ChatPanel = () => {
  const { user } = useAuth();
  const messages = useWorkspaceStore((state) => state.messages);
  const users = 
    useWorkspaceStore((s) => s.users) || []; 
  const activePanel = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const setTyping = useUIStore((s) => s.setTyping);
  const isTyping = useUIStore((s) => s.isTyping);
  const { nearbyUser, selectedUser, mode: activeChatTab, setMode, togglePanel, wasOpenedByProximity, setSelectedUser } = useUIStore((state) => ({
    nearbyUser: state.nearbyUser,
    selectedUser: state.selectedUser,
    mode: state.activeChatTab,
    setMode: state.setActiveChatTab,
    togglePanel: state.togglePanel,
    wasOpenedByProximity: state.wasOpenedByProximity,
    setSelectedUser: state.setSelectedUser
  }));
  const [input, setInput] = useState('');
  const [isTypingUser, setIsTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentUserId = user?.id || user?._id;
  const selectedUserId = selectedUser?.id;

  if (activePanel !== "chat") return null;

  const filteredUsers = users.filter( 
    (u) => String(u.id) !== String(currentUserId) 
  );

  const filteredMessages = messages.filter((msg) => { 
    return !msg.type || msg.type === "nearby"; 
  }); 
  console.log("MESSAGES:", messages);
  console.log("FILTERED MESSAGES:", filteredMessages);

  // ENTER key enables typing
  useEffect(() => { 
    const handleEnter = (e) => { 
      if (e.key === "Enter") { 
        const state = useUIStore.getState(); 
 
        if (state.activePanel === "chat" && !state.isTyping) { 
          state.setTyping(true); 
          inputRef.current?.focus(); 
        } 
      } 
    }; 
 
    window.addEventListener("keydown", handleEnter); 
    return () => window.removeEventListener("keydown", handleEnter); 
  }, []);

  // ESC closes chat + stops typing
  useEffect(() => { 
    const handleEsc = (e) => { 
      if (e.key === "Escape") { 
        const state = useUIStore.getState(); 
 
        state.setActivePanel(null); 
        state.setTyping(false); 
      } 
    }; 
 
    window.addEventListener("keydown", handleEsc); 
    return () => window.removeEventListener("keydown", handleEsc); 
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const text = input;
    console.log("SENDING:", text);
    setInput("");

    const receiverId = 
      activeChatTab === "dm" 
        ? String(selectedUser?.id) 
        : String(nearbyUser?.id);

    const scene = window.Phaser?.GAMES?.[0]?.scene?.getScene("WorkspaceScene");

    if (socket) {
      const chatPayload = {
        message: text,
        type: activeChatTab, // "dm" or "nearby"
        senderId: currentUserId,
      senderName: user?.name,
      receiverId: receiverId,
      x: scene?.player?.x || 0,
      y: scene?.player?.y || 0,
      timestamp: Date.now()
      };
      console.log("EMITTING CHAT:", chatPayload);
      socket.emit("chat:send", chatPayload);
    }
  };

  const title = activeChatTab === "nearby" 
    ? `${nearbyUser?.name || "Nearby"} (Nearby)` 
    : `${selectedUser?.name || "DM"}`;

  return (
    <motion.div
      className={`fixed bottom-5 right-5 w-80 max-h-[60vh] min-h-[320px] flex flex-col ${CINEMATIC.PRESETS.CHAT_PANEL} overflow-hidden pointer-events-auto ${CINEMATIC.STATES.PANEL_HOVER}`}
      style={{ zIndex: Z_INDEX.PANEL }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: TRANSITION.NORMAL, ease: "easeOut" }}
    >
      <div className={`p-4 border-b ${CINEMATIC.DIVIDER.PRIMARY}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              {title}
            </h2>
            {nearbyUser && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
        </div>

        {activeChatTab === "nearby" && nearbyUser && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-2 flex items-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs text-primary font-medium">
              {nearbyUser.name} is nearby
            </p>
          </motion.div>
        )}

        {activeChatTab === "dm" && (
          <div className={`border-b ${CINEMATIC.DIVIDER.SECONDARY} p-2 max-h-[120px] overflow-y-auto`}>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary/60 mb-1 px-2 font-bold">Online Users</p>
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No users online"
                description="Waiting for team members to join"
              />
            ) : (
              filteredUsers.map((u) => (
                <div 
                  key={u.id} 
                  onClick={() => {
                    setSelectedUser(u);
                  }}
                  className={`px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all flex items-center gap-2 ${
                    selectedUser?.id === u.id 
                      ? "bg-primary/20 text-primary font-semibold" 
                      : `text-text-secondary ${CINEMATIC.STATES.INTERACTIVE_HOVER}`
                  }`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-50" />
                  {u.name}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs uppercase tracking-widest font-bold">No messages yet</p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isOwn = String(msg.senderId) === String(currentUserId);

            let bubbleStyle = "";
            if (msg.type === "nearby") {
              bubbleStyle = "bg-emerald-500/20 border border-emerald-400/20 text-text-primary";
            } else if (msg.type === "dm") {
              bubbleStyle = isOwn ? "bg-blue-500 text-white" : "bg-bg-tertiary text-text-primary border border-white/5";
            } else {
              bubbleStyle = isOwn ? "bg-primary text-white" : "bg-bg-tertiary text-text-primary border border-white/5";
            }

            // Stable unique key to prevent rendering issues
            const messageKey = `${msg.timestamp}_${msg.senderId}_${msg.content}`;

            return (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={messageKey}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] px-3 py-2 rounded-xl shadow-sm ${
                  isOwn ? "rounded-tr-none" : "rounded-tl-none"
                } ${bubbleStyle}`}>
                  {!isOwn && (
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      msg.type === 'nearby' ? 'text-emerald-400' : 'text-primary/80'
                    }`}>
                      {msg.senderName}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed break-words">
                    {msg.content}
                  </p>
                  <p className={`text-[10px] opacity-50 mt-1 text-right ${isOwn ? "text-white" : "text-text-secondary"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isTypingUser && (
        <div className="px-4 py-1">
          <p className="text-[10px] text-text-secondary animate-pulse italic">
            {isTypingUser} is typing...
          </p>
        </div>
      )}

      {/* Input */}
      <div className={`p-4 border-t ${CINEMATIC.DIVIDER.PRIMARY}`}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={nearbyUser ? `Chat with ${nearbyUser.name}...` : "Type a message..."}
            className={`input-primary flex-1 bg-bg-tertiary border-none text-text-primary placeholder:text-text-secondary/50 ${CINEMATIC.STATES.FOCUS}`}
          />
        </div>
        <p className="text-[9px] text-text-secondary mt-2 text-center opacity-50">
          Press ESC to close · ENTER to send
        </p>
      </div>
    </motion.div>
  );
};
