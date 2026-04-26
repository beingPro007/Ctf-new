#!/bin/bash
# CTF Multi-Service Tunnel Script
# - HTTP challenges: Cloudflare Quick Tunnels (free)
# - TCP/SSH challenges: Pinggy.io (free TCP tunneling)
# Usage: bash ctf-infra/tunnel/quick-tunnel.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$HOME/.cloudflared/quick-tunnel-logs"
mkdir -p "$LOG_DIR"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║       CTF Platform - Full Infrastructure Launch       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Start Docker containers ────────────────────────────────────────────────
echo "🐳 Starting CTF Docker containers..."
docker compose -f "$INFRA_DIR/docker-compose.yml" up -d 2>&1 | grep -E "(Running|Started|Created|Error)" || true
sleep 2
echo ""

# ── 2. Start Cloudflare Quick Tunnels for HTTP services ───────────────────────
start_http_tunnel() {
    local SERVICE=$1
    local LABEL=$2
    local LOG="$LOG_DIR/${LABEL}.log"

    cloudflared tunnel --url "$SERVICE" --no-autoupdate > "$LOG" 2>&1 &
    echo $! >> "$LOG_DIR/pids.txt"

    local URL=""
    local RETRIES=0
    while [ -z "$URL" ] && [ $RETRIES -lt 30 ]; do
        sleep 1
        URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1)
        RETRIES=$((RETRIES + 1))
    done
    echo "$URL"
}

