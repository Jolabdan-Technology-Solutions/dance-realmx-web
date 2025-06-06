# Deployment Guide

## Prerequisites

### Server Requirements
- Ubuntu 20.04 LTS or higher
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Nginx
- PM2
- SSL certificate

### Domain Setup
1. Configure DNS records
2. Set up SSL certificate
3. Configure domain in Nginx

## Environment Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE dancerealmx;
CREATE USER dancerealmx WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dancerealmx TO dancerealmx;
\q

# Apply migrations
cd /var/www/html/dance-realmx
npx prisma migrate deploy
```

### 3. Application Setup

#### Backend
```bash
# Clone repository
git clone https://github.com/your-org/dance-realmx.git
cd dance-realmx

# Install dependencies
npm install

# Build application
npm run build

# Configure environment
cp .env.example .env
# Edit .env with production values

# Start with PM2
pm2 start ecosystem.config.js
```

#### Frontend
```bash
# Build frontend
cd dance-realmx-web
npm install
npm run build

# Configure Nginx
sudo nano /etc/nginx/sites-available/dancerealmx
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html/dance-realmx-web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. SSL Setup
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Deployment Process

### 1. Backend Deployment
```bash
# Pull latest changes
cd /var/www/html/dance-realmx
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Apply database migrations
npx prisma migrate deploy

# Restart application
pm2 restart dance-realmx
```

### 2. Frontend Deployment
```bash
# Pull latest changes
cd /var/www/html/dance-realmx-web
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart Nginx
sudo systemctl restart nginx
```

## Monitoring

### 1. Application Monitoring
```bash
# View application logs
pm2 logs dance-realmx

# Monitor application status
pm2 status

# Monitor resources
pm2 monit
```

### 2. Database Monitoring
```bash
# Check database status
sudo systemctl status postgresql

# View database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 3. Server Monitoring
```bash
# Check system resources
htop

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Backup Strategy

### 1. Database Backup
```bash
# Create backup script
nano /var/www/html/backup-db.sh

#!/bin/bash
BACKUP_DIR="/var/backups/dancerealmx"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Create backup
pg_dump -U dancerealmx dancerealmx > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### 2. Application Backup
```bash
# Create backup script
nano /var/www/html/backup-app.sh

#!/bin/bash
BACKUP_DIR="/var/backups/dancerealmx"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz"

# Create backup
tar -czf $BACKUP_FILE /var/www/html/dance-realmx

# Remove backups older than 30 days
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +30 -delete
```

## Security Measures

### 1. Firewall Configuration
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 2. Regular Updates
```bash
# Create update script
nano /var/www/html/update.sh

#!/bin/bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/html/dance-realmx
npm update

# Update frontend packages
cd /var/www/html/dance-realmx-web
npm update

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

## Troubleshooting

### Common Issues

1. **Application Not Starting**
   - Check PM2 logs: `pm2 logs dance-realmx`
   - Verify environment variables
   - Check database connection

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Verify network connectivity

3. **Nginx Issues**
   - Check Nginx configuration: `sudo nginx -t`
   - View error logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify SSL certificate

4. **Performance Issues**
   - Monitor system resources: `htop`
   - Check application logs
   - Verify database performance

## Rollback Procedure

### 1. Code Rollback
```bash
# Revert to previous version
cd /var/www/html/dance-realmx
git reset --hard HEAD^
npm install
npm run build
pm2 restart dance-realmx
```

### 2. Database Rollback
```bash
# Restore from backup
pg_restore -U dancerealmx -d dancerealmx /var/backups/dancerealmx/db_backup_YYYYMMDD_HHMMSS.sql.gz
```

## Maintenance Schedule

### Daily Tasks
- Monitor system logs
- Check application status
- Verify backup completion

### Weekly Tasks
- Review error logs
- Check disk space
- Update system packages

### Monthly Tasks
- Review security updates
- Check SSL certificate expiration
- Review backup retention
- Performance optimization 