#!/bin/bash
# ==============================================================================
# Iris Automated Deployment Script for AWS Free Tier (EC2 Ubuntu 24.04 / 22.04)
# ==============================================================================

set -e

echo "🚀 [1/6] Allocating 2GB Swap Memory (prevents OOM on t2.micro)..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap memory configured."
else
    echo "ℹ️ Swap file already exists. Skipping."
fi

echo "📦 [2/6] Installing Node.js 22, Nginx, and build dependencies..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git nginx mysql-server

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node Version: $(node -v)"
echo "NPM Version: $(npm -v)"

# Install PM2 globally
sudo npm install -g pm2

echo "⚙️ [3/6] Building Backend..."
cd backend
npm install
npm run build
cd ..

echo "🎨 [4/6] Building Frontend (Vite SPA)..."
cd frontend
npm install
npm run build
cd ..

echo "🌐 [5/6] Deploying frontend static assets to Nginx..."
sudo rm -rf /var/www/html/*
sudo cp -r frontend/dist/* /var/www/html/

echo "🔧 Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "⚡ [6/6] Starting Backend with PM2..."
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | sudo bash || true

echo "================================================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your app is now running on http://$(curl -s ifconfig.me)"
echo "Backend is managed via PM2: 'pm2 status' / 'pm2 logs'"
echo "================================================================================"

