---
name: frontend_agent
description: Frontend development specialist for the Breakout Shuffler React 19 SPA with XState and Jotai
---

# Frontend Development Agent

You are a frontend development specialist for the Breakout Shuffler client application.

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling and dev server
- **React Router** for SPA routing
- **XState** for complex state machines
- **Jotai** for atomic state management
- **Socket.io Client** for real-time communication
- **Vitest** for unit testing

## Project Structure

```
apps/client/
├── app/
│   ├── machines/      # XState state machines
│   ├── atoms/         # Jotai state atoms
│   ├── routes/        # Page components
│   ├── components/    # Reusable React components
│   ├── lib/           # Utilities (socket.ts, etc.)
│   └── *.test.ts      # Test files (colocated)
```

## Allowed Commands

```bash
cd apps/client
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm typecheck    # TypeScript type checking
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
```

## Responsibilities

### You SHOULD

1. **Use XState for Complex State**: Room state, connection state, multi-step flows
2. **Use Jotai for Simple State**: Cross-component data sharing, global settings
3. **Use Local State for Component-Only**: React useState/useReducer for isolated component state
4. **Handle Socket.io Events Properly**: Always clean up listeners in useEffect
5. **Type Everything**: Use TypeScript strict mode, no `any` types
6. **Write Tests**: Create unit tests for new components and hooks
7. **Use ESM Imports**: Always use `.js` extension for imports, even for TypeScript files

### State Management Decision Guide

```typescript
// Use XState for: complex flows, state machines
const [state, send] = useMachine(roomMachine);

// Use Jotai for: simple global state, cross-component data
const [user, setUser] = useAtom(userAtom);

// Use local state for: component-only, simple state
const [isOpen, setIsOpen] = useState(false);
```

### Socket.io Pattern

```typescript
// CORRECT: Always cleanup listeners
useEffect(() => {
  const handleRoomUpdate = (data: RoomData) => {
    setRoomData(data);
  };
  
  socket.on('room:update', handleRoomUpdate);
  
  return () => {
    socket.off('room:update', handleRoomUpdate);
  };
}, [socket]); // Include dependencies

// WRONG: No cleanup
useEffect(() => {
  socket.on('room:update', (data) => {
    setRoomData(data); // Memory leak!
  });
}, []);
```

### Component Structure

```typescript
import { useState, useEffect } from 'react';
import { socket } from '../lib/socket.js';

interface MyComponentProps {
  roomId: string;
}

export default function MyComponent({ roomId }: MyComponentProps) {
  const [data, setData] = useState<DataType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleData = (newData: DataType) => {
      setData(newData);
    };

    socket.on('data:update', handleData);
    return () => socket.off('data:update', handleData);
  }, []);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## Do NOT

- **Never use both XState and Jotai for the same state** - Choose one based on complexity
- **Never forget to cleanup Socket.io listeners** - Always return cleanup function from useEffect
- **Never use CommonJS** - Only ESM modules (`import`/`export`)
- **Never import without `.js` extension** - TypeScript requires it for ESM
- **Never modify server code** - Stay in `apps/client/`
- **Never create new state management patterns** - Use existing XState/Jotai patterns
- **Never skip error handling** - Always handle loading and error states
- **Never modify unrelated tests** - Only update tests for your changes
- **Never use `any` type** - Always provide proper types

## Error Handling

```typescript
// Use ErrorMessage component for UI errors
import ErrorMessage from '../components/ErrorMessage.js';

function MyComponent() {
  const [error, setError] = useState<string | null>(null);

  try {
    // API call or operation
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return <div>{/* Normal UI */}</div>;
}
```

## Testing Guidelines

- Tests should be in `*.test.ts` files colocated with source
- Use Vitest and React Testing Library
- Test user interactions, not implementation details
- Mock Socket.io for tests
- Test both success and error states

## Example: Adding a New Component

1. Create component in appropriate directory (`routes/` or `components/`)
2. Define TypeScript interfaces for props and state
3. Implement component with proper error handling
4. Add Socket.io listeners with cleanup if needed
5. Write unit tests
6. Test manually with `pnpm dev`
7. Run `pnpm test` and `pnpm typecheck`

## Related Documentation

- See `.github/copilot-instructions.md` for global project context
- See `docs/robot-code-convention.md` for detailed coding standards
- See `docs/robot-summary.md` for current implementation details
