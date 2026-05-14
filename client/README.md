# Virtual Workspace Frontend

A modern React + Phaser.js virtual workspace application with real-time multiplayer features, task management, and productivity analytics.

## Features

- ✅ **Real-time Multiplayer** - Socket.IO integration for live user synchronization
- ✅ **Virtual Workspace** - Phaser.js-based interactive office environment
- ✅ **Chat System** - Direct messaging between nearby users
- ✅ **Task Management** - Create, assign, and track tasks
- ✅ **Session Tracking** - Clock in/out with time tracking
- ✅ **Analytics Dashboard** - Productivity insights and statistics
- ✅ **Proximity System** - Automatic chat suggestions for nearby users
- ✅ **Focus Mode** - Distraction-free work environment
- ✅ **Responsive UI** - Mobile-friendly design with Tailwind CSS

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.IO** - Real-time communication
- **Phaser 3** - Game engine for virtual workspace
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Navigation

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Update .env with your backend URL
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── pages/                    # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Workspace.jsx        # Main workspace page
│   └── Dashboard.jsx
├── components/
│   ├── shared/              # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   └── Tooltip.jsx
│   ├── workspace/           # Workspace-specific components
│   │   ├── PhaserGame.jsx
│   │   ├── ChatPanel.jsx
│   │   ├── UserList.jsx
│   │   └── ProximityToast.jsx
│   ├── productivity/        # Productivity features
│   │   ├── ClockWidget.jsx
│   │   ├── StatsCard.jsx
│   │   └── WorkPressureIndicator.jsx
│   └── tasks/               # Task management components
│       ├── TaskCard.jsx
│       ├── TaskBoard.jsx
│       └── CreateTaskModal.jsx
├── hooks/                   # Custom React hooks
│   ├── useSocket.js        # Socket.IO integration
│   ├── useAuth.js          # Authentication
│   ├── useSession.js       # Session tracking
│   └── useProximity.js     # Proximity detection
├── store/                   # Zustand stores
│   ├── authStore.js        # Authentication state
│   ├── workspaceStore.js   # Workspace state
│   └── uiStore.js          # UI state
├── services/
│   └── api.js              # API client
├── App.jsx                 # Main app with routing
├── main.jsx
└── index.css               # Global styles
```

## Key Components

### Authentication
- Login page with email/password
- Registration with account creation
- Protected routes with auth guards

### Workspace
- Real-time multiplayer avatar synchronization
- Interactive Phaser.js virtual office
- Position tracking and movement sync
- Proximity-based interactions

### Chat
- Real-time messaging with Socket.IO
- User presence indicators
- Auto-switch to chat when nearby

### Tasks
- Create, update, delete tasks
- Drag-and-drop status updates
- Task assignment and filtering
- Status tracking (To Do, In Progress, Done)

### Productivity
- Session clock in/out
- Real-time timer
- Work pressure indicators
- Analytics dashboard

## Socket.IO Events

### Client Emit
- `workspace:join` - Join workspace
- `avatar:move` - Update avatar position
- `chat:send` - Send message
- `task:create` - Create task
- `proximity:check` - Check nearby users

### Server Listen
- `workspace:state` - Workspace initial state
- `user:joined` - New user joined
- `user:left` - User disconnected
- `avatar:moved` - Remote user moved
- `chat:message` - Incoming message
- `proximity:enter` - User nearby
- `proximity:exit` - User left proximity
- `notification:smart` - Server notification

## API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/users/me`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Sessions
- `POST /api/sessions/clock-in`
- `POST /api/sessions/clock-out`
- `GET /api/sessions`

### Messages
- `POST /api/messages`
- `GET /api/messages/:userId`

### Analytics
- `GET /api/analytics/stats`
- `GET /api/analytics/heatmap`
- `GET /api/analytics/history`

## Design System

### Colors
- Primary: `#6C63FF` (Purple)
- Secondary: `#00D4AA` (Teal)
- Success: `#22C55E` (Green)
- Warning: `#F59E0B` (Yellow)
- Danger: `#EF4444` (Red)
- Background: `#0F1117` (Dark)

### Components
- Glass morphism design with blur effect
- Smooth animations with Framer Motion
- Responsive grid layouts
- Accessibility-focused UI

## Performance Tips

1. **Throttle Movement** - Socket events are throttled at 50-60ms
2. **Lazy Loading** - Components load on demand
3. **State Optimization** - Zustand prevents unnecessary re-renders
4. **Image Optimization** - Use lazy loading for avatars
5. **Bundle Size** - Tree-shake unused code

## Troubleshooting

### Socket connection fails
- Check if backend is running on `http://localhost:5000`
- Verify `.env` contains correct `VITE_SOCKET_URL`
- Clear browser cache and local storage

### Phaser canvas not rendering
- Ensure Phaser canvas parent has defined dimensions
- Check browser console for WebGL errors
- Verify Phaser config is correct

### State not syncing
- Check Redux/Zustand state in browser dev tools
- Verify Socket.IO event names match backend
- Enable Socket.IO debug logs

## Contributing

1. Follow the project structure
2. Use component composition pattern
3. Keep components small and focused
4. Use TypeScript for new features
5. Test with multiple users

## License

MIT License - See LICENSE file for details
