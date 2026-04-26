#!/bin/bash
# CTF Infrastructure Quick Start
# Run this to start all Docker containers + Cloudflare Tunnel

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

echo "🐳 Starting CTF Docker containers..."
docker compose -f "$INFRA_DIR/docker-compose.yml" up -d

echo ""
echo "✅ Containers started:"
docker compose -f "$INFRA_DIR/docker-compose.yml" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Starting Cloudflare Tunnel..."
echo "   (Press Ctrl+C to stop the tunnel)"
echo ""

# Check if config exists
CF_CONFIG="$HOME/.cloudflared/config.yml"
if [ ! -f "$CF_CONFIG" ]; then
    echo "❌ Cloudflare config not found at $CF_CONFIG"
    echo ""
    echo "To set up:"
    echo "  1. cloudflared tunnel login"
    echo "  2. cloudflared tunnel create ctf-platform"
    echo "  3. Copy ctf-infra/tunnel/config.example.yml → ~/.cloudflared/config.yml"
    echo "  4. Fill in your tunnel ID and domain"
    echo ""
    exit 1
fi

cloudflared tunnel run ctf-platform
