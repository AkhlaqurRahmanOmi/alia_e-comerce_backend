# Hostinger VPS Deployment (NestJS + Prisma)

## 1) Prepare VPS once

Run on your Hostinger Ubuntu VPS:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg

# Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and back in once so docker group applies.

## 2) Create app directory and files on VPS

```bash
mkdir -p /opt/alia-backend
cd /opt/alia-backend
mkdir -p uploads logs
```

Copy these files from repo to VPS:
- `docker-compose.prod.yml`
- `.env.prod` (never commit real secrets)

## 3) GitHub repo settings

Enable:
- Settings -> Actions -> General -> Workflow permissions -> Read and write permissions.

Add GitHub secrets:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT` (optional, default 22)
- `VPS_APP_DIR` (example: `/opt/alia-backend`)
- `GHCR_USERNAME` (your GitHub username)
- `GHCR_TOKEN` (PAT with at least `read:packages`)

## 4) How pipeline works

On every PR to `main`:
- install deps, generate Prisma client, lint, test, build.

On every push to `main`:
- run CI,
- build Docker image,
- push image to GHCR (`ghcr.io/<owner>/<repo>:latest`),
- SSH into VPS and deploy via `docker compose`.

## 5) DNS / reverse proxy / SSL

Recommended production edge:
- Put Nginx or Caddy in front of port `4000`.
- Use HTTPS cert (Let's Encrypt).
- Forward to `127.0.0.1:4000`.

## 6) Prisma migrations

Your container already runs:
- `npx prisma migrate deploy && node dist/main`

So migrations are applied automatically on deploy.
