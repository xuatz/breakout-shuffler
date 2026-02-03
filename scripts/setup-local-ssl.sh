#!/bin/bash

# Setup local SSL certificates using mkcert
# This script generates trusted local certificates for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "caddy/Caddyfile" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Usage: ./scripts/setup-local-ssl.sh"
    exit 1
fi

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo -e "${RED}Error: mkcert is not installed${NC}"
    echo ""
    echo "Please install mkcert first:"
    echo ""
    echo "  macOS:"
    echo "    brew install mkcert"
    echo ""
    echo "  Linux (Debian/Ubuntu):"
    echo "    sudo apt install mkcert"
    echo ""
    echo "  Linux (Arch):"
    echo "    sudo pacman -S mkcert"
    echo ""
    echo "  Other: https://github.com/FiloSottile/mkcert#installation"
    exit 1
fi

echo -e "${YELLOW}Setting up local SSL certificates...${NC}"
echo ""

# Set CAROOT to use caddy directory for CA files
export CAROOT="$(pwd)/caddy"

# Install the local CA in the system trust store
# This also generates rootCA.pem and rootCA-key.pem in CAROOT if they don't exist
echo "Installing local CA in system trust store..."
mkcert -install

# Generate certificates for local domains
echo "Generating certificates for local domains..."
mkcert -cert-file caddy/cert.pem -key-file caddy/key.pem \
    client.breakout.local \
    server.breakout.local

echo ""
echo -e "${GREEN}Local SSL setup complete!${NC}"
echo ""
echo "Generated files in caddy/:"
echo "  - rootCA.pem (local CA certificate)"
echo "  - rootCA-key.pem (local CA private key)"
echo "  - cert.pem (server certificate)"
echo "  - key.pem (server private key)"
echo ""
echo -e "${YELLOW}Important: Restart your browser for the CA to be recognized.${NC}"
