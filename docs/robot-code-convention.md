# Code Conventions

## Server Architecture

### Repository Layer
- Use repository pattern for data persistence operations
- Each repository extends BaseRepository for common Redis operations
- Follow consistent key naming patterns:
  - Entity-specific data: `entity:{id}` (e.g., `room:{roomId}`)
  - Relationship data: `relationship:{parentId}` (e.g., `host_nudges:{roomId}`)
- Store complex data as JSON strings in Redis hashes
- Include timestamps for time-sensitive data

### Service Layer
- Services use repositories for data access
- Services contain business logic and orchestrate repository operations
- Services should not directly interact with Redis
- Keep services focused on their domain:
  - RoomService: Room management and participant operations
  - SocketService: Real-time communication and event handling

## UI Components

### Dark Mode Support
- Use `dark:` prefix for dark mode variants of styles
- Follow color intensity pattern:
  - Light mode: base color -> hover +100 (e.g., bg-blue-500 -> hover:bg-blue-600)
  - Dark mode: base color +100 -> hover +200 (e.g., dark:bg-blue-600 -> dark:hover:bg-blue-700)

### Debug Features
- Prefix debug-related event names with 'debug' (e.g., 'debugPing')

### React Components
- Extract frequently used values into variables before the return statement
- When using hooks that return multiple values, destructure only the needed values (e.g., `const [cookies] = useCookies()` if setCookie is not needed)
- Use consistent naming for user identifiers (e.g., userId for the current user's ID)
- Layout patterns:
  - Use flex with gap utilities (e.g., gap-x-2) for consistent spacing between elements
  - Prefer gap over margin/padding for element spacing when possible

### Modal Components
- Use a base Modal component for consistent styling and behavior
- Implement click-outside behavior at the base Modal level
- Pass title as a prop when the modal needs a header
- Include close button in header when applicable

### State Management
- Use Jotai for global state management
- Prefer atoms with listeners for state that needs side effects
- Keep atom definitions in dedicated files under atoms/
- Group related atoms in the same file (e.g., nudgeWithListener.ts)

### Socket Messages
- Keep socket message payloads minimal:
  - Omit empty objects when no data needs to be sent
  - Only include necessary data in the payload
- Group related socket events in the server implementation
- Include proper error handling for each socket event
- Persist relevant socket event data in Redis when needed

## Docker

### Dockerfile Formatting
- Align multiple COPY commands for better readability when copying to the same destination directory
  ```dockerfile
  COPY --from=build-env /app/apps/client/build            /usr/share/nginx/html
  COPY --from=build-env /app/apps/client/build/index.html /usr/share/nginx/html/index.html
