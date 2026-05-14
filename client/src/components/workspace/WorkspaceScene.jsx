import React, { useEffect, useRef } from "react";
import socketInstance from "../../socket/socket";
import { useAuth } from "../../hooks/useAuth";
import * as NotificationEvents from "../../utils/notificationEvents";
import { useWorkspaceStore } from "../../store/workspaceStore";

let __currentUserId = null;

function WorkspaceScene() {
  const initializedRef = useRef(false);
  const gameRef = useRef(null);
  const { user } = useAuth();
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    // TODO: handle via React UI layer (do not control from Phaser)
  }, []);

  useEffect(() => {
    // Wait for user to be loaded from auth store and have a valid ID
    const userId = user?.id || user?._id;
    if (!user || !userId) {
      console.log("WorkspaceScene: User not ready or missing ID:", user);
      return;
    }

    // Guard against double-initialization
    if (initializedRef.current) {
      console.log("WorkspaceScene: Already initialized, skipping...");
      // Even if already initialized, ensure __currentUserId is correct
      __currentUserId = userId;
      return;
    }
    initializedRef.current = true;

    const PHASER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js";

    let _sceneStarted = false;
    function runWorkspace(userData) { 
      if (_sceneStarted) { 
        console.log("⚠️ Prevented duplicate scene start"); 
        return; 
      } 
 
      _sceneStarted = true; 
 
      if (!userData || (!userData.id && !userData._id)) {
        console.error("❌ runWorkspace: User data invalid or missing ID:", userData);
        initializedRef.current = false;
        return;
      }

        let sceneRef = null;
        __currentUserId = userData.id || userData._id;
        window.authUserId = __currentUserId;
        console.log("✅ window.authUserId SET:", window.authUserId);
        const socket = socketInstance;
      console.log("Starting workspace with user:", __currentUserId);
      // ORIGINAL INLINE SCRIPT — preserved verbatim, no logic changes
      // ===========================================================================
      // ═══════════════════════════════════════════════════════════════════════════════
      // DESIGN TOKENS
      // ═══════════════════════════════════════════════════════════════════════════════
      const C = {
        bg: 0x0F1117, surface: 0x1E2534, path: 0x161B27,
        purple: 0x6C63FF, teal: 0x00D4AA, danger: 0xFF5B5B,
        text: 0xE8EAF0, border: 0xFFFFFF, wall: 0x2A3347,
        wallLine: 0x3A4560, table: 0x253044, sofa: 0x243040, plant: 0x1E3A2F,
        amber: 0xFFB84C, grey: 0x8899AA,
        skin: 0xF1C8A4, skinDark: 0xC99A77, hair: 0x2B2438, shirt: 0x3D4863,
      };
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // AVATAR COLOR SYSTEM — deterministic from userId, consistent across clients
      // ═══════════════════════════════════════════════════════════════════════════════
      const AVATAR_COLORS = [
        '#6C63FF', // Purple
        '#00D4FF', // Cyan
        '#00D4AA', // Teal
        '#FF6B9D', // Coral
        '#7C4DFF', // Violet
        '#FFB84C', // Amber
        '#FF5B5B', // Red
        '#4CAF50', // Green
        '#2196F3', // Blue
        '#FF9800', // Orange
        '#E91E63', // Pink
        '#00BCD4', // Light Blue
        '#8BC34A', // Light Green
        '#CDDC39', // Lime
        '#FF5722', // Deep Orange
        '#9C27B0', // Deep Purple
      ];

      function getAvatarColor(userId) {
        if (!userId) return AVATAR_COLORS[0];
        const str = String(userId);
        // Simple but effective string hash for deterministic color selection
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        const index = Math.abs(hash) % AVATAR_COLORS.length;
        return AVATAR_COLORS[index];
      }

      // ═══════════════════════════════════════════════════════════════════════════════
      // GLOBAL INPUT GUARDS — prevent Phaser from hijacking keys while typing.
      // Stops the WASD/Space/E/Enter/M/F/1-4 bug inside chat input, whiteboard
      // sticky notes, command palette, avatar settings, etc.
      // ═══════════════════════════════════════════════════════════════════════════════
      function IS_TYPING() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (el.isContentEditable) return true;
        return false;
      }
      function ensureTypingGuard() {
        if (window.__WorkspaceSceneTypingGuard) return;
        window.__WorkspaceSceneTypingGuard = true;
        ['keydown','keyup','keypress'].forEach(evt => {
          window.addEventListener(evt, e => {
            if (IS_TYPING()) {
              // Allow Escape/Enter to bubble for our own panel handlers.
              if (e.key === 'Escape' || e.key === 'Enter') return;
              e.stopPropagation();
            }
          }, true);
        });
      }
      ensureTypingGuard();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // WORKSPACE CONFIG
      // ═══════════════════════════════════════════════════════════════════════════════
      const W = 1400, H = 900, PATH_W = 80, CX = W / 2, CY = H / 2;
      const LEFT_X1 = 0,          LEFT_X2  = CX - PATH_W / 2;
      const RIGHT_X1 = CX + PATH_W / 2, RIGHT_X2 = W;
      const TOP_Y1 = 0,           TOP_Y2   = CY - PATH_W / 2;
      const BOT_Y1 = CY + PATH_W / 2,   BOT_Y2  = H;

      let lastObjectEmit = 0;
      function emitObjectState(objectId, state, x, y) {
        if (!state) {
          console.warn("Attempted to emit undefined state for object:", objectId);
          return;
        }
        
        const now = Date.now();
        if (now - lastObjectEmit < 100) return; // 100ms throttle
        lastObjectEmit = now;

        // Add versioning
        state.updatedAt = now;

        socket.emit("object:state", { 
          objectId, 
          state,
          x,
          y
        });
      }
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // AVATAR DATA — structured for multiplayer-ready extension
      // ═══════════════════════════════════════════════════════════════════════════════
      const OTHERS = [
        { id: 'a1', name: 'Alex',   x: 190, y: 195, status: 'focus',  color: C.purple },
        { id: 'a2', name: 'Sam',    x: 340, y: 195, status: 'normal', color: C.teal   },
        { id: 'a3', name: 'Jordan', x: 190, y: 390, status: 'busy',   color: C.danger },
        { id: 'a4', name: 'Riley',  x: 990, y: 195, status: 'normal', color: C.teal   },
      ];
      
      const STATUS_META = {
        normal: { label: 'Available', color: '#00D4AA', hex: C.teal   },
        busy:   { label: 'Busy',      color: '#FF5B5B', hex: C.danger },
        focus:  { label: 'Focus',     color: '#6C63FF', hex: C.purple },
        away:   { label: 'Away',      color: '#8899AA', hex: C.grey   },
      };
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // TOAST SYSTEM
      // ═══════════════════════════════════════════════════════════════════════════════
      const Toast = (() => {
        const el = document.getElementById('toast');
        const msgEl = document.getElementById('toast-msg');
        const iconEl = document.getElementById('toast-icon');
        let timer = null;
        const TYPES = {
          info:    { cls: 'toast-teal',   icon: 'ℹ' },
          success: { cls: 'toast-teal',   icon: '✓' },
          warn:    { cls: 'toast-amber',  icon: '⚠' },
          error:   { cls: 'toast-red',    icon: '✕' },
          action:  { cls: 'toast-purple', icon: '⬡' },
        };
        const ToastObj = {
          show(msg, type = 'info', duration = 2800) {
            const t = TYPES[type] || TYPES.info;
            el.className = `show ${t.cls}`;
            iconEl.textContent = t.icon;
            msgEl.textContent = msg;
            clearTimeout(timer);
            timer = setTimeout(() => { el.className = el.className.replace('show','').trim(); }, duration);
          },
          hide() { el.className = el.className.replace('show','').trim(); clearTimeout(timer); }
        };
        window.__PhaserToast = ToastObj;
        return ToastObj;
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // ZONE BADGE
      // ═══════════════════════════════════════════════════════════════════════════════
      const ZoneBadge = (() => {
        const nameEl = document.getElementById('zone-name');
        const dotEl  = document.getElementById('zone-dot');
        const tintEl = document.getElementById('zone-tint');
        const dotColors  = { work:'#00D4AA', meeting:'#6C63FF', chill:'#FFB84C', corridor:'rgba(200,205,220,0.4)' };
        const tintColors = {
          work:     'rgba(0,60,120,0.06)',
          meeting:  'rgba(60,30,120,0.08)',
          chill:    'rgba(10,30,10,0.09)',
          corridor: 'transparent',
        };
        let current = '';
        return {
          set(zone) {
            if (zone === current) return;
            current = zone;
            const labels = { work:'Work Area', meeting:'Meeting Room', chill:'Chill Zone', corridor:'Corridor' };
            nameEl.textContent = labels[zone] || 'Corridor';
            dotEl.style.background = dotColors[zone] || dotColors.corridor;
            tintEl.style.background = tintColors[zone] || 'transparent';
          }
        };
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // SIT BADGE
      // ═══════════════════════════════════════════════════════════════════════════════
      const SitBadge = (() => {
        const el = document.getElementById('sit-badge');
        return { show() { el.classList.add('show'); }, hide() { el.classList.remove('show'); } };
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // CHAT SYSTEM
      // ═══════════════════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════════════════
      // MINIMAP SYSTEM
      // ═══════════════════════════════════════════════════════════════════════════════
      const Minimap = (() => {
        const canvas = document.getElementById('minimap-canvas');
        const ctx = canvas.getContext('2d');
        const MW = 130, MH = 84;
        const SX = MW / W, SY = MH / H; // scale factors
      
        function toMap(wx, wy) { return [Math.round(wx * SX), Math.round(wy * SY)]; }
      
        return {
          draw(playerX, playerY, others) {
            ctx.clearRect(0, 0, MW, MH);
      
            // Background
            ctx.fillStyle = 'rgba(15,17,23,0.9)';
            ctx.fillRect(0, 0, MW, MH);
      
            // Zone regions
            const zones = [
              { x: 0, y: 0, w: LEFT_X2, h: H, color: 'rgba(0,212,170,0.08)' },
              { x: RIGHT_X1, y: 0, w: RIGHT_X2 - RIGHT_X1, h: TOP_Y2, color: 'rgba(108,99,255,0.1)' },
              { x: RIGHT_X1, y: BOT_Y1, w: RIGHT_X2 - RIGHT_X1, h: BOT_Y2 - BOT_Y1, color: 'rgba(255,184,76,0.08)' },
            ];
            zones.forEach(z => {
              ctx.fillStyle = z.color;
              ctx.fillRect(z.x * SX, z.y * SY, z.w * SX, z.h * SY);
            });
      
            // Corridors
            ctx.fillStyle = 'rgba(22,27,39,0.9)';
            ctx.fillRect((CX - PATH_W / 2) * SX, 0, PATH_W * SX, MH);
            ctx.fillRect(0, (CY - PATH_W / 2) * SY, MW, PATH_W * SY);
      
            // Other avatars
            others.forEach(av => {
              const [mx, my] = toMap(av.container.x, av.container.y);
              ctx.beginPath();
              ctx.arc(mx, my, 3, 0, Math.PI * 2);
              const hex = STATUS_META[av.data.status]?.color || '#00D4AA';
              ctx.fillStyle = hex;
              ctx.fill();
            });
      
            // Player dot
            const [px, py] = toMap(playerX, playerY);
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, Math.PI * 2);
            
            // Dynamic player status color
            const playerStatus = sceneRef?.playerStatus || 'normal';
            ctx.fillStyle = STATUS_META[playerStatus]?.color || '#6C63FF';
            ctx.fill();
      
            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, MW - 1, MH - 1);
          }
        };
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // FOLLOW UI
      // ═══════════════════════════════════════════════════════════════════════════════
      const FollowUI = (() => {
        const bar   = document.getElementById('follow-bar');
        const label = document.getElementById('follow-label');
        const stop  = document.getElementById('follow-stop');
        let onStop = null;
        stop.addEventListener('click', () => { if (onStop) onStop(); });
        return {
          show(name) { label.textContent = `Following ${name}`; bar.classList.add('show'); },
          hide()     { bar.classList.remove('show'); },
          onStop(fn) { onStop = fn; }
        };
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // AUDIO — Web Audio API, ultra-lightweight
      // ═══════════════════════════════════════════════════════════════════════════════
      const Audio = (() => {
        let ctx = null, ambient = null, lastZone = 'corridor';
        function getCtx() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; }
        function beep(freq, dur, vol = 0.035, type = 'sine') {
          try { const ac = getCtx(); const osc = ac.createOscillator(); const gain = ac.createGain(); osc.connect(gain); gain.connect(ac.destination); osc.frequency.value = freq; osc.type = type; gain.gain.setValueAtTime(vol, ac.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur); osc.start(); osc.stop(ac.currentTime + dur); } catch(e) {}
        }
        function setZone(zone) {
          if (zone === lastZone) return; lastZone = zone;
          try {
            const ac = getCtx(); if (ambient) { ambient.gain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + .25); ambient.osc.stop(ac.currentTime + .3); }
            const map = { work:[92,'sine',0.008], chill:[174,'triangle',0.007], meeting:[132,'sine',0.005] };
            if (!map[zone]) return;
            const [freq,type,vol]=map[zone]; const osc=ac.createOscillator(); const gain=ac.createGain(); osc.type=type; osc.frequency.value=freq; gain.gain.value=0.0001; osc.connect(gain); gain.connect(ac.destination); osc.start(); gain.gain.linearRampToValueAtTime(vol, ac.currentTime + .8); ambient={osc,gain};
          } catch(e) {}
        }
        return {
          footstep() { beep(118 + Math.random()*24, 0.035, 0.018, 'square'); },
          footstop() { beep(82, 0.045, 0.014, 'triangle'); },
          sit() { beep(440, 0.1, 0.035); beep(660, 0.08, 0.024); },
          interact() { beep(880, 0.07, 0.03); }, click() { beep(620, 0.035, 0.022); },
          send() { beep(760, 0.045, 0.026); },
          deny() { beep(220, 0.15, 0.038, 'sawtooth'); },
          notify() { beep(660, 0.08, 0.03); setTimeout(() => beep(880, 0.08, 0.024), 100); },
          setZone,
        };
      })();
      
      
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // PRODUCT-LAYER SYSTEMS — modular upgrades, socket-ready boundaries
      // ═══════════════════════════════════════════════════════════════════════════════
      const ProductLayer = (() => {
        const qs = id => document.getElementById(id);
        const state = {
          room: localStorage.getItem('vw.room') || 'Workspace A',
          theme: localStorage.getItem('vw.theme') || 'dark',
          muted: false,
          avatar: JSON.parse(localStorage.getItem('vw.avatar') || '{"color":"purple","initial":"★","style":"normal"}'),
        };
        // ── MULTIPLAYER SCAFFOLD ──
        const socketBridge = (() => {
          // Movement throttling system
          let lastMoveEmit = 0;
          const MOVE_EMIT_THROTTLE = 50; // 50ms = max 20 emits/sec
          
          const handlers = {
            onUserMove(payload) { 
              const now = Date.now();
              if (now - lastMoveEmit > MOVE_EMIT_THROTTLE) {
                socket?.emit?.('player:move', payload); 
                lastMoveEmit = now;
              }
            },
            connect() {
              const conn = socket;
              const scene = sceneRef;
              if (!conn) return;

              // If scene not ready, wait for initialization
              if (!scene) {
                console.warn("WorkspaceScene connect() called before scene initialization, waiting for scene ready");
                return;
              }

              // Initialize callback registry if not exists
              if (!scene._socketCallbacks) {
                scene._socketCallbacks = {};
              }

              // Clean up previous callbacks with references
              if (scene._socketCallbacks.userLeft) conn.off('user:left', scene._socketCallbacks.userLeft);
              if (scene._socketCallbacks.chatReceive) conn.off('chat:receive', scene._socketCallbacks.chatReceive);
              if (scene._socketCallbacks.playersInit) conn.off('players:init', scene._socketCallbacks.playersInit);
              if (scene._socketCallbacks.userJoined) conn.off('user:joined', scene._socketCallbacks.userJoined);
              if (scene._socketCallbacks.taskAssigned) conn.off('task:assigned', scene._socketCallbacks.taskAssigned);
              if (scene._socketCallbacks.focusUpdated) conn.off('focus:updated', scene._socketCallbacks.focusUpdated);
              if (scene._socketCallbacks.connect) conn.off('connect', scene._socketCallbacks.connect);

          // window.WorkspaceSceneRef removal — replaced by internal listeners

          // Define callbacks and store references
          scene._socketCallbacks.userLeft = (data) => {
            NotificationEvents.handleUserLeft(data);
            const currentScene = sceneRef;
            if (currentScene && currentScene._remoteLeave) {
              currentScene._remoteLeave(data);
            }
          };

          scene._socketCallbacks.chatReceive = (data) => {
            // Use sceneRef instead of captured scene to avoid null reference
            const currentScene = sceneRef;
            if (!currentScene) return;

            // Throttle chat updates to prevent React rerender loops
            if (!currentScene._lastChatUpdate || Date.now() - currentScene._lastChatUpdate > 100) {
              const { addMessage } = useWorkspaceStore.getState();
              addMessage(data);
              currentScene._lastChatUpdate = Date.now();
            }
          };

          scene._socketCallbacks.playersInit = (data) => {
            if (!scene) {
              setTimeout(() => {
                if (sceneRef && sceneRef._remoteInit) {
                  sceneRef._remoteInit(data);
                }
              }, 500);
              return;
            }
            scene._remoteInit(data); // Use scene instead of this
          };

          scene._socketCallbacks.userJoined = (data) => {
            const currentScene = sceneRef;
            if (!currentScene) {
              // Scene not ready yet, retry shortly
              setTimeout(() => {
                if (sceneRef && sceneRef._remoteJoin) {
                  sceneRef._remoteJoin(data);
                }
              }, 500);
              return;
            }
            currentScene._remoteJoin(data);
          };

          scene._socketCallbacks.taskAssigned = (data) => {
            NotificationEvents.handleTaskAssigned(data);
          };

          scene._socketCallbacks.focusUpdated = (data) => {
            const currentScene = sceneRef;
            if (!currentScene || !data.userId) return;
            
            const remote = currentScene.otherPlayers[data.userId];
            if (remote) {
              remote.data.status = data.focusMode ? 'focus' : 'normal';
              currentScene.updateAvatarStatus(remote.container, remote.data.status);
            }
          };

          scene._socketCallbacks.connect = () => {
            const userId = userData?.id || userData?._id || __currentUserId;
            const payload = {
              userId: userId,
              name: userData?.name || 'Unknown'
            };

            if (!userId) {
              console.warn('Cannot emit user:join: userId is null');
              return;
            }

            socket.emit('user:join', payload);
          };

          // Register listeners with callback references
          conn.on('user:left', scene._socketCallbacks.userLeft);
          conn.on('chat:receive', scene._socketCallbacks.chatReceive);
          conn.on('players:init', scene._socketCallbacks.playersInit);
          conn.on('user:joined', scene._socketCallbacks.userJoined);
          conn.on('task:assigned', scene._socketCallbacks.taskAssigned);
          conn.on('focus:updated', scene._socketCallbacks.focusUpdated);
          conn.on('connect', scene._socketCallbacks.connect);

          // Emit user:join immediately after listeners are registered
          // This ensures players:init is received by the registered listener
          const userId = userData?.id || userData?._id || __currentUserId;
          const payload = {
            userId: userId,
            name: userData?.name || 'Unknown'
          };

          if (!userId) {
            console.warn('Cannot emit user:join: userId is null');
          } else if (socket.connected) {
            socket.emit('user:join', payload);
          } else {
            socket.once('connect', () => {
              socket.emit('user:join', payload);
            });
          }
            },
            join() {
                
                const userId = userData?.id || userData?._id || __currentUserId;
                const payload = { 
                  userId: userId,
                  name: userData?.name || 'Unknown'
                };
                
                if (!userId) {
                  console.warn('Cannot emit user:join: userId is null');
                  return;
                }

                if (!socket.connected) {

                  socket.once("connect", () => {

                    socket.emit("user:join", {
                      userId: sceneRef?.currentUserId || __currentUserId,
                      name: window.authUserName || "Guest",
                    });
                  });

                  return;
                }

                socket.emit('user:join', payload);
            },
          };
          handlers.connect();
          return handlers;
        })();
      
      
        function panel(id) { return qs(id); }
        function togglePanel(id) {
          // Handled by React UI (TopBar/uiStore)
          console.log("togglePanel called for:", id);
        }
        function closeTransient(except) { 
          // Handled by React UI
        }
        function updateBellBadge() {
          // Handled by React UI (TopBar unreadCount)
        }
        function addNotification(text, opts) {
          // Redirect to Zustand store
          if (window.uiStore) {
            window.uiStore.getState().addNotification({
              message: text,
              type: opts?.type || 'info'
            });
          }
        }
        function renderNotifications() {
          // Handled by React UI (NotificationPanel)
        }
        function setTheme(theme) {
          state.theme = theme; localStorage.setItem('vw.theme', theme);
          document.body.classList.toggle('light-mode', theme === 'light');
          qs('theme-btn')?.classList.toggle('active', theme === 'light');
        }
        function setRoom(room, scene) {
          state.room = room; localStorage.setItem('vw.room', room);
          if (scene) {
            scene.playerBody.setPosition(CX, CY + 120); scene.syncPlayerVisual();
            scene.roomName = room; scene.saveState();
          }
          panel('room-panel')?.classList.remove('open');
        }
        function updateMeeting(scene) {
          const inMeeting = scene?.currentZone === 'meeting';
          const meetingPanel = panel('meeting-panel');
          if (meetingPanel) meetingPanel.classList.toggle('open', !!inMeeting);
          if (!inMeeting) return;
          const people = ['You', ...Object.values(scene.otherPlayers).filter(av => scene.meetingRoomRect?.contains(av.container.x, av.container.y)).map(av => av.data.name)];
          const countEl = qs('meeting-count');
          const listEl = qs('participant-list');
          if (countEl) countEl.textContent = `${people.length} participant${people.length === 1 ? '' : 's'}`;
          if (listEl) listEl.innerHTML = people.map(p => `<div class="participant"><span>${p}</span><span class="pl-small">online</span></div>`).join('');
        }
        function makeDraggable(id) {
          const el = panel(id); const head = el?.querySelector('.pl-head') || el;
          if (!el || !head) return;
          let sx=0, sy=0, ox=0, oy=0, dragging=false;
          head.addEventListener('pointerdown', e => { dragging=true; sx=e.clientX; sy=e.clientY; const r=el.getBoundingClientRect(); ox=r.left; oy=r.top; head.setPointerCapture?.(e.pointerId); });
          head.addEventListener('pointermove', e => {
            if (!dragging) return;
            const x = Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, ox + e.clientX - sx));
            const y = Math.max(8, Math.min(window.innerHeight - el.offsetHeight - 8, oy + e.clientY - sy));
            el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
          });
          head.addEventListener('pointerup', e => { dragging=false; head.releasePointerCapture?.(e.pointerId); });
        }
        function init(scene) {
          // window.WorkspaceSceneRef removal — bridge logic replaced by internal scene listeners
          if (window.__WorkspaceSceneProductLayerInit) {
            return;
          }
          window.__WorkspaceSceneProductLayerInit = true;
          
          setTheme(state.theme);
          // DOM UI hooks for buttons that might still exist in legacy HTML
          qs('bell-btn')?.addEventListener('click', () => {
             if (window.uiStore) window.uiStore.getState().togglePanel('notifications');
          });
          qs('rooms-btn')?.addEventListener('click', () => {
             if (window.uiStore) window.uiStore.getState().togglePanel('rooms');
          });
          qs('settings-btn')?.addEventListener('click', () => {
             if (window.uiStore) window.uiStore.getState().togglePanel('settings');
          });
          qs('theme-btn')?.addEventListener('click', () => setTheme(state.theme === 'light' ? 'dark' : 'light'));
          qs('clear-notes')?.addEventListener('click', () => {
            if (window.uiStore) window.uiStore.getState().clearNotifications();
            Audio.click();
          });

          document.querySelectorAll('.room-option').forEach(btn => btn.addEventListener('click', () => setRoom(btn.dataset.room, scene)));
          document.querySelectorAll('.swatch').forEach(btn => btn.addEventListener('click', () => { state.avatar.color = btn.dataset.color; saveAvatar(scene); }));
          
          const initialInput = qs('avatar-initial');
          const styleSelect = qs('avatar-style');
          if (initialInput) {
            initialInput.value = state.avatar.initial;
            initialInput.oninput = e => { state.avatar.initial = e.target.value || '★'; saveAvatar(scene); };
          }
          if (styleSelect) {
            styleSelect.value = state.avatar.style;
            styleSelect.onchange = e => { state.avatar.style = e.target.value; saveAvatar(scene); };
          }

          qs('mute-btn')?.addEventListener('click', () => { state.muted=!state.muted; qs('mute-btn').textContent = state.muted ? 'Unmute' : 'Mute'; Audio.click(); });
          qs('leave-meeting-btn')?.addEventListener('click', () => { scene.player.setPosition(CX, CY + 70); scene.syncPlayerVisual(); Toast.show('Left meeting room', 'info', 1600); Audio.click(); });
          
          // Draggables for legacy panels
          ['notification-panel'].forEach(makeDraggable);
          setRoom(state.room, scene);
      
          // ── Bonus features wiring ──
          Agenda.init();
          CommandPalette.init(scene);
          ReactionWheel.init(scene);
        }
        function saveAvatar(scene) {
          localStorage.setItem('vw.avatar', JSON.stringify(state.avatar));
          scene?.refreshPlayerAvatar?.();
        }
        function _removeNote(id) {
          if (window.uiStore) {
            window.uiStore.getState().removeNotification(id);
          }
        }
        return { init, updateMeeting, addNotification, _removeNote, socket: socketBridge, get avatar() { return state.avatar; }, closeTransient, setRoom };
      })();

      
      const Whiteboard = (() => {
        const modal = document.getElementById('whiteboard-modal');
        const canvas = document.getElementById('whiteboard-canvas');
        let notes = JSON.parse(localStorage.getItem('vw.whiteboard') || '[]');
        
        const save = (remote = false) => {
          localStorage.setItem('vw.whiteboard', JSON.stringify(notes));
          if (!remote) {
            emitObjectState('wb1', { type: 'whiteboard', content: notes }, sceneRef?.player?.x || 0, sceneRef?.player?.y || 0);
          }
        };

        function render() { canvas.innerHTML=''; notes.forEach((n,i)=>addEl(n,i)); }
        function addEl(n,i) {
          const el = document.createElement('div');
          el.className = 'sticky';
          el.style.left = n.x + 'px';
          el.style.top = n.y + 'px';

          const content = document.createElement('div');
          content.className = 'sticky-text';
          content.contentEditable = 'true';
          content.textContent = n.text;
          content.style.minHeight = '40px';
          content.style.outline = 'none';

          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'sticky-remove';
          removeBtn.textContent = '×';
          removeBtn.style.position = 'absolute';
          removeBtn.style.top = '6px';
          removeBtn.style.right = '6px';
          removeBtn.style.width = '24px';
          removeBtn.style.height = '24px';
          removeBtn.style.border = 'none';
          removeBtn.style.borderRadius = '50%';
          removeBtn.style.background = 'rgba(0,0,0,0.25)';
          removeBtn.style.color = '#fff';
          removeBtn.style.cursor = 'pointer';
          removeBtn.style.fontSize = '14px';

        let sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
        content.addEventListener('focus', () => { Whiteboard.isEditing = true; });
        content.addEventListener('blur', () => { Whiteboard.isEditing = false; });
        content.addEventListener('input', () => { notes[i].text = content.textContent; save(); });
        el.addEventListener('pointerdown', e => {
          if (e.target === removeBtn) return;
          if (e.target !== el && e.target !== content) return;
          drag = true;
          Whiteboard.isEditing = true;
          sx = e.clientX; sy = e.clientY;
          ox = parseFloat(el.style.left);
          oy = parseFloat(el.style.top);
          el.setPointerCapture?.(e.pointerId);
        });
        el.addEventListener('pointermove', e => {
          if (!drag) return;
          const sw = el.offsetWidth || 200, sh = el.offsetHeight || 140;
          notes[i].x = Math.max(0, Math.min(canvas.clientWidth - sw, ox + e.clientX - sx));
          notes[i].y = Math.max(0, Math.min(canvas.clientHeight - sh, oy + e.clientY - sy));
          el.style.left = notes[i].x + 'px';
          el.style.top = notes[i].y + 'px';
        });
        el.addEventListener('pointerup', e => { drag = false; Whiteboard.isEditing = false; save(); el.releasePointerCapture?.(e.pointerId); });
          removeBtn.addEventListener('click', () => { notes.splice(i, 1); render(); save(); });

          el.appendChild(removeBtn);
          el.appendChild(content);
          canvas.appendChild(el);
        }
        document.getElementById('add-note').onclick=()=>{ notes.push({x:30+(notes.length%4)*230,y:30+Math.floor(notes.length/4)*160,text:'New idea — type here'}); render(); save(); Audio.click(); };
        document.getElementById('close-whiteboard').onclick=()=>modal.classList.remove('open');
        return { 
          isEditing: false,
          open(){ render(); modal.classList.add('open'); Audio.click(); return { type: "whiteboard", content: notes }; },
          getContent() { return notes; },
          setContent(newNotes) {
            notes = newNotes;
            save(true);
            render();
          }
        };
      })();
      
      const ProfilePopup = (() => {
        const popup = document.getElementById('profile-popup'); let current=null;
        document.getElementById('profile-follow').onclick=()=>{ if(current){ this.startFollow(current.data,current.container); hide(); } };
        document.getElementById('profile-chat').onclick=()=>{ if(current){ /* Chat handled by React */ hide(); } };
        document.getElementById('profile-view').onclick=()=>{ if(current) Toast.show(`${current.data.name}'s profile is ready for backend data`, 'info', 2200); hide(); };
        document.addEventListener('pointerdown', e => { if (!popup.contains(e.target) && !e.target.closest('canvas')) hide(); });
        function show(data, container, pointer) {
          current={data,container};
          document.getElementById('profile-name').textContent=data.name || 'Unknown';
          document.getElementById('profile-status').textContent=STATUS_META[data.status]?.label || 'Available';
          const av=document.getElementById('profile-avatar'); 
          av.textContent=data.name?.charAt(0) || '?'; 
          // Safe color fallback
          const color = data.color ? data.color.toString(16).padStart(6,'0') : '888888';
          av.style.background=`#${color}`;
          popup.style.left=Math.min(window.innerWidth-250, Math.max(12, pointer.x+12))+'px'; 
          popup.style.top=Math.min(window.innerHeight-190, Math.max(12, pointer.y-18))+'px';
          popup.classList.add('open'); 
          Audio.click();
        }
        function hide(){ popup.classList.remove('open'); }
        return { show, hide };
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // BONUS FEATURES — Pomodoro, World Clock, Agenda, Command Palette, Reaction Wheel
      // ═══════════════════════════════════════════════════════════════════════════════
      // Agenda — pushes the next scheduled event into the bell notification panel
      // (instead of rendering its own floating widget).
      const Agenda = (() => {
        const events = [
          { time: '10:00', text: 'Team Standup' },
          { time: '12:00', text: 'Lunch Break ☕' },
          { time: '14:30', text: 'Design Review' },
          { time: '16:00', text: 'Sprint Demo' },
        ];
        const NOTE_ID = 'agenda-next';
        let lastSig = '';
      
        function nextEvent() {
          const now = new Date(); const mins = now.getHours() * 60 + now.getMinutes();
          return events.find(e => { const [h,m]=e.time.split(':').map(Number); return h*60+m > mins; }) || events[0];
        }
        function refresh() {
          const next = nextEvent();
          const text = `Next: ${next.text} at ${next.time}`;
          if (text === lastSig) return;
          lastSig = text;
          ProductLayer?._removeNote?.(NOTE_ID);
        }
        function init() { refresh(); setInterval(refresh, 60000); }
        return { init };
      })();
      
      const CommandPalette = (() => {
        const overlay = () => document.getElementById('palette-overlay');
        const input = () => document.getElementById('palette-input');
        const results = () => document.getElementById('palette-results');
        let commands = [], filtered = [], idx = 0;
        function open() { overlay().classList.add('open'); input().value=''; idx=0; render(commands); setTimeout(()=>input().focus(), 50); Audio.click(); }
        function close() { overlay().classList.remove('open'); }
        function render(list) {
          filtered = list;
          results().innerHTML = list.length
            ? list.map((c,i)=>`<div class="palette-item${i===idx?' active':''}" data-i="${i}"><span class="pi-icon">${c.icon}</span><span>${c.label}</span><span class="pi-hint">${c.hint||''}</span></div>`).join('')
            : '<div class="palette-item" style="opacity:.5;cursor:default">No matches</div>';
          results().querySelectorAll('.palette-item[data-i]').forEach(el => el.onclick = () => run(filtered[+el.dataset.i]));
        }
        function run(cmd) { if (!cmd) return; close(); cmd.action(); }
        function init(scene) {
          commands = [
            { icon:'📋', label:'Open Whiteboard',    hint:'whiteboard', action:() => Whiteboard.open() },
            { icon:'🌗', label:'Toggle Theme',         hint:'theme', action:() => document.getElementById('theme-btn').click() },
            { icon:'🔔', label:'Notifications',         hint:'bell', action:() => document.getElementById('bell-btn').click() },
            { icon:'🏢', label:'Switch Room',           hint:'rooms', action:() => document.getElementById('rooms-btn').click() },
            { icon:'⚙️', label:'Avatar Settings',       hint:'avatar', action:() => document.getElementById('settings-btn').click() },
            { icon:'🎯', label:'Status: Focus',         action:() => clickStatus('focus') },
            { icon:'🟢', label:'Status: Available',     action:() => clickStatus('normal') },
            { icon:'🔴', label:'Status: Busy',          action:() => clickStatus('busy') },
            { icon:'⚪', label:'Status: Away',          action:() => clickStatus('away') },
            { icon:'😀', label:'Open Reaction Wheel',  hint:'reactions', action:() => ReactionWheel.toggle() },
            { icon:'🚪', label:'Leave Meeting',         action:() => document.getElementById('leave-meeting-btn').click() },
            { icon:'🎬', label:'Go to Workspace A',     action:() => ProductLayer.setRoom('Workspace A', scene) },
            { icon:'💼', label:'Go to Workspace B',     action:() => ProductLayer.setRoom('Workspace B', scene) },
            { icon:'🔒', label:'Go to Private Room',    action:() => ProductLayer.setRoom('Private Room', scene) },
          ];
          function clickStatus(s) { 
            scene.playerStatus = s;
            scene.refreshPlayerAvatar();
          }
      
          input().addEventListener('input', () => {
            const q = input().value.toLowerCase().trim();
            idx = 0;
            const list = !q ? commands : commands.filter(c => (c.label + ' ' + (c.hint||'')).toLowerCase().includes(q));
            render(list);
          });
          input().addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { idx = Math.min(filtered.length-1, idx+1); render(filtered); e.preventDefault(); }
            else if (e.key === 'ArrowUp') { idx = Math.max(0, idx-1); render(filtered); e.preventDefault(); }
            else if (e.key === 'Enter') { run(filtered[idx]); e.preventDefault(); }
            else if (e.key === 'Escape') { close(); e.preventDefault(); }
          });
          overlay().addEventListener('click', e => { if (e.target === overlay()) close(); });
      
          window.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
              e.preventDefault(); e.stopPropagation();
              overlay().classList.contains('open') ? close() : open();
            }
          }, true);
        }
        return { init, open, close };
      })();
      
      const ReactionWheel = (() => {
        const wheel = () => document.getElementById('reaction-wheel');
        let scene = null;
        function toggle() { wheel().classList.toggle('show'); Audio.click(); }
        function init(s) {
          scene = s;
          wheel().querySelectorAll('.rw-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              scene?.showEmote?.(scene.playerVisual, btn.dataset.emote);
              Audio.click();
              wheel().classList.remove('show');
            });
          });
        }
        return { init, toggle };
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // SCENE
      // ═══════════════════════════════════════════════════════════════════════════════
      class WorkspaceScene extends Phaser.Scene {
        constructor() {
          super({ key: 'WorkspaceScene' });
          this.currentUserId = __currentUserId;
        }

        shutdown() {
          // Clean up socket listeners on scene shutdown using callback references
          if (socket && this._socketCallbacks) {
            if (this._socketCallbacks.userLeft) socket.off('user:left', this._socketCallbacks.userLeft);
            if (this._socketCallbacks.chatReceive) socket.off('chat:receive', this._socketCallbacks.chatReceive);
            if (this._socketCallbacks.playerMoved) socket.off('player:moved', this._socketCallbacks.playerMoved);
            if (this._socketCallbacks.playersInit) socket.off('players:init', this._socketCallbacks.playersInit);
            if (this._socketCallbacks.userJoined) socket.off('user:joined', this._socketCallbacks.userJoined);
            if (this._socketCallbacks.taskAssigned) socket.off('task:assigned', this._socketCallbacks.taskAssigned);
            if (this._socketCallbacks.connect) socket.off('connect', this._socketCallbacks.connect);

            // Clear callback references
            this._socketCallbacks = {};
          }
          super.shutdown();
        }

        setupSocketListeners() {
          const scene = this;
          const conn = socket; // Use global socket instance

          if (!conn) {
            return;
          }

          // Initialize callback registry if not exists
          if (!scene._socketCallbacks) {
            scene._socketCallbacks = {};
          }

          // Clean up previous callback with reference
          if (scene._socketCallbacks.playerMoved) {
            conn.off('player:moved', scene._socketCallbacks.playerMoved);
          }

          // Define callback and store reference
          scene._socketCallbacks.playerMoved = (payload) => {
            const players = Array.isArray(payload) ? payload : [payload];

            players.forEach(data => {
              if (!data) return;
              scene._remoteMove(data);
            });
          };

          // Register listener with callback reference
          conn.on('player:moved', scene._socketCallbacks.playerMoved);
        }

        preload() {}
      
        create() {
          console.log("PHASER SCENE READY");
          console.log("ACTIVE SCENE INSTANCE", this.scene.key, this);
          sceneRef = this;
          this.physics.world.setBounds(0, 0, W, H);

          this.socket = socket;
          console.log("SOCKET:", this.socket);

          this.setupSocketListeners();

          // Core state
          this.deskRects         = [];
          this.interactableSeats = [];
          this.wallZones         = [];
          this.otherPlayers      = {};   // Fast lookup for multiplayer
          this.envObjects        = [];   // coffee machine, whiteboard, etc.
          this.objectColliders   = [];   // {x,y,w,h} static blockers for furniture/objects
          this.seated            = false;
          this.currentSeat       = null;
          this.meetingAccess     = false;
          this.meetingRequested  = false;
          this.currentZone       = 'corridor';
          this.roomName          = localStorage.getItem('vw.room') || 'Workspace A';
          this.lastMoveAt        = Date.now();
          this._wasMoving        = false;
          this._lastMinimapDraw  = 0;
      
          // Follow mode state
          this.followTarget      = null;
      
          // Player status
          this.playerStatus      = 'normal';
      
          // Camera zoom target
          this._zoomTarget       = 1.15;
      
          // Footstep timer
          this._footTimer        = 0;
      
          // Proximity chat cooldown
          this._proxNotified     = new Set();
          this._proxChatTimer    = null;
          this._proxChatTargetId = null;
      
          
          // Build scene
          this.createWorkspace();
          
          this.createPlayer();
          
          this.handleCamera();


          // Prevent React rerender loop - only set workspace loaded once
          if (window.setWorkspaceLoaded && !window._workspaceLoadedSet) {
            window.setWorkspaceLoaded(true);
            window._workspaceLoadedSet = true;
          }

          ProductLayer.init(this);
          ProductLayer.socket.connect();

          // Input
          this.cursors = this.input.keyboard.createCursorKeys();
          this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
          });
          this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
          this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
          this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
          this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
          this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
          this.emoteKeys = [Phaser.Input.Keyboard.KeyCodes.ONE,Phaser.Input.Keyboard.KeyCodes.TWO,Phaser.Input.Keyboard.KeyCodes.THREE,Phaser.Input.Keyboard.KeyCodes.FOUR].map(k => this.input.keyboard.addKey(k));
      
          // Disable Phaser's auto preventDefault so text fields receive characters even
          // if a key briefly leaks through. Combined with IS_TYPING() in update().
          this.input.keyboard.disableGlobalCapture();
      
          // Player facing direction (down by default)
          this.facing = 'down';
      
          // Interaction indicator (minimal)
          this.interactIndicator = this.add.graphics().setDepth(3);

          // Follow stop
          FollowUI.onStop(() => this.stopFollowing());
      
          // Entry overlay fade out
          
          // IMMEDIATE force removal for debugging
          const overlay = document.getElementById('entry-overlay');
          if (overlay) {
            overlay.style.display = 'none';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            overlay.style.zIndex = '-9999';
          } else {
          }
          
          // Also remove any other loading overlays
          const loadingOverlays = document.querySelectorAll('[class*="loading"], [id*="loading"]');
          loadingOverlays.forEach(el => {
            el.style.display = 'none';
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
          });
          
          setTimeout(() => {
            const overlay = document.getElementById('entry-overlay');
            if (overlay) {
              overlay.classList.add('fade-out');
              setTimeout(() => overlay.remove(), 800);
            }
            Toast.show('Welcome back · Use WASD to move, E to interact', 'info', 3500);
            console.log("OVERLAY: Overlay removal complete");
            
            // Force canvas visibility
            const canvas = document.querySelector('canvas');
            if (canvas) {
              console.log("CANVAS: Found canvas, forcing visibility", {
                opacity: canvas.style.opacity,
                visibility: canvas.style.visibility,
                zIndex: canvas.style.zIndex,
                display: canvas.style.display
              });
              canvas.style.opacity = '1';
              canvas.style.visibility = 'visible';
              canvas.style.zIndex = '1';
              canvas.style.display = 'block';
              canvas.style.position = 'absolute';
              canvas.style.top = '0';
              canvas.style.left = '0';
            } else {
              console.log("CANVAS: No canvas found");
            }
          }, 1700);
        }
      
        // ───────────────────────────────────────────────────────────────────────────
        // WORKSPACE BUILD
        // ───────────────────────────────────────────────────────────────────────────
        createWorkspace() {
          console.log("WORKSPACE: Creating office workspace");
          const g = this.add.graphics();
          g.setDepth(0); // Ensure background is at bottom
          g.fillStyle(C.bg, 1);
          g.fillRect(0, 0, W, H);
          console.log("WORKSPACE: Background created");
          
          this.createPaths(g);
          console.log("WORKSPACE: Paths created");
          
          this.createWorkArea(g);
          console.log("WORKSPACE: Work area created");
          
          this.createMeetingRoom(g);
          console.log("WORKSPACE: Meeting room created");
          
          this.createChillZone(g);
          console.log("WORKSPACE: Chill zone created");
          
          this.createEnvObjects(g);
          console.log("WORKSPACE: Environment objects created");
          
          this.createZoneLabels();
          console.log("WORKSPACE: Zone labels created");
          
          // Verify display list
          console.log("WORKSPACE: Display list verification", {
            totalChildren: this.children.list.length,
            deskRects: this.deskRects.length,
            interactableSeats: this.interactableSeats.length,
            wallZones: this.wallZones.length,
            envObjects: this.envObjects.length
          });
          
          console.log("WORKSPACE: Office creation complete");
        }
      
        
      
        createPaths(g) {
          g.fillStyle(C.path, 1);
          g.fillRect(CX - PATH_W / 2, 0, PATH_W, H);
          g.fillRect(0, CY - PATH_W / 2, W, PATH_W);
          g.fillStyle(0xFFFFFF, 0.03);
          const step = 20;
          for (let px = CX - PATH_W / 2 + step; px < CX + PATH_W / 2; px += step)
            for (let py = step; py < H; py += step) g.fillCircle(px, py, 1);
          for (let px = step; px < W; px += step)
            for (let py = CY - PATH_W / 2 + step; py < CY + PATH_W / 2; py += step) g.fillCircle(px, py, 1);
        }
      
        createWorkArea(g) {
          const zoneW = LEFT_X2 - LEFT_X1, zoneH = H;
          g.fillStyle(0x111520, 1);
          g.fillRect(LEFT_X1, 0, zoneW, zoneH);
          g.lineStyle(1, C.border, 0.06);
          g.strokeRect(LEFT_X1, 0, zoneW, zoneH);
      
          const COLS = 2, ROWS = 3, DESK_W = 110, DESK_H = 52, CHAIR_W = 44, CHAIR_H = 18;
          const PAD_X = 50, PAD_Y = 60;
          const GAP_X = (zoneW - PAD_X * 2 - DESK_W * COLS) / (COLS - 1);
          const GAP_Y = (zoneH - PAD_Y * 2 - DESK_H * ROWS) / (ROWS + 1);
      
          for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
              const dx = LEFT_X1 + PAD_X + col * (DESK_W + GAP_X);
              const dy = PAD_Y + GAP_Y + row * (DESK_H + GAP_Y);
              this.drawDesk(g, dx, dy, DESK_W, DESK_H);
              const cx2 = dx + DESK_W / 2 - CHAIR_W / 2;
              const cy2 = dy - CHAIR_H - 6;
              this.drawChair(g, cx2, cy2, CHAIR_W, CHAIR_H);
              this.deskRects.push(new Phaser.Geom.Rectangle(dx, dy, DESK_W, DESK_H));
              this.interactableSeats.push({
                rect: new Phaser.Geom.Rectangle(cx2 - 10, cy2 - 10, CHAIR_W + 20, CHAIR_H + 20),
                snapX: cx2 + CHAIR_W / 2, snapY: cy2 + CHAIR_H / 2,
                occupied: false, type: 'chair'
              });
              g.fillStyle(C.teal, 0.55);
              g.fillRoundedRect(dx + DESK_W / 2 - 14, dy + 8, 28, 14, 3);
              g.fillStyle(C.bg, 0.7);
              g.fillRoundedRect(dx + DESK_W / 2 - 11, dy + 11, 22, 8, 2);
            }
          }
          // ── WORK AREA WALL with DOOR opening ──
          // Vertical wall along LEFT_X2 (corridor side). Carve a 88px-tall door
          // around the corridor row (y = CY) so player can enter the work area.
          const WX = LEFT_X2 - 4, WW = 8;
          const DOOR_H = 88;
          const doorTop = CY - DOOR_H / 2;
          const doorBot = CY + DOOR_H / 2;
          // Wall segment ABOVE door
          this.wallZones.push(new Phaser.Geom.Rectangle(WX, 0, WW, doorTop));
          // Wall segment BELOW door
          this.wallZones.push(new Phaser.Geom.Rectangle(WX, doorBot, WW, H - doorBot));
      
          // Visible door frame
          g.fillStyle(0x2A3347, 1); g.fillRect(WX - 2, doorTop - 4, 12, 4);   // top jamb
          g.fillStyle(0x2A3347, 1); g.fillRect(WX - 2, doorBot, 12, 4);       // bottom jamb
          // Door floor mat (lighter strip showing the threshold)
          g.fillStyle(C.path, 1); g.fillRect(WX - 8, doorTop, 24, DOOR_H);
          g.fillStyle(C.teal, 0.18); g.fillRect(WX - 8, doorTop, 24, DOOR_H);
          // Glass door panel (semi-transparent visual on the wall)
          g.fillStyle(0x4FA8E8, 0.18); g.fillRect(WX - 1, doorTop + 4, 10, DOOR_H - 8);
          g.lineStyle(1.5, 0x4FA8E8, 0.55); g.strokeRect(WX - 1, doorTop + 4, 10, DOOR_H - 8);
          // Door handle dot
          g.fillStyle(C.teal, 0.9); g.fillCircle(WX + 4, CY, 2.2);
          // "WORK" sign above the door
          this.add.text(WX + 4, doorTop - 12, '⌂ WORK', {
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            fontSize: '9px', color: '#00D4AA', letterSpacing: 1.5,
          }).setOrigin(0.5, 1).setAlpha(0.7).setDepth(5);
      
          // Door interaction rect (E to enter / smooth ease-in)
          this.workDoorRect = new Phaser.Geom.Rectangle(WX - 18, doorTop, 40, DOOR_H);
          this.workDoorCenter = { x: WX + 4, y: CY };
          this.workAreaInsideX = LEFT_X2 - 30; // target after auto-entering
        }
      
        drawDesk(g, x, y, w, h) {
          g.fillStyle(0x000000, 0.25); g.fillRoundedRect(x + 3, y + 5, w, h, 8);
          g.fillStyle(C.surface, 1);   g.fillRoundedRect(x, y, w, h, 8);
          g.fillStyle(0xFFFFFF, 0.04); g.fillRoundedRect(x, y, w, 6, { tl: 8, tr: 8, bl: 0, br: 0 });
          g.lineStyle(1, C.border, 0.12); g.strokeRoundedRect(x, y, w, h, 8);
        }
      
        drawChair(g, x, y, w, h) {
          g.fillStyle(0x000000, 0.18); g.fillRoundedRect(x + 2, y + 3, w, h, 6);
          g.fillStyle(0x253044, 1);    g.fillRoundedRect(x, y, w, h, 6);
          g.lineStyle(1, C.border, 0.08); g.strokeRoundedRect(x, y, w, h, 6);
        }
      
        createMeetingRoom(g) {
          // ── GRID-ALIGNED LAYOUT ──
          // All meeting-room objects snap to a 4 px grid for visual consistency.
          const SNAP = 4;
          const snap = (v) => Math.round(v / SNAP) * SNAP;
      
          const rx = snap(RIGHT_X1 + 20), ry = snap(TOP_Y1 + 20);
          const rw = snap(RIGHT_X2 - RIGHT_X1 - 40), rh = snap(TOP_Y2 - TOP_Y1 - 20);
      
          // Floor + outer wall outline
          g.fillStyle(0x111520, 1); g.fillRoundedRect(rx, ry, rw, rh, 10);
          g.lineStyle(1.5, C.wallLine, 0.7); g.strokeRoundedRect(rx, ry, rw, rh, 10);
      
          // Door opening on the BOTTOM wall, centered horizontally
          const DOOR_W = 56;                          // wider for glass twin-panel
          const doorX = snap(rx + rw / 2 - DOOR_W / 2);
          const doorY = ry + rh;
          // Floor strip in the doorway (entry mat)
          g.fillStyle(C.path, 1); g.fillRect(doorX, doorY - 2, DOOR_W, 5);
          // Door frame highlights (left & right pillars)
          g.fillStyle(0x4FA8E8, 0.55); g.fillRect(doorX - 3, doorY - 8, 3, 12);
          g.fillStyle(0x4FA8E8, 0.55); g.fillRect(doorX + DOOR_W, doorY - 8, 3, 12);
          // Header lintel
          g.fillStyle(0x1A2038, 1); g.fillRect(doorX - 3, doorY - 10, DOOR_W + 6, 3);
      
          // ── GRID-ALIGNED CONTENT ──
          // Center conference table on the room center
          const tw = snap(160), th = snap(60);
          const tx = snap(rx + rw / 2 - tw / 2);
          const ty = snap(ry + rh / 2 - th / 2);
          g.fillStyle(0x000000, 0.25); g.fillRoundedRect(tx + 3, ty + 5, tw, th, 10);
          g.fillStyle(C.table, 1);     g.fillRoundedRect(tx, ty, tw, th, 10);
          g.lineStyle(1, C.border, 0.15); g.strokeRoundedRect(tx, ty, tw, th, 10);
          g.fillStyle(0xFFFFFF, 0.03); g.fillRoundedRect(tx + 4, ty + 4, tw - 8, 12, 6);
          this.objectColliders.push({ x: tx, y: ty, w: tw, h: th });

          // ── STICKY NOTE (standalone example on the table) ──
          const snX = tx + 40, snY = ty + 20;
          g.fillStyle(0xFFE68A, 1); g.fillRect(snX, snY, 14, 14);
          g.lineStyle(1, 0x000000, 0.2); g.strokeRect(snX, snY, 14, 14);
          
          this.envObjects.push({
            x: snX + 7, y: snY + 7,
            type: 'sticky', label: 'Sticky Note', id: 'sn1',
            text: 'Meeting notes...', color: '#FFE68A',
            isEditing: false,
            onInteract: function() {
              this.isEditing = true;
              const newText = prompt("Edit note:", this.text);
              this.isEditing = false;
              if (newText !== null) {
                this.text = newText;
                Toast.show('Note updated locally', 'success', 2000);
                return { type: 'sticky', text: this.text, color: this.color };
              }
            },
            updateState: function(state) {
              if (!state || this.isEditing) return;
              if (state?.type === 'sticky') {
                this.text = state.text;
                this.color = state.color;
                Toast.show(`Note updated: ${this.text}`, 'info', 2000);
              }
            }
          });
      
          // Whiteboard — pinned to LEFT wall, vertically centered
          const wbW = 72, wbH = 48;
          const wbX = snap(rx + 12), wbY = snap(ry + (rh - wbH) / 2 - 12);
          g.fillStyle(0x1A2038, 1); g.fillRoundedRect(wbX, wbY, wbW, wbH, 6);
          g.lineStyle(1, 0x3A4568, 0.9); g.strokeRoundedRect(wbX, wbY, wbW, wbH, 6);
          g.fillStyle(0x6C63FF, 0.15); g.fillRoundedRect(wbX + 4, wbY + 4, wbW - 8, wbH - 8, 4);
          g.lineStyle(1, C.purple, 0.5);
          g.beginPath(); g.moveTo(wbX + 10, wbY + 22); g.lineTo(wbX + 32, wbY + 14); g.strokePath();
          g.beginPath(); g.moveTo(wbX + 32, wbY + 14); g.lineTo(wbX + 56, wbY + 28); g.strokePath();
          g.fillStyle(0xFFFFFF, 0.25); g.fillRect(wbX + 8, wbY + wbH - 10, 18, 4);
          this.objectColliders.push({ x: wbX, y: wbY, w: wbW, h: wbH });
      
          this.envObjects.push({
            x: wbX + wbW / 2, y: wbY + wbH / 2,
            type: 'whiteboard', label: 'Whiteboard', id: 'wb1',
            get isEditing() { return Whiteboard.isEditing; },
            onInteract: () => Whiteboard.open(),
            updateState: (state) => {
              if (!state || Whiteboard.isEditing) return;
              if (state.type === 'whiteboard') {
                if (!document.getElementById('whiteboard-modal').classList.contains('open')) {
                  Whiteboard.open();
                }
                Whiteboard.setContent(state.content);
              }
            }
          });
      
          // Chairs — evenly spaced along long sides of the table
          const chairW = 28, chairH = 14;
          const SEAT_GAP = 8;
          const seatsPerSide = 3;
          const chairTotalW = seatsPerSide * chairW + (seatsPerSide - 1) * SEAT_GAP;
          const chairStartX = snap(tx + (tw - chairTotalW) / 2);
          const positions = [];
          for (let i = 0; i < seatsPerSide; i++) positions.push({ x: chairStartX + i * (chairW + SEAT_GAP), y: ty - chairH - 6, r: 0 });
          for (let i = 0; i < seatsPerSide; i++) positions.push({ x: chairStartX + i * (chairW + SEAT_GAP), y: ty + th + 6, r: 0 });
          positions.push({ x: tx - chairH - 8, y: snap(ty + th / 2 - chairW / 2), r: 90 });
          positions.push({ x: tx + tw + 8,     y: snap(ty + th / 2 - chairW / 2), r: 90 });
          positions.forEach(p => {
            const pw = p.r === 90 ? chairH : chairW, ph = p.r === 90 ? chairW : chairH;
            g.fillStyle(0x000000, 0.15); g.fillRoundedRect(p.x + 1, p.y + 2, pw, ph, 5);
            g.fillStyle(0x253044, 1);    g.fillRoundedRect(p.x, p.y, pw, ph, 5);
            g.lineStyle(1, C.border, 0.1); g.strokeRoundedRect(p.x, p.y, pw, ph, 5);
            this.interactableSeats.push({
              rect: new Phaser.Geom.Rectangle(p.x - 8, p.y - 8, pw + 16, ph + 16),
              snapX: p.x + pw / 2, snapY: p.y + ph / 2,
              occupied: false, type: 'meeting-chair'
            });
          });
      
          g.lineStyle(1, C.purple, 0.25); g.strokeRoundedRect(tx + 6, ty + 6, tw - 12, th - 12, 6);
          this.meetingRoomRect = new Phaser.Geom.Rectangle(rx, ry, rw, rh);
      
          // Walls — leave the doorway gap for the glass doors
          const wallT = 6;
          this.meetingWalls = [
            new Phaser.Geom.Rectangle(rx, ry, rw, wallT),                                     // top
            new Phaser.Geom.Rectangle(rx, ry, wallT, rh),                                     // left
            new Phaser.Geom.Rectangle(rx + rw - wallT, ry, wallT, rh),                        // right
            new Phaser.Geom.Rectangle(rx, ry + rh - wallT, doorX - rx, wallT),                // bottom-left of door
            new Phaser.Geom.Rectangle(doorX + DOOR_W, ry + rh - wallT, (rx + rw) - (doorX + DOOR_W), wallT), // bottom-right
          ];
          this.meetingDoorRect = new Phaser.Geom.Rectangle(doorX, doorY - 20, DOOR_W, 30);
      
          // ═══════════════════════════════════════════════════════════════════
          // AUTOMATIC GLASS DOORS — twin sliding panels
          // Closed by default · open when player approaches · close on leave.
          // Collider toggles with the open/closed state so the player can only
          // pass through while the doors are open.
          // ═══════════════════════════════════════════════════════════════════
          const panelW = DOOR_W / 2;
          const panelH = 14;
          const panelY = doorY - panelH;             // sit flush with bottom wall
          const closedLX = doorX;                    // left panel closed pos
          const closedRX = doorX + panelW;           // right panel closed pos
          const openLX   = doorX - panelW + 4;       // slide left (4px overlap into frame)
          const openRX   = doorX + DOOR_W - 4;       // slide right
      
          const makePanel = (x) => {
            const rect = this.add.rectangle(x + panelW / 2, panelY + panelH / 2, panelW, panelH, 0x6FE6D6, 0.28)
              .setStrokeStyle(1.5, 0x9DF7E9, 0.85)
              .setDepth(6);
            // glass highlight stripe
            const shine = this.add.rectangle(x + panelW / 2, panelY + 3, panelW - 6, 2, 0xFFFFFF, 0.35).setDepth(6);
            // handle
            const handle = this.add.rectangle(x + panelW / 2, panelY + panelH / 2, 2, 8, 0x0F1117, 0.7).setDepth(7);
            this.physics.add.existing(rect, true);   // static body
            return { rect, shine, handle, baseX: x };
          };
      
          this.meetingDoorPanels = {
            left:  makePanel(closedLX),
            right: makePanel(closedRX),
            closedLX, closedRX, openLX, openRX,
            panelW, panelH, panelY,
            // ── STATE MACHINE ─────────────────────────────────────────────
            // CLOSED → (player enters trigger zone) → OPENING → OPEN
            // OPEN   → (player leaves zone for >closeDelay) → CLOSING → CLOSED
            // Hysteresis: openRange < closeRange so we never flicker on the boundary.
            state: 'CLOSED',                         // CLOSED | OPENING | OPEN | CLOSING
            tweenProgress: 0,                        // 0 = closed, 1 = open
            isPlayerNear: false,
            leftZoneAt: 0,                           // ms timestamp when player left
            closeDelay: 800,                         // ms before closing after exit
            openRange: 90,                           // px to trigger open
            closeRange: 150,                         // px hysteresis band
            cx: doorX + DOOR_W / 2,
            cy: doorY,
          };
          // Add panel bodies into wall group so they collide while closed
          if (!this.glassDoorGroup) this.glassDoorGroup = this.physics.add.staticGroup();
          this.glassDoorGroup.add(this.meetingDoorPanels.left.rect);
          this.glassDoorGroup.add(this.meetingDoorPanels.right.rect);
        }
      
        // ═══════════════════════════════════════════════════════════════════
        // GLASS DOOR PROXIMITY — open when player is within range, close on leave.
        // Uses a single tween value (0..1) and refreshes physics body each frame.
        // ═══════════════════════════════════════════════════════════════════
        updateGlassDoors(delta) {
          const d = this.meetingDoorPanels;
          if (!d) return;
          const px = this.playerBody.x, py = this.playerBody.y;
          const dist = Phaser.Math.Distance.Between(px, py, d.cx, d.cy);
          const now = performance.now();
      
          // ── HYSTERESIS DETECTION ──
          // Use two thresholds so the player standing on the boundary never
          // toggles the door rapidly. Access gate still required.
          const wasNear = d.isPlayerNear;
          if (!wasNear && dist < d.openRange && this.meetingAccess === true) {
            d.isPlayerNear = true;
          } else if (wasNear && dist > d.closeRange) {
            d.isPlayerNear = false;
            d.leftZoneAt = now;
          }
      
          // ── STATE TRANSITIONS ──
          switch (d.state) {
            case 'CLOSED':
              if (d.isPlayerNear) { d.state = 'OPENING'; Audio.interact?.(); }
              break;
            case 'OPENING':
              if (d.tweenProgress >= 1) { d.state = 'OPEN'; }
              else if (!d.isPlayerNear) { d.state = 'CLOSING'; } // player ran past
              break;
            case 'OPEN':
              if (!d.isPlayerNear && (now - d.leftZoneAt) > d.closeDelay) {
                d.state = 'CLOSING';
              }
              break;
            case 'CLOSING':
              if (d.isPlayerNear) { d.state = 'OPENING'; }       // came back
              else if (d.tweenProgress <= 0) { d.state = 'CLOSED'; }
              break;
          }
      
          // ── PROGRESS UPDATE (driven only by state, not by raw distance) ──
          const target = (d.state === 'OPENING' || d.state === 'OPEN') ? 1 : 0;
          const step = (delta / 1000) * 5;            // ~200ms full open/close
          d.tweenProgress = Phaser.Math.Clamp(
            d.tweenProgress + (target > d.tweenProgress ? step : -step),
            0, 1
          );
      
          // ── VISUAL POSITIONS ──
          const eased = Phaser.Math.Easing.Sine.InOut(d.tweenProgress);
          const lx = Phaser.Math.Linear(d.closedLX, d.openLX, eased);
          const rx = Phaser.Math.Linear(d.closedRX, d.openRX, eased);
          d.left.rect.x   = lx + d.panelW / 2;
          d.left.shine.x  = lx + d.panelW / 2;
          d.left.handle.x = lx + d.panelW - 3;
          d.right.rect.x   = rx + d.panelW / 2;
          d.right.shine.x  = rx + d.panelW / 2;
          d.right.handle.x = rx + 3;
          d.left.rect.body.updateFromGameObject();
          d.right.rect.body.updateFromGameObject();
      
          // ── COLLISION TOGGLE (single transition per state change) ──
          const shouldCollide = d.tweenProgress < 0.85;
          if (d.left.rect.body.enable !== shouldCollide) {
            d.left.rect.body.enable  = shouldCollide;
            d.right.rect.body.enable = shouldCollide;
          }
      
          // Subtle alpha pulse during motion only (not during static OPEN/CLOSED)
          if (d.state === 'OPENING' || d.state === 'CLOSING') {
            const a = 0.22 + 0.10 * (1 - Math.abs(0.5 - d.tweenProgress) * 2);
            d.left.rect.setFillStyle(0x6FE6D6, a);
            d.right.rect.setFillStyle(0x6FE6D6, a);
          }
        }
      
      
        createChillZone(g) {
          const rx = RIGHT_X1 + 20, ry = BOT_Y1 + 20;
          const rw = RIGHT_X2 - RIGHT_X1 - 40, rh = BOT_Y2 - BOT_Y1 - 20;
      
          g.fillStyle(0x0D1019, 1); g.fillRoundedRect(rx, ry, rw, rh, 10);
          g.lineStyle(1.5, C.wallLine, 0.5); g.strokeRoundedRect(rx, ry, rw, rh, 10);
      
          // Clear doorway on top wall (corridor entry)
          const cdoorX = rx + rw / 2 - 28, cdoorY = ry;
          g.fillStyle(C.path, 1); g.fillRect(cdoorX, cdoorY - 2, 56, 5);
          // Door frame highlights
          g.fillStyle(C.teal, 0.6); g.fillRect(cdoorX, cdoorY - 1, 4, 3);
          g.fillStyle(C.teal, 0.6); g.fillRect(cdoorX + 52, cdoorY - 1, 4, 3);
      
          // Wall colliders with doorway gap on TOP edge
          const wT = 6;
          this.chillWalls = [
            // top wall, split into two segments around doorway
            new Phaser.Geom.Rectangle(rx, ry, cdoorX - rx, wT),
            new Phaser.Geom.Rectangle(cdoorX + 56, ry, (rx + rw) - (cdoorX + 56), wT),
            // left, right, bottom
            new Phaser.Geom.Rectangle(rx, ry, wT, rh),
            new Phaser.Geom.Rectangle(rx + rw - wT, ry, wT, rh),
            new Phaser.Geom.Rectangle(rx, ry + rh - wT, rw, wT),
          ];
      
          const sofaThick = 34, sofaLongW = 180, sofaShortH = 110;
          const sofaX = rx + 30, sofaY = ry + rh - sofaShortH - 20;
      
          g.fillStyle(0x000000, 0.22);
          g.fillRoundedRect(sofaX + 3, sofaY + sofaThick + 3, sofaLongW, sofaShortH - sofaThick, 8);
          g.fillRoundedRect(sofaX + 3, sofaY + 3, sofaLongW, sofaThick, 8);
          g.fillRoundedRect(sofaX + 3, sofaY + sofaThick + 3, sofaThick, sofaShortH - sofaThick, 8);
          g.fillStyle(C.sofa, 1); g.fillRoundedRect(sofaX, sofaY, sofaLongW, sofaThick, 8);
          g.lineStyle(1, C.border, 0.1); g.strokeRoundedRect(sofaX, sofaY, sofaLongW, sofaThick, 8);
          g.fillStyle(C.sofa, 1); g.fillRoundedRect(sofaX, sofaY + sofaThick, sofaThick, sofaShortH - sofaThick, 8);
          g.lineStyle(1, C.border, 0.1); g.strokeRoundedRect(sofaX, sofaY + sofaThick, sofaThick, sofaShortH - sofaThick, 8);
          g.fillStyle(0xFFFFFF, 0.04); g.fillRoundedRect(sofaX + 4, sofaY + 4, sofaLongW - 8, 10, 4);
      
          // L-shaped sofa colliders (back row + side)
          this.objectColliders.push({ x: sofaX, y: sofaY, w: sofaLongW, h: sofaThick });
          this.objectColliders.push({ x: sofaX, y: sofaY + sofaThick, w: sofaThick, h: sofaShortH - sofaThick });
      
          const seatSpacing = 50;
          for (let i = 0; i < 3; i++) {
            this.interactableSeats.push({
              rect: new Phaser.Geom.Rectangle(sofaX + sofaThick + i * seatSpacing, sofaY - 10, 44, sofaThick + 20),
              snapX: sofaX + sofaThick + i * seatSpacing + 22,
              snapY: sofaY + sofaThick / 2, occupied: false, type: 'sofa'
            });
          }
      
          // Coffee machine (interactive env object)
          const cmX = rx + rw - 58, cmY = ry + rh - 70;
          g.fillStyle(0x1A2038, 1); g.fillRoundedRect(cmX, cmY, 38, 48, 8);
          g.lineStyle(1, 0x3A4568, 0.9); g.strokeRoundedRect(cmX, cmY, 38, 48, 8);
          g.fillStyle(C.teal, 0.6); g.fillRoundedRect(cmX + 6, cmY + 6, 26, 18, 5);
          g.fillStyle(0x000000, 0.5); g.fillRoundedRect(cmX + 11, cmY + 9, 16, 12, 3);
          g.fillStyle(C.amber, 0.7); g.fillCircle(cmX + 19, cmY + 33, 5);
          g.fillStyle(C.amber, 0.3); g.fillCircle(cmX + 19, cmY + 33, 8);
      
          this.envObjects.push({
            x: cmX + 19, y: cmY + 24, type: 'coffee',
            label: 'Coffee Machine',
            onInteract: () => {
              const msgs = ['☕ Mmm, fresh espresso!', '☕ Energy restored!', '☕ You got a coffee!'];
              Toast.show(msgs[Math.floor(Math.random() * msgs.length)], 'success', 2500);
            }
          });
          this.objectColliders.push({ x: cmX, y: cmY, w: 38, h: 48 });
      
          // Center table
          const ctW = 70, ctH = 55;
          const ctX = sofaX + sofaThick + 30;
          const ctY = sofaY + sofaThick + (sofaShortH - sofaThick) / 2 - ctH / 2;
          g.fillStyle(0x000000, 0.22); g.fillRoundedRect(ctX + 2, ctY + 4, ctW, ctH, 10);
          g.fillStyle(C.table, 1);     g.fillRoundedRect(ctX, ctY, ctW, ctH, 10);
          g.lineStyle(1, C.border, 0.14); g.strokeRoundedRect(ctX, ctY, ctW, ctH, 10);
          g.fillStyle(0xFFFFFF, 0.05); g.fillRoundedRect(ctX + 4, ctY + 4, ctW - 8, 10, 5);
          g.lineStyle(1, C.teal, 0.2); g.strokeRoundedRect(ctX + 5, ctY + 5, ctW - 10, ctH - 10, 6);
          this.objectColliders.push({ x: ctX, y: ctY, w: ctW, h: ctH });
      
          const pX = rx + rw - 50, pY = ry + 24;
          this.drawPlant(g, pX, pY);
          this.plantX = pX; this.plantY = pY; // for animation
      
          // ── SECOND SOFA (symmetric, opposite side of chill zone) ──
          const sofa2W = 150, sofa2Thick = 34;
          const sofa2X = rx + rw - sofa2W - 30;
          const sofa2Y = ry + 80;
          g.fillStyle(0x000000, 0.22); g.fillRoundedRect(sofa2X + 3, sofa2Y + 3, sofa2W, sofa2Thick, 8);
          g.fillStyle(C.sofa, 1);      g.fillRoundedRect(sofa2X, sofa2Y, sofa2W, sofa2Thick, 8);
          g.lineStyle(1, C.border, 0.1); g.strokeRoundedRect(sofa2X, sofa2Y, sofa2W, sofa2Thick, 8);
          g.fillStyle(0xFFFFFF, 0.04); g.fillRoundedRect(sofa2X + 4, sofa2Y + 4, sofa2W - 8, 10, 4);
          // Sofa-2 back collider (only the back/back-rest, leave seat front passable for sit)
          this.objectColliders.push({ x: sofa2X, y: sofa2Y, w: sofa2W, h: sofa2Thick });
          // Two cushion seats
          for (let i = 0; i < 2; i++) {
            const sx = sofa2X + 18 + i * 60;
            this.interactableSeats.push({
              rect: new Phaser.Geom.Rectangle(sx - 8, sofa2Y - 10, 50, sofa2Thick + 20),
              snapX: sx + 22, snapY: sofa2Y + sofa2Thick / 2,
              occupied: false, type: 'sofa'
            });
          }
      
          // ── MINI LIBRARY SHELF (chill zone) ──
          const libX = rx + 22, libY = ry + 32;
          g.fillStyle(0x000000, 0.25); g.fillRoundedRect(libX + 2, libY + 4, 70, 44, 4);
          g.fillStyle(0x3A2A1F, 1);    g.fillRoundedRect(libX, libY, 70, 44, 4);
          // Shelves
          g.fillStyle(0x2A1E18, 1); g.fillRect(libX + 3, libY + 21, 64, 2);
          g.fillStyle(0x2A1E18, 1); g.fillRect(libX + 3, libY + 41, 64, 2);
          // Books (varied colors)
          const bookCols = [0xFF5B5B, 0x6C63FF, 0x00D4AA, 0xFFB84C, 0x4FA8E8, 0xE85FA8];
          for (let i = 0; i < 8; i++) {
            g.fillStyle(bookCols[i % bookCols.length], 0.9);
            g.fillRect(libX + 5 + i * 8, libY + 4, 6, 16);
          }
          for (let i = 0; i < 7; i++) {
            g.fillStyle(bookCols[(i + 2) % bookCols.length], 0.85);
            g.fillRect(libX + 6 + i * 9, libY + 24, 7, 16);
          }
          g.lineStyle(1, C.border, 0.18); g.strokeRoundedRect(libX, libY, 70, 44, 4);
          this.envObjects.push({
            x: libX + 35, y: libY + 22, type: 'library', label: 'Library Shelf',
            onInteract: () => Toast.show('📚 Reading… +3 inspiration', 'info', 2400),
          });
          this.objectColliders.push({ x: libX, y: libY, w: 70, h: 44 });
      
          // ── SANITIZER STAND (chill zone, near doorway) ──
          const sanX = rx + 100, sanY = ry + 38;
          g.fillStyle(0x000000, 0.22); g.fillRoundedRect(sanX + 2, sanY + 2, 14, 22, 3);
          g.fillStyle(0xE8EAF0, 0.9);  g.fillRoundedRect(sanX, sanY, 14, 22, 3);
          g.fillStyle(0x4FA8E8, 0.5);  g.fillRoundedRect(sanX + 3, sanY + 4, 8, 12, 2);
          g.fillStyle(0x1A2032, 1);    g.fillRect(sanX + 5, sanY - 4, 4, 6);
          this.envObjects.push({
            x: sanX + 7, y: sanY + 11, type: 'sanitizer', label: 'Sanitizer',
            onInteract: () => Toast.show('🧼 Sanitized hands · safe & clean', 'success', 2200),
          });
      
          // ── FIRE EXTINGUISHER (visual only — non-interactive) ──
          const feX = rx + rw - 22, feY = ry + 30;
          g.fillStyle(0x000000, 0.3); g.fillRoundedRect(feX + 1, feY + 2, 12, 30, 3);
          g.fillStyle(0xC0392B, 1);   g.fillRoundedRect(feX, feY, 12, 30, 3);
          g.fillStyle(0x1A2032, 1);   g.fillRect(feX + 4, feY - 3, 4, 5);
          g.fillStyle(0xFFFFFF, 0.18); g.fillRect(feX + 2, feY + 8, 8, 2);
      
          this.chillZoneRect = new Phaser.Geom.Rectangle(rx, ry, rw, rh);
        }
      
        // Environmental objects with E-key interaction (extra realism objects)
        createEnvObjects(g) {
          // ── PRINTER (work area, north-east corner — INSIDE work area bounds) ──
          const prX = LEFT_X1 + 30, prY = 50;
          g.fillStyle(0x000000, 0.25); g.fillRoundedRect(prX + 2, prY + 4, 50, 36, 6);
          g.fillStyle(0x232B40, 1);    g.fillRoundedRect(prX, prY, 50, 36, 6);
          g.fillStyle(0x101622, 1);    g.fillRoundedRect(prX + 5, prY + 22, 40, 8, 2);
          g.fillStyle(C.teal, 0.7);    g.fillCircle(prX + 10, prY + 8, 2);
          g.fillStyle(C.amber, 0.6);   g.fillCircle(prX + 16, prY + 8, 2);
          g.lineStyle(1, C.border, 0.1); g.strokeRoundedRect(prX, prY, 50, 36, 6);
          this.envObjects.push({
            x: prX + 25, y: prY + 18, type: 'printer', label: 'Printer',
            onInteract: () => Toast.show('🖨 Printing your document…', 'info', 2200),
          });
          this.objectColliders.push({ x: prX, y: prY, w: 50, h: 36 });
      
          // ── WATER COOLER (MEETING ROOM, against right wall, near the door) ──
          const wcX = RIGHT_X2 - 50, wcY = TOP_Y2 - 90;
          g.fillStyle(0x000000, 0.22); g.fillRoundedRect(wcX + 2, wcY + 4, 28, 56, 6);
          g.fillStyle(0x1B2236, 1);    g.fillRoundedRect(wcX, wcY, 28, 56, 6);
          g.fillStyle(0x4FA8E8, 0.6);  g.fillRoundedRect(wcX + 4, wcY + 6, 20, 22, 4);
          g.fillStyle(0xFFFFFF, 0.15); g.fillRoundedRect(wcX + 5, wcY + 7, 6, 18, 3);
          g.lineStyle(1, C.border, 0.1); g.strokeRoundedRect(wcX, wcY, 28, 56, 6);
          this.envObjects.push({
            x: wcX + 14, y: wcY + 28, type: 'water', label: 'Water Cooler',
            onInteract: () => Toast.show('💧 Stayed hydrated. +5 focus!', 'success', 2200),
          });
          this.objectColliders.push({ x: wcX, y: wcY, w: 28, h: 56 });
      
          // NOTE: Whiteboard duplicate REMOVED — single whiteboard now lives inside
          // createMeetingRoom() and is the only one in the world.
      
          // ── TV / Screen in chill zone (clamp inside chill zone bounds) ──
          const tvX = Math.min(CX + 200, RIGHT_X2 - 86), tvY = BOT_Y1 + 40;
          g.fillStyle(0x000000, 0.3); g.fillRoundedRect(tvX + 2, tvY + 4, 76, 46, 5);
          g.fillStyle(0x0A0E18, 1);   g.fillRoundedRect(tvX, tvY, 76, 46, 5);
          g.fillStyle(0x1F4480, 0.85); g.fillRoundedRect(tvX + 3, tvY + 3, 70, 40, 3);
          g.fillStyle(0xFFFFFF, 0.08); g.fillRoundedRect(tvX + 6, tvY + 6, 64, 14, 2);
          g.lineStyle(1, C.border, 0.15); g.strokeRoundedRect(tvX, tvY, 76, 46, 5);
          this.envObjects.push({
            x: tvX + 38, y: tvY + 23, type: 'tv', label: 'Lounge TV',
            onInteract: () => Toast.show('📺 Now playing: company highlights', 'info', 2400),
          });
          this.objectColliders.push({ x: tvX, y: tvY, w: 76, h: 46 });
      
          // ── PRESENTATION SCREEN (meeting room, opposite whiteboard wall) ──
          const psX = RIGHT_X2 - 100, psY = TOP_Y1 + 40;
          g.fillStyle(0x000000, 0.32); g.fillRoundedRect(psX + 2, psY + 4, 80, 50, 5);
          g.fillStyle(0x0A0E18, 1);    g.fillRoundedRect(psX, psY, 80, 50, 5);
          g.fillStyle(0x1A2038, 1);    g.fillRoundedRect(psX + 4, psY + 4, 72, 42, 4);
          g.fillStyle(C.purple, 0.6); g.fillRect(psX + 10, psY + 10, 30, 3);
          g.fillStyle(C.teal, 0.5);   g.fillRect(psX + 10, psY + 18, 50, 2);
          g.fillStyle(C.teal, 0.5);   g.fillRect(psX + 10, psY + 24, 44, 2);
          g.fillStyle(C.amber, 0.5);  g.fillRect(psX + 10, psY + 32, 38, 2);
          g.fillStyle(C.teal, 0.9);   g.fillCircle(psX + 75, psY + 47, 1.6);
          g.lineStyle(1, C.border, 0.16); g.strokeRoundedRect(psX, psY, 80, 50, 5);
          this.envObjects.push({
            x: psX + 40, y: psY + 25, type: 'presentation', label: 'Presentation',
            onInteract: () => {
              Toast.show('🎬 Presentation Mode ON', 'action', 2600);
              ProductLayer.addNotification('Presentation mode activated');
            },
          });
          this.objectColliders.push({ x: psX, y: psY, w: 80, h: 50 });
      
          // ── LOCKER / CABINET (work area, below printer, INSIDE bounds) ──
          const lkX = LEFT_X1 + 30, lkY = 110;
          g.fillStyle(0x000000, 0.28); g.fillRoundedRect(lkX + 2, lkY + 4, 44, 56, 5);
          g.fillStyle(0x2A3347, 1);    g.fillRoundedRect(lkX, lkY, 44, 56, 5);
          g.lineStyle(1, C.border, 0.18); g.strokeRect(lkX + 2, lkY + 2, 20, 52);
          g.strokeRect(lkX + 22, lkY + 2, 20, 52);
          g.fillStyle(C.teal, 0.85); g.fillCircle(lkX + 18, lkY + 28, 1.6);
          g.fillStyle(C.teal, 0.85); g.fillCircle(lkX + 26, lkY + 28, 1.6);
          g.fillStyle(0x000000, 0.5); g.fillRect(lkX + 6, lkY + 6, 12, 1);
          g.fillStyle(0x000000, 0.5); g.fillRect(lkX + 26, lkY + 6, 12, 1);
          this.envObjects.push({
            x: lkX + 22, y: lkY + 28, type: 'locker', label: 'Locker',
            onInteract: () => Toast.show('🔒 Locker secured · belongings stored', 'info', 2400),
          });
          this.objectColliders.push({ x: lkX, y: lkY, w: 44, h: 56 });
      
          // ── ELEVATOR PANEL (corridor — clamped inside corridor + map bounds) ──
          const elX = CX - PATH_W / 2 + 6, elY = H - 70;
          g.fillStyle(0x000000, 0.3); g.fillRoundedRect(elX + 2, elY + 4, 28, 44, 5);
          g.fillStyle(0x1B2236, 1);   g.fillRoundedRect(elX, elY, 28, 44, 5);
          g.fillStyle(C.teal, 0.85);
          g.fillTriangle(elX + 14, elY + 8, elX + 8, elY + 16, elX + 20, elY + 16);
          g.fillStyle(C.amber, 0.85);
          g.fillTriangle(elX + 14, elY + 36, elX + 8, elY + 28, elX + 20, elY + 28);
          g.fillStyle(0x000000, 0.55); g.fillRoundedRect(elX + 6, elY + 18, 16, 8, 2);
          const elDisp = this.add.text(elX + 14, elY + 22, '3', {
            fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '8px', color: '#00D4AA'
          }).setOrigin(0.5).setDepth(5);
          g.lineStyle(1, C.border, 0.18); g.strokeRoundedRect(elX, elY, 28, 44, 5);
          let elFloor = 3;
          this.envObjects.push({
            x: elX + 14, y: elY + 22, type: 'elevator', label: 'Elevator Panel',
            onInteract: () => {
              const target = 1 + Math.floor(Math.random() * 6);
              Toast.show(`🛗 Going to floor ${target}…`, 'action', 2400);
              const step = () => {
                if (elFloor === target) return;
                elFloor += elFloor < target ? 1 : -1;
                elDisp.setText(String(elFloor));
                this.time.delayedCall(280, step);
              };
              step();
            },
          });
          this.objectColliders.push({ x: elX, y: elY, w: 28, h: 44 });
        }
      
        drawPlant(g, x, y) {
          g.fillStyle(0x2A2030, 1); g.fillRoundedRect(x - 12, y + 20, 24, 16, 4);
          g.lineStyle(1, C.border, 0.1); g.strokeRoundedRect(x - 12, y + 20, 24, 16, 4);
          [{ ox:0,oy:0,r:16 },{ ox:-12,oy:6,r:12 },{ ox:12,oy:6,r:12 },{ ox:-6,oy:-8,r:10 },{ ox:6,oy:-8,r:10 }]
            .forEach(l => { g.fillStyle(C.plant, 1); g.fillCircle(x + l.ox, y + l.oy, l.r); });
          g.fillStyle(0x2ECC71, 0.12); g.fillCircle(x - 3, y - 5, 8);
        }
      
        createZoneLabels() {
          const style = { fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '11px', color: '#E8EAF0', letterSpacing: 2 };
          [
            { text: 'WORK AREA',    x: LEFT_X1 + (LEFT_X2 - LEFT_X1) / 2,   y: 14 },
            { text: 'MEETING ROOM', x: RIGHT_X1 + (RIGHT_X2 - RIGHT_X1) / 2, y: 14 },
            { text: 'CHILL ZONE',   x: RIGHT_X1 + (RIGHT_X2 - RIGHT_X1) / 2, y: BOT_Y1 + 12 },
          ].forEach(l => this.add.text(l.x, l.y, l.text, style).setOrigin(0.5, 0).setAlpha(0.28).setDepth(5));
        }
      
        // ───────────────────────────────────────────────────────────────────────────
        // PLAYER
        // ───────────────────────────────────────────────────────────────────────────
        createPlayer() {
          const saved = JSON.parse(localStorage.getItem('vw.player') || '{}');
          this.playerData = { name: 'You', x: saved.x || CX, y: saved.y || CY + 120, status: saved.status || 'normal' };
          
          // Create invisible physics zone - cleaner than rectangle
          this.playerBody = this.add.zone(this.playerData.x, this.playerData.y, 24, 24);
          this.physics.add.existing(this.playerBody);
          
          const physicsBody = this.playerBody.body;
          if (physicsBody) {
            physicsBody.setCollideWorldBounds(true);
            // Enhanced physics settings for smooth acceleration/deceleration
            physicsBody.setDrag(800, 800);  // Higher drag for smoother deceleration
            physicsBody.setMaxVelocity(250, 250);  // Slightly higher max velocity
            physicsBody.setAcceleration(0, 0);  // We'll control acceleration manually
            physicsBody.setSize(24, 24);
            physicsBody.setBounce(0);  // No bouncing for office movement
          } else {
            console.error("FAILED TO CREATE PHYSICS BODY");
          }

          // Create upgraded visual avatar for local player
          const meta = STATUS_META[this.playerStatus] || STATUS_META.normal;
          const playerAvatarColor = ProductLayer?.avatar?.color ? `#${C[ProductLayer.avatar.color]?.toString(16).padStart(6, '0') || '6C63FF'}` : '#6C63FF';
          
          this.playerVisual = this.createAvatarContainer({
            id: 'local',
            name: 'You',
            avatar: { color: playerAvatarColor },
            status: this.playerStatus || 'normal',
            facing: 'down',
            isLocal: true
          });
          
          // Set initial player position to match physics body
          this.playerBody.setPosition(this.playerData.x, this.playerData.y);
          this.playerVisual.setPosition(this.playerData.x, this.playerData.y);
          this.playerVisual.setDepth(10);
      
          // Build hard-collision wall bodies from all rectangle wall arrays
          this._buildWallColliders();
        }
      
        // ── HARD WALL COLLIDERS (Arcade Physics static bodies) ───────────────────
        _buildWallColliders() {
          this.wallGroup = this.physics.add.staticGroup();
          const addRect = (r) => {
            const w = r.width  ?? r.w;
            const h = r.height ?? r.h;
            const cx = r.x + w / 2;
            const cy = r.y + h / 2;
            const body = this.add.rectangle(cx, cy, w, h, 0x000000, 0);
            this.physics.add.existing(body, true);
            this.wallGroup.add(body);
          };
          (this.wallZones || []).forEach(addRect);
          (this.meetingWalls || []).forEach(addRect);
          (this.chillWalls || []).forEach(addRect);
          // Desks act as solid blockers too (so player can't walk through them)
          (this.deskRects || []).forEach(addRect);
          // Furniture / objects (sofa, tables, shelves, locker, printer, elevator, etc.)
          (this.objectColliders || []).forEach(addRect);
          this.physics.add.collider(this.playerBody, this.wallGroup);
          // Glass meeting-room doors collide with the player only while CLOSED.
          // updateGlassDoors() toggles each panel body's `enable` flag every frame.
          if (this.glassDoorGroup) {
            this.physics.add.collider(this.playerBody, this.glassDoorGroup);
          }
        }
      
      
      
        // ───────────────────────────────────────────────────────────────────────────
        // OTHER PLAYERS — multiplayer-ready structure
        // ───────────────────────────────────────────────────────────────────────────
        createOtherPlayers() {
          // OTHERS.forEach(data => {
          //   const av = this.createAvatarVisual(data.name, data.color, data.status, false);
          //   av.setPosition(data.x, data.y);
          //   av.setDepth(8);
          //
          //   // Make other avatars clickable for follow/chat
          //   av.setInteractive(new Phaser.Geom.Circle(0, 0, 22), Phaser.Geom.Circle.Contains);
          //   av.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
          //   av.on('pointerout',  () => { this.input.setDefaultCursor('default'); });
          //   av.on('pointerdown', pointer => { this.onAvatarClick(data, av, pointer); });
          //
          //   this.otherPlayers[data.id] = { container: av, targetX: data.x, targetY: data.y, data };
          // });
        }
      
        // ── AVATAR VISUAL ─────────────────────────────────────────────────────────
        // Body anatomy: feet, body (shirt), head, hair, eyes — directional and animated.
        // ───────────────────────────────────────────────────────────────────────────
        // CENTRALIZED AVATAR CONTAINER SYSTEM
        // ───────────────────────────────────────────────────────────────────────────
        createAvatarContainer(userData) {
          const { id, name, avatar = {}, status = 'normal', facing = 'down', isLocal = false } = userData;
          
          // Main container for all avatar elements
          const container = this.add.container(0, 0);
          container.name = name;
          container.playerId = id;
          container.isLocal = isLocal;
          
          // Avatar sprite layer - pass isLocal flag
          const avatarSprite = this.createAvatarSprite({ 
            ...avatar, 
            isLocal: isLocal,
            status: status 
          }, facing);
          container.add(avatarSprite);
          container.avatarSprite = avatarSprite;

          // Username text layer - modern floating pill design
          const usernameText = this.add.text(0, -65, name, {
            fontSize: '13px',
            fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#FFFFFF',
            fontStyle: '600',
            backgroundColor: 'rgba(10, 12, 18, 0.88)',
            padding: { x: 12, y: 6 },
            borderRadius: 20,
            shadow: {
              offsetX: 0,
              offsetY: 3,
              blur: 12,
              color: 'rgba(0, 0, 0, 0.5)',
              stroke: false,
              fill: true
            },
            stroke: 'rgba(108, 99, 255, 0.3)',
            strokeThickness: 1
          }).setOrigin(0.5);
          container.add(usernameText);
          container.usernameText = usernameText;
          
          // Status indicator layer - attached to outer glow ring
          const statusDot = this.createStatusIndicator(status);
          statusDot.setPosition(18, -2);
          container.add(statusDot);
          container.statusDot = statusDot;
          
          // Effects layer (for future emotes, particles, etc.)
          const effectsLayer = this.add.container(0, 0);
          container.add(effectsLayer);
          container.effectsLayer = effectsLayer;
          
          // Store avatar data for updates
          container.userData = userData;
          container.currentFacing = facing;
          container.currentStatus = status;
          container.currentAnimation = 'idle';
          
          // Make remote avatars interactive
          if (!isLocal) {
            container.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
            container.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
            container.on('pointerout',  () => { this.input.setDefaultCursor('default'); });
            container.on('pointerdown', pointer => { this.onAvatarClick(userData, container, pointer); });
          }
          
          return container;
        }
        
        createAvatarSprite(avatarConfig, facing) {
          // Cute floating spirit avatar - faithful recreation of old HTML workspace style
          const body = this.add.container(0, 0);
          const isLocal = avatarConfig.isLocal || false;
          
          const avatarColor = avatarConfig.color || '#6C63FF';
          const colorInt = Phaser.Display.Color.HexStringToColor(avatarColor).color;
          const HEAD_R = 9;
          
          // Colors from old HTML
          const skinTone = 0xFFDBB4;
          const skinDark = Phaser.Display.Color.ValueToColor(skinTone);
          skinDark.darken(20);
          const hairColor = 0x3D3D3D;
          
          // 1. Proximity ring + ground glow (player only) - EXACT match to old HTML
          const ground = this.add.graphics();
          if (isLocal) {
            ground.lineStyle(1, colorInt, 0.12);
            ground.strokeCircle(0, 0, 52);
            ground.fillStyle(colorInt, 0.04);
            ground.fillCircle(0, 0, 52);
          }
          body.add(ground);
          body.ground = ground;
          
          // Status glow rings around body - EXACT match to old HTML
          const status = avatarConfig.status || 'normal';
          const glowAlpha = status === 'focus' ? 0.45 : 0.28;
          for (let i = 3; i >= 0; i--) {
            ground.lineStyle(i + 1, colorInt, glowAlpha * (0.18 + i * 0.16));
            ground.strokeCircle(0, 4, 16 + i * 1.5);
          }
          
          // 2. Drop shadow under feet - EXACT match to old HTML
          const shadow = this.add.graphics();
          shadow.fillStyle(0x000000, 0.38);
          shadow.fillEllipse(0, 16, 22, 7);
          body.add(shadow);
          body.shadow = shadow;
          
          // 3. Legs (tiny dangling feet) - extremely subtle, almost hidden
          const legL = this.add.graphics();
          legL.fillStyle(0x0E1119, 1);
          legL.fillRoundedRect(-2.5, 7, 2, 3.5, 2);
          body.add(legL);
          body.legL = legL;
          
          const legR = this.add.graphics();
          legR.fillStyle(0x0E1119, 1);
          legR.fillRoundedRect(0.5, 7, 2, 3.5, 2);
          body.add(legR);
          body.legR = legR;
          
          // 4. Body / shirt — colored capsule - tighter compactness
          const bodyShape = this.add.graphics();
          bodyShape.fillStyle(0x000000, 0.22);
          bodyShape.fillRoundedRect(-6, 0, 14, 11, 5);
          bodyShape.fillStyle(colorInt, 1);
          bodyShape.fillRoundedRect(-7, -1, 14, 11, 5);
          bodyShape.fillStyle(0xFFFFFF, 0.10);
          bodyShape.fillRoundedRect(-7, -1, 14, 3, { tl: 5, tr: 5, bl: 0, br: 0 });
          bodyShape.lineStyle(1, 0xFFFFFF, 0.08);
          bodyShape.strokeRoundedRect(-7, -1, 14, 11, 5);
          body.add(bodyShape);
          body.bodyShape = bodyShape;
          
          // 5. Arms (two thin rects beside body) - tighter compactness
          const armL = this.add.graphics();
          armL.fillStyle(colorInt, 1);
          armL.fillRoundedRect(-9, 1, 2.5, 7, 1.5);
          body.add(armL);
          body.armL = armL;
          
          const armR = this.add.graphics();
          armR.fillStyle(colorInt, 1);
          armR.fillRoundedRect(6.5, 1, 2.5, 7, 1.5);
          body.add(armR);
          body.armR = armR;
          
          // 6. Head + hair - tighter compactness
          const head = this.add.graphics();
          head.fillStyle(0x000000, 0.25);
          head.fillCircle(0, -8, HEAD_R);
          head.fillStyle(skinTone, 1);
          head.fillCircle(0, -9, HEAD_R);
          head.fillStyle(skinDark.color, 0.4);
          head.fillCircle(2, -7, HEAD_R * 0.55);
          
          // Hair cap
          head.fillStyle(hairColor, 1);
          head.beginPath();
          head.arc(0, -9, HEAD_R, Math.PI, 0, false);
          head.fillPath();
          head.fillRect(-HEAD_R, -11, HEAD_R * 2, 4);
          body.add(head);
          body.head = head;
          
          // 7. Eyes — repositioned by facing - tighter compactness
          const eyes = this.add.graphics();
          const drawEyes = (facing) => {
            eyes.clear();
            eyes.fillStyle(0x141821, 1);
            let lx = -3, rx = 3, y = -8;
            if (facing === 'left') { lx = -5.5; rx = -0.5; }
            else if (facing === 'right') { lx = 0.5; rx = 5.5; }
            else if (facing === 'up') { y = -10; }
            if (facing === 'up') { /* hide eyes when looking up */ }
            else { eyes.fillCircle(lx, y, 1.3); eyes.fillCircle(rx, y, 1.3); }
            // mouth subtle
            eyes.fillStyle(0x6B4533, 0.6);
            eyes.fillRect(-1.5, -5, 3, 0.8);
          };
          drawEyes(facing || 'down');
          body.add(eyes);
          body.eyes = eyes;
          body.drawEyes = drawEyes;
          body._facing = facing || 'down';

          // Expose handles for animation (matching old HTML structure)
          body._setFacing = (f) => {
            if (f === body._facing) return;
            body._facing = f;
            body.drawEyes(f);
            // Subtle body tilt for left/right - enhanced for better readability
            const tilt = f === 'left' ? -0.12 : f === 'right' ? 0.12 : 0;
            body.bodyShape.rotation = tilt;
            body.head.rotation = tilt;
          };
          body._setSitting = (sitting) => {
            body.legL.setVisible(!sitting);
            body.legR.setVisible(!sitting);
            body._sitting = sitting;
            body.shadow.alpha = sitting ? 0.15 : 0.38;
            // Compress body when sitting
            if (sitting) {
              body.bodyShape.setScale(0.95, 0.92);
              body.head.y = -8;
            } else {
              body.bodyShape.setScale(1, 1);
              body.head.y = 0;
            }
          };

          return body;
        }

        createDirectionIndicator(facing) {
          const indicator = this.add.triangle(0, -15, 0, -5, -4, 2, 4, 2, 0xFFFFFF, 0.6);
          
          // Rotate based on facing direction
          const rotations = {
            'up': 0,
            'down': 180,
            'left': -90,
            'right': 90
          };
          
          indicator.setRotation(Phaser.Math.DegToRad(rotations[facing] || 0));
          return indicator;
        }
        
        createStatusIndicator(status) {
          const statusColors = {
            'normal': '#00D4AA',
            'focus': '#6C63FF', 
            'away': '#8899AA',
            'busy': '#FF5B5B',
            'dnd': '#FF5B5B'
          };
          
          const color = statusColors[status] || statusColors.normal;
          const hexColor = Phaser.Display.Color.HexStringToColor(color).color;
          
          // Create container for status indicator
          const container = this.add.container(0, 0);
          
          // Add glow effect
          const glow = this.add.circle(0, 0, 10, hexColor, 0.3);
          
          // Create inner status dot
          const statusDot = this.add.circle(0, 0, 6, hexColor);
          
          // Add both to container
          container.add([glow, statusDot]);
          
          return container;
        }
        
        // Update avatar facing direction and animation
        updateAvatarDirection(container, facing, isMoving = false) {
          if (!container || !container.avatarSprite) return;
          
          const directionIndicator = container.avatarSprite.directionIndicator;
          if (directionIndicator) {
            const rotations = {
              'up': 0,
              'down': 180,
              'left': -90,
              'right': 90
            };
            
            directionIndicator.setRotation(Phaser.Math.DegToRad(rotations[facing] || 0));
          }
          
          container.currentFacing = facing;
          container.currentAnimation = isMoving ? 'walk' : 'idle';
        }
        
        // Update avatar status
        updateAvatarStatus(container, status) {
          if (!container || !container.statusDot) return;
          
          const statusColors = {
            'normal': '#00D4AA',
            'focus': '#6C63FF',
            'away': '#8899AA', 
            'busy': '#FF5B5B',
            'dnd': '#FF5B5B'
          };
          
          const color = statusColors[status] || statusColors.normal;
          const hexColor = Phaser.Display.Color.HexStringToColor(color).color;
          
          // 1. Update status indicator (dot near head)
          if (container.statusDot.list && container.statusDot.list.length >= 2) {
            container.statusDot.list[0].setFillStyle(hexColor, 0.3); // glow
            container.statusDot.list[1].setFillStyle(hexColor); // inner dot
          }
          
          // 2. Update body glow rings (cinematic atmosphere)
          if (container.avatarSprite && container.avatarSprite.ground) {
            const ground = container.avatarSprite.ground;
            const isLocal = container.isLocal;
            const avatarColor = container.userData?.avatar?.color || '#6C63FF';
            const avatarColorInt = Phaser.Display.Color.HexStringToColor(avatarColor).color;
            
            // Re-draw the status glow rings with new status intensity
            const glowAlpha = status === 'focus' ? 0.45 : 0.28;
            ground.clear();
            
            // Re-draw ground ring for local player
            if (isLocal) {
              ground.lineStyle(1, avatarColorInt, 0.12);
              ground.strokeCircle(0, 0, 52);
              ground.fillStyle(avatarColorInt, 0.04);
              ground.fillCircle(0, 0, 52);
            }
            
            // Re-draw status-specific rings
            for (let i = 3; i >= 0; i--) {
              ground.lineStyle(i + 1, avatarColorInt, glowAlpha * (0.18 + i * 0.16));
              ground.strokeCircle(0, 4, 16 + i * 1.5);
            }
          }
          
          container.currentStatus = status;
        }
        
        // Legacy method for backward compatibility - redirects to new system
        createAvatarVisual(name, color, status, isPlayer) {
          return this.createAvatarContainer({
            id: isPlayer ? 'local' : `remote_${Date.now()}`,
            name: isPlayer ? 'You' : name,
            avatar: { color: `#${color.toString(16).padStart(6, '0')}` },
            status,
            isLocal: isPlayer
          });
        }
      
        // ───────────────────────────────────────────────────────────────────────────
        // CAMERA
        // ───────────────────────────────────────────────────────────────────────────
        handleCamera() {
          // Restore proper Phaser camera behavior
          this.cameras.main
            .setBounds(0, 0, W, H)
            .setZoom(1)
            .setRoundPixels(true)
            .startFollow(this.playerBody, true, 0.08, 0.08);
        }
      
        // ═══════════════════════════════════════════════════════════════════════════
        // UPDATE LOOP
        // ═══════════════════════════════════════════════════════════════════════════
        update(time, delta) {
          // Remote interpolation MUST run every frame without conditions
          this.handleRemoteInterpolation(delta);

          // Safety guard - prevent crashes during initialization
          if (!this.playerBody?.body) return;
          
          // Sync visual avatar position from physics body
          if (this.playerBody && this.playerVisual) {
            this.playerVisual.setPosition(this.playerBody.x, this.playerBody.y);
          }

          // Camera protection - prevent invalid positions from corrupting camera
          if (
            isNaN(this.playerBody?.x) ||
            isNaN(this.playerBody?.y)
          ) {
            this.playerBody.x = 700;
            this.playerBody.y = 570;
            
            if (this.playerBody?.body) {
              this.playerBody.body.reset(700, 570);
              this.playerBody.body.setVelocity(0, 0);
            }
            
            return;
          }
          
          this.pulseTime += delta;
      
          const typing = IS_TYPING() || window.uiStore?.getState().isTyping;
      
          if (!typing) {
            this.handleMovement(delta);
          }
          else { 
            this.playerBody.body.setVelocity(0, 0);
          }
      
          this.handleCollision();
          this.handleRoomDetection();
          this.handleInteractionHints();
          this.handleAvatarAnimation(delta);
          this.handleProximity();
          this.handleFollowMode();
          // handleRemoteInterpolation moved to top of update() to ensure it runs without conditions
          this.syncPlayerVisual();
          // DISABLED: this.handleCameraZoom(delta) - Camera zoom disabled for render debugging

          // Minimap update throttled for smoother rendering
          if (time - this._lastMinimapDraw > 120) { Minimap.draw(this.playerBody.x, this.playerBody.y, Object.values(this.otherPlayers)); this._lastMinimapDraw = time; }
          this.handleStatusAutomation();
          ProductLayer.updateMeeting(this);
          this.updateGlassDoors(delta);            // animated meeting-room doors
      
          // Skip ALL hotkeys while typing — fixes WASD/Space/E/M/F/1-4 chat & whiteboard bug.
          if (!typing) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleInteraction();
            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) { /* Chat handled by React */ }
            if (Phaser.Input.Keyboard.JustDown(this.escKey)) ProductLayer.closeTransient();
            if (Phaser.Input.Keyboard.JustDown(this.mKey)) document.getElementById('mute-btn').click();
            if (Phaser.Input.Keyboard.JustDown(this.fKey) && this.followTarget) this.stopFollowing();
            this.emoteKeys.forEach((key, i) => { if (Phaser.Input.Keyboard.JustDown(key)) this.showEmote(this.playerVisual, ['👍','😂','👏','🔥'][i]); });
          } else {
            if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
              document.activeElement?.blur?.();
              ProductLayer.closeTransient();
            }
          }
          
          // Safety guard - reset invalid positions
          if (isNaN(this.playerBody.x) || isNaN(this.playerBody.y)) {
            console.error("RESETTING INVALID PLAYER POSITION");

            this.playerBody.x = 700;
            this.playerBody.y = 570;

            if (this.playerBody?.body) {
              this.playerBody.body.reset(700, 570);
              this.playerBody.body.setVelocity(0, 0);
            }
          }
          
          if (time % 500 < delta) this.saveState();
          
        }
      
        // ── MOVEMENT (delta-aware, client-side prediction, throttled emit) ────────
        handleMovement(delta) {
          // Safety guard - prevent crashes during initialization
          if (!this.playerBody?.body) return;
          
          const isTyping = window.uiStore?.getState().isTyping;
          if (isTyping || this._workDoorEntering || this.seated || this.followTarget) {
            this.playerBody.body.setVelocity(0, 0);
            return;
          }
      
          const acceleration = 1200;  // Smooth acceleration
          const maxSpeed = 200;
          let ax = 0;
          let ay = 0;
      
          // Input-based acceleration
          if (this.cursors.left.isDown || this.wasd.left.isDown) ax = -acceleration;
          if (this.cursors.right.isDown || this.wasd.right.isDown) ax = acceleration;
          if (this.cursors.up.isDown || this.wasd.up.isDown) ay = -acceleration;
          if (this.cursors.down.isDown || this.wasd.down.isDown) ay = acceleration;
      
          // Normalize diagonal acceleration
          if (ax !== 0 && ay !== 0) {
            ax *= 0.707;
            ay *= 0.707;
          }
      
          // Apply acceleration with current velocity limits
          const vx = this.playerBody.body.velocity.x;
          const vy = this.playerBody.body.velocity.y;
          const newVx = Phaser.Math.Clamp(vx + ax * (delta / 1000), -maxSpeed, maxSpeed);
          const newVy = Phaser.Math.Clamp(vy + ay * (delta / 1000), -maxSpeed, maxSpeed);
          
          // Validate velocities before setting
          if (isNaN(newVx) || isNaN(newVy)) {
            return;
          }
          
          // Use physics body for movement with smooth velocity changes
          this.playerBody.body.setVelocity(newVx, newVy);
      
          // Track facing
          if (vx !== 0 || vy !== 0) {
            if (Math.abs(vx) > Math.abs(vy)) {
              this.facing = vx < 0 ? 'left' : 'right';
            } else {
              this.facing = vy < 0 ? 'up' : 'down';
            }
          }
      
          const moving = vx !== 0 || vy !== 0;
          if (moving) {
            // If we were seated or focusMode was true, emit focusMode: false
            if (!this._lastFocusModeEmit || this._lastFocusModeEmit !== false) {
              if (this.socket && socket) {
                this.socket.emit("user:update", { focusMode: false });
              }
              this._lastFocusModeEmit = false;
            }
            this.lastMoveAt = Date.now();
            this._footTimer += (delta || 16);
            if (this._footTimer > 300) { Audio.footstep(); this._footTimer = 0; }
      
            const now = performance.now();
            if (!this._lastEmitAt || now - this._lastEmitAt >= 50) {
              this._lastEmitAt = now;
              if (this.socket && socket) {
                ProductLayer.socket.onUserMove({
                  x: Math.round(this.playerBody.x), y: Math.round(this.playerBody.y), facing: this.facing
                });
              }
            }
          } else {
            if (this._wasMoving) {
              Audio.footstop();
              this._footTimer = 0;
              if (this.socket && socket) {
                ProductLayer.socket.onUserMove({
                  x: Math.round(this.playerBody.x), y: Math.round(this.playerBody.y), facing: this.facing, stopped: true
                });
              }
              this._lastEmitAt = performance.now();
            }
          }
          this._wasMoving = moving;
        }
      
        // ── COLLISION ───────────────────────────────────────────────────────────────
        // Walls + desks are now real Arcade Physics static bodies (see _buildWallColliders),
        // so the engine prevents clipping and provides smooth wall-sliding for free.
        // Only the locked-door logic remains here.
        handleCollision() {
          if (this.seated) return;
          if (!this.playerBody?.body) return;
          const px = this.playerBody.x, py = this.playerBody.y;
      
          // Locked meeting-room door — bounce player back if they got past somehow.
          if (!this.meetingAccess && this.meetingDoorRect && this.meetingRoomRect) {
            if (this.meetingRoomRect.contains(px, py)) {
              const doorCy = this.meetingDoorRect.y + this.meetingDoorRect.height;
                            this.playerBody.y = doorCy + 12;
              this.playerBody.body.setVelocity(0, 120);
              this._showMeetingBlockMsg();
            }
          }
        }
      
      
        _showMeetingBlockMsg() {
          if (this._meetingMsgCooldown && this.time.now - this._meetingMsgCooldown < 3000) return;
          this._meetingMsgCooldown = this.time.now;
          Toast.show('Meeting Room Locked — Press E to Request Access', 'warn', 3000);
        }
      
        // ── ROOM DETECTION ──────────────────────────────────────────────────────────
        handleRoomDetection() {
          const px = this.playerBody.x, py = this.playerBody.y;
          let zone = 'corridor';

          if (this.meetingRoomRect?.contains(px, py))   zone = 'meeting';
          else if (this.chillZoneRect?.contains(px, py)) zone = 'chill';
          else if (px < LEFT_X2 && !(px > LEFT_X1 && px < LEFT_X2 && py > TOP_Y2 && py < BOT_Y1)) zone = 'work';

          if (zone !== this.currentZone) {
            this.currentZone = zone;
            ZoneBadge.set(zone);
            Audio.setZone(zone);
            const msgs = {
              meeting: ['Meeting Room — Keep it professional ☕', 'action'],
              chill:   ['Chill Zone — Take a break, you earned it', 'success'],
              work:    ['Work Area — Focus mode activated', 'info'],
            };
            if (msgs[zone]) Toast.show(...msgs[zone], 2500);
          }
        }
      
        // ── AVATAR ANIMATION (breathing + walk cycle + facing) ────────────────────
        syncPlayerVisual() {
          if (!this.seated && this.playerVisual) {
            // Smooth interpolation for responsive movement
            const targetX = this.playerBody.x;
            const targetY = this.playerBody.y;
            const currentX = this.playerVisual.x;
            const currentY = this.playerVisual.y;
            
            // Use gentle lerp for smooth but responsive follow
            const lerpFactor = 0.35;
            const newX = Phaser.Math.Linear(currentX, targetX, lerpFactor);
            const newY = Phaser.Math.Linear(currentY, targetY, lerpFactor);
            
            this.playerVisual.setPosition(newX, newY);
            
            // CRITICAL: Ensure local player raw circle is ALWAYS visible
            if (!this.playerVisual.visible || this.playerVisual.alpha < 0.1) {
              console.warn("[CRITICAL] Local player visibility fix applied in syncPlayerVisual!");
              console.trace("SYNC VISIBILITY FIX - STACK TRACE:");
              this.playerVisual.setVisible(true).setAlpha(1);
            }
            
            // Update avatar facing direction based on movement
            const vx = this.playerBody.body.velocity.x;
            const vy = this.playerBody.body.velocity.y;
            if (Math.abs(vx) > 1) {
              this.facing = vx > 0 ? 'right' : 'left';
            } else if (Math.abs(vy) > 1) {
              this.facing = vy > 0 ? 'down' : 'up';
            }
            
            // Direction
            this.playerVisual._setFacing?.(this.facing || 'down');
          }
        }
      
        // Other avatars: breathing + idle look-around
        handleAvatarAnimation(delta) {
          const t = Date.now();
          const isMoving = Math.hypot(this.playerBody.body.velocity.x, this.playerBody.body.velocity.y) > 10;
          
          // Animate local player avatar
          if (this.playerVisual && this.playerVisual.avatarSprite) {
            this.animateAvatarEffects(this.playerVisual, t, isMoving, 0);
          }
          
          // Animate remote avatars
          Object.values(this.otherPlayers).forEach((av, i) => {
      if (!av.container) return;
      
        // Ensure proper depth for remote avatars
        av.container.setDepth(100);

      const targetS = 1 + Math.sin(t * 0.0018 + i * 0.9) * 0.018;
      const currentS = av.container.scaleX || 1;
      const newS = Phaser.Math.Linear(currentS, targetS, 0.06);
      if (!isNaN(newS)) {
        av.container.setScale(newS);
      }
      
      // Apply idle floating and pulsing effects
      this.animateAvatarEffects(av.container, t, false, i);
      
      // Random subtle facing change every few seconds
      if (!av._nextLook || t > av._nextLook) {
        const dirs = ['down','left','right','down'];
        av.container._setFacing?.(dirs[Math.floor(Math.random() * dirs.length)]);
        av._nextLook = t + 2500 + Math.random() * 3500;
      }
    });
        }
        
        animateAvatarEffects(container, time, isMoving, offset) {
          if (!container || !container.avatarSprite) return;

          const sprite = container.avatarSprite;

          // 1. FLOATING IDLE ANIMATION - smoother hover easing
          if (!isMoving) {
            const floatY = Math.sin(time * 0.0015 + offset * 1.3) * 1.5;
            const currentY = sprite.y || 0;
            sprite.y = Phaser.Math.Linear(currentY, floatY, 0.03);
          } else {
            // Reset position when moving
            sprite.y = Phaser.Math.Linear(sprite.y || 0, 0, 0.06);
          }

          // 2. BREATHING ANIMATION - subtle scale pulse
          const breatheScale = 1 + Math.sin(time * 0.0015 + offset * 0.5) * 0.008;
          if (!isMoving) {
            const currentScale = sprite.scaleX || 1;
            sprite.setScale(Phaser.Math.Linear(currentScale, breatheScale, 0.02));
          }

          // 3. LEG ANIMATION - simple bounce while moving (not complex walk cycle)
          if (isMoving) {
            const bounceSpeed = 0.012;
            const bouncePhase = time * bounceSpeed + offset;
            
            // Simple leg bounce
            if (sprite.legL && sprite.legR) {
              const legBounce = Math.sin(bouncePhase) * 0.6;
              sprite.legL.y = 7 + legBounce;
              sprite.legR.y = 7 - legBounce;
            }
            
            // Arm swing - gentle opposite rotation
            if (sprite.armL && sprite.armR) {
              const armSwing = Math.sin(bouncePhase) * 0.18;
              sprite.armL.rotation = Phaser.Math.Linear(sprite.armL.rotation || 0, -armSwing, 0.1);
              sprite.armR.rotation = Phaser.Math.Linear(sprite.armR.rotation || 0, armSwing, 0.1);
            }
            
            // Body bounce
            const bodyBounce = Math.abs(Math.sin(bouncePhase * 2)) * 0.6;
            sprite.y = Phaser.Math.Linear(sprite.y || 0, -bodyBounce, 0.05);
          } else {
            // Reset legs when idle
            if (sprite.legL && sprite.legR) {
              sprite.legL.y = Phaser.Math.Linear(sprite.legL.y || 7, 7, 0.06);
              sprite.legR.y = Phaser.Math.Linear(sprite.legR.y || 7, 7, 0.06);
            }
            // Reset arms when idle
            if (sprite.armL && sprite.armR) {
              sprite.armL.rotation = Phaser.Math.Linear(sprite.armL.rotation || 0, 0, 0.06);
              sprite.armR.rotation = Phaser.Math.Linear(sprite.armR.rotation || 0, 0, 0.06);
            }
          }

          // 4. HEAD TILT - subtle movement with body lean
          if (sprite.head) {
            if (isMoving) {
              const headTilt = Math.sin(time * 0.008 + offset) * 0.04;
              sprite.head.rotation = Phaser.Math.Linear(sprite.head.rotation || 0, headTilt, 0.04);
              // Subtle body lean in movement direction
              const leanAngle = sprite._facing === 'left' ? -0.03 : sprite._facing === 'right' ? 0.03 : 0;
              sprite.bodyShape.rotation = Phaser.Math.Linear(sprite.bodyShape.rotation || 0, leanAngle, 0.06);
            } else {
              // Micro head motion while idle
              const headBob = Math.sin(time * 0.0015 + offset * 0.6) * 0.015;
              sprite.head.rotation = Phaser.Math.Linear(sprite.head.rotation || 0, headBob, 0.025);
              // Reset body tilt
              sprite.bodyShape.rotation = Phaser.Math.Linear(sprite.bodyShape.rotation || 0, 0, 0.06);
            }
          }

          // 5. AURA/GLOW PULSE - gentle breathing
          if (sprite.ground) {
            const glowScale = 1 + Math.sin(time * 0.0015 + offset * 0.4) * 0.03;
            // Re-draw glow rings with pulse
            const status = sprite.userData?.status || 'normal';
            const glowAlphaBase = status === 'focus' ? 0.45 : 0.28;
            const colorInt = Phaser.Display.Color.HexStringToColor(sprite.userData?.avatar?.color || '#6C63FF').color;
            sprite.ground.clear();
            if (sprite.userData?.isLocal) {
              sprite.ground.lineStyle(1, colorInt, 0.12);
              sprite.ground.strokeCircle(0, 0, 52);
              sprite.ground.fillStyle(colorInt, 0.04);
              sprite.ground.fillCircle(0, 0, 52);
            }
            for (let i = 3; i >= 0; i--) {
              sprite.ground.lineStyle(i + 1, colorInt, glowAlphaBase * (0.18 + i * 0.16) * glowScale);
              sprite.ground.strokeCircle(0, 4, 16 + i * 1.5);
            }
          }

          // 6. BLINK ANIMATION - eyes close periodically
          if (sprite.eyes && sprite.drawEyes) {
            const blinkPeriod = 4500 + offset * 700;
            const blinkTime = time % blinkPeriod;
            const blinkDuration = 100;

            if (blinkTime < blinkDuration) {
              // Blink - clear eyes temporarily
              sprite.eyes.clear();
            } else {
              // Redraw eyes
              sprite.drawEyes(sprite._facing || 'down');
            }
          }

          // 7. SHADOW - subtle scaling
          if (sprite.shadow) {
            const shadowScale = 1 - Math.sin(time * 0.0015 + offset * 0.8) * 0.015;
            sprite.shadow.setScale(shadowScale);
          }
        }
      
        // ── INTERACTION HINTS ───────────────────────────────────────────────────────
        handleInteractionHints() {
          const px = this.playerBody.x, py = this.playerBody.y;
          const RANGE = 55;
          this.interactIndicator.clear();
      
          let nearSeat = null, nearMeeting = false, nearEnv = null, nearWorkDoor = false;
      
          if (!this.seated) {
            // Nearby seats (check closest first)
            let nearestSeatDist = Infinity;
            for (const seat of this.interactableSeats) {
              if (seat.type === 'meeting-chair' && !this.meetingAccess) continue;
              if (seat.occupied) continue;
              const dist = Phaser.Math.Distance.Between(px, py, seat.snapX, seat.snapY);
              if (dist < RANGE && dist < nearestSeatDist) {
                nearSeat = seat;
                nearestSeatDist = dist;
              }
            }
      
            // Nearby env objects
            let nearestEnvDist = Infinity;
            for (const obj of this.envObjects) {
              const dist = Phaser.Math.Distance.Between(px, py, obj.x, obj.y);
              if (dist < 60 && dist < nearestEnvDist) {
                nearEnv = obj;
                nearestEnvDist = dist;
              }
            }
      
            // Near meeting door
            if (!this.meetingAccess && this.meetingDoorRect) {
              const dCx = this.meetingDoorRect.x + this.meetingDoorRect.width / 2;
              const dCy = this.meetingDoorRect.y + this.meetingDoorRect.height / 2;
              if (Phaser.Math.Distance.Between(px, py, dCx, dCy) < 70) nearMeeting = true;
            }
      
            // Near WORK AREA door with simple hysteresis
            if (this.workDoorCenter) {
              const d = Phaser.Math.Distance.Between(px, py, this.workDoorCenter.x, this.workDoorCenter.y);
              const onCorridorSide = px >= this.workDoorCenter.x - 6;
              if (this._workDoorPromptOn) {
                if (d < 95 && onCorridorSide) nearWorkDoor = true;
                else this._workDoorPromptOn = false;
              } else {
                if (d < 70 && onCorridorSide) { nearWorkDoor = true; this._workDoorPromptOn = true; }
              }
            }
          }
      
          // Pulsing glow effect
          const pulse = 0.08 + Math.sin(this.pulseTime * 0.005) * 0.05;
      
          // Draw interaction indicators
          if (nearSeat) {
            this.interactIndicator.fillStyle(C.teal, 0.6 + pulse);
            this.interactIndicator.fillCircle(nearSeat.snapX, nearSeat.snapY, 24);
            this.interactIndicator.lineStyle(1.5, C.teal, 0.8 + pulse);
            this.interactIndicator.strokeCircle(nearSeat.snapX, nearSeat.snapY, 24);
          }
      
          if (nearEnv) {
            this.interactIndicator.fillStyle(C.amber, 0.6 + pulse);
            this.interactIndicator.fillCircle(nearEnv.x, nearEnv.y, 28);
            this.interactIndicator.lineStyle(1.5, C.amber, 0.7);
            this.interactIndicator.strokeCircle(nearEnv.x, nearEnv.y, 28);
          }
      
          if (nearWorkDoor) {
            this.interactIndicator.fillStyle(C.teal, 0.6);
            this.interactIndicator.fillCircle(this.workDoorCenter.x, this.workDoorCenter.y, 32);
            this.interactIndicator.lineStyle(1.5, C.teal, 0.8);
            this.interactIndicator.strokeCircle(this.workDoorCenter.x, this.workDoorCenter.y, 32);
          }
      
          // Door prompt overlay (DOM)
          const dp = this._doorPromptEl || document.getElementById('door-prompt');
          const dt = this._doorPromptTextEl || document.getElementById('door-prompt-text');
          this._doorPromptEl = dp;
          this._doorPromptTextEl = dt;
          if (dp && dt) {
            const showDoor = nearWorkDoor && !this._workDoorEntering;
            if (showDoor) {
              if (dt.textContent !== 'Enter Work Area') dt.textContent = 'Enter Work Area';
              if (!dp.classList.contains('show')) dp.classList.add('show');
            } else if (dp.classList.contains('show')) {
              dp.classList.remove('show');
            }
          }
      
          const ctx = this.seated         ? 'seated'
                    : nearWorkDoor        ? 'near-work-door'
                    : nearEnv             ? `env-${nearEnv.type}`
                    : nearSeat            ? 'near-seat'
                    : nearMeeting         ? 'near-meeting'
                    : 'none';
      
          if (ctx !== this._lastHintCtx) {
            this._lastHintCtx = ctx;
            if (ctx === 'seated')   Toast.show('Press E to stand up', 'action', 60000);
            else if (ctx === 'near-work-door') Toast.hide();
            else if (ctx === 'near-seat') {
              Toast.show(`[ E ] Sit — ${nearSeat.type === 'sofa' ? 'Sofa' : 'Chair'}`, 'info', 60000);
            }
            else if (ctx === 'near-meeting') Toast.show('Meeting Room Locked — Press E to Request Access', 'warn', 60000);
            else if (nearEnv)       Toast.show(`[ E ] ${nearEnv.label}`, 'info', 60000);
            else                    Toast.hide();
          }
        }
      
        // ── PROXIMITY CHAT DETECTION ─────────────────────────────────────────────
        handleProximity() {
          const px = this.playerBody.x, py = this.playerBody.y;
          const CHAT_RANGE = 100;
          let nearestUser = null;
          let nearestDist = Infinity;

          // Find nearest user and handle notifications
          Object.values(this.otherPlayers).forEach(av => {
            const dist = Phaser.Math.Distance.Between(px, py, av.container.x, av.container.y);
            
            // Track nearest user
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestUser = av.data;
            }

            // Handle nearby notifications
            if (dist < 80) {
              if (!this._proxNotified.has(av.data.id)) {
                this._proxNotified.add(av.data.id);
                Toast.show(`${av.data.name} is nearby — press Enter to chat`, 'info', 3000);
                Audio.notify();
              }
            } else if (dist > 120) {
              this._proxNotified.delete(av.data.id);
            }
          });

          // Handle chat range detection
          if (nearestUser && nearestDist < CHAT_RANGE) {
            // User is in chat range
            if (this._proxChatTargetId !== nearestUser.id) {
              this._proxChatTargetId = nearestUser.id;
              
              // Clear any existing timer
              if (this._proxChatTimer) {
                clearTimeout(this._proxChatTimer);
              }
              
              // Delay to prevent flicker when walking past
              this._proxChatTimer = setTimeout(() => {
                if (this._proxChatTargetId === nearestUser.id) {
                  window.uiStore?.getState().setNearbyUser({
                    id: nearestUser.id,
                    name: nearestUser.name
                  });
                }
              }, 800);
            }
          } else {
            // User is out of chat range
            if (this._proxChatTargetId) {
              this._proxChatTargetId = null;
              if (this._proxChatTimer) {
                clearTimeout(this._proxChatTimer);
                this._proxChatTimer = null;
              }
              window.uiStore?.getState().setNearbyUser(null);
            }
          }
        }
      
        // ── FOLLOW MODE ─────────────────────────────────────────────────────────────
        onAvatarClick(data, container, pointer) {
          ProfilePopup.show(data, container, pointer || { x: window.innerWidth / 2, y: window.innerHeight / 2 });
          
          // Start DM on click (throttled to prevent React rerender loops)
          if (!this._lastUserSelectUpdate || Date.now() - this._lastUserSelectUpdate > 200) {
            window.uiStore?.getState().setSelectedUser({
              id: data.id,
              name: data.name
            });
            this._lastUserSelectUpdate = Date.now();
          }
        }
      
        startFollow(data, container) {
          if (this.followTarget?.id === data.id) { this.stopFollowing(); return; }
          this.followTarget = { id: data.id, container, data };
          FollowUI.show(data.name);
          document.getElementById('controls-hint').style.opacity = '0';
          Toast.show(`Following ${data.name} — click Stop to exit`, 'action', 2500);
        }
      
        handleFollowMode() {
          if (!this.followTarget) return;
          if (!this.playerBody?.body) return;
          const { x, y } = this.followTarget.container;
          
          // Validate target positions before Linear interpolation
          if (isNaN(x) || isNaN(y) || isNaN(this.playerBody.x) || isNaN(this.playerBody.y)) {
            return;
          }
          
          const newX = Phaser.Math.Linear(this.playerBody.x, x, 0.05);
          const newY = Phaser.Math.Linear(this.playerBody.y, y + 40, 0.05);
          
          // Validate interpolated positions
          if (isNaN(newX) || isNaN(newY)) {
                        return;
          }
          
                    this.playerBody.x = newX;
          this.playerBody.y = newY;
          this.playerBody.body.setVelocity(0, 0);
        }
      
        stopFollowing() {
          this.followTarget = null;
          FollowUI.hide();
          document.getElementById('controls-hint').style.opacity = '1';
          Toast.show('Follow mode stopped', 'info', 1500);
        }
      
        // ── CAMERA ZOOM (idle zoom-in / move zoom-out, viewport-aware) ────────────
        handleCameraZoom(delta) {
          const speed = Math.hypot(this.playerBody.body.velocity.x, this.playerBody.body.velocity.y);
          // Viewport-aware base zoom.
          // DESKTOP values are UNCHANGED (1.18 idle / 1.08 move).
          // MOBILE & TABLET use a wider 1.2–1.4 range so the workspace is fully visible
          // and doesn't feel boxed-in.
          const vw = this.scale.width;
          const isMobile = vw < 768;
          const isTablet = vw >= 768 && vw < 1024;
          const idleZoom = isMobile ? 1.35 : isTablet ? 1.25 : 1.18; // desktop unchanged
          const moveZoom = isMobile ? 1.25 : isTablet ? 1.18 : 1.08; // desktop unchanged
          this._zoomTarget = speed > 10 ? moveZoom : idleZoom;
          const curZoom = this.cameras.main.zoom;
          this.cameras.main.setZoom(Phaser.Math.Linear(curZoom, this._zoomTarget, 0.025));
        }
      
        // ── INTERACTION HANDLER ──────────────────────────────────────────────────────
        handleInteraction() {
          const px = this.playerBody.x, py = this.playerBody.y;

          if (this.seated) { this.handleSeating(null); return; }
      
          // ── WORK AREA DOOR (smooth ease-in instead of teleport) ──
          if (this.workDoorCenter && !this._workDoorEntering) {
            const d = Phaser.Math.Distance.Between(px, py, this.workDoorCenter.x, this.workDoorCenter.y);
            if (d < 70 && px >= this.workDoorCenter.x - 6) {
              this._enterWorkArea();
              return;
            }
          }
      
          // Env objects
          for (const obj of this.envObjects) {
            if (Phaser.Math.Distance.Between(px, py, obj.x, obj.y) < 60) {
              Audio.interact(); 
              const newState = obj.onInteract();
              console.log("OBJECT STATE EMIT:", { objectId: obj.id, state: newState, x: obj.x, y: obj.y });
              if (newState && obj.id) {
                emitObjectState(obj.id, newState, obj.x, obj.y);
              }
              return;
            }
          }
      
          // Meeting door
          if (!this.meetingAccess && this.meetingDoorRect) {
            const dCx = this.meetingDoorRect.x + this.meetingDoorRect.width / 2;
            const dCy = this.meetingDoorRect.y + this.meetingDoorRect.height / 2;
            if (Phaser.Math.Distance.Between(px, py, dCx, dCy) < 70) {
              this.requestMeetingAccess(); return;
            }
          }
      
          // Nearby seat
          for (const seat of this.interactableSeats) {
            if (seat.type === 'meeting-chair' && !this.meetingAccess) continue;
            if (seat.occupied) continue;
            if (Phaser.Math.Distance.Between(px, py, seat.snapX, seat.snapY) < 55) {
              this.handleSeating(seat); return;
            }
          }
        }
      
        // ── DOOR ENTRY: smooth tween + brief input lock ──
        _enterWorkArea() {
          if (!this.playerBody?.body) return;
          this._workDoorEntering = true;
          const targetX = this.workAreaInsideX || (LEFT_X2 - 30);
          const targetY = this.workDoorCenter.y;
          this.playerBody.body.setVelocity(0, 0);
          this.playerBody.body.enable = false;          // disable physics during transition
          Audio.interact?.();
          Toast.show('🚪 Entering Work Area…', 'action', 1200);
          document.getElementById('door-prompt')?.classList.remove('show');
          this.tweens.add({
            targets: this.playerBody,
            x: targetX, y: targetY,
            duration: 520, ease: 'Sine.easeInOut',
            onUpdate: () => this.syncPlayerVisual(),
            onComplete: () => {
              this.playerBody.body.enable = true;
              this._workDoorEntering = false;
            },
          });
        }
      
        // ── SEATING ─────────────────────────────────────────────────────────────────
        handleSeating(seat) {
          if (seat === null) {
            // Stand up
            if (this.currentSeat) this.currentSeat.occupied = false;
            this.currentSeat = null; 
            this.seated = false;
            this.playerVisual._setSitting?.(false);
            
            // Sync stand state
            if (this.socket && socket) {
              this.socket.emit("player:state", { state: "standing" });
            }
            this._lastFocusModeEmit = false;

            SitBadge.hide();
            Toast.show('Standing up', 'info', 1500);
            this._lastHintCtx = null;
            return;
          }
          
          // Sit down
          seat.occupied = true; 
          this.currentSeat = seat; 
          this.seated = true;
          
          // Stop movement and position player at seat
          if (this.playerBody?.body) {
            this.playerBody.body.setVelocity(0, 0);
            this.playerBody.body.reset(seat.snapX, seat.snapY);
          }
          
          this.playerVisual.setPosition(seat.snapX, seat.snapY);
          this.playerVisual._setSitting?.(true);

          // Sync sit state
          if (this.socket && socket) {
            this.socket.emit("player:state", { 
              state: "sitting", 
              x: seat.snapX, 
              y: seat.snapY 
            });
          }
          this._lastFocusModeEmit = true;

          Audio.sit();
          SitBadge.show();
          Toast.show(`Seated — Press E to stand`, 'success', 2500);
          this._lastHintCtx = null;
        }
      
        // ── MEETING ROOM ACCESS ──────────────────────────────────────────────────────
        requestMeetingAccess() {
          if (this.meetingRequested) { Toast.show('Access request already pending…', 'warn', 2000); return; }
          this.meetingRequested = true;
          Toast.show('Sending access request…', 'action', 1800);
      
          // Structured approval simulation — swap this.time.delayedCall for real socket event
          this.time.delayedCall(1800, () => {
            const approved = Math.random() < 0.75;
            if (approved) {
              this.meetingAccess = true;
              Audio.notify();
              Toast.show('✓ Access Granted — Welcome to the Meeting Room', 'success', 3000);
            } else {
              this.meetingRequested = false;
              Audio.deny();
              Toast.show('Access Denied — Room is currently occupied', 'error', 3000);
            }
          });
        }
      
        // ── PRODUCT UPGRADES ─────────────────────────────────────────────────────────
        showEmote(container, emoji) {
          const t = this.add.text(container.x, container.y - 44, emoji, { fontFamily:"'Segoe UI', system-ui, sans-serif", fontSize:'24px' }).setOrigin(.5).setDepth(40);
          this.tweens.add({ targets:t, y:t.y-34, alpha:0, duration:2000, ease:'Cubic.easeOut', onComplete:()=>t.destroy() });
        }
      
        showChatBubble(userId, text, data = {}) {
          if (data.type === "dm") return;
          if (!this.otherPlayers[userId] && userId !== this.currentUserId) return;
          const isOwn = userId === this.currentUserId;
          
          let target;
          if (isOwn) {
            target = this.playerVisual;
          } else {
            target = this.otherPlayers[userId]?.container;
          }

          if (!target?._bubble) return;
          
          target._bubble.setText(text.length > 34 ? text.slice(0, 31) + '…' : text).setAlpha(1);
          // Ensure bubble is positioned correctly above target
          target._bubble.setPosition(0, -40);
          
          this.tweens.killTweensOf(target._bubble);
          this.tweens.add({ targets: target._bubble, alpha: 0, delay: 3000, duration: 450 });
        }
      
        refreshPlayerAvatar() {
          // Update existing player avatar container instead of recreating it
          if (this.playerVisual) {
            // Update status color if needed
            const statusColors = {
              'normal': 0x00D4AA,
              'focus': 0x6C63FF,
              'away': 0x8899AA,
              'busy': 0xFF5B5B
            };
            const statusColor = statusColors[this.playerStatus] || statusColors.normal;
            
            // Update status indicator color
            this.updateAvatarStatus(this.playerVisual, this.playerStatus);
          }
        }
        
        // Add animation methods to player avatar
        _setSitting(isSitting) {
          if (!this.playerVisual) return;
          
          if (isSitting) {
            // Sitting animation - shrink slightly and lower
            this.playerVisual.currentAnimation = 'sitting';
            if (this.playerVisual.avatarSprite) {
              this.playerVisual.avatarSprite.setScale(0.9);
            }
          } else {
            // Standing animation - restore normal size
            this.playerVisual.currentAnimation = 'idle';
            if (this.playerVisual.avatarSprite) {
              this.playerVisual.avatarSprite.setScale(1);
            }
          }
        }
        
        _setFacing(direction) {
          if (!this.playerVisual) return;
          this.updateAvatarDirection(this.playerVisual, direction);
        }
      
        handleStatusAutomation() {
          // Sync local status with Zustand store if available
          if (window.workspaceStore) {
            const isInFocusMode = window.workspaceStore.getState().isInFocusMode;
            const targetStatus = isInFocusMode ? 'focus' : 'normal';
            
            if (this.playerStatus !== targetStatus) {
              this.playerStatus = targetStatus;
              this.refreshPlayerAvatar();
            }
          }
          return;
        }
      
        saveState() {
          localStorage.setItem('vw.player', JSON.stringify({ x:this.playerBody.x, y:this.playerBody.y, status:this.playerStatus, room:this.roomName }));
        }
      
        // ── SYNC ─────────────────────────────────────────────────────────────────────
        syncPlayerVisual() {
          if (!this.seated && this.playerVisual) {
            // Round to whole pixels — kills sub-pixel jitter / shimmer
            this.playerVisual.setPosition(Math.round(this.playerBody.x), Math.round(this.playerBody.y));
            
            // CRITICAL: Ensure local player container is ALWAYS visible
            if (!this.playerVisual.visible || this.playerVisual.alpha < 0.1) {
              console.warn("[CRITICAL] Local player visibility fix applied in syncPlayerVisual!");
              console.trace("SYNC VISIBILITY FIX - STACK TRACE:");
              this.playerVisual.setVisible(true).setAlpha(1);
            }
            
            // Update avatar facing direction based on movement
            const moving = this.playerBody.body.velocity.x !== 0 || this.playerBody.body.velocity.y !== 0;
            if (this.facing) {
              this.updateAvatarDirection(this.playerVisual, this.facing, moving);
            }
          }
        }
      
        // ── REMOTE PLAYER INTERPOLATION ──────────────────────────────────────────
        // Called from the socket layer when a 'user:move' packet arrives. Stores the
        // target position; the actual sprite is moved smoothly each frame in
        // handleRemoteInterpolation() using a lerp — never snapped to the raw
        // server value. This eliminates the choppy/teleport feel of remote players
        // and protects against frame-drop micro-flicker.
        _remoteInit(players = []) {
          if (!this.otherPlayers) {
            this.otherPlayers = {};
          }

          const playersArray = Array.isArray(players) ? players : Object.values(players);

          // Clear stale players on full init (reconnect scenario)
          if (playersArray.length > 0) {
            // Remove all existing player sprites
            Object.keys(this.otherPlayers).forEach(playerId => {
              if (
                this.otherPlayers[playerId] &&
                this.otherPlayers[playerId].container &&
                this.otherPlayers[playerId].container.destroy
              ) {
                this.otherPlayers[playerId].container.destroy();
              }
            });
            this.otherPlayers = {};
          }

          playersArray.forEach((player) => {
            const playerId =
              player.id ||
              player.userId ||
              player._id ||
              player.user?.id ||
              player.user?._id;

            if (!playerId) {
              return;
            }

            if (playerId === String(__currentUserId)) {
              return;
            }

            if (this.otherPlayers[playerId]) {
              return;
            }


            const status = player.status || (player.focusMode ? 'focus' : 'normal');

            this.createOtherPlayer({
              userId: playerId,
              x: player.x || player.position?.x || 700,
              y: player.y || player.position?.y || 500,
              name: player.name || player.user?.name || "Remote User",
              status: status
            });
          });

        }

        createOtherPlayer(p) {
          const id = String(p.userId);
          const name = p.name;
          const x = p.x;
          const y = p.y;

          // Deterministic avatar color from userId - same user always gets same color
          const avatarColor = getAvatarColor(id);

          // Use the new upgraded avatar visual system
          const av = this.createAvatarContainer({
            id: id,
            name: name,
            avatar: { color: avatarColor },
            status: p.status || 'normal',
            facing: 'down',
            isLocal: false
          });
          
          // Set properties
          av.setDepth(9999);
          av.setVisible(true);
          av.setActive(true);
          av.setPosition(x, y);
          av.setAlpha(1);
          
          // Add missing methods to prevent errors
          av._setSitting = (isSitting) => {
            av.setVisible(true);
            av.setAlpha(1);
          };
          
          av._setFacing = (direction) => {
            this.updateAvatarDirection(av, direction);
          };
          
          const remotePlayer = {
            id: id,
            container: av,
            targetX: x,
            targetY: y,
            lastX: x,
            lastY: y,
            data: { id, name, x, y, status: p.status || 'normal' }
          };

          this.otherPlayers[id] = remotePlayer;
        }

        _remoteMove(data) {
          const id = data.userId || data.id || data.user?._id || data.user?.id;

          if (!id) return;

          const currentId = __currentUserId ? String(__currentUserId) : null;
          const remoteId = id ? String(id) : null;

          if (!remoteId || (currentId && remoteId === currentId)) return;

          const remote = this.otherPlayers[remoteId];

          if (!remote) return;

          const x = data.x ?? data.position?.x;
          const y = data.y ?? data.position?.y;

          if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) return;

          remote.targetX = x;
          remote.targetY = y;

          // Update status if provided in movement packet
          if (data.focusMode !== undefined || data.status !== undefined) {
            const newStatus = data.status || (data.focusMode ? 'focus' : 'normal');
            if (remote.data.status !== newStatus) {
              remote.data.status = newStatus;
              this.updateAvatarStatus(remote.container, newStatus);
            }
          }

          if (data.facing && remote.container._setFacing) remote.container._setFacing(data.facing);

          if (remote.container) {
            remote.container.setVisible(true);
            if (remote.container.depth < 100) remote.container.setDepth(100);
          }
        }

        handleRemoteInterpolation(delta) {
          Object.values(this.otherPlayers).forEach(remote => {
            if (!remote) return;
            if (!remote.container) return;

            remote.container.x = Phaser.Math.Linear(
              remote.container.x,
              remote.targetX,
              0.2
            );

            remote.container.y = Phaser.Math.Linear(
              remote.container.y,
              remote.targetY,
              0.2
            );
          });
        }

        _remoteJoin(data) {
          if (!this.otherPlayers) {
            this.otherPlayers = {};
          }

          const playerId =
            data.userId ||
            data.user?.id ||
            data.user?._id ||
            data.id;

          if (!playerId) {
            return;
          }

          if (playerId === String(__currentUserId)) {
            return;
          }

          if (this.otherPlayers[playerId]) {
            return;
          }

          const status = data.status || data.user?.status || (data.focusMode || data.user?.focusMode ? 'focus' : 'normal');

          this.createOtherPlayer({
            userId: playerId,
            x: data.x || data.position?.x || 700,
            y: data.y || data.position?.y || 500,
            name: data.user?.name || data.name || "Remote User",
            status: status
          });
        }

        _remoteLeave(payload) {
          const id = payload?.id || payload?.userId;
          if (!id) return;
          
          const remoteId = String(id);
          const player = this.otherPlayers[remoteId];
          if (player) {
            player.container.destroy();
            delete this.otherPlayers[remoteId];
          }
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // PHASER CONFIG
      // ═══════════════════════════════════════════════════════════════════════════════
      const config = {
        type: Phaser.AUTO,
        width: window.innerWidth, height: window.innerHeight,
        backgroundColor: '#0F1117',
        parent: 'game-container',
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
        fps: { target: 60, forceSetTimeOut: true },
        scene: [WorkspaceScene],
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      };
      
      if (gameRef.current) {
        console.log("Phaser game already exists, skipping creation");
        return;
      }
      console.log("Creating new Phaser game instance");
      gameRef.current = new Phaser.Game(config);
      const game = gameRef.current;
      const __onResize = () => game.scale.resize(window.innerWidth, window.innerHeight);
      window.addEventListener('resize', __onResize);
      game.__onResize = __onResize;
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // VIRTUAL JOYSTICK (mobile) — feeds normalized {x,y} into window.__joy
      // Consumed by WorkspaceScene.handleMovement().
      // ═══════════════════════════════════════════════════════════════════════════════
      (function setupJoystick() {
        const base = document.getElementById('joystick');
        const stick = document.getElementById('joystick-stick');
        if (!base || !stick) return;
        if (window.__WorkspaceSceneJoystickInit) return;
        window.__WorkspaceSceneJoystickInit = true;
        window.__joy = { x: 0, y: 0 };
      
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
          window.__joy = { x: 0, y: 0 };
          base.style.display = 'none';
          stick.style.display = 'none';
          return;
        }
        window.__joy = { x: 0, y: 0 };
        base.classList.add('visible');
      
        let activeId = null;
        let cx = 0, cy = 0, radius = 0;
      
        function reset() {
          activeId = null;
          stick.style.transform = 'translate(0px, 0px)';
          window.__joy.x = 0; window.__joy.y = 0;
        }
      
        function start(e) {
          const t = e.changedTouches ? e.changedTouches[0] : e;
          const r = base.getBoundingClientRect();
          cx = r.left + r.width / 2;
          cy = r.top + r.height / 2;
          radius = r.width / 2 - 8;
          activeId = e.changedTouches ? t.identifier : 'mouse';
          move(e);
          e.preventDefault();
        }
      
        function move(e) {
          if (activeId === null) return;
          let t;
          if (e.changedTouches) {
            for (const ct of e.changedTouches) if (ct.identifier === activeId) { t = ct; break; }
            if (!t) return;
          } else { t = e; }
          let dx = t.clientX - cx;
          let dy = t.clientY - cy;
          const mag = Math.hypot(dx, dy);
          if (mag > radius) { dx = (dx / mag) * radius; dy = (dy / mag) * radius; }
          stick.style.transform = `translate(${dx}px, ${dy}px)`;
          window.__joy.x = dx / radius;
          window.__joy.y = dy / radius;
          e.preventDefault();
        }
      
        function end(e) {
          if (activeId === null) return;
          if (e.changedTouches) {
            for (const ct of e.changedTouches) if (ct.identifier === activeId) { reset(); return; }
          } else { reset(); }
        }
      
        base.addEventListener('touchstart', start, { passive: false });
        base.addEventListener('touchmove', move, { passive: false });
        base.addEventListener('touchend', end);
        base.addEventListener('touchcancel', end);
        // Allow desktop testing too
        base.addEventListener('mousedown', start);
        window.addEventListener('mousemove', e => { if (activeId === 'mouse') move(e); });
        window.addEventListener('mouseup', e => { if (activeId === 'mouse') reset(); });
      })();
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // MOBILE TOUCH BUTTONS — interact (E)
      // ═══════════════════════════════════════════════════════════════════════════════
      (function setupTouchButtons() {
        if (window.__WorkspaceSceneTouchButtonsInit) return;
        window.__WorkspaceSceneTouchButtonsInit = true;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const interactBtn = document.getElementById('interact-btn');
        if (!isMobile) {
          if (interactBtn) interactBtn.style.display = 'none';
          return;
        }
        interactBtn?.classList.add('visible');
        // Interact: simulate the same code path as pressing E
        interactBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          const scene = gameRef.current?.scene?.getScene('WorkspaceScene');
          if (scene && typeof scene.handleInteraction === 'function') {
            scene.handleInteraction();
          }
        });
      })();
      
      // ── SINGLE SOURCE OF TRUTH JOIN ──
      ProductLayer.socket.join();
      
      // ===========================================================================
      // END ORIGINAL INLINE SCRIPT
      // ===========================================================================
    }

    // Load Phaser from CDN if not already present, then run workspace logic
    function ensurePhaserLoaded(cb) {
      if (typeof window === "undefined") return;
      if (window.Phaser) { cb(); return; }
      const existing = document.querySelector('script[data-phaser-cdn="1"]');
      if (existing) {
        if (window.Phaser) { cb(); return; }
        existing.addEventListener("load", () => cb(), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = PHASER_SRC;
      s.async = true;
      s.dataset.phaserCdn = "1";
      s.onload = () => cb();
      document.head.appendChild(s);
    }

    ensurePhaserLoaded(() => {
      // Only run if component is still mounted and initialized
      if (!initializedRef.current) {
        console.log("ensurePhaserLoaded: Component unmounted or not initialized, skipping.");
        return;
      }
      
      const userId = user?.id || user?._id;
      if (!user || !userId) {
        console.error("ensurePhaserLoaded: User became null or lost ID during load:", user);
        initializedRef.current = false;
        return;
      }

      console.log("Starting workspace with user:", userId);
      runWorkspace(user);
    });

    // Cleanup on unmount: destroy Phaser game instance
    return () => {
      const game = gameRef.current;

      // Remove socket listeners
      socketInstance.off('player:moved');
      socketInstance.off('player:move');
      socketInstance.off('players:init');
      socketInstance.off('user:joined');
      socketInstance.off('user:join');
      socketInstance.off('user:left');

      if (game) {
        try {
          if (game.__onResize) {
            window.removeEventListener('resize', game.__onResize);
          }
          game.destroy(true);
        } catch (err) {
          // ignore
        }
        // DO NOT set gameRef.current = null - this allows the guard to prevent double creation
      }
      initializedRef.current = false;
    };
  }, [ ]); // Run only once on mount

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: "  * { margin: 0; padding: 0; box-sizing: border-box; }\n  html, body {\n    width: 100%; height: 100%;\n    background: #0F1117;\n    overflow: hidden;\n    font-family: 'Segoe UI', system-ui, sans-serif;\n  }\n  #game-container { width: 100vw; height: 100vh; }\n\n  /* ── ENTRY OVERLAY ── */\n  #entry-overlay {\n    position: fixed; inset: 0;\n    background: #0F1117;\n    display: flex; flex-direction: column;\n    align-items: center; justify-content: center; gap: 20px;\n    z-index: 1000;\n    transition: opacity 0.7s ease;\n    overflow: hidden;\n  }\n  #entry-overlay.fade-out { opacity: 0; pointer-events: none; }\n  \n  .entry-atmosphere-1 {\n    position: absolute; inset: 0;\n    background: radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%, rgba(6, 182, 212, 0.1) 100%);\n    animation: atmospherePulse 8s ease-in-out infinite;\n  }\n  .entry-atmosphere-2 {\n    position: absolute; inset: 0;\n    background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.6) 100%);\n  }\n  .entry-atmosphere-3 {\n    position: absolute; inset: 0;\n    background: linear-gradient(to bottom right, rgba(30, 58, 138, 0.05), transparent, rgba(126, 34, 206, 0.05));\n  }\n  \n  @keyframes atmospherePulse {\n    0%, 100% { opacity: 0.6; }\n    50% { opacity: 1; }\n  }\n\n  .entry-spinner {\n    width: 48px; height: 48px;\n    border: 2px solid rgba(139, 92, 246, 0.3);\n    border-top-color: #8B5CF6;\n    border-radius: 50%;\n    animation: entrySpin 2s linear infinite;\n    position: relative; z-index: 10;\n  }\n  @keyframes entrySpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n  \n  .entry-text {\n    color: rgba(255, 255, 255, 0.8);\n    font-size: 14px; font-weight: 500;\n    letter-spacing: 0.025em;\n    position: relative; z-index: 10;\n  }\n\n  /* ── TOP HUD ── */\n  #hud {\n    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);\n    display: flex; gap: 12px; align-items: center;\n    background: rgba(30,37,52,0.88);\n    border: 1px solid rgba(255,255,255,0.08);\n    border-radius: 12px; padding: 10px 20px;\n    backdrop-filter: blur(14px);\n    z-index: 100; pointer-events: none;\n  }\n  #hud-dot { width: 8px; height: 8px; border-radius: 50%; background: #00D4AA; box-shadow: 0 0 8px #00D4AA; }\n  #hud-text { color: #E8EAF0; font-size: 13px; font-weight: 500; letter-spacing: 0.3px; opacity: 0.85; }\n\n  /* ── USER PANEL (top-left) ── */\n  #user-panel {\n    position: fixed; top: 20px; left: 20px;\n    background: rgba(30,37,52,0.88); border: 1px solid rgba(255,255,255,0.08);\n    border-radius: 12px; padding: 12px 16px;\n    backdrop-filter: blur(14px); z-index: 100;\n    display: flex; align-items: center; gap: 12px;\n    min-width: 180px; cursor: pointer;\n    transition: border-color 0.2s ease, background 0.2s ease;\n  }\n  #user-panel:hover { border-color: rgba(108,99,255,0.3); background: rgba(35,43,65,0.92); }\n  .up-avatar {\n    width: 34px; height: 34px; border-radius: 50%;\n    background: linear-gradient(135deg, #6C63FF, #8B84FF);\n    display: flex; align-items: center; justify-content: center;\n    font-size: 14px; font-weight: 700; color: #fff;\n    flex-shrink: 0; position: relative;\n  }\n  .up-status-dot {\n    position: absolute; bottom: 0; right: 0;\n    width: 9px; height: 9px; border-radius: 50%;\n    border: 1.5px solid #1E2534;\n    background: #00D4AA;\n    transition: background 0.25s ease;\n  }\n  .up-info { display: flex; flex-direction: column; gap: 2px; }\n  .up-name { color: #E8EAF0; font-size: 13px; font-weight: 600; }\n  .up-status-label { color: rgba(232,234,240,0.45); font-size: 11px; letter-spacing: 0.3px; }\n\n  /* Status dropdown */\n  #status-menu {\n    position: fixed; top: 76px; left: 20px;\n    background: rgba(22,28,42,0.97); border: 1px solid rgba(255,255,255,0.1);\n    border-radius: 10px; padding: 6px;\n    backdrop-filter: blur(16px); z-index: 300;\n    display: none; flex-direction: column; gap: 2px;\n    min-width: 180px; box-shadow: 0 12px 40px rgba(0,0,0,0.6);\n  }\n  #status-menu.open { display: flex; }\n  .sm-item {\n    display: flex; align-items: center; gap: 10px;\n    padding: 9px 12px; border-radius: 8px; cursor: pointer;\n    color: rgba(232,234,240,0.8); font-size: 12px;\n    transition: background 0.15s ease;\n  }\n  .sm-item:hover { background: rgba(255,255,255,0.06); }\n  .sm-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }\n\n  /* ── ZONE BADGE ── */\n  #zone-badge {\n    position: fixed; top: 20px; right: 24px;\n    background: rgba(30,37,52,0.88); border: 1px solid rgba(255,255,255,0.07);\n    border-radius: 10px; padding: 8px 16px;\n    backdrop-filter: blur(12px); z-index: 100; pointer-events: none;\n    display: flex; align-items: center; gap: 8px;\n    transition: border-color 0.4s ease;\n  }\n  #zone-dot { width: 7px; height: 7px; border-radius: 50%; background: #00D4AA; transition: background 0.4s ease; }\n  #zone-name { color: rgba(232,234,240,0.6); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }\n\n  /* ── MINIMAP (bottom-left, fixed) ── */\n  #minimap {\n    position: fixed; left: 16px; bottom: 16px;\n    background: rgba(22,28,42,0.9); border: 1px solid rgba(255,255,255,0.08);\n    border-radius: 10px; padding: 8px;\n    backdrop-filter: blur(12px); z-index: 150;\n    pointer-events: none;\n  }\n  #minimap canvas { display: block; border-radius: 6px; width: 130px; height: 84px; }\n  #minimap-label {\n    text-align: center; font-size: 9px; letter-spacing: 1px;\n    color: rgba(232,234,240,0.36); margin-top: 5px;\n    text-transform: uppercase;\n  }\n\n  /* ── TOAST ── */\n  #toast {\n    position: fixed; top: 76px; left: 50%; transform: translateX(-50%) translateY(-8px);\n    background: rgba(22,28,42,0.97); border: 1px solid rgba(255,255,255,0.1);\n    border-radius: 10px; padding: 10px 22px;\n    color: #E8EAF0; font-size: 13px; font-weight: 500; letter-spacing: 0.3px;\n    z-index: 200; pointer-events: none; opacity: 0;\n    transition: opacity 0.22s ease, transform 0.22s ease;\n    white-space: nowrap; display: flex; align-items: center; gap: 10px;\n    backdrop-filter: blur(16px); box-shadow: 0 8px 32px rgba(0,0,0,0.5);\n  }\n  #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }\n  #toast .toast-icon { font-size: 15px; }\n  #toast.toast-teal   { border-color: rgba(0,212,170,0.35); }\n  #toast.toast-purple { border-color: rgba(108,99,255,0.35); }\n  #toast.toast-red    { border-color: rgba(255,91,91,0.35); }\n  #toast.toast-amber  { border-color: rgba(255,190,60,0.35); }\n\n  /* ── CHAT PANEL (desktop: sits ABOVE the minimap; mobile: slide-up sheet) ── */\n  #chat-panel {\n    position: fixed; bottom: 148px; left: 16px;\n    width: 280px; max-height: calc(100vh - 200px);\n    background: rgba(22,28,42,0.95); border: 1px solid rgba(255,255,255,0.08);\n    border-radius: 12px; overflow: hidden;\n    backdrop-filter: blur(16px); z-index: 160;\n    display: flex; flex-direction: column;\n    transform: translateY(8px); opacity: 0;\n    transition: opacity 0.28s ease, transform 0.28s ease;\n    pointer-events: none;\n  }\n  #chat-panel.visible { opacity: 1; transform: translateY(0); pointer-events: all; }\n  #chat-header {\n    padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);\n    font-size: 11px; letter-spacing: 0.8px; color: rgba(232,234,240,0.45);\n    text-transform: uppercase; display: flex; align-items: center; gap: 8px;\n  }\n  #chat-nearby-name { color: rgba(232,234,240,0.75); font-weight: 600; }\n  #chat-messages {\n    flex: 1; max-height: 160px; overflow-y: auto;\n    padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;\n    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;\n  }\n  .chat-msg { display: flex; flex-direction: column; gap: 2px; }\n  .chat-msg .cm-name { font-size: 10px; color: rgba(232,234,240,0.4); }\n  .chat-msg .cm-text {\n    font-size: 12px; color: rgba(232,234,240,0.88);\n    background: rgba(255,255,255,0.05);\n    padding: 6px 10px; border-radius: 8px; display: inline-block;\n    max-width: 220px; word-wrap: break-word; line-height: 1.45;\n  }\n  .chat-msg.own .cm-name { text-align: right; }\n  .chat-msg.own .cm-text { background: rgba(108,99,255,0.22); color: rgba(180,176,255,0.95); align-self: flex-end; }\n  #chat-input-row {\n    display: flex; padding: 8px 10px; gap: 8px;\n    border-top: 1px solid rgba(255,255,255,0.06);\n  }\n  #chat-input {\n    flex: 1; background: rgba(255,255,255,0.05);\n    border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;\n    padding: 7px 11px; color: #E8EAF0; font-size: 12px;\n    outline: none; font-family: inherit;\n  }\n  #chat-input::placeholder { color: rgba(232,234,240,0.28); }\n  #chat-input:focus { border-color: rgba(108,99,255,0.4); }\n  #chat-send {\n    background: rgba(108,99,255,0.3); border: 1px solid rgba(108,99,255,0.4);\n    border-radius: 8px; padding: 7px 12px; color: rgba(180,176,255,0.95);\n    font-size: 12px; cursor: pointer; white-space: nowrap;\n    transition: background 0.15s ease;\n  }\n  #chat-send:hover { background: rgba(108,99,255,0.5); }\n\n  /* Mobile chat toggle FAB (only visible on touch / small screens) */\n  #chat-fab {\n    position: fixed; right: 16px; bottom: 150px;\n    width: 48px; height: 48px; border-radius: 50%;\n    background: linear-gradient(135deg, #6C63FF, #00D4AA);\n    border: none; color: #fff; font-size: 20px;\n    box-shadow: 0 8px 22px rgba(108,99,255,0.45);\n    z-index: 205; display: none; cursor: pointer;\n    align-items: center; justify-content: center;\n  }\n  #chat-fab.visible { display: flex; }\n\n  /* ── FOLLOW UI ── */\n  #follow-bar {\n    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);\n    background: rgba(108,99,255,0.22); border: 1px solid rgba(108,99,255,0.4);\n    border-radius: 10px; padding: 9px 20px;\n    backdrop-filter: blur(12px); z-index: 100;\n    color: rgba(180,176,255,0.9); font-size: 12px; letter-spacing: 0.3px;\n    display: flex; align-items: center; gap: 12px;\n    opacity: 0; transition: opacity 0.25s ease; pointer-events: none;\n  }\n  #follow-bar.show { opacity: 1; pointer-events: all; }\n  #follow-stop {\n    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.12);\n    border-radius: 6px; padding: 4px 10px; color: rgba(232,234,240,0.7);\n    font-size: 11px; cursor: pointer; transition: background 0.15s ease;\n  }\n  #follow-stop:hover { background: rgba(255,255,255,0.18); }\n\n  /* ── SIT BADGE ── */\n  #sit-badge {\n    position: fixed; bottom: 20px; right: 24px;\n    background: rgba(108,99,255,0.18); border: 1px solid rgba(108,99,255,0.3);\n    border-radius: 10px; padding: 8px 16px;\n    backdrop-filter: blur(12px); z-index: 100; pointer-events: none;\n    color: rgba(180,176,255,0.9); font-size: 12px; letter-spacing: 0.4px;\n    opacity: 0; transition: opacity 0.25s ease;\n  }\n  #sit-badge.show { opacity: 1; }\n\n  /* ── CONTROLS HINT ── */\n  #controls-hint {\n    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);\n    background: rgba(30,37,52,0.75); border: 1px solid rgba(255,255,255,0.06);\n    border-radius: 10px; padding: 8px 18px;\n    color: rgba(232,234,240,0.4); font-size: 12px; letter-spacing: 0.4px;\n    z-index: 90; pointer-events: none;\n    transition: opacity 0.3s ease;\n  }\n\n  /* ── ZONE TINT OVERLAY ── */\n  #zone-tint {\n    position: fixed; inset: 0; pointer-events: none; z-index: 1;\n    transition: background 1.2s ease; background: transparent;\n  }\n\n\n  /* ── PRODUCT-LAYER ENHANCEMENTS ── */\n  :root {\n    --ws-bg:#0F1117; --ws-panel:rgba(22,28,42,0.95); --ws-panel-strong:rgba(30,37,52,0.96);\n    --ws-text:#E8EAF0; --ws-muted:rgba(232,234,240,0.48); --ws-border:rgba(255,255,255,0.09);\n    --ws-primary:#6C63FF; --ws-teal:#00D4AA; --ws-amber:#FFB84C; --ws-danger:#FF5B5B;\n  }\n  body.light-mode {\n    --ws-bg:#F5F7FB; --ws-panel:rgba(255,255,255,0.94); --ws-panel-strong:rgba(248,250,255,0.96);\n    --ws-text:#172033; --ws-muted:rgba(23,32,51,0.54); --ws-border:rgba(42,52,76,0.14);\n  }\n  body.light-mode #entry-overlay { background: var(--ws-bg); }\n  body.light-mode .entry-title, body.light-mode #hud-text, body.light-mode .up-name,\n  body.light-mode #chat-input, body.light-mode .pl-title, body.light-mode .pl-modal-title { color: var(--ws-text); }\n  body.light-mode .entry-sub, body.light-mode #zone-name, body.light-mode .up-status-label,\n  body.light-mode #minimap-label { color: var(--ws-muted); }\n  body.light-mode #hud, body.light-mode #user-panel, body.light-mode #zone-badge,\n  body.light-mode #minimap, body.light-mode #chat-panel, body.light-mode #toast,\n  body.light-mode #status-menu, body.light-mode .pl-panel, body.light-mode .profile-card,\n  body.light-mode #whiteboard-modal .whiteboard-shell { background: var(--ws-panel); border-color: var(--ws-border); color: var(--ws-text); }\n  #top-actions { position:fixed; top:20px; right:170px; display:flex; gap:8px; z-index:160; }\n  .icon-btn { width:38px; height:38px; border-radius:11px; border:1px solid var(--ws-border); background:var(--ws-panel-strong); color:var(--ws-text); cursor:pointer; backdrop-filter:blur(14px); transition:transform .18s ease,border-color .18s ease,background .18s ease; }\n  .icon-btn:hover { transform:translateY(-1px); border-color:rgba(108,99,255,.42); background:rgba(47,57,84,.92); }\n  .icon-btn.active { border-color:rgba(0,212,170,.55); box-shadow:0 0 18px rgba(0,212,170,.16); }\n  .pl-panel { position:fixed; background:var(--ws-panel); border:1px solid var(--ws-border); border-radius:12px; backdrop-filter:blur(16px); z-index:180; color:var(--ws-text); box-shadow:0 18px 50px rgba(0,0,0,.42); opacity:0; transform:translateY(8px) scale(.98); pointer-events:none; transition:opacity .2s ease, transform .2s ease; overflow:hidden; }\n  .pl-panel.open { opacity:1; transform:translateY(0) scale(1); pointer-events:all; }\n  .pl-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 13px; border-bottom:1px solid var(--ws-border); cursor:grab; user-select:none; }\n  .pl-title { font-size:12px; font-weight:700; letter-spacing:.5px; }\n  .pl-body { padding:12px; }\n  .pl-small { color:var(--ws-muted); font-size:11px; line-height:1.5; }\n  .pl-btn { border:1px solid var(--ws-border); background:rgba(255,255,255,.06); color:var(--ws-text); border-radius:8px; padding:7px 10px; font-size:12px; cursor:pointer; transition:background .15s ease,border-color .15s ease; }\n  .pl-btn:hover { background:rgba(108,99,255,.18); border-color:rgba(108,99,255,.36); }\n  #notification-panel { top:66px; right:24px; width:300px; }\n  .note-item { display:flex; justify-content:space-between; gap:10px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,.06); font-size:12px; color:var(--ws-text); }\n  .note-time { color:var(--ws-muted); font-size:10px; white-space:nowrap; }\n  #room-panel { top:66px; right:72px; width:220px; }\n  .room-option { width:100%; text-align:left; margin-bottom:7px; }\n  #settings-panel { top:66px; left:20px; width:260px; }\n  .field-row { display:grid; gap:6px; margin-bottom:10px; font-size:11px; color:var(--ws-muted); }\n  .field-row input, .field-row select { background:rgba(255,255,255,.06); color:var(--ws-text); border:1px solid var(--ws-border); border-radius:8px; padding:8px; outline:none; }\n  .swatches { display:flex; gap:8px; }\n  .swatch { width:24px; height:24px; border-radius:50%; border:2px solid rgba(255,255,255,.18); cursor:pointer; }\n  #meeting-panel { top:118px; right:24px; width:250px; }\n  .participant { display:flex; align-items:center; justify-content:space-between; padding:7px 0; font-size:12px; }\n  .participant:before { content:''; width:7px; height:7px; border-radius:50%; background:var(--ws-teal); margin-right:8px; box-shadow:0 0 8px rgba(0,212,170,.45); }\n  .meeting-actions { display:flex; gap:8px; margin-top:10px; }\n  /* #screen-share removed (was buggy permanent overlay) */\n  #profile-popup { position:fixed; width:230px; z-index:260; opacity:0; transform:translateY(8px) scale(.95); pointer-events:none; transition:opacity .18s ease,transform .18s ease; }\n  #profile-popup.open { opacity:1; transform:translateY(0) scale(1); pointer-events:all; }\n  .profile-card { background:var(--ws-panel); border:1px solid var(--ws-border); border-radius:14px; color:var(--ws-text); backdrop-filter:blur(16px); box-shadow:0 20px 60px rgba(0,0,0,.46); padding:14px; }\n  .profile-top { display:flex; align-items:center; gap:10px; margin-bottom:12px; }\n  .profile-avatar { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; color:#fff; font-weight:800; }\n  .profile-name { font-size:14px; font-weight:800; }.profile-status { font-size:11px; color:var(--ws-muted); }\n  .profile-actions { display:grid; grid-template-columns:1fr; gap:7px; }\n  #whiteboard-modal { position:fixed; inset:0; z-index:500; display:none; place-items:center; background:rgba(5,7,12,.58); backdrop-filter:blur(5px); }\n  #whiteboard-modal.open { display:grid; animation:fadeLayer .18s ease; }\n  .whiteboard-shell { width:min(880px,94vw); height:min(620px,88vh); border-radius:16px; background:var(--ws-panel); border:1px solid var(--ws-border); color:var(--ws-text); box-shadow:0 30px 100px rgba(0,0,0,.58); display:flex; flex-direction:column; overflow:hidden; }\n  .whiteboard-canvas { position:relative; flex:1; background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03)); overflow:auto; }\n  /* Sticky notes — larger, readable, auto-wrap, internal scroll, never overflow */\n  .sticky {\n    position:absolute;\n    width: 200px; max-width: 220px;\n    min-height: 140px; max-height: 220px;\n    background:#FFE68A; color:#1b2132;\n    border-radius:10px; padding:14px 14px 14px 14px;\n    box-shadow:0 14px 28px rgba(0,0,0,.22);\n    cursor:grab;\n    font-size:14px; line-height:1.45; font-weight:500;\n    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;\n    outline:none;\n    overflow-y:auto; overflow-x:hidden;\n    overflow-wrap:break-word; word-wrap:break-word; word-break:break-word;\n    white-space: pre-wrap; hyphens:auto;\n    box-sizing: border-box;\n    scrollbar-width: thin; scrollbar-color: rgba(0,0,0,.18) transparent;\n  }\n  .sticky::-webkit-scrollbar { width:6px; }\n  .sticky::-webkit-scrollbar-thumb { background: rgba(0,0,0,.18); border-radius:3px; }\n  .sticky:active { cursor: grabbing; }\n  .sticky:nth-child(2n) { background:#A7F3D0; }.sticky:nth-child(3n) { background:#C7D2FE; }\n  .sticky:nth-child(4n) { background:#FBC8E1; }.sticky:nth-child(5n) { background:#FFD4A8; }\n  #chat-tabs { display:flex; gap:6px; margin-left:auto; }\n  .chat-tab { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.07); color:rgba(232,234,240,.62); border-radius:999px; padding:4px 8px; font-size:10px; cursor:pointer; }\n  .chat-tab.active { color:var(--ws-text); border-color:rgba(108,99,255,.4); background:rgba(108,99,255,.18); }\n  #typing-indicator { min-height:16px; padding:0 14px 7px; color:var(--ws-teal); font-size:11px; opacity:.82; }\n  @keyframes popIn { from{opacity:0; transform:translateX(-50%) translateY(8px) scale(.96)} to{opacity:1; transform:translateX(-50%) translateY(0) scale(1)} }\n  @keyframes fadeLayer { from{opacity:0} to{opacity:1} }\n  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms!important; transition-duration:.001ms!important; } }\n\n  /* ── BONUS WIDGETS ── */\n  .pl-floating {\n    position: fixed; z-index: 110;\n    background: rgba(30,37,52,0.92); border: 1px solid rgba(255,255,255,0.08);\n    border-radius: 10px; padding: 8px 12px; backdrop-filter: blur(14px);\n    color: #E8EAF0; font-size: 12px; display: flex; align-items: center; gap: 8px;\n    box-shadow: 0 4px 20px rgba(0,0,0,0.35);\n  }\n  body.light-mode .pl-floating { background: var(--ws-panel); border-color: var(--ws-border); color: var(--ws-text); }\n  /* Bottom-right stack: clock above pomodoro */\n  #clock-widget {\n    position: fixed; right: 16px; bottom: 16px;\n    flex-direction: column; align-items: flex-start; gap: 2px;\n    padding: 8px 14px; min-width: 132px;\n    background: rgba(22,28,42,0.92);\n    border: 1px solid rgba(255,255,255,0.1);\n    box-shadow: 0 10px 30px rgba(0,0,0,0.45);\n  }\n  #pomodoro-widget {\n    position: fixed; right: 16px; bottom: 78px;\n    background: rgba(22,28,42,0.92);\n    border: 1px solid rgba(255,255,255,0.1);\n    box-shadow: 0 10px 30px rgba(0,0,0,0.45);\n  }\n  #clock-time { font-size: 15px; font-weight: 600; letter-spacing: 0.5px; }\n  #clock-meta { font-size: 10px; opacity: 0.75; letter-spacing: 0.4px; }\n  /* Agenda is now rendered inside the bell notification panel — keep DOM hidden */\n  #agenda-widget { display: none !important; }\n  /* Bell unread badge */\n  #bell-btn { position: relative; }\n  .bell-badge {\n    position: absolute; top: -4px; right: -4px;\n    min-width: 16px; height: 16px; padding: 0 4px;\n    border-radius: 8px; background: #FF5B5B; color: #fff;\n    font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;\n    box-shadow: 0 0 0 2px rgba(15,17,23,0.95), 0 0 10px rgba(255,91,91,0.55);\n    pointer-events: none; display: none;\n  }\n  .bell-badge.show { display: inline-block; }\n  .note-item.unread { background: rgba(108,99,255,0.10); padding-left: 8px; padding-right: 8px; border-radius: 6px; }\n  .note-item.unread::before { content: \"●\"; color: #6C63FF; margin-right: 6px; }\n  /* Door interaction prompt overlay */\n  #door-prompt {\n    position: fixed; left: 50%; bottom: 24%;\n    transform: translateX(-50%) translateY(8px);\n    background: rgba(22,28,42,0.96); border: 1px solid rgba(0,212,170,0.45);\n    border-radius: 10px; padding: 8px 16px;\n    color: #E8EAF0; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;\n    z-index: 220; pointer-events: none; opacity: 0;\n    transition: opacity 0.18s ease, transform 0.18s ease;\n    box-shadow: 0 10px 30px rgba(0,0,0,0.45);\n    display: flex; align-items: center; gap: 10px;\n  }\n  #door-prompt.show { opacity: 1; transform: translateX(-50%) translateY(0); }\n  #door-prompt kbd {\n    background: rgba(0,212,170,0.2); border: 1px solid rgba(0,212,170,0.5);\n    padding: 2px 7px; border-radius: 5px; font-size: 11px; font-family: inherit;\n  }\n  .pomo-btn {\n    background: rgba(108,99,255,0.2); border: 1px solid rgba(108,99,255,0.4);\n    color: #E8EAF0; border-radius: 6px; padding: 3px 9px; cursor: pointer;\n    font-size: 11px; transition: background 0.18s ease;\n  }\n  .pomo-btn:hover { background: rgba(108,99,255,0.35); }\n  .pomo-icon { font-size: 14px; }\n  #pomo-time { font-weight: 600; min-width: 44px; }\n\n  #palette-overlay {\n    position: fixed; inset: 0; z-index: 600; display: none;\n    background: rgba(5,7,12,0.6); backdrop-filter: blur(6px);\n    align-items: flex-start; justify-content: center; padding-top: 18vh;\n    animation: fadeLayer .15s ease;\n  }\n  #palette-overlay.open { display: flex; }\n  #palette-modal {\n    width: min(560px, 92vw); background: rgba(30,37,52,0.98);\n    border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;\n    box-shadow: 0 30px 80px rgba(0,0,0,0.6); overflow: hidden;\n  }\n  #palette-input {\n    width: 100%; padding: 16px 18px; background: transparent; border: none; outline: none;\n    color: #E8EAF0; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.08);\n  }\n  #palette-results { max-height: 320px; overflow-y: auto; }\n  .palette-item {\n    padding: 10px 18px; font-size: 13px; color: #E8EAF0; cursor: pointer;\n    display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.04);\n    transition: background 0.12s ease;\n  }\n  .palette-item:hover, .palette-item.active { background: rgba(108,99,255,0.18); }\n  .palette-item .pi-icon { font-size: 16px; opacity: 0.9; }\n  .palette-item .pi-hint { margin-left: auto; font-size: 10px; opacity: 0.5; }\n\n  #reaction-wheel {\n    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(20px);\n    z-index: 110; display: none; gap: 6px; padding: 8px 12px;\n    background: rgba(30,37,52,0.95); border: 1px solid rgba(255,255,255,0.08);\n    border-radius: 30px; backdrop-filter: blur(14px);\n    box-shadow: 0 12px 40px rgba(0,0,0,0.45);\n    transition: opacity 0.2s ease, transform 0.2s ease; opacity: 0;\n  }\n  #reaction-wheel.show { display: flex; opacity: 1; transform: translateX(-50%) translateY(0); }\n  .rw-btn {\n    width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer;\n    background: rgba(255,255,255,0.04); font-size: 20px;\n    transition: transform 0.15s ease, background 0.15s ease;\n  }\n  .rw-btn:hover { transform: scale(1.18); background: rgba(255,255,255,0.12); }\n\n  /* ── VIRTUAL JOYSTICK (mobile) — sits ABOVE the minimap ── */\n  #joystick {\n    position: fixed; left: 16px; bottom: 130px;\n    width: 130px; height: 130px; border-radius: 50%;\n    background: rgba(22,28,42,0.55);\n    border: 1px solid rgba(255,255,255,0.12);\n    backdrop-filter: blur(8px);\n    z-index: 200; touch-action: none;\n    display: none;\n    box-shadow: 0 8px 24px rgba(0,0,0,0.4);\n  }\n  #joystick.visible { display: block; }\n  #joystick-stick {\n    position: absolute; left: 50%; top: 50%;\n    width: 56px; height: 56px; margin-left: -28px; margin-top: -28px;\n    border-radius: 50%;\n    background: linear-gradient(135deg, #6C63FF, #00D4AA);\n    box-shadow: 0 4px 14px rgba(108,99,255,0.5);\n    transition: transform 0.04s linear;\n    pointer-events: none;\n  }\n\n  /* ── MOBILE INTERACT BUTTON (replaces \"E\" key on touch devices) ── */\n  #interact-btn {\n    position: fixed; right: 22px; bottom: 150px;\n    width: 64px; height: 64px; border-radius: 50%;\n    background: linear-gradient(135deg, #00D4AA, #6C63FF);\n    border: 2px solid rgba(255,255,255,0.18);\n    color: #fff; font-weight: 800; font-size: 13px; letter-spacing: 0.5px;\n    box-shadow: 0 10px 26px rgba(0,212,170,0.45);\n    z-index: 205; display: none; cursor: pointer; user-select: none;\n    align-items: center; justify-content: center; touch-action: manipulation;\n    transition: transform 0.12s ease;\n  }\n  #interact-btn.visible { display: flex; }\n  #interact-btn:active { transform: scale(0.92); }\n\n  /* ── RESPONSIVE / MOBILE & TABLET ── */\n  @media (max-width: 1024px) {\n    #hud { padding: 7px 14px; font-size: 11px; }\n    #top-actions { right: 150px; }\n  }\n\n  /* === TABLET (≤900px): collapse top bar — hide HUD, shrink everything === */\n  @media (max-width: 900px) {\n    #hud { display: none; }                       /* \"X members online\" — not essential */\n    #top-actions { top: 12px; right: 12px; gap: 6px; z-index: 170; }\n    .icon-btn { width: 34px; height: 34px; font-size: 14px; }\n    /* Move zone badge BELOW the top-actions so it never collides */\n    #zone-badge {\n      top: 56px; right: 12px;\n      padding: 5px 10px;\n      font-size: 10px;\n    }\n    #zone-name { font-size: 10px; }\n  }\n\n  /* === MOBILE PHONE (≤768px) === */\n  @media (max-width: 768px) {\n    /* TOP-LEFT: collapse user panel to just the avatar circle */\n    #user-panel {\n      top: 12px; left: 12px;\n      padding: 6px; min-width: 0;\n      gap: 0;\n    }\n    .up-info { display: none; }                   /* hide name + status text */\n\n    /* LEFT COLUMN bottom stack: minimap → joystick (above) */\n    #minimap { left: 10px; bottom: 10px; padding: 6px; }\n    #minimap canvas { width: 96px; height: 62px; }\n    #minimap-label { display: none; }\n    #joystick { display: block; left: 14px; bottom: 100px; width: 116px; height: 116px; }\n    #joystick-stick { width: 48px; height: 48px; margin-left: -24px; margin-top: -24px; }\n\n    /* RIGHT COLUMN bottom stack — explicit 12px vertical gaps, nothing overlaps.\n       Order from bottom up:  clock → pomodoro → interact-btn → chat-fab        */\n    /* Heights:  clock ≈48px,  pomodoro ≈32px,  interact 58px,  chat-fab 46px\n       Stack with 8px gaps:\n         clock     : 10  → 58\n         pomodoro  : 66  → 98\n         interact  : 110 → 168\n         chat-fab  : 180 → 226                                           */\n    #clock-widget {\n      right: 10px; bottom: 10px;\n      padding: 5px 10px; min-width: 104px;\n      gap: 0;\n    }\n    #clock-time { font-size: 12px; line-height: 1.2; }\n    #clock-meta { font-size: 9px; line-height: 1.2; }\n    #pomodoro-widget {\n      right: 10px; bottom: 66px;\n      padding: 5px 10px; font-size: 11px;\n    }\n    #interact-btn {\n      display: flex;\n      right: 14px; bottom: 110px;\n      width: 58px; height: 58px; font-size: 12px;\n    }\n    #chat-fab {\n      display: flex;\n      right: 14px; bottom: 180px;\n      width: 46px; height: 46px; font-size: 18px;\n    }\n\n    /* Chat = slide-up bottom sheet, full width */\n    #chat-panel {\n      width: 100vw !important;\n      left: 0 !important; right: 0 !important;\n      bottom: 0 !important;\n      max-height: 50vh;\n      border-radius: 16px 16px 0 0 !important;\n      transform: translateY(100%) !important;\n    }\n    #chat-panel.visible { transform: translateY(0) !important; }\n    #chat-messages { max-height: 32vh; }\n\n    #controls-hint { display: none; }\n    #door-prompt { bottom: 38%; font-size: 12px; padding: 7px 12px; }\n  }\n\n  /* === SMALL PHONE (≤480px) — tighten further === */\n  @media (max-width: 480px) {\n    #joystick { left: 10px; bottom: 96px; width: 104px; height: 104px; }\n    #joystick-stick { width: 44px; height: 44px; margin-left: -22px; margin-top: -22px; }\n    #interact-btn { right: 10px; bottom: 100px; width: 54px; height: 54px; font-size: 11px; }\n    #chat-fab { right: 10px; bottom: 168px; width: 42px; height: 42px; font-size: 16px; }\n    #chat-panel { max-height: 55vh; }\n    /* On very small screens, HIDE the zone badge — the minimap shows location */\n    #zone-badge { display: none; }\n    /* Compact top-actions further */\n    .icon-btn { width: 32px; height: 32px; font-size: 13px; }\n  }\n\n\n" }} />

      {/* Entry screen */}
      <div id="entry-overlay">
        <div className="entry-atmosphere-1"></div>
        <div className="entry-atmosphere-2"></div>
        <div className="entry-atmosphere-3"></div>
        <div className="entry-spinner"></div>
        <div className="entry-text">Entering Workspace...</div>
      </div>

      <div id="game-container" className="z-0"></div>
      <div id="zone-tint"></div>
      <div id="door-prompt"><kbd>E</kbd><span id="door-prompt-text">Enter Work Area</span></div>

      {/* Mobile touch controls (joystick, interact) */}
      {isMobile && (
        <>
          <div id="joystick" aria-hidden="true"><div id="joystick-stick"></div></div>
          <button id="interact-btn" type="button" aria-label="Interact">E</button>
        </>
      )}

      {/* Minimap */}
      <div id="minimap">
        <canvas id="minimap-canvas" width="130" height="84"></canvas>
        <div id="minimap-label">Overview</div>
      </div>

      {/* Toast */}
      <div id="toast"><span className="toast-icon" id="toast-icon">ℹ</span><span id="toast-msg"></span></div>

      <div id="notification-panel" className="pl-panel">
        <div className="pl-head"><span className="pl-title">Notifications</span><button className="pl-btn" id="clear-notes">Clear</button></div>
        <div className="pl-body" id="note-list"></div>
      </div>

      <div id="room-panel" className="pl-panel">
        <div className="pl-head"><span className="pl-title">Rooms</span></div>
        <div className="pl-body">
          <button className="pl-btn room-option" data-room="Workspace A">Workspace A</button>
          <button className="pl-btn room-option" data-room="Workspace B">Workspace B</button>
          <button className="pl-btn room-option" data-room="Private Room">Private Room</button>
        </div>
      </div>

      <div id="settings-panel" className="pl-panel">
        <div className="pl-head"><span className="pl-title">Avatar</span></div>
        <div className="pl-body">
          <label className="field-row">Initial <input id="avatar-initial" maxLength={2} defaultValue="★" /></label>
          <label className="field-row">Style
            <select id="avatar-style" defaultValue="normal">
              <option value="normal">Glow</option>
              <option value="minimal">Minimal</option>
              <option value="bold">Bold</option>
            </select>
          </label>
          <div className="field-row">Color
            <div className="swatches">
              <button className="swatch" data-color="purple" style={{ background: "#6C63FF" }}></button>
              <button className="swatch" data-color="teal" style={{ background: "#00D4AA" }}></button>
              <button className="swatch" data-color="amber" style={{ background: "#FFB84C" }}></button>
              <button className="swatch" data-color="danger" style={{ background: "#FF5B5B" }}></button>
            </div>
          </div>
        </div>
      </div>

      <div id="meeting-panel" className="pl-panel">
        <div className="pl-head"><span className="pl-title">Meeting in progress</span></div>
        <div className="pl-body">
          <div className="pl-small" id="meeting-count">Participants</div>
          <div id="participant-list"></div>
          <div className="meeting-actions">
            <button className="pl-btn" id="mute-btn">Mute</button>
            <button className="pl-btn" id="leave-meeting-btn">Leave</button>
          </div>
        </div>
      </div>

      {/* screen-share overlay removed: caused permanent UI bleed */}

      <div id="profile-popup">
        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar" id="profile-avatar">A</div>
            <div>
              <div className="profile-name" id="profile-name">Alex</div>
              <div className="profile-status" id="profile-status">Focus</div>
            </div>
          </div>
          <div className="profile-actions">
            <button className="pl-btn" id="profile-follow">Follow</button>
            <button className="pl-btn" id="profile-chat">Chat</button>
            <button className="pl-btn" id="profile-view">View Profile</button>
          </div>
        </div>
      </div>

      <div id="whiteboard-modal">
        <div className="whiteboard-shell">
          <div className="pl-head">
            <span className="pl-modal-title">Whiteboard</span>
            <div>
              <button className="pl-btn" id="add-note">Add sticky note</button>{" "}
              <button className="pl-btn" id="close-whiteboard">Close</button>
            </div>
          </div>
          <div className="whiteboard-canvas" id="whiteboard-canvas"></div>
        </div>
      </div>

      {/* Follow bar */}
      <div id="follow-bar"><span id="follow-label">Following —</span><button id="follow-stop">Stop</button></div>

      {/* Sit badge */}
      <div id="sit-badge">🪑 Seated — Press E to stand</div>

      {/* Controls */}
      <div id="controls-hint">WASD · E interact · 1–4 emotes · Enter chat · M mute · F follow · Ctrl+K palette</div>

      {/* Agenda / Daily standup */}

      {/* Command palette (Ctrl/Cmd + K) */}
      <div id="palette-overlay">
        <div id="palette-modal">
          <input id="palette-input" placeholder="Type a command…  (try 'whiteboard', 'meeting', 'theme')" autoComplete="off" />
          <div id="palette-results"></div>
        </div>
      </div>

      {/* Quick reaction wheel */}
      <div id="reaction-wheel">
        <button className="rw-btn" data-emote="👍">👍</button>
        <button className="rw-btn" data-emote="😂">😂</button>
        <button className="rw-btn" data-emote="👏">👏</button>
        <button className="rw-btn" data-emote="🔥">🔥</button>
        <button className="rw-btn" data-emote="❤️">❤️</button>
        <button className="rw-btn" data-emote="🎉">🎉</button>
      </div>
    </>
  );
}

export default WorkspaceScene;
