# Hosting INTIMA Hub on DigitalOcean - Step-by-Step Guide

This guide walks through deploying the INTIMA Hub application (Vite frontend + Express backend + PostgreSQL) on a DigitalOcean Ubuntu Node.js droplet.

---

## Prerequisites

- DigitalOcean account
- A domain name (optional, but recommended)
- SSH client installed locally
- Git installed on your local machine

---

## Step 1: Create a DigitalOcean Droplet

1. Go to [DigitalOcean Console](https://cloud.digitalocean.com)
2. Click **Create** → **Droplets**
3. Configure:
   - **Image**: Ubuntu 22.04 LTS (recommended) or latest LTS
   - **Size**: $4-6/month ($5) for small apps, or higher based on expected traffic
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `intima-hub` or similar
4. Click **Create Droplet**

**Note the Droplet's IP address** (e.g., `123.45.67.89`)

---

## Step 2: Initial Server Setup

### 2.1 SSH into your droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 2.2 Update system packages

```bash
apt update && apt upgrade -y
```

### 2.3 Install Node.js (v18 LTS or latest)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version
npm --version
```

### 2.4 Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 2.5 Install PM2 globally

```bash
npm install -g pm2
```

### 2.6 Install other utilities

```bash
apt install -y git curl wget nginx certbot python3-certbot-nginx
```

---

## Step 3: Set Up PostgreSQL Database

### 3.1 Create database and user

```bash
sudo -u postgres psql
```

Inside psql prompt:

```sql
CREATE DATABASE intima_hub;
ALTER USER postgres WITH PASSWORD 'root';
GRANT ALL PRIVILEGES ON DATABASE intima_hub TO postgres;
\q
```

**Note**: The `postgres` user already exists by default, so we use `ALTER USER` instead of `CREATE USER`. Save your database credentials securely.

### 3.2 Test connection (optional)

```bash
psql -U postgres -d intima_hub -h localhost
```

---

## Step 4: Clone and Set Up Application

### 4.1 Create app directory

```bash
mkdir -p /var/www/intima-hub
cd /var/www/intima-hub
```

### 4.2 Clone repository

```bash
git clone https://github.com/yxlow07/intima-hub.git .
```

### 4.3 Install dependencies

```bash
npm install
```

### 4.4 Create `.env` file

```bash
nano .env
```

Add your environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres:root@localhost:5432/intima_hub

# Node Environment
NODE_ENV=production

# Backend Port
PORT=3001

# Frontend Build
VITE_API_URL=https://yourdomain.com

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

Save with `Ctrl+X` → `Y` → `Enter`

### 4.5 Run database migrations

```bash
npm run db:migrate
```

### 4.6 Build frontend

```bash
npm run build
```

---

## Step 5: Configure PM2

### 5.1 Update `ecosystem.config.js` for production

The existing config is already set up. For production, update the frontend script to serve the built files instead of dev server:

**Replace the frontend app section in `ecosystem.config.js`:**

```javascript
{
  name: 'intima-hub-frontend',
  script: 'npx',
  args: 'serve -s dist -l 5173',
  env: {
    NODE_ENV: 'production',
  },
  env_production: {
    NODE_ENV: 'production',
  },
  instances: 1,
  exec_mode: 'fork',
  max_memory_restart: '500M',
  error_file: './logs/frontend-err.log',
  out_file: './logs/frontend-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
},
```

Or simply run backend only and use Nginx to serve the frontend (recommended - see Step 6).

### 5.2 Start PM2 with production config

```bash
pm2 start ecosystem.config.js --env production
```

### 5.3 Save PM2 config to auto-start on reboot

```bash
pm2 startup
pm2 save
```

Follow the instructions PM2 provides.

### 5.4 Monitor PM2

```bash
pm2 monit
pm2 logs
```

---

## Step 6: Configure Nginx as Reverse Proxy

### 6.1 Create Nginx config

```bash
nano /etc/nginx/sites-available/intima-hub
```

Add:

```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    root /var/www/intima-hub/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Express backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads endpoint
    location /uploads/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 6.2 Enable the site

```bash
ln -s /etc/nginx/sites-available/intima-hub /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default config if desired
```

### 6.3 Test and reload Nginx

```bash
nginx -t
systemctl reload nginx
```

---

## Step 7: Set Up SSL Certificate (HTTPS)

### 7.1 Install SSL with Certbot

```bash
certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

Follow the prompts. Certbot will automatically update Nginx config.

### 7.2 Auto-renew certificates

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## Step 8: Configure Firewall

### 8.1 Enable UFW (if not already)

```bash
ufw enable
```

### 8.2 Allow SSH, HTTP, HTTPS

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
```

### 8.3 Verify rules

```bash
ufw status
```

---

## Step 9: Set Up Log Rotation

Create log rotation config:

```bash
nano /etc/logrotate.d/intima-hub
```

Add:

```
/var/www/intima-hub/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nobody adm
    sharedscripts
    postrotate
        pm2 reload ecosystem.config.js >> /dev/null 2>&1 || true
    endscript
}
```

---

## Step 10: Verify Deployment

### 10.1 Check PM2 processes

```bash
pm2 list
```

### 10.2 View logs

```bash
pm2 logs intima-hub-backend
```

### 10.3 Test the application

Visit `https://YOUR_DOMAIN.com` in your browser.

---

## Useful Commands

### PM2 Management

```bash
pm2 start ecosystem.config.js --env production
pm2 restart all
pm2 stop all
pm2 delete all
pm2 logs
pm2 monit
pm2 info intima-hub-backend
```

### Database Management

```bash
# Connect to database
psql -U postgres -d intima_hub

# Backup database
pg_dump -U postgres -d intima_hub > backup.sql

# Restore database
psql -U postgres -d intima_hub < backup.sql
```

### Application Updates

```bash
cd /var/www/intima-hub
git pull origin main
npm install
npm run build
npm run db:migrate  # If schema changes
pm2 restart all
```

### Nginx Management

```bash
systemctl restart nginx
systemctl status nginx
nginx -t  # Test config
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Application not starting

```bash
pm2 logs  # Check error logs
pm2 stop all
pm2 start ecosystem.config.js --env production
```

### Database connection issues

- Verify `.env` DATABASE_URL is correct
- Check PostgreSQL is running: `systemctl status postgresql`
- Test connection: `psql -U intima_user -d intima_hub -h localhost`

### Port 3001 already in use

```bash
lsof -i :3001
kill -9 PID
```

### SSL certificate issues

```bash
certbot renew --dry-run
certbot certificates
```

### Nginx not serving static files

- Verify `root /var/www/intima-hub/dist;` exists
- Check permissions: `ls -la /var/www/intima-hub/`
- Reload: `systemctl reload nginx`

---

## Security Recommendations

1. **SSH Keys**: Use SSH keys instead of password login

   ```bash
   # Disable password authentication in /etc/ssh/sshd_config
   nano /etc/ssh/sshd_config
   # Change PasswordAuthentication to no
   systemctl restart ssh
   ```

2. **Fail2Ban**: Install to protect against brute force

   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```

3. **Environment Variables**: Keep `.env` secure and never commit to Git

   ```bash
   chmod 600 .env
   ```

4. **Database Password**: Use strong password and consider restricting PostgreSQL to localhost only

5. **Regular Backups**: Set up automated database backups

---

## Performance Optimization

1. **Enable Gzip compression** in Nginx (usually enabled by default)
2. **Configure caching** headers for static assets in Nginx
3. **Consider CDN** for static files if serving globally
4. **Monitor memory/CPU** regularly with `pm2 monit`
5. **Set up uptime monitoring** (e.g., UptimeRobot, Pingdom)

---

## Next Steps

1. Set up automated backups for PostgreSQL
2. Configure monitoring/alerting
3. Set up CI/CD pipeline (e.g., GitHub Actions) for auto-deployment
4. Add email notifications for errors
5. Scale to multiple instances as needed

---

For questions or issues, refer to:

- [DigitalOcean Docs](https://docs.digitalocean.com)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- Project README: `README.md`
