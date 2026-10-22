# AWS EC2 Docker Deployment & Setup Guide

This guide walks through setting up, deploying, and managing the **API Management Platform** on an AWS EC2 instance using Docker and Docker Compose.

---

## 1. Architecture Overview

The application runs in 4 isolated Docker containers managed by [Docker/docker-compose.yml](file:///d:/Project/API-Management-Platform/Docker/docker-compose.yml):

```
                        ┌──────────────────────────────────────────────┐
                        │                 EC2 Instance                 │
                        │                                              │
Browser / User  ───────►│ Port 3000: [frontend] (React + Nginx)        │
                        │                    │                         │
                        │                    ▼ (Internal proxy)        │
Client API / Stripe ───►│ Port 5000: [app]      (Node.js / Express)    │
                        │                    │                         │
                        │         ┌──────────┴──────────┐              │
                        │         ▼                     ▼              │
                        │ [mongo] (Mongo 7)     [redis] (Redis 7)      │
                        │ (mongo_data volume)                          │
                        └──────────────────────────────────────────────┘
```

| Service | Container Image / Source | Port Binding | Purpose |
|---|---|---|---|
| **frontend** | [Docker/frontend.Dockerfile](file:///d:/Project/API-Management-Platform/Docker/frontend.Dockerfile) | `3000:80` | Builds React app & serves static SPA via Nginx with API reverse proxy |
| **app** | [Docker/Dockerfile](file:///d:/Project/API-Management-Platform/Docker/Dockerfile) | `5000:5000` | Node.js / Express REST API backend |
| **mongo** | `mongo:7` | `27017:27017` | MongoDB database with persistent volume `mongo_data` |
| **redis** | `redis:7-alpine` | `6379:6379` | Redis caching & API rate limiting |

---

## 2. EC2 Instance Requirements & Security Groups

### Recommended Instance Specifications
- **OS:** Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (64-bit x86)
- **Instance Type:** `t3.small` (2 GB RAM) or `t3.medium` (4 GB RAM) recommended
- **Storage:** At least 15–20 GB gp3 SSD volume

### Security Group Inbound Rules
Configure your EC2 Security Group to allow incoming traffic on the following ports:

| Type | Protocol | Port Range | Source | Purpose |
|---|---|---|---|---|
| **SSH** | TCP | `22` | Your IP (or `0.0.0.0/0`) | Remote SSH terminal access |
| **Custom TCP** | TCP | `3000` | `0.0.0.0/0` | Frontend Web UI (Nginx) |
| **Custom TCP** | TCP | `5000` | `0.0.0.0/0` | Backend API & Stripe Webhooks |
| **HTTP (optional)** | TCP | `80` | `0.0.0.0/0` | If configuring a domain/SSL reverse proxy |
| **HTTPS (optional)**| TCP | `443` | `0.0.0.0/0` | If configuring a domain/SSL reverse proxy |

---

## 3. Step 1: Install Docker on EC2

SSH into your EC2 instance:
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Run the following commands to install Docker and the Docker Compose plugin:

```bash
# 1. Update package repository
sudo apt update && sudo apt upgrade -y

# 2. Install Docker and Docker Compose plugin
sudo apt install -y docker.io docker-compose-v2

# 3. Enable and start Docker service
sudo systemctl enable --now docker

# 4. Add the ubuntu user to the docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# 5. Apply the group change without logging out
newgrp docker
```

Verify the installation:
```bash
docker --version
docker compose version
```

---

## 4. Step 2: Clone the Project and Configure Environment

### 1. Clone the repository
```bash
cd ~
git clone https://github.com/<your-username>/API-Management-Platform.git
cd API-Management-Platform
```

### 2. Create the `.env` file
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
nano .env
```

Ensure the values match the Docker network and your EC2 public IP:

```env
PORT=5000

# Docker service names are used as hostnames inside the Docker network
MONGO_URI=mongodb://mongo:27017/api-management

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your_super_secret_random_jwt_key_here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL: Replace with your actual EC2 public IP or domain
FRONTEND_URL=http://<EC2_PUBLIC_IP>:3000
```
*(Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit `nano`).*

---

## 5. Step 3: Run the Application with Docker Compose

Run the entire application stack:

```bash
# Build images and start all 4 containers in the background
docker compose -f Docker/docker-compose.yml up -d --build
```

### Check running containers:
```bash
docker compose -f Docker/docker-compose.yml ps
```
You should see all 4 services with `STATUS: Up`:
- `api-management-platform-app-1`
- `api-management-platform-frontend-1`
- `api-management-platform-mongo-1`
- `api-management-platform-redis-1`

### Seed Initial Database Data (First Run Only):
Run the database seed script inside the running backend container:
```bash
docker compose -f Docker/docker-compose.yml exec app node src/scripts/seed.js
```

---

## 6. Step 4: Clear Cache and Rebuild

When you make changes to your code, Dockerfile, or dependencies, rebuild without using cached layers:

### Rebuild and Run Without Cache (Standard)
```bash
# Stop containers, build with no cache, and bring them back up
docker compose -f Docker/docker-compose.yml down
docker compose -f Docker/docker-compose.yml build --no-cache
docker compose -f Docker/docker-compose.yml up -d
```

### Complete Cache Wipe (Deep Clean)
If you want to clear all dangling build cache and unused images on EC2:
```bash
# 1. Stop all running containers
docker compose -f Docker/docker-compose.yml down

# 2. Prune old images and build cache
docker image prune -af
docker builder prune -af

# 3. Build and launch fresh containers
docker compose -f Docker/docker-compose.yml up -d --build --force-recreate
```

> [!WARNING]
> Do NOT use `docker compose down -v` unless you intend to completely delete the MongoDB database volume (`mongo_data`).

---

## 7. Useful Docker Management Commands

| Action | Command |
|---|---|
| **View logs (all services)** | `docker compose -f Docker/docker-compose.yml logs -f` |
| **View backend logs only** | `docker compose -f Docker/docker-compose.yml logs -f app` |
| **View frontend logs only** | `docker compose -f Docker/docker-compose.yml logs -f frontend` |
| **Check container health** | `curl http://localhost:5000/health` |
| **Restart a specific service** | `docker compose -f Docker/docker-compose.yml restart app` |
| **Stop all services** | `docker compose -f Docker/docker-compose.yml down` |
| **Open shell inside backend** | `docker compose -f Docker/docker-compose.yml exec app sh` |
| **Open MongoDB shell** | `docker compose -f Docker/docker-compose.yml exec mongo mongosh api-management` |
| **Open Redis CLI** | `docker compose -f Docker/docker-compose.yml exec redis redis-cli` |

---

## 8. Verification & Testing

Once running:
1. **Frontend UI:** Open your browser and navigate to:
   ```
   http://<EC2_PUBLIC_IP>:3000
   ```
2. **Backend Health Check:** In your terminal or browser:
   ```bash
   curl http://<EC2_PUBLIC_IP>:5000/health
   ```
   Expected response:
   ```json
   {"status":"ok","db":"connected","redis":"connected"}
   ```

---

## 9. Troubleshooting

### 1. `permission denied while trying to connect to the Docker daemon socket`
If you see this error after installing Docker, run:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Port Already in Use (`bind: address already in use`)
Check what process is holding the port (e.g., 5000 or 3000):
```bash
sudo lsof -i :5000
sudo lsof -i :3000
```
Stop old containers or kill conflicting processes before running `docker compose up`.

### 3. Out of Memory / Container Crashes
The compose file configures memory limits:
- `app`: 512 MB
- `frontend`: 256 MB
- `mongo`: 1 GB
- `redis`: 256 MB

If your instance runs out of memory during a Vite frontend build, add swap space to your EC2 instance:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
