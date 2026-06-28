# GlowCamp — Self-Hosted Deployment

You have two ways to put this site on a real server:

---

## Option A — Emergent Deploy (1 click)

Click the **Deploy** button in the Emergent chat UI. Pick a subdomain. Done in 2 minutes. Emergent handles MongoDB, SSL, scaling, env vars, backups, everything. Recommended unless you have a specific reason to self-host.

---

## Option B — Self-host with `deploy.sh`

### What you need
- A fresh **Ubuntu 22.04 or 24.04** VPS — DigitalOcean / Hetzner / AWS Lightsail / Vultr all work
- Minimum **1 GB RAM**, 1 vCPU, 20 GB disk (~$4-6/mo)
- A domain name (e.g. `glowcamp.com`) with its **A record pointing to your VPS IP**
- Root or `sudo` access to the VPS

### Steps

```bash
# 1. SSH into your VPS
ssh root@YOUR_SERVER_IP

# 2. Clone your repo (push to GitHub first via Emergent's "Save to Github" button)
cd /var/www
git clone https://github.com/YOUR_USERNAME/glowcamp.git
cd glowcamp

# 3. Run the deploy script
sudo bash deploy.sh
```

The script will ask you for:

| Prompt | What to enter |
|---|---|
| **Domain** | `glowcamp.com` (no `https://`, no trailing slash) |
| **SSL email** | Your email — Let's Encrypt uses this for cert-expiry alerts |
| **MongoDB URL** | Press Enter for `mongodb://localhost:27017` (script will install Mongo for you), OR paste an external Atlas connection string |
| **Database name** | Press Enter for `glowcamp_prod` |
| **Emergent LLM key** | Paste your key from emergent.sh → Profile → Universal Key (needed for image uploads). Leave blank if you don't need uploads. |
| **Skip SSL** | Press Enter (N) to install Let's Encrypt automatically |

The script will then:

1. Install Python 3, Node 20, nginx, MongoDB 7, certbot, pm2, ufw
2. Set up a Python venv, install backend deps + emergentintegrations
3. Write `backend/.env` from your inputs
4. Start the backend under `pm2` (auto-restarts on crash, auto-starts on reboot)
5. Build the React frontend (`yarn build`)
6. Configure nginx as a reverse proxy
7. Open ports 80/443 and 22 in UFW firewall
8. Provision a Let's Encrypt SSL cert
9. Print the admin login URL

### After deploy

1. **Change the admin password** — sign in to `/admin/login` with `admin@glowcamp.com` / `GlowCamp@2026`, then immediately update via the admin (or directly in DB).
2. **Configure SMTP** in Admin → Settings → SMTP so order-confirmation emails actually send.
3. **Configure PayPal** in Admin → Settings → Payment (paste your live Client ID + Secret, switch mode to `live`).
4. **Upload your real product photos** in Admin → Product (Main Image) and Admin → Gallery.

### Day-to-day commands

```bash
# Push a code update
cd /var/www/glowcamp
git pull
sudo bash deploy.sh        # idempotent — safe to re-run

# Tail backend logs
pm2 logs glowcamp-backend

# Restart backend (e.g. after editing .env)
pm2 restart glowcamp-backend

# Restart nginx (e.g. after editing nginx config)
sudo nginx -t && sudo systemctl reload nginx

# Backup the database (run this on a cron job)
mongodump --uri="mongodb://localhost:27017" --db=glowcamp_prod --out=/root/backups/$(date +%F)
```

### Common issues

**"My domain shows nginx default page"**
DNS hasn't propagated yet. Wait 5-30 min, then re-run `sudo bash deploy.sh`.

**"SSL setup failed"**
Your A record isn't pointing to this server yet. Fix the DNS, wait a few minutes, then run:
```bash
sudo certbot --nginx -d glowcamp.com -d www.glowcamp.com
```

**"Order emails not sending"**
SMTP credentials aren't set. Sign in to `/admin` → Settings → SMTP and paste your Gmail/Mailgun/SendGrid credentials. For Gmail use an [App Password](https://myaccount.google.com/apppasswords), not your real password.

**"Image uploads fail"**
`EMERGENT_LLM_KEY` isn't set in `backend/.env`, or it's expired. Grab a fresh one from your Emergent profile.

**"I want to point a second domain at the same site"**
Edit `/etc/nginx/sites-available/glowcamp`, add the second domain to `server_name`, then `sudo certbot --nginx -d second-domain.com` and `sudo systemctl reload nginx`.

### Server sizing

| Monthly traffic | RAM | Cost |
|---|---|---|
| 0 – 5,000 visits  | 1 GB | $4-6 |
| 5k – 50k visits   | 2 GB | $12 |
| 50k – 500k visits | 4 GB | $24 |
| 500k+ visits      | Move to managed hosting (Emergent / Vercel / Render) |
