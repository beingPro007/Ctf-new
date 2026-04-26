#!/bin/bash
# Auto-generates ~/.cloudflared/config.yml and sets up DNS routes
# Run: bash ctf-infra/tunnel/setup-config.sh

TUNNEL_ID="a0a58650-6064-4570-86ef-c3439865547c"
TUNNEL_NAME="ctf-platform"
CREDS_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"

echo "╔══════════════════════════════════════════╗"
echo "║  CTF Platform - Cloudflare Tunnel Setup  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Tunnel ID: $TUNNEL_ID"
echo ""
echo "Enter your Cloudflare domain (e.g. yourdomain.com):"
read -r DOMAIN
echo ""

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain cannot be empty."
    exit 1
fi

# Generate config.yml
CONFIG_FILE="$HOME/.cloudflared/config.yml"

cat > "$CONFIG_FILE" << EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CREDS_FILE}

ingress:
  # Web challenges - HTTP (players just open in browser)
  - hostname: web1.ctf.${DOMAIN}
    service: http://localhost:5001

  - hostname: web2.ctf.${DOMAIN}
    service: http://localhost:5002

  - hostname: web3.ctf.${DOMAIN}
    service: http://localhost:5003

  # TCP challenges (players: cloudflared access tcp --hostname ...)
  - hostname: pwn.ctf.${DOMAIN}
    service: tcp://localhost:4001

  - hostname: crypto.ctf.${DOMAIN}
    service: tcp://localhost:4002

  - hostname: rev.ctf.${DOMAIN}
    service: tcp://localhost:4003

  - hostname: ssh.ctf.${DOMAIN}
    service: ssh://localhost:2222

  # Catch-all required by cloudflared
  - service: http_status:404
EOF

echo "✅ Config written to $CONFIG_FILE"
echo ""
echo "🌐 Setting up DNS records in Cloudflare..."

# Register DNS routes for HTTP challenges
for subdomain in web1.ctf web2.ctf web3.ctf pwn.ctf crypto.ctf rev.ctf ssh.ctf; do
    hostname="${subdomain}.${DOMAIN}"
    echo "   → Routing $hostname"
    cloudflared tunnel route dns "$TUNNEL_NAME" "$hostname" 2>&1 | grep -v "WRN"
done

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Setup Complete!                         ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Connection strings for your challenges: ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Web challenges (browser):               ║"
echo "║    http://web1.ctf.${DOMAIN}             ║"
echo "║    http://web2.ctf.${DOMAIN}             ║"
echo "║    http://web3.ctf.${DOMAIN}             ║"
echo "╠══════════════════════════════════════════╣"
echo "║  TCP challenges (players need cloudflared):"
echo "║    cloudflared access tcp \\              ║"
echo "║      --hostname pwn.ctf.${DOMAIN} \\     ║"
echo "║      --url localhost:9001               ║"
echo "║    nc localhost 9001                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Now run: ./ctf-infra/tunnel/start.sh"
echo ""

# Save domain to env for the Next.js app
if [ -f ".env.local" ]; then
    # Update CTF_SERVER_IP with domain info
    if grep -q "CTF_SERVER_IP" .env.local; then
        sed -i "s|CTF_SERVER_IP=.*|# CTF web challenges hosted via Cloudflare Tunnel\n# CTF_SERVER_IP=not-needed-with-tunnel\nCTF_TUNNEL_DOMAIN=${DOMAIN}|" .env.local
    else
        echo "" >> .env.local
        echo "# Cloudflare Tunnel domain" >> .env.local
        echo "CTF_TUNNEL_DOMAIN=${DOMAIN}" >> .env.local
    fi
    echo "✅ Updated .env.local with CTF_TUNNEL_DOMAIN=${DOMAIN}"
fi
