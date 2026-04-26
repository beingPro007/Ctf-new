#!/bin/bash
# CTF Infrastructure & Platform Setup Script
# Run this on a fresh Ubuntu/Debian machine to set up everything automatically.
# Usage: bash deploy-infra.sh

set -e # Exit on error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║          CTF Platform - Automated Deployment          ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Make sure we're running as root or have sudo privileges
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Please run this script as root or with sudo"
  echo "    sudo bash deploy-infra.sh"
  exit 1
fi

REPO_URL="https://github.com/your-username/your-repo.git" # <-- CHANGE THIS
PROJECT_DIR="/opt/ctf-platform"

echo "📦 1. Updating system and installing basic dependencies..."
apt-get update -y
apt-get install -y curl git wget build-essential tmux net-tools

echo "🐳 2. Installing Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker is already installed."
fi

echo "🟢 3. Installing Node.js (LTS)..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js is already installed."
fi

echo "☁️  4. Installing Cloudflared (for quick tunnels)..."
if ! command -v cloudflared &> /dev/null; then
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
else
    echo "Cloudflared is already installed."
fi

echo "🚀 5. Cloning repository..."
if [ -d "$PROJECT_DIR" ]; then
    echo "Directory $PROJECT_DIR already exists. Pulling latest changes..."
    cd "$PROJECT_DIR"
    # git pull # Uncomment when repository is configured
else
    echo "Note: Replace REPO_URL in this script with your actual git repository."
    # git clone "$REPO_URL" "$PROJECT_DIR"
    
    # FOR NOW, since this is a local setup, we'll simulate the clone by working in the current dir if running locally
    if [ -d "ctf-infra" ]; then
        PROJECT_DIR="$(pwd)"
        echo "Found existing ctf-infra directory, continuing in $PROJECT_DIR"
    else
        echo "Please upload your project files to $PROJECT_DIR"
        mkdir -p "$PROJECT_DIR"
    fi
fi

cd "$PROJECT_DIR"

echo "🔐 6. Setting up environment variables..."
if [ ! -f .env.local ]; then
    echo "No .env.local found. Let's create one."
    read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
    read -p "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_KEY
    
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
FLAG_PEPPER=$(head -c 32 /dev/urandom | base64)
EOF
    echo "✅ .env.local created."
else
    echo "✅ .env.local already exists."
fi

echo "📦 7. Installing Node dependencies..."
# We need @supabase/supabase-js for the sync script
if [ -f "package.json" ]; then
    npm install
else
    npm install @supabase/supabase-js
fi

echo "🏗️  8. Setup Complete!"
echo "════════════════════════════════════════════════════════════════"
echo "Your CTF infrastructure dependencies are fully installed."
echo ""
echo "To start your dynamic infrastructure tunnels:"
echo "1. Recommend running in a tmux session so it stays alive:"
echo "   tmux new -s ctf-tunnels"
echo "2. Run the tunnel script:"
echo "   bash ctf-infra/tunnel/quick-tunnel.sh"
echo ""
echo "This will spin up all Docker containers, tunnel HTTP APIs through"
echo "Cloudflare, tunnel TCP/SSH through Pinggy, and sync all URLs directly"
echo "to your Supabase platform database."
echo "════════════════════════════════════════════════════════════════"
