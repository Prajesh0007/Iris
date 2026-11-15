#!/bin/bash
# ==============================================================================
# Iris Automated Deployment Script for AWS Free Tier (EC2 Ubuntu 24.04 / 22.04)
# ==============================================================================

set -e

echo "🚀 [1/7] Allocating 2GB Swap Memory (prevents OOM on t2.micro/t3.micro)..."
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

echo "📦 [2/7] Installing Node.js 22, Nginx, MySQL, and dependencies..."
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

echo "🗄️ [3/7] Configuring MySQL Database & Dedicated iris_user..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and dedicated user 'iris_user' with full privileges on Iris
sudo mysql -e "CREATE DATABASE IF NOT EXISTS Iris CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'iris_user'@'localhost' IDENTIFIED BY 'Iris@2026_SecureKey';"
sudo mysql -e "ALTER USER 'iris_user'@'localhost' IDENTIFIED BY 'Iris@2026_SecureKey';"
sudo mysql -e "GRANT ALL PRIVILEGES ON Iris.* TO 'iris_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
echo "✅ MySQL database and user initialized."

# Write backend environment file
echo "📝 Writing backend/.env configuration..."
cat << 'EOF' > backend/.env
PORT=3001
DB_HOST=localhost
DB_USER=iris_user
DB_PASSWORD=Iris@2026_SecureKey
DB_NAME=Iris
JWT_SECRET=super_secret_iris_jwt_key_2026
EOF

echo "⚙️ [4/7] Building Backend..."
cd backend
npm install
npm run build
cd ..

echo "🎨 [5/7] Building Frontend (Vite SPA)..."
cd frontend
npm install
npm run build
cd ..

echo "🌐 [6/7] Deploying frontend static assets to Nginx..."
sudo rm -rf /var/www/html/*
sudo cp -r frontend/dist/* /var/www/html/

echo "🔧 Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "⚡ [7/7] Starting/Restarting Backend with PM2..."
pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | sudo bash || true

echo "================================================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your app is now running on http://$(curl -s ifconfig.me)"
echo "Backend is managed via PM2: 'pm2 status' / 'pm2 logs'"
echo "================================================================================"
