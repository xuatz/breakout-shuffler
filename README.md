# Breakout Shuffler

## MVP-20250220 Demo

[Demo here](https://breakout-shuffler.xuatz.com/host)

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

1. Install Docker
2. Install [mkcert](https://github.com/FiloSottile/mkcert) for trusted local HTTPS:
   - **macOS**: `brew install mkcert`
   - **Linux (Debian/Ubuntu)**: `sudo apt install mkcert`
   - **Linux (Arch)**: `sudo pacman -S mkcert`
3. Generate and trust local SSL certificates:
   ```bash
   ./scripts/setup-local-ssl.sh
   ```
4. Restart your browser (required for the new CA to be recognized)
5. Start the development environment:
   ```bash
   docker compose up -d
   ```
6. Visit https://client.breakout.local

## Mobile Testing with Tailscale

Test on mobile devices via your Tailscale network with valid HTTPS certificates and custom DNS names. Uses [Tailscale Docker containers](https://tailscale.com/kb/1282/docker) as sidecars.

### One-time setup

Generate a **reusable** auth key at https://login.tailscale.com/admin/settings/keys
- Check "Reusable" (allows both containers to use the same key)
- Check "Ephemeral" (auto-cleanup when containers stop)

### Run the app

Add the auth key to your `.env` file:
```bash
TS_AUTHKEY=tskey-auth-xxxxx
TAILSCALE_DOMAIN=tail1234.ts.net  # Optional: auto-detected if tailscale is running locally
```

Then run:
```bash
./scripts/run-docker-tailscale.sh
```

The script will also prompt for the key if not found in `.env` or environment.

This will:
1. Start Tailscale sidecar containers for client and server
2. Each container gets its own Tailscale identity and HTTPS certificate
3. Follow Docker logs (Ctrl+C to stop)

Access from your mobile device (connected to Tailscale):
- Client: `https://breakout-client.<your-tailnet>.ts.net`
- Server: `https://breakout-server.<your-tailnet>.ts.net`

The QR code will automatically use the correct Tailscale URL.

### Stop the services

Press `Ctrl+C` in the terminal - the script will automatically stop all containers.

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
