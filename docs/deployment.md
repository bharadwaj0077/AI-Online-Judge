# 🚀 AWS Production Deployment Guide — SynapseJudge

This guide provides the complete, production-tested walkthrough for deploying the **SynapseJudge** platform to Amazon Web Services (AWS) using an **AWS EC2 Ubuntu Compute Node**, Docker sandboxing, Nginx reverse proxying, PM2 process management, and PostgreSQL.

---

## 📋 1. Prerequisites & IAM Verification

### Is Your IAM User with `AdministratorAccess` Sufficient?
**Yes, 100%!** The `AdministratorAccess` policy grants full administrative authority to create, configure, and manage all necessary AWS resources:
- **Amazon EC2:** Virtual compute server, Security Groups, Elastic IPs, Key Pairs.
- **Amazon RDS (Optional):** Managed PostgreSQL database.
- **Amazon Route 53 (Optional):** Custom domain routing.
- **VPC & Networking:** Subnets, Internet Gateways, Route Tables.

> [!IMPORTANT]
> **Security Best Practice:** Never use the AWS Root account for daily deployments. Store your Root account credentials securely and log into the AWS Management Console using your newly created **IAM User**.

---

## 🏗️ 2. Recommended Production Architecture on AWS

```mermaid
flowchart TB
    User["Web Browser / Client (HTTPS:443)"]
    
    subgraph AWS ["Amazon Web Services (AWS)"]
        subgraph SecurityGroup ["EC2 Security Group (Ports 22, 80, 443)"]
            subgraph EC2Instance ["AWS EC2 Ubuntu 24.04 LTS (t3.medium or larger)"]
                Nginx["Nginx Reverse Proxy (:80 / :443 + SSL)"]
                
                subgraph PM2Cluster ["PM2 Process Daemon"]
                    Frontend["Next.js App Router (:3000)"]
                    Backend["Node.js Express + Socket.io (:5000)"]
                end
                
                subgraph DockerHost ["Docker Engine (Host Daemon)"]
                    SandboxPy["Sandbox Container: Python 3.11"]
                    SandboxCpp["Sandbox Container: GCC 13"]
                    SandboxNode["Sandbox Container: Node.js 20"]
                end
            end
        end

        subgraph DatabaseTier ["Persistence Tier"]
            RDS[("AWS RDS PostgreSQL 16 (or Dockerized PostgreSQL)")]
        end
    end

    User --> Nginx
    Nginx -->|/api & /socket.io| Backend
    Nginx -->|/ (Page Routes)| Frontend
    Backend -->|Child Process Exec| DockerHost
    Backend -->|Prisma Connection Pool| DatabaseTier
```

### Why EC2 for Online Judges?
Online judges execute arbitrary untrusted student code inside isolated Docker containers with strict resource caps (`--network none`, `--memory 256m`, `--cpus 0.5`). 
- **Serverless platforms** (like AWS Lambda or AWS ECS Fargate) cannot easily spawn dynamic nested Docker containers with kernel-level memory boundaries.
- **AWS EC2** provides native Linux host access to `/var/run/docker.sock`, making container lifecycle management lightning fast and completely reliable.

---

## 🛠️ 3. Step-by-Step AWS Deployment Walkthrough

### Step 1: Launch an AWS EC2 Instance
1. Log into the AWS Console using your **IAM User**.
2. Navigate to **EC2** ➔ Click **Launch Instance**.
3. Configure the instance settings:
   - **Name:** `synapse-online-judge-prod`
   - **AMI (Operating System):** **Ubuntu Server 24.04 LTS** (64-bit x86_64).
   - **Instance Type:** `t3.medium` (2 vCPU, 4GB RAM) or `t3.large`.
     *(Building Next.js 16 and running Docker compiler containers requires at least 4GB RAM. Do not use t2.micro).*
   - **Key Pair:** Click **Create new key pair** ➔ Name: `synapse-key` ➔ Type: `RSA` ➔ Format: `.pem` (save the downloaded `.pem` file to your local computer).
   - **Storage:** Increase root volume from 8GB to **30GB gp3** (to comfortably hold Docker compiler images).
4. **Network Settings (Security Group):**
   Select **Create Security Group** and allow the following inbound rules:
   - **SSH (Port 22):** Source: `My IP` (or `0.0.0.0/0` if on dynamic IP).
   - **HTTP (Port 80):** Source: `Anywhere (0.0.0.0/0)`.
   - **HTTPS (Port 443):** Source: `Anywhere (0.0.0.0/0)`.
5. Click **Launch Instance**.
6. *(Recommended)* Go to **Elastic IPs** in the EC2 sidebar ➔ **Allocate Elastic IP** ➔ Associate it with your instance so its public IP never changes across reboots.

---

### Step 2: Database Setup (Two Supported Options)

