# Breakout Shuffler - GitHub Copilot Instructions

This file provides global instructions for GitHub Copilot when working with this repository.

## Project Overview

Breakout Shuffler is a real-time video breakout room application built as a PNPM monorepo with:
- **Frontend**: React 19 SPA with React Router, XState, and Jotai
- **Backend**: Node.js/Hono API with Socket.io for real-time communication
- **Data Store**: Redis for session and room management

## Technology Stack

### Client (`apps/client`)
- React 19 with TypeScript
- Vite for build tooling
- React Router for SPA routing
- XState for state machines
- Jotai for atomic state management
- Vitest for testing

### Server (`apps/server`)
- Node.js with TypeScript
- Hono web framework
- Socket.io for WebSocket communication
- Redis for data persistence
- Vitest for testing

### Shared (`packages/shared`)
- Shared utilities between client and server
- ESM modules only

## Development Commands

```bash
# Install dependencies (requires PNPM 10.4.0+)
pnpm install

# Run all apps in development mode
pnpm dev

# Run tests across all packages
pnpm test

# Build all packages
pnpm build
```

## Code Standards

### Module System
- **Use ESM only**: All packages have `"type": "module"` in package.json
- Import paths must use `.js` extensions even for TypeScript files
- TypeScript configured with `module: ESNext` and `moduleResolution: bundler`

### State Management Patterns
- **XState**: For complex state machines (room state, connection state)
- **Jotai**: For simple global state and cross-component data sharing
- **Local State**: Use React hooks for component-only state

### Backend Patterns
- **Repository Pattern**: All data access through repository classes extending BaseRepository
- **Service Layer**: Business logic separated from data access
- **Redis Keys**: Use format `entity:{id}` for entities, `relationship:{parentId}` for relationships

### Socket.io Patterns
```typescript
// Client-side listener setup (always cleanup in useEffect)
useEffect(() => {
  const handleEvent = (data: DataType) => { /* handle */ };
  socket.on('eventName', handleEvent);
  return () => { socket.off('eventName', handleEvent); };
}, [dependencies]);
```

### Testing
- Unit tests with Vitest
- Test files colocated with source: `*.test.ts`
- No E2E testing framework configured

## File Organization

### Client Structure
- `apps/client/app/machines/` - XState state machines
- `apps/client/app/atoms/` - Jotai state atoms
- `apps/client/app/routes/` - Page components
- `apps/client/app/components/` - Reusable React components
- `apps/client/app/lib/socket.ts` - Socket.io client configuration

### Server Structure
- `apps/server/src/repositories/` - Data access layer
- `apps/server/src/services/` - Business logic layer
- `apps/server/src/index.ts` - Application entry point

## Important Constraints

### Do NOT
- Mix CommonJS and ESM (use ESM only)
- Import TypeScript files without `.js` extension
- Access Redis directly (always use repositories)
- Create new state management patterns without justification
- Remove or modify unrelated tests
- Add new testing frameworks without discussion
- Bypass the service layer for business logic

### Always
- Run `pnpm install` after adding dependencies
- Check existing patterns before creating new ones
- Write tests for new features
- Use TypeScript strict mode
- Handle errors properly with try-catch and error states
- Clean up Socket.io listeners in useEffect return functions

## Documentation

For more detailed information:
- See `docs/robot-instructions.md` for project-specific guidance
- See `docs/robot-code-convention.md` for detailed coding standards
- See `docs/robot-summary.md` for current implementation details
- See `AGENTS.md` for Claude Code agent instructions
