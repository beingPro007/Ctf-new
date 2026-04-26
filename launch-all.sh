#!/bin/bash
# CTF Platform All-In-One Launch Script
# Downloads, builds, and runs the entire platform (frontend + containers + tunnels)
# Usage on a new machine: bash launch-all.sh

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║      CTF Platform - ALL-IN-ONE DEPLOYMENT             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Configuration
REPO_URL="https://github.com/your-username/your-repo.git" # <-- Change to your actual repo if running from scratch
PROJECT_DIR="/opt/ctf-platform"

echo "📦 1. Checking System Dependencies"
echo "------------------------------------------------"
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Please run as root (sudo bash launch-all.sh)"
    exit 1
fi

# Install dependencies if missing
apt-get update -yqq
apt-get install -yqq curl git wget build-essential tmux net-tools jq

if ! command -v docker &> /dev/null; then
    echo "[+] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
fi

if ! command -v node &> /dev/null; then
    echo "[+] Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "[+] Installing PM2 (Process Manager)..."
    npm install -g pm2
fi

if ! command -v cloudflared &> /dev/null; then
    echo "[+] Installing Cloudflared..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
fi

echo "✅ All dependencies satisfied."
echo ""

echo "📥 2. Fetching & Preparing Project codebase"
echo "------------------------------------------------"
if [ ! -f "package.json" ]; then
    # We are not in the local repo, so clone it
    if [ ! -d "$PROJECT_DIR" ]; then
        echo "[+] Cloning repository to $PROJECT_DIR..."
        git clone "$REPO_URL" "$PROJECT_DIR"
    fi
    cd "$PROJECT_DIR"
else
    # We are already in the directory, set it as project dir
    PROJECT_DIR="$(pwd)"
fi

echo "Current Directory: $PROJECT_DIR"
echo ""

echo "🔐 3. Configuring Database & Variables"
echo "------------------------------------------------"
if [ ! -f ".env.local" ]; then
    echo "⚠️  Missing .env.local! Let's generate it."
    read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
    read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON
    read -p "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_KEY
    
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
FLAG_PEPPER=$(head -c 32 /dev/urandom | base64)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
    echo "✅ .env.local created successfully!"
else
    echo "✅ .env.local already configured."
fi

# Push migrations to Supabase if requested
echo -n "[?] Sync database schema to Supabase? (y/n) [n]: "
read DO_SYNC
if [ "$DO_SYNC" = "y" ]; then
    echo "[+] Pushing migrations..."
    npx supabase db push
fi
echo ""

echo "🏗️  4. Building Next.js Frontend Website"
echo "------------------------------------------------"
echo "[+] Installing NPM packages..."
npm install
echo "[+] Building Production Next.js App..."
npm run build
echo "✅ Build complete."
echo ""

echo "🚀 5. Starting Platform Processes"
echo "------------------------------------------------"

# Kill existing pm2 processes if any
pm2 delete ctf-web 2>/dev/null || true
pm2 delete ctf-tunnels 2>/dev/null || true

# Start Next.js on port 3000
echo "[+] Booting Next.js UI (PM2 -> ctf-web)..."
pm2 start npm --name "ctf-web" -- start
sleep 3 # Wait for web GUI to boot up

# Make the tunnel script executable
chmod +x ctf-infra/tunnel/quick-tunnel.sh

# Start backend containers and tunnels
echo "[+] Booting Challenge Tunnels & Containers (PM2 -> ctf-tunnels)..."
pm2 start ctf-infra/tunnel/quick-tunnel.sh --name "ctf-tunnels"

# Save pm2 state so it restarts on system reboot
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true

echo ""
echo "⏳ Waiting 15 seconds for Cloudflare/Pinggy tunnels to securely establish..."
sleep 15

# Read the generated URL to display to the user
PLATFORM_URL=$(grep -oP 'Main CTF Site:\s*\K\S+' ~/.cloudflared/quick-tunnel-logs/current-urls.txt 2>/dev/null || echo "Tunnels booting...")

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║     🟢 ALL SYSTEMS ONLINE AND DEPLOYED 🟢             ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║ You can now access your ENTIRE platform, login, and   ║"
echo "║ play challenges from ANY browser/device using:        ║"
echo "║                                                       ║"
printf "║ 👉 %-50s ║\n" "$PLATFORM_URL"
echo "║                                                       ║"
echo "║ The database is synced. Everything is running.        ║"
echo "║ To view logs:  pm2 logs                               ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