#### Option A: Managed AWS RDS PostgreSQL (Recommended for High Traffic)
1. Go to **AWS RDS** ➔ **Create database** ➔ Select **PostgreSQL 16**.
2. Template: **Free tier** (or Production `db.t3.micro`).
3. DB identifier: `synapse-db`, Master username: `postgres`, Master password: `<SECURE_PASSWORD>`.
4. In **Connectivity**, attach the same VPC as your EC2 instance and allow inbound port `5432` from your EC2 Security Group.
5. Your connection string will look like:
   `postgresql://postgres:<SECURE_PASSWORD>@<RDS_ENDPOINT>:5432/online_judge_db?sslmode=require`

#### Option B: Dockerized PostgreSQL on EC2 (Zero Additional Cost)
If you do not want to manage a separate RDS instance, you can run PostgreSQL directly on the same EC2 instance using Docker:
```bash
docker run -d \
  --name postgres-synapse \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=my_strong_password \
  -e POSTGRES_DB=online_judge_db \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

---

### Step 3: Connect to EC2 & Run the Provisioning Script

1. Open your terminal on your computer where `synapse-key.pem` is located:
   ```bash
   # Set correct permissions for your private key (Linux/macOS):
   chmod 400 synapse-key.pem

   # Connect via SSH:
   ssh -i synapse-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
   ```

2. Clone your repository onto the EC2 server:
   ```bash
   git clone https://github.com/bharadwaj0077/AI-Online-Judge.git
   cd AI-Online-Judge
   ```

3. Run the automated provisioning script included in the repo:
   ```bash
   chmod +x scripts/aws-setup.sh
   ./scripts/aws-setup.sh
   ```
   *This script automatically updates Ubuntu, installs Docker, Node.js 20, PM2, Nginx, UFW firewall, and pre-pulls all compiler Docker images (`python:3.11-slim`, `gcc:11`, `node:20-slim`).*

4. Log out and reconnect so your user's Docker permissions take effect:
   ```bash
   exit
   ssh -i synapse-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
   cd AI-Online-Judge
   ```

---

### Step 4: Configure Production Environment Variables

#### A. Backend Configuration (`backend/.env`)
Create `backend/.env`:
```bash
nano backend/.env
```
Paste your production configuration:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:<PASSWORD>@<DB_HOST>:5432/online_judge_db"
JWT_SECRET="your-super-long-cryptographic-secret-at-least-32-chars-long"
GEMINI_API_KEY="your-google-gemini-api-key"
CLIENT_URL="http://<YOUR-EC2-PUBLIC-IP>" # or "https://yourdomain.com"
```
Press `Ctrl + O`, `Enter` to save, and `Ctrl + X` to exit.

#### B. Frontend Configuration (`frontend/.env.local`)
Create `frontend/.env.local`:
```bash
nano frontend/.env.local
```
Paste:
```env
NEXT_PUBLIC_API_URL="/api/v1"
NEXT_PUBLIC_SOCKET_URL=""
```
*(By pointing `NEXT_PUBLIC_API_URL` to `/api/v1` and leaving `SOCKET_URL` relative, Nginx automatically proxies requests to the backend with zero CORS issues!)*

---

### Step 5: Database Migration & Seeding
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
cd ..
```

---

### Step 6: Build Frontend & Launch PM2 Daemon
```bash
# 1. Build the Next.js application bundle
cd frontend
npm install
npm run build
cd ..

# 2. Launch both Backend and Frontend under PM2 process supervisor
pm2 start ecosystem.config.js

# 3. Configure PM2 to auto-start on server reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Check process health:
```bash
pm2 status
```
Both `synapse-backend` and `synapse-frontend` should be in the `online` state.

---

### Step 7: Access Your Live Application!
Open your web browser and navigate to:
```
http://<YOUR-EC2-PUBLIC-IP>
```
Your SynapseJudge application is now live on AWS with:
- Next.js frontend serving on Port 80 via Nginx.
- Express API & Socket.io WebSockets routed via `/api/` and `/socket.io/`.
- Isolated Docker sandboxes running submissions.
- 1v1 Arena, Voice Mock Interviews, and Visual Profiler fully functioning!

---

## 🔒 4. Adding Free SSL / HTTPS (Let's Encrypt)
If you have a domain name (e.g. `judge.yourdomain.com`):
1. In your domain registrar (GoDaddy, Namecheap, Route 53, Cloudflare), add an **A Record**:
   - Host: `@` or `judge`
   - Value: `<YOUR-EC2-ELASTIC-IP>`
2. Edit `/etc/nginx/sites-available/synapsejudge` to replace `server_name _;` with:
   `server_name judge.yourdomain.com;`
3. Reload Nginx:
   `sudo systemctl reload nginx`
4. Run Certbot to generate and install free SSL certificates:
   ```bash
   sudo certbot --nginx -d judge.yourdomain.com
   ```
5. Certbot will automatically configure HTTPS redirect and renewal cron jobs!