# ── 3. Start Pinggy Tunnels for TCP/SSH services ──────────────────────────────
start_tcp_tunnel() {
    local PORT=$1
    local LABEL=$2
    local LOG="$LOG_DIR/${LABEL}.log"

    ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:$PORT tcp@a.pinggy.io > "$LOG" 2>&1 &
    local PID=$!
    echo $PID >> "$LOG_DIR/pids.txt"

    local URL=""
    local RETRIES=0
    while [ -z "$URL" ] && [ $RETRIES -lt 30 ]; do
        sleep 1
        URL=$(grep -oE 'tcp://[a-zA-Z0-9.-]+:[0-9]+' "$LOG" | head -1)
        RETRIES=$((RETRIES + 1))
    done
    
    # Extract host and port
    if [[ "$URL" =~ tcp://(.*):([0-9]+) ]]; then
        local HOST="${BASH_REMATCH[1]}"
        local PORT_TUNNEL="${BASH_REMATCH[2]}"
        
        if [ "$LABEL" == "ssh" ]; then
            echo "ssh ctfuser@${HOST} -p ${PORT_TUNNEL}"
        else
            echo "nc ${HOST} ${PORT_TUNNEL}"
        fi
    else
        echo "FAILED"
    fi
}

# Clean old pids
rm -f "$LOG_DIR/pids.txt"
touch "$LOG_DIR/pids.txt"

echo "🌐 Starting HTTP & TCP Tunnels (Cloudflare & Pinggy)..."
echo "   This takes 10-20 seconds to establish securely."
echo ""

# HTTP
echo -n "   [HTTP] Main Web Platform (Port 3000) → "
URL_PLATFORM=$(start_http_tunnel "http://localhost:3000" "platform")
echo "${URL_PLATFORM:-NOT DETECTED (ensure npm start is running)}"

echo -n "   [HTTP] web-001 (SQLi)        → "
URL_WEB1=$(start_http_tunnel "http://localhost:5001" "web1")
echo "${URL_WEB1:-FAILED}"

echo -n "   [HTTP] web-002 (LFI)         → "
URL_WEB2=$(start_http_tunnel "http://localhost:5002" "web2")
echo "${URL_WEB2:-FAILED}"

echo -n "   [HTTP] web-003 (Cmd Inject)  → "
URL_WEB3=$(start_http_tunnel "http://localhost:5003" "web3")
echo "${URL_WEB3:-FAILED}"

# TCP
echo -n "   [TCP]  pwn-001 (Overflow)    → "
CONN_PWN=$(start_tcp_tunnel "4001" "pwn")
echo "${CONN_PWN:-FAILED}"

echo -n "   [TCP]  crypto-001 (RSA)      → "
CONN_CRYPTO=$(start_tcp_tunnel "4002" "crypto")
echo "${CONN_CRYPTO:-FAILED}"

echo -n "   [TCP]  rev-001 (Crackme)     → "
CONN_REV=$(start_tcp_tunnel "4003" "rev")
echo "${CONN_REV:-FAILED}"

echo -n "   [SSH]  ssh-001 (Linux Box)   → "
CONN_SSH=$(start_tcp_tunnel "2222" "ssh")
echo "${CONN_SSH:-FAILED}"

echo ""
echo "╔═════════════════════════════════════════════════════════════════════════╗"
echo "║                  🎯 ACTIVE CHALLENGE CONNECTIONS                       ║"
echo "╠═════════════════════════════════════════════════════════════════════════╣"
printf "║  Main CTF Site:    %-52s ║\n" "${URL_PLATFORM:-N/A}"
printf "║  SQLi Flask:       %-52s ║\n" "${URL_WEB1:-N/A}"
printf "║  LFI PHP:          %-52s ║\n" "${URL_WEB2:-N/A}"
printf "║  Cmd Injection:    %-52s ║\n" "${URL_WEB3:-N/A}"
printf "║  Buffer Overflow:  %-52s ║\n" "${CONN_PWN:-N/A}"
printf "║  RSA Oracle:       %-52s ║\n" "${CONN_CRYPTO:-N/A}"
printf "║  XOR Crackme:      %-52s ║\n" "${CONN_REV:-N/A}"
printf "║  Linux Enum Box:   %-52s ║\n" "${CONN_SSH:-N/A}"
echo "╚═════════════════════════════════════════════════════════════════════════╝"
echo ""

# ── 4. Save all URLs to file ──────────────────────────────────────────────────
cat > "$LOG_DIR/current-urls.txt" << EOF
CTF Connection Info - $(date)

HTTP Challenges (Cloudflare Tunnel):
  SQL Injection: ${URL_WEB1}
  PHP LFI:       ${URL_WEB2}
  Cmd Injection: ${URL_WEB3}

TCP/SSH Challenges (Pinggy Tunnel):
  PWN Buffer Overflow: ${CONN_PWN}
  Crypto RSA Oracle:   ${CONN_CRYPTO}
  Rev XOR Crackme:     ${CONN_REV}
  SSH Linux Box:       ${CONN_SSH} (pass: password123)
EOF

echo "📋 Connection info saved to: $LOG_DIR/current-urls.txt"
echo ""

# ── 5. Sync everything to Supabase ────────────────────────────────────────────
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
SYNC_SCRIPT="$PROJECT_DIR/sync-tunnel-urls.mjs"

if [ -f "$SYNC_SCRIPT" ] && [ -f "$PROJECT_DIR/.env.local" ]; then
    echo "🔁 Syncing all challenge URLs to platform database..."
    (cd "$PROJECT_DIR" && \
     export $(grep -v '^#' .env.local | xargs) && \
     URL_WEB1="${URL_WEB1}" \
     URL_WEB2="${URL_WEB2}" \
     URL_WEB3="${URL_WEB3}" \
     CONN_PWN="${CONN_PWN}" \
     CONN_CRYPTO="${CONN_CRYPTO}" \
     CONN_REV="${CONN_REV}" \
     CONN_SSH="${CONN_SSH}" \
     node "$SYNC_SCRIPT" 2>&1)
    echo ""
fi

echo "⚠️  NOTE: Free Tunnels expire in 60 minutes. Keep script running."
echo "Press Ctrl+C to STOP tunnels."
echo ""

trap "echo ''; echo 'Stopping Tunnels...'; kill \$(cat $LOG_DIR/pids.txt) 2>/dev/null; " SIGINT SIGTERM
wait
