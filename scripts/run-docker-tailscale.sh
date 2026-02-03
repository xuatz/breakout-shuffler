#!/bin/bash

# Run Docker Compose with Tailscale sidecar containers
# Each service gets its own Tailscale hostname:
#   - breakout-client.<tailnet>.ts.net
#   - breakout-server.<tailnet>.ts.net
#
# Press Ctrl+C to stop

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.tailscale.yml down 2>/dev/null || true
    echo -e "${GREEN}Cleanup complete!${NC}"
    exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Usage: ./scripts/run-docker-tailscale.sh"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install jq: sudo apt install jq (or brew install jq on macOS)"
    exit 1
fi

echo -e "${CYAN}=== Tailscale Docker Setup ===${NC}"
echo ""

# Check for auth key in environment or .env file
if [ -z "$TS_AUTHKEY" ]; then
    # Try to load from .env file
    if [ -f ".env" ]; then
        source <(grep -E '^TS_AUTHKEY=' .env)
    fi
fi

if [ -z "$TS_AUTHKEY" ]; then
    echo -e "${YELLOW}Tailscale auth key not found.${NC}"
    echo ""
    echo "You can either:"
    echo "  1. Add TS_AUTHKEY=tskey-auth-xxx to .env file"
    echo "  2. Export it: export TS_AUTHKEY=tskey-auth-xxx"
    echo "  3. Enter it below"
    echo ""
    echo "Generate a reusable auth key at:"
    echo "  https://login.tailscale.com/admin/settings/keys"
    echo ""
    echo "Recommended settings:"
    echo "  - Reusable: Yes (allows both containers to use the same key)"
    echo "  - Ephemeral: Yes (auto-cleanup when containers stop)"
    echo ""
    
    read -p "Enter auth key: " TS_AUTHKEY
    if [ -z "$TS_AUTHKEY" ]; then
        echo -e "${RED}Error: Auth key is required${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Found TS_AUTHKEY${NC}"
fi

export TS_AUTHKEY

# Get Tailscale domain from local tailscale (if available) or prompt
if command -v tailscale &> /dev/null && tailscale status &> /dev/null; then
    TAILSCALE_DOMAIN=$(tailscale status --json | jq -r '.MagicDNSSuffix')
    echo -e "${GREEN}Detected Tailscale domain:${NC} $TAILSCALE_DOMAIN"
else
    echo -e "${YELLOW}Tailscale not running locally. Please enter your tailnet domain.${NC}"
    echo "Find it at: https://login.tailscale.com/admin/dns"
    echo ""
    read -p "Enter your Tailscale domain (e.g., tail1234.ts.net): " TAILSCALE_DOMAIN
    if [ -z "$TAILSCALE_DOMAIN" ]; then
        echo -e "${RED}Error: Tailscale domain is required${NC}"
        exit 1
    fi
fi

export TAILSCALE_DOMAIN

echo ""
echo "Services will be available at:"
echo -e "  Client: ${GREEN}https://breakout-client.$TAILSCALE_DOMAIN${NC}"
echo -e "  Server: ${GREEN}https://breakout-server.$TAILSCALE_DOMAIN${NC}"
echo ""

echo -e "${YELLOW}Starting Docker Compose with Tailscale...${NC}"
docker compose -f docker-compose.yml -f docker-compose.tailscale.yml up -d

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Tailscale containers are starting!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Wait a few seconds for Tailscale to authenticate..."
echo ""
echo "Access the app from your mobile device:"
echo -e "  Client: ${GREEN}https://breakout-client.$TAILSCALE_DOMAIN${NC}"
echo -e "  Server: ${GREEN}https://breakout-server.$TAILSCALE_DOMAIN${NC}"
echo ""
echo "The QR code will use the correct Tailscale URL."
echo ""
echo -e "${CYAN}Press Ctrl+C to stop${NC}"
echo ""

# Follow docker logs
docker compose -f docker-compose.yml -f docker-compose.tailscale.yml logs -f
