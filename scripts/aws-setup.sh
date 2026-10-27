#!/usr/bin/env bash
# ==============================================================================
# SynapseJudge — Automated AWS EC2 Instance Provisioning & Deployment Script
# Target OS: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS (x86_64 or arm64)
# ==============================================================================

set -e

echo "🚀 [1/6] Updating Ubuntu package indexes..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential ufw nginx certbot python3-certbot-nginx

echo "🐳 [2/6] Installing Docker Engine & CLI for code sandboxing..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
fi

# Allow current user to invoke docker commands without sudo
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

echo "📦 [3/6] Pre-pulling Compiler Sandbox Docker Images..."
sudo docker pull python:3.11-slim
sudo docker pull gcc:11
sudo docker pull node:20-slim

echo "🟢 [4/6] Installing Node.js 20.x LTS & PM2 Process Manager..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

sudo npm install -g pm2 tsx

echo "🌐 [5/6] Configuring Nginx Reverse Proxy..."
if [ -f "config/nginx.conf" ]; then
    sudo cp config/nginx.conf /etc/nginx/sites-available/synapsejudge
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf /etc/nginx/sites-available/synapsejudge /etc/nginx/sites-enabled/synapsejudge
    sudo nginx -t
    sudo systemctl restart nginx
fi

echo "🔥 [6/6] Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "=============================================================================="
echo "🎉 SynapseJudge AWS Environment Provisioning Complete!"
echo "=============================================================================="
echo "Next steps:"
echo "1. Log out and log back in so your user's Docker permissions take effect:"
echo "   exit"
echo "2. Re-connect via SSH:"
echo "   ssh -i your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>"
echo "3. Fill in your production environment variables in backend/.env and frontend/.env.local"
echo "4. Seed Database & Run migrations:"
echo "   cd backend && npx prisma db push && cd .."
echo "5. Build Frontend & Launch PM2:"
echo "   cd frontend && npm install && npm run build && cd .."
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save && pm2 startup"
echo "=============================================================================="
