# SET - Multiplayer Card Game 🎮

A modern, real-time multiplayer implementation of the SET card game, rebuilt with 2025 technologies.

## 🚀 Features

- Real-time multiplayer gameplay using Socket.io
- Modern React 18 with TypeScript and hooks
- Lightning-fast development with Vite
- Beautiful UI with TailwindCSS
- Type-safe client and server communication
- Monorepo structure with shared types

## 🏗️ Tech Stack

### Frontend (Client)
- **React 18** - Modern UI with functional components and hooks
- **TypeScript** - Full type safety
- **Vite** - Fast build tool with HMR
- **TailwindCSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time WebSocket communication

### Backend (Server)
- **Node.js** with **Express** - HTTP server
- **Socket.io** - Real-time bidirectional communication
- **TypeScript** - Type-safe server code
- **UUID** - Unique game identifiers
- **unique-names-generator** - Auto-generated player nicknames

### Shared
- **TypeScript types** - Shared between client and server for type safety

## 📦 Project Structure

```
set/
├── client/          # React frontend (Vite + TypeScript + TailwindCSS)
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── views/       # Main views (Title, Lobby, Game)
│   │   ├── lib/         # Utilities (Socket client)
│   │   └── App.tsx      # Main application
│   └── public/
│       └── img/         # Card images
├── server/          # Express + Socket.io backend (TypeScript)
│   └── src/
│       ├── index.ts     # Server entry point
│       ├── socket.ts    # Socket.io event handlers
│       ├── app.ts       # Game logic controller
│       ├── games.ts     # Game state management
│       └── users.ts     # User management
├── shared/          # Shared TypeScript types
│   └── src/
│       └── types.ts     # Shared type definitions
└── package.json     # Root workspace configuration
```

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ and yarn

### Installation

1. Install dependencies for all workspaces:
```bash
yarn install
```

### Development

Run both client and server concurrently:
```bash
yarn dev
```

Or run them separately:
```bash
# Terminal 1 - Server
yarn dev:server

# Terminal 2 - Client
yarn dev:client
```

The application will be available at:
- **Client**: http://localhost:5173
- **Server**: http://localhost:3000

### Production Build

```bash
# Build the client
yarn build

# Start the production server
yarn start
```

In production, the server serves the built client files.

## 🎮 How to Play

1. **Enter the game** - Enter a nickname or leave it blank for a random one
2. **Create or join a game** - Create a new game or join an existing one from the lobby
3. **Start the game** - The game creator can start the game when ready
4. **Find SETs** - Select three cards that form a valid SET:
   - Each attribute (shape, color, count, fill) must be either all the same or all different across the three cards
5. **Score points** - Submit your SET to score a point. Invalid SETs lose a point!

## 🔧 Available Scripts

- `yarn dev` - Run both client and server in development mode
- `yarn dev:server` - Run only the server
- `yarn dev:client` - Run only the client
- `yarn build` - Build the client for production
- `yarn build:server` - Build the server
- `yarn start` - Start the production server

## 🆕 What's New in 2.0

This is a complete modernization from the 2017/2020 version:

### Before (2017)
- RequireJS/AMD modules
- React.createClass (legacy API)
- Runtime JSX transpilation
- Semantic UI
- No build system
- No TypeScript
- Socket.io 2.x

### After (2025)
- ✅ ES Modules
- ✅ Modern React with hooks
- ✅ Vite build system with HMR
- ✅ TailwindCSS
- ✅ Full TypeScript support
- ✅ Socket.io 4.x
- ✅ Monorepo structure
- ✅ Type-safe client/server communication
- ✅ Modern development workflow

## 📝 License

This project is open source and available for educational purposes.

## 🎉 Acknowledgments

Original game created in 2017, modernized in 2025 with the latest web technologies.
