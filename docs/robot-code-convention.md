# Code Conventions

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
