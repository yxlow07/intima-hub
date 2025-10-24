# Hosting on DigitalOcean

This guide will walk you through deploying the Intima Hub application to DigitalOcean.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup DigitalOcean Account](#setup-digitalocean-account)
3. [Create a Droplet](#create-a-droplet)
4. [SSH into Your Droplet](#ssh-into-your-droplet)
5. [Install Dependencies](#install-dependencies)
6. [Clone Your Repository](#clone-your-repository)
7. [Configure Environment Variables](#configure-environment-variables)
8. [Setup PM2](#setup-pm2)
9. [Configure Database](#configure-database)
10. [Setup Reverse Proxy (Nginx)](#setup-reverse-proxy-nginx)
11. [SSL Certificate (Let's Encrypt)](#ssl-certificate-lets-encrypt)
12. [Monitoring and Logs](#monitoring-and-logs)

---

## Prerequisites

- A DigitalOcean account (sign up at [digitalocean.com](https://www.digitalocean.com))
- SSH client installed on your local machine
- Git installed and configured
- Basic command-line knowledge

---

## Setup DigitalOcean Account

1. Create an account at [DigitalOcean](https://www.digitalocean.com)
2. Add your payment method
3. Create a new SSH key pair (recommended for security):
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```
4. Add the public key to your DigitalOcean account:
   - Go to Settings → Security → SSH keys
   - Click "Add SSH Key"
   - Paste your public key and give it a name

---

## Create a Droplet

1. Click "Create" → "Droplets"
2. **Choose an image**: Select Ubuntu 22.04 or latest LTS
3. **Choose a size**:
   - Start with Basic ($4-5/month) for testing
   - Scale up to Standard ($12+/month) for production
4. **Choose a region**: Select the closest region to your users
5. **Authentication**: Select your SSH key from prerequisites
6. **Hostname**: Give it a meaningful name (e.g., `intima-hub`)
7. **Click "Create Droplet"**

Wait a few minutes for the droplet to be created.

---

## SSH into Your Droplet

1. Get your droplet's IP address from the DigitalOcean console
2. SSH into your droplet:
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```
3. Update system packages:
   ```bash
   apt update && apt upgrade -y
   ```

---

## Install Dependencies

### Install Node.js and npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:

```bash
node --version
npm --version
```

### Install PM2 globally

```bash
sudo npm install -g pm2
```

### Install Git

```bash
sudo apt-get install -y git
```

### Install Nginx (for reverse proxy)

```bash
sudo apt-get install -y nginx
```

### Install PostgreSQL (if using database)

```bash
sudo apt-get install -y postgresql postgresql-contrib
```

Start PostgreSQL:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Clone Your Repository

1. Generate SSH keys on the server:

   ```bash
   ssh-keygen -t rsa -b 4096
   ```

2. Add the public key to your GitHub repository settings:

   - Copy the key: `cat ~/.ssh/id_rsa.pub`
   - Go to GitHub → Settings → SSH and GPG keys
   - Add the new SSH key

3. Clone your repository:

   ```bash
   cd /var/www
   sudo git clone git@github.com:yxlow07/intima-hub.git
   cd intima-hub
   ```

4. Change ownership to your user (optional but recommended):
   ```bash
   sudo chown -R $USER:$USER /var/www/intima-hub
   ```

---

## Configure Environment Variables

1. Create a `.env` file in the project root:

   ```bash
   nano /var/www/intima-hub/.env
   ```

2. Add your environment variables:

   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://username:password@localhost:5432/intima_hub
   # Add other required environment variables here
   ```

3. Save the file (Ctrl+X, then Y, then Enter)

---

## Install Project Dependencies

```bash
cd /var/www/intima-hub
npm install
```

Build the frontend:

```bash
npm run build
```

Migrate database (if needed):

```bash
npm run db:migrate
```

Seed database (if needed):

```bash
npm run db:seed
```

---

## Setup PM2

### Start with PM2

```bash
cd /var/www/intima-hub
pm2 start ecosystem.config.js
```

### Verify processes are running

```bash
pm2 status
```

You should see:

- `intima-hub-backend` - online
- `intima-hub-frontend` - online

### Setup PM2 to start on boot

```bash
pm2 startup
pm2 save
```

Copy and run the command that's output by `pm2 startup`.

### View logs

```bash
pm2 logs intima-hub-backend
pm2 logs intima-hub-frontend
```

---

## Configure Database

### Create PostgreSQL User and Database

```bash
sudo -u postgres psql
```

Inside psql:

```sql
CREATE USER intima_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE intima_hub OWNER intima_user;
ALTER ROLE intima_user SET client_encoding TO 'utf8';
ALTER ROLE intima_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE intima_user SET default_transaction_deferrable TO on;
ALTER ROLE intima_user SET default_transaction_read_only TO off;
ALTER ROLE intima_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE intima_hub TO intima_user;
\q
```

---

## Setup Reverse Proxy (Nginx)

### Create Nginx configuration

```bash
sudo nano /etc/nginx/sites-available/intima-hub
```

Paste this configuration:

```nginx
upstream backend {
    server 127.0.0.1:3001;
}

upstream frontend {
    server 127.0.0.1:5173;
}

server {
    listen 80;
    server_name intima.page www.intima.page;

    # Redirect HTTP to HTTPS (uncomment after SSL is set up)
    # return 301 https://$server_name$request_uri;

    # API endpoints
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Login endpoint
    location /login {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads
    location /uploads {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/intima-hub /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### Test and restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Generate SSL certificate

```bash
sudo certbot certonly --nginx -d intima.page -d www.intima.page
```

### Update Nginx configuration with SSL

Edit the configuration again:

```bash
sudo nano /etc/nginx/sites-available/intima-hub
```

Replace the configuration with:

```nginx
upstream backend {
    server 127.0.0.1:3001;
}

upstream frontend {
    server 127.0.0.1:5173;
}

server {
    listen 80;
    server_name intima.page www.intima.page;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name intima.page www.intima.page;

    ssl_certificate /etc/letsencrypt/live/intima.page/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intima.page/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API endpoints
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Login endpoint
    location /login {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads
    location /uploads {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Setup auto-renewal for SSL

```bash
sudo certbot renew --dry-run
```

---

## Monitoring and Logs

### Check application logs

```bash
pm2 logs
```

### Check specific application logs

```bash
pm2 logs intima-hub-backend
pm2 logs intima-hub-frontend
```

### View Nginx logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Monitor system resources

```bash
pm2 monit
```

### Check PM2 processes status

```bash
pm2 status
pm2 describe intima-hub-backend
```

---

## Troubleshooting

### Backend not connecting

1. Check if backend is running:

   ```bash
   pm2 status
   ```

2. Check backend logs:

   ```bash
   pm2 logs intima-hub-backend --lines 50
   ```

3. Verify port is listening:
   ```bash
   netstat -tlnp | grep 3001
   ```

### Database connection issues

1. Check PostgreSQL is running:

   ```bash
   sudo systemctl status postgresql
   ```

2. Test database connection:

   ```bash
   psql -U intima_user -d intima_hub -h localhost
   ```

3. Check DATABASE_URL in `.env` file

### Nginx issues

1. Test Nginx configuration:

   ```bash
   sudo nginx -t
   ```

2. Check Nginx logs:

   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### SSL certificate issues

1. Check certificate status:

   ```bash
   sudo certbot certificates
   ```

2. Test SSL:
   ```bash
   sudo certbot renew --dry-run
   ```

---

## Deployment Updates

To update your application after pushing changes to GitHub:

```bash
cd /var/www/intima-hub
git pull origin main
npm install
npm run build
npm run db:migrate  # if needed
pm2 restart all
```

Or create a script for automated deployments:

```bash
#!/bin/bash
cd /var/www/intima-hub
git pull origin main
npm install
npm run build
npm run db:migrate
pm2 restart all
pm2 save
```

Save as `deploy.sh` and make it executable:

```bash
chmod +x /var/www/intima-hub/deploy.sh
```

---

## Security Best Practices

1. **Firewall**: Enable UFW firewall

   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Keep system updated**:

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Use strong passwords** for database and admin accounts

4. **Backup your data regularly**:

   ```bash
   sudo pg_dump -U intima_user intima_hub > backup.sql
   ```

5. **Monitor logs regularly** for suspicious activity

---

## Additional Resources

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## Support

For issues or questions:

1. Check the logs: `pm2 logs`
2. Review the troubleshooting section above
3. Check DigitalOcean docs and community
4. Open an issue on GitHub

Happy hosting! 🚀
