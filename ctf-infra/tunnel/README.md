# Cloudflare Tunnel Setup for CTF Infrastructure

## Prerequisites
- A free Cloudflare account: https://cloudflare.com
- A domain added to Cloudflare (even a free one works)
- `cloudflared` installed (already done)

---

## Step 1: Login to Cloudflare
```bash
cloudflared tunnel login
```
This opens a browser. Authorize your domain. A certificate is saved to `~/.cloudflared/cert.pem`.

---

## Step 2: Create the Tunnel
```bash
cloudflared tunnel create ctf-platform
```
This creates a tunnel and saves credentials to `~/.cloudflared/<tunnel-id>.json`.
Copy the tunnel ID from the output.

---

## Step 3: Configure DNS (in Cloudflare Dashboard)
Add these CNAME records pointing to `<tunnel-id>.cfargotunnel.com`:

| Subdomain | Type | Points to |
|-----------|------|-----------|
| `ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |
| `web1.ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |
| `web2.ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |
| `web3.ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |
| `pwn.ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |
| `crypto.ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |
| `rev.ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |
| `ssh.ctf` | CNAME | `<tunnel-id>.cfargotunnel.com` |

OR run these commands instead:
```bash
cloudflared tunnel route dns ctf-platform web1.ctf.yourdomain.com
cloudflared tunnel route dns ctf-platform web2.ctf.yourdomain.com
cloudflared tunnel route dns ctf-platform web3.ctf.yourdomain.com
cloudflared tunnel route dns ctf-platform pwn.ctf.yourdomain.com
cloudflared tunnel route dns ctf-platform crypto.ctf.yourdomain.com
cloudflared tunnel route dns ctf-platform rev.ctf.yourdomain.com
cloudflared tunnel route dns ctf-platform ssh.ctf.yourdomain.com
```

---

## Step 4: Edit the config file
Copy `config.example.yml` to `~/.cloudflared/config.yml` and fill in your tunnel ID and domain.

---

## Step 5: Run the tunnel
```bash
# Test run
cloudflared tunnel run ctf-platform

# Or as a background service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## For TCP Challenges (nc, SSH) — Player Instructions
Since Cloudflare Tunnel proxies TCP through HTTPS, players need `cloudflared` to connect:

```bash
# Install cloudflared (players do this once)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Connect to PWN challenge:
cloudflared access tcp --hostname pwn.ctf.yourdomain.com --url localhost:9001
nc localhost 9001

# Connect to SSH:
cloudflared access ssh --hostname ssh.ctf.yourdomain.com
```

**Or**: open port forwarding at the firewall level if your home router allows it (simpler for players).
