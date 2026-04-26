#!/bin/bash
# CTF Infrastructure Final Verification Script
# Run this script at the end of deployment to ensure EVERYTHING is working correctly.
# Usage: bash verify-health.sh

echo "╔═══════════════════════════════════════════════════════╗"
echo "║      CTF Platform Health & Final Verification         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

ALL_PASS=true

function print_pass() { echo -e "  ✅ \e[32mPASS\e[0m - $1"; }
function print_fail() { echo -e "  ❌ \e[31mFAIL\e[0m - $1"; ALL_PASS=false; }
function print_warn() { echo -e "  ⚠️  \e[33mWARN\e[0m - $1"; }
function check_command() {
    if command -v "$1" &> /dev/null; then
        print_pass "$2"
    else
        print_fail "$2"
    fi
}

echo "1. System Dependencies"
echo "---------------------------------------------------------"
check_command "docker" "Docker is installed and in PATH"
check_command "node" "Node.js is installed"
check_command "cloudflared" "Cloudflared is installed"

echo ""
echo "2. Local Container Status"
echo "---------------------------------------------------------"
DOCKER_CMD="docker ps --format '{{.Names}}'"
if $DOCKER_CMD | grep -q "ctf-web-001"; then print_pass "Web-001 container is running"; else print_fail "Web-001 container is securely offline"; fi
if $DOCKER_CMD | grep -q "ctf-web-002"; then print_pass "Web-002 container is running"; else print_fail "Web-002 container is securely offline"; fi
if $DOCKER_CMD | grep -q "ctf-web-003"; then print_pass "Web-003 container is running"; else print_fail "Web-003 container is securely offline"; fi
if $DOCKER_CMD | grep -q "ctf-pwn-001"; then print_pass "Pwn-001 container is running"; else print_fail "Pwn-001 container is securely offline"; fi
if $DOCKER_CMD | grep -q "ctf-crypto-001"; then print_pass "Crypto-001 container is running"; else print_fail "Crypto-001 container is securely offline"; fi
if $DOCKER_CMD | grep -q "ctf-rev-001"; then print_pass "Rev-001 container is running"; else print_fail "Rev-001 container is securely offline"; fi
if $DOCKER_CMD | grep -q "ctf-ssh-001"; then print_pass "SSH-001 container is running"; else print_fail "SSH-001 container is securely offline"; fi

echo ""
echo "3. Local Network Port Verification"
echo "---------------------------------------------------------"
check_port() {
    local PORT=$1
    local NAME=$2
    if nc -z -w 2 localhost "$PORT" 2>/dev/null || timeout 2 bash -c "</dev/tcp/localhost/$PORT" 2>/dev/null; then
        print_pass "$NAME mapped correctly to Port $PORT"
    else
        print_fail "$NAME port $PORT is closed or unbound"
    fi
}
check_port "5001" "SQLi Flask app"
check_port "5002" "PHP LFI app"
check_port "5003" "Node Command Injection app"
check_port "4001" "Buffer Overflow Socat"
check_port "4002" "RSA Python Server"
check_port "4003" "XOR Crackme Socat"
check_port "2222" "Linux Box OpenSSH"

echo ""
echo "4. Environment & Database Configuration"
echo "---------------------------------------------------------"
if [ -f ".env.local" ]; then
    print_pass ".env.local file exists"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=" ".env.local" && grep -q "SUPABASE_SERVICE_ROLE_KEY=" ".env.local"; then
        print_pass "Supabase credentials found in .env.local"
    else
        print_fail "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    fi
else
    print_fail ".env.local file is missing"
fi

echo ""
echo "5. Front-End Assets"
echo "---------------------------------------------------------"
if [ -d "node_modules" ]; then
    print_pass "node_modules is installed"
else
    print_warn "node_modules missing (Run 'npm install' before production build)"
fi

if [ -f "sync-tunnel-urls.mjs" ]; then
    print_pass "Database remote synchronization script is present"
else
    print_fail "sync-tunnel-urls.mjs is missing"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
if [ "$ALL_PASS" = true ]; then
    echo -e "║    \e[42m\e[97m FULL SYSTEM HEALTH CHECK PASSED SUCCESSFULLY \e[0m     ║"
    echo "║    Your CTF infrastructure behaves exactly as         ║"
    echo "║    expected on this machine!                          ║"
else
    echo -e "║     \e[41m\e[97m HEALTH CHECK ENCOUNTERED ERRORS \e[0m                  ║"
    echo "║    Please review the red FAIL messages above.         ║"
fi
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
