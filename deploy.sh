#!/usr/bin/env bash
#
# GlowCamp one-command deploy script
# -----------------------------------
# Usage:
#   sudo bash deploy.sh
#
# Tested on: Ubuntu 22.04 / 24.04 fresh VPS
# Assumptions:
#   - You're root or have sudo
#   - This script is run from inside the cloned repo, e.g.:
#       cd /var/www/glowcamp && sudo bash deploy.sh
#
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
#  Pretty output helpers
# ──────────────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { printf "${BLUE}▸${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}✓${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$*"; }
die()  { printf "${RED}✗${NC} %s\n" "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Please run as root: sudo bash deploy.sh"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -d "$REPO_DIR/backend" && -d "$REPO_DIR/frontend" ]] \
  || die "Run this from inside the GlowCamp repo root (must contain backend/ and frontend/)"

# ──────────────────────────────────────────────────────────────────────────────
#  Collect user input
# ──────────────────────────────────────────────────────────────────────────────
echo
log "GlowCamp deploy script — let's set up your server"
echo

read -rp "Your domain (e.g. glowcamp.com, without https://): " DOMAIN
[[ -n "$DOMAIN" ]] || die "Domain is required"

read -rp "Email for SSL certificate notifications (Let's Encrypt): " SSL_EMAIL
[[ -n "$SSL_EMAIL" ]] || die "Email is required"

read -rp "MongoDB URL [mongodb://localhost:27017]: " MONGO_URL
MONGO_URL="${MONGO_URL:-mongodb://localhost:27017}"

read -rp "MongoDB database name [glowcamp_prod]: " DB_NAME
DB_NAME="${DB_NAME:-glowcamp_prod}"

read -rp "Emergent LLM key (for image uploads / AI — leave blank to skip): " EMERGENT_LLM_KEY

read -rp "Skip SSL (Let's Encrypt) setup? [y/N]: " SKIP_SSL
SKIP_SSL="${SKIP_SSL:-N}"

echo
log "Summary:"
echo "  Domain:           $DOMAIN"
echo "  SSL email:        $SSL_EMAIL"
echo "  MongoDB:          $MONGO_URL ($DB_NAME)"
echo "  Emergent key:     $([[ -n "$EMERGENT_LLM_KEY" ]] && echo set || echo skipped)"
echo "  Install SSL:      $([[ "$SKIP_SSL" =~ ^[yY] ]] && echo no || echo yes)"
echo
read -rp "Continue? [y/N]: " CONFIRM
[[ "$CONFIRM" =~ ^[yY] ]] || die "Aborted."

# ──────────────────────────────────────────────────────────────────────────────
#  1. System dependencies
# ──────────────────────────────────────────────────────────────────────────────
log "Installing system dependencies (apt)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  curl ca-certificates gnupg lsb-release \
  python3 python3-pip python3-venv \
  nginx \
  git build-essential \
  ufw

# Node 20 via NodeSource
if ! command -v node >/dev/null || [[ "$(node -v | cut -c2-3)" -lt 20 ]]; then
  log "Installing Node.js 20…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
npm install -g yarn pm2 >/dev/null 2>&1 || true
ok "System deps installed (node $(node -v), python $(python3 --version | cut -d' ' -f2))"

# MongoDB (only if we're using local)
if [[ "$MONGO_URL" == "mongodb://localhost:27017" ]]; then
  if ! command -v mongod >/dev/null; then
    log "Installing MongoDB 7.0…"
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    UBUNTU_CODENAME="$(lsb_release -sc)"
    # Use jammy for ubuntu 24 (noble) since mongodb may not ship noble yet
    [[ "$UBUNTU_CODENAME" == "noble" ]] && UBUNTU_CODENAME="jammy"
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $UBUNTU_CODENAME/mongodb-org/7.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update -qq
    apt-get install -y -qq mongodb-org
    systemctl enable --now mongod
  fi
  ok "MongoDB running on localhost:27017"
fi

# ──────────────────────────────────────────────────────────────────────────────
#  2. Backend — venv, deps, .env, pm2
# ──────────────────────────────────────────────────────────────────────────────
log "Setting up Python backend…"
cd "$REPO_DIR/backend"

if [[ ! -d venv ]]; then
  python3 -m venv venv
fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install -q --upgrade pip
# emergentintegrations is hosted on Emergent's CDN, not PyPI — pass the extra
# index URL so pip can resolve it while installing requirements.txt.
pip install -q \
  --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ \
  -r requirements.txt
deactivate

cat > "$REPO_DIR/backend/.env" <<EOF
MONGO_URL="$MONGO_URL"
DB_NAME="$DB_NAME"
CORS_ORIGINS="https://$DOMAIN"
EMERGENT_LLM_KEY="$EMERGENT_LLM_KEY"
APP_NAME="glowcamp"
EOF
ok "backend/.env written"

# Start / restart with pm2
pm2 delete glowcamp-backend >/dev/null 2>&1 || true
pm2 start "$REPO_DIR/backend/venv/bin/uvicorn" \
  --name glowcamp-backend \
  --cwd "$REPO_DIR/backend" \
  -- server:app --host 127.0.0.1 --port 8001 --workers 2
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
ok "Backend running under pm2 on 127.0.0.1:8001"

# ──────────────────────────────────────────────────────────────────────────────
#  3. Frontend — yarn build
# ──────────────────────────────────────────────────────────────────────────────
log "Building frontend (this can take 2–4 minutes)…"
cd "$REPO_DIR/frontend"
cat > .env <<EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF
yarn install --frozen-lockfile --silent
yarn build
ok "Frontend built → frontend/build/"

# ──────────────────────────────────────────────────────────────────────────────
#  4. Nginx
# ──────────────────────────────────────────────────────────────────────────────
log "Configuring nginx…"
cat > "/etc/nginx/sites-available/glowcamp" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend static build
    root $REPO_DIR/frontend/build;
    index index.html;

    # Allow image uploads up to 10 MB
    client_max_body_size 10M;

    # SPA fallback — every non-/api/ path goes to React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API + uploaded files
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120;
        proxy_send_timeout 120;
    }

    # Cache static assets aggressively
    location ~* \.(?:js|css|woff2?|ttf|svg|png|jpg|jpeg|gif|webp|ico)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }
}
NGINX

ln -sf "/etc/nginx/sites-available/glowcamp" "/etc/nginx/sites-enabled/glowcamp"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
ok "nginx serving $DOMAIN on :80"

# ──────────────────────────────────────────────────────────────────────────────
#  5. Firewall (UFW)
# ──────────────────────────────────────────────────────────────────────────────
log "Configuring firewall…"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ok "Firewall up (SSH + 80/443 open)"

# ──────────────────────────────────────────────────────────────────────────────
#  6. SSL via Let's Encrypt
# ──────────────────────────────────────────────────────────────────────────────
if [[ "$SKIP_SSL" =~ ^[yY] ]]; then
  warn "Skipping SSL — your site is HTTP only. Run 'certbot --nginx -d $DOMAIN -d www.$DOMAIN' later."
else
  log "Installing Let's Encrypt SSL…"
  apt-get install -y -qq certbot python3-certbot-nginx
  if certbot --nginx --non-interactive --agree-tos --email "$SSL_EMAIL" \
       -d "$DOMAIN" -d "www.$DOMAIN" --redirect; then
    ok "SSL active — https://$DOMAIN is live"
  else
    warn "SSL setup failed (DNS not pointing to this server yet?). Site still works on HTTP."
    warn "Once DNS is correct, re-run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  fi
fi

# ──────────────────────────────────────────────────────────────────────────────
#  Done
# ──────────────────────────────────────────────────────────────────────────────
echo
echo "═══════════════════════════════════════════════════════════════════"
ok "GlowCamp is deployed!"
echo "═══════════════════════════════════════════════════════════════════"
echo
echo "  Storefront:    https://$DOMAIN"
echo "  Admin panel:   https://$DOMAIN/admin/login"
echo "    email:       admin@glowcamp.com"
echo "    password:    GlowCamp@2026   ← change this immediately"
echo
echo "  Logs:          pm2 logs glowcamp-backend"
echo "  Restart back:  pm2 restart glowcamp-backend"
echo "  Update code:   git pull && sudo bash deploy.sh"
echo
echo "  Next steps:"
echo "   1. Sign in to /admin and change the admin password"
echo "   2. Settings → SMTP: add your sender email so order emails go out"
echo "   3. Settings → Payment: paste your PayPal client ID to go live"
echo "   4. Product / Gallery: upload your real product photos"
echo "═══════════════════════════════════════════════════════════════════"
