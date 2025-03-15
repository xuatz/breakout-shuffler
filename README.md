# Breakout Shuffler

## MVP-20250220 Demo

https://github.com/user-attachments/assets/f5aea545-46b0-435b-a3c4-45949166f40c

## Setup

1. Ensure you have Node.js (v20+) installed
2. Install PNPM: `npm install -g pnpm`
3. Install dependencies: `pnpm install`
4. Update /etc/hosts

```diff
...
127.0.0.1       localhost
::1             localhost
...
+ 127.0.0.1 client.breakout.local
+ 127.0.0.1 server.breakout.local
```

## Local Development

Because this application shares the cookie between the client and server app, it is probably easier if you just do the whole local dev environment with docker compose, with caddy (and redis) setup already.

1. install docker
2. docker compose up -d
3. visit https://client.breakout.local

### Trust self-signed tls cert with mkcert

1. certs are in caddy
2. https://github.com/FiloSottile/mkcert#installing-the-ca-on-other-systems

## Workspace Structure

- `apps/`: Application-specific projects
- `packages/`: Shared libraries and utilities

## Feature Roadmap

### Phase 1: Basic Room Creation and User Management ✓
- Room creation with Redis persistence
- User identification with cookies
- Random name generation with customization
- Real-time participant tracking

### Phase 2: Host and Attendee Management ✓
- Host view of attendees
- Group configuration (size/count modes)
- Real-time group distribution preview

### Phase 3: Group Shuffling and Notifications ✓
- Group assignment with shuffle
- Real-time notifications
- Group state persistence

### Phase 4: Advanced Features (In Progress)
- Repeat minimization algorithm
- Late-joining participant handling
- Enhanced group management features

For detailed task tracking and future improvements, see [docs/todos.md](docs/todos.md)
