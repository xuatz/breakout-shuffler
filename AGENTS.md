# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Project Setup
```bash
# Install dependencies (requires PNPM 10.4.0+)
pnpm install

# Start development environment with Docker (recommended)
docker compose up -d
# Access at https://client.breakout.local (requires /etc/hosts setup)

# Run development mode without Docker
pnpm dev  # Runs all apps in parallel
```

### Individual App Commands
```bash
# Client (React)
cd apps/client
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm typecheck  # Run TypeScript checks
pnpm test       # Run tests once
pnpm test:watch # Run tests in watch mode

# Server (Node.js/Hono)
cd apps/server
pnpm dev        # Start with hot reload
pnpm build      # Compile TypeScript
pnpm start      # Run production build
pnpm test       # Run tests once
pnpm test:watch # Run tests in watch mode
```

### Testing
```bash
# Run all tests in monorepo
pnpm test

# Run specific test file
cd apps/client && pnpm test path/to/file.test.ts
cd apps/server && pnpm test path/to/file.test.ts
```

## Architecture Overview

### Monorepo Structure
This is a PNPM workspace monorepo with:
- **Client** (`apps/client`): React 19 SPA with React Router, XState for state machines, and Jotai for atomic state
- **Server** (`apps/server`): Node.js backend using Hono framework with Socket.io for real-time communication
- **Shared** (`packages/shared`): Shared utilities used by both client and server (e.g., `generateRandomName`)

### Module System
The project uses **ESM (ECMAScript Modules)** throughout:
- All packages have `"type": "module"` in package.json
- TypeScript configured with `module: ESNext` and `moduleResolution: bundler`
- After `pnpm install`, shared packages are automatically built via `postinstall` script

### Key Architectural Decisions

#### Frontend State Management
- **XState**: Used for complex state machines (room state, connection state)
- **Jotai**: Used for simple global state and cross-component data sharing
- **React Router**: SPA mode for client-side routing

#### Backend Architecture
- **Repository Pattern**: All data access goes through repository classes extending BaseRepository
- **Service Layer**: Business logic separated from data access (RoomService, SocketService)
- **Redis**: Primary data store using hash structures with JSON serialization
- **Socket.io**: Real-time bidirectional communication between client and server

#### Communication Patterns
- **HTTP**: RESTful endpoints for data operations (GET, POST)
- **WebSocket**: Real-time updates via Socket.io events
- **Shared Cookie**: Authentication state shared between client.breakout.local and server.breakout.local

### Key File Locations

#### Client Structure
- `apps/client/app/machines/` - XState state machines
- `apps/client/app/atoms/` - Jotai state atoms  
- `apps/client/app/routes/` - Page components
- `apps/client/app/components/` - Reusable React components
- `apps/client/app/lib/socket.ts` - Socket.io client configuration

#### Server Structure
- `apps/server/src/repositories/` - Data access layer
- `apps/server/src/services/` - Business logic layer
- `apps/server/src/index.ts` - Application entry point

### Development Workflow

1. **Read Documentation First**: Check `docs/robot-instructions.md` for project-specific guidance
2. **Follow Code Conventions**: Review `docs/robot-code-convention.md` for coding standards
3. **Check Current Tasks**: Look at `docs/todos.md` for ongoing work
4. **Understand System State**: Read `docs/robot-summary.md` for current implementation details

### Important Patterns

#### Redis Key Naming
- Entity data: `entity:{id}` (e.g., `room:{roomId}`)
- Relationships: `relationship:{parentId}` (e.g., `host_nudges:{roomId}`)

#### Socket Event Patterns
```typescript
// Client-side listener setup
useEffect(() => {
  const handleEvent = (data: DataType) => { /* handle */ };
  socket.on('eventName', handleEvent);
  return () => { socket.off('eventName', handleEvent); };
}, [dependencies]);
```

#### Error Handling
- Use ErrorMessage component for UI errors
- Handle socket errors via 'error' event
- Wrap API calls in try-catch with proper error states

### Testing Approach
- Unit tests with Vitest
- Test files colocated with source files (*.test.ts)
- No specific E2E testing framework configured