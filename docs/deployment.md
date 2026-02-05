# WellKorea ERP - Deployment Guide

This document describes the deployment architecture and setup for WellKorea ERP in both local development and production environments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Local Development](#local-development)
- [Monitoring Stack](#monitoring-stack)
- [Production Deployment](#production-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Local Development Architecture

```mermaid
graph TB
    subgraph "Developer Machine"
        Browser["Browser"]

        subgraph "Docker Compose (docker-compose.local.yml)"
            Frontend["Frontend<br/>(Nginx Container)<br/>:80"]
            Backend["Backend<br/>(Spring Boot)<br/>:8080"]
            MinIO["MinIO<br/>:9000 API<br/>:9001 Console"]
            Postgres[(PostgreSQL<br/>:5432)]
        end

        HostsFile["/etc/hosts<br/>127.0.0.1 minio.local"]
    end

    Browser -->|"http://localhost:80"| Frontend
    Browser -->|"http://localhost:8080/api"| Backend
    Browser -->|"http://minio.local:9000<br/>(presigned URLs)"| MinIO
    Browser -->|"http://localhost:9001"| MinIO

    Frontend -.->|"API calls"| Backend
    Backend --> Postgres
    Backend --> MinIO

    HostsFile -.->|"DNS resolution"| MinIO

    style HostsFile fill:#fff3cd,stroke:#856404
```

**Key Points:**
- All services run in Docker containers
- Ports exposed directly to localhost
- MinIO uses `minio.local` hostname for presigned URL compatibility
- Frontend container serves built React assets via Nginx

---

### Production Architecture

```mermaid
graph TB
    subgraph "Internet"
        Browser["Browser / Client"]
    end

    subgraph "Production Server"
        subgraph "Host Nginx (SSL Termination)"
            FE_Nginx["wellkorea.mipllab.com:443<br/>Reverse Proxy"]
            API_Nginx["api.wellkorea.mipllab.com:443<br/>Reverse Proxy"]
            Storage_Nginx["storage.wellkorea.mipllab.com:443<br/>Reverse Proxy"]
        end

        subgraph "Docker Network (Internal)"
            Frontend["Frontend Container<br/>127.0.0.1:20030"]
            Backend["Backend Container<br/>127.0.0.1:20080"]
            MinIO["MinIO Container<br/>127.0.0.1:20090"]
            Postgres[(PostgreSQL<br/>Internal Only)]
        end
    end

    Browser -->|"HTTPS"| FE_Nginx
    Browser -->|"HTTPS"| API_Nginx
    Browser -->|"HTTPS<br/>(presigned URLs)"| Storage_Nginx

    FE_Nginx -->|"proxy_pass"| Frontend
    API_Nginx -->|"proxy_pass"| Backend
    Storage_Nginx -->|"proxy_pass"| MinIO

    Backend --> Postgres
    Backend -->|"generate presigned URLs<br/>verify files exist"| MinIO

    style Frontend fill:#d4edda,stroke:#155724
    style FE_Nginx fill:#cce5ff,stroke:#004085
    style API_Nginx fill:#cce5ff,stroke:#004085
    style Storage_Nginx fill:#cce5ff,stroke:#004085
```

**Key Points:**
- Host Nginx handles SSL termination for all subdomains
- Docker containers bind to `127.0.0.1` only (not publicly accessible)
- All services (including frontend) run as Docker containers
- All subdomains use the same wildcard/SAN SSL certificate
- MinIO console (port 9001) is not exposed externally

---

### Request Flow: File Upload

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant API as Backend API
    participant S as MinIO Storage

    Note over B,S: 1. Request Presigned Upload URL
    B->>F: Click "Upload File"
    F->>API: POST /api/.../upload-url<br/>{fileName, fileSize}
    API->>API: Validate request
    API->>S: Generate presigned PUT URL
    S-->>API: Presigned URL (15 min expiry)
    API-->>F: {uploadUrl, objectKey}

    Note over B,S: 2. Direct Upload to MinIO
    F->>S: PUT {uploadUrl}<br/>(file binary data)
    S-->>F: 200 OK

    Note over B,S: 3. Register Upload in Database
    F->>API: POST /api/.../register<br/>{objectKey, fileName}
    API->>S: Verify file exists
    S-->>API: File confirmed
    API->>API: Save metadata to DB
    API-->>F: {attachmentId}
    F-->>B: Upload complete!
```

---

## Local Development

### Prerequisites

1. Docker and Docker Compose installed
2. `/etc/hosts` entry for MinIO:
   ```
   127.0.0.1 minio.local
   ```

### Setup

```bash
# 1. Copy environment file
cp .env.local.example .env

# 2. Start all services
docker compose -f docker-compose.local.yml up -d

# 3. Check status
docker compose -f docker-compose.local.yml ps

# 4. View logs
docker compose -f docker-compose.local.yml logs -f backend
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:80 | React application |
| Backend API | http://localhost:8080 | REST API |
| Swagger UI | http://localhost:8080/swagger-ui.html | API documentation |
| MinIO Console | http://localhost:9001 | Storage admin UI |
| PostgreSQL | localhost:5432 | Database (use any SQL client) |

### Stopping Services

```bash
# Stop services (keep data)
docker compose -f docker-compose.local.yml down

# Stop and remove all data
docker compose -f docker-compose.local.yml down -v
```

---

## Monitoring Stack

The monitoring stack is opt-in and includes Prometheus (metrics), Loki (logs), Promtail (log collector), and Grafana (dashboards).

### Starting Monitoring Services

```bash
# Start with monitoring profile
docker compose -f docker-compose.local.yml --profile monitoring up -d

# Verify all services are healthy
docker compose -f docker-compose.local.yml ps
```

### Monitoring Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |
| Prometheus | http://localhost:9090 | Metrics explorer |
| Loki | http://localhost:3100 | Log aggregation API |

### Healthchecks

All monitoring services have Docker healthchecks configured:

| Service | Endpoint | Tool |
|---------|----------|------|
| Prometheus | `/-/healthy` | wget |
| Loki | `/ready` | wget |
| Promtail | `/ready` | bash /dev/tcp |
| Grafana | `/api/health` | wget |

> **Note:** Promtail uses `/dev/tcp` for healthcheck because the container lacks wget/curl. This is a [community-recommended workaround](https://github.com/grafana/loki/issues/11590).

### Verifying Log Collection

```bash
# Check if Prometheus can scrape backend metrics
docker exec wellkorea-erp-prometheus wget -qO- http://backend:8080/actuator/prometheus | head -5

# Query logs in Grafana
# Navigate to Explore > Loki > {service="backend"}
```

### Future: Migration to Grafana Alloy

Promtail is deprecated (EOL: March 2, 2026). See [promtail-to-alloy-migration.md](promtail-to-alloy-migration.md) for the planned migration to Grafana Alloy.

---

## Production Deployment

### Prerequisites

1. Server with Docker and Docker Compose
2. Nginx installed on host
3. SSL certificate (all subdomains can use the same wildcard/SAN cert):
   - `wellkorea.mipllab.com`
   - `api.wellkorea.mipllab.com`
   - `storage.wellkorea.mipllab.com`
   - `dashboard.wellkorea.mipllab.com` (optional, for Grafana monitoring)
4. DNS records pointing all subdomains to server IP

### Deployment Steps

#### 1. Prepare Environment

```bash
# Clone repository
git clone <repository-url> /opt/wellkorea-erp
cd /opt/wellkorea-erp

# Create production environment file
cp .env.prod.example .env

# Edit .env with production values
vim .env
```

#### 2. Start Docker Services

```bash
cd /opt/wellkorea-erp

# Build and start services (includes frontend container)
docker compose -f docker-compose.prod.yml up -d --build

# Verify services are healthy
docker compose -f docker-compose.prod.yml ps
```

#### 3. Configure Nginx

See [Nginx Configuration](#nginx-configuration) section below.

#### 4. Verify Deployment

```bash
# Check backend health
curl http://127.0.0.1:20080/actuator/health

# Check MinIO health
curl http://127.0.0.1:20090/minio/health/live

# Check frontend
curl http://127.0.0.1:20030/

# Test external access (after Nginx setup)
curl https://api.wellkorea.mipllab.com/actuator/health
```

---

## Nginx Configuration

Create the following Nginx configuration files on the production server.

> **Note:** Actual production config files are maintained in `docs/operations/`:
> - `wellkorea.conf` - Frontend
> - `wellkorea-api.conf` - Backend API
> - `wellkorea-dashboard.conf` - Grafana dashboard
> - `wellkorea-storage.conf` - MinIO storage
>
> These examples use `/etc/nginx/conf.d/*.conf` (Red Hat/CentOS style).
> If your system uses `sites-available/sites-enabled` (Debian/Ubuntu style), adjust paths accordingly.

### Frontend (wellkorea.mipllab.com)

```nginx
# /etc/nginx/conf.d/wellkorea.conf

server {
    listen 443 ssl;
    server_name wellkorea.mipllab.com;

    ssl_certificate /etc/letsencrypt/live/wellkorea.mipllab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wellkorea.mipllab.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/wellkorea-erp;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Proxy to frontend container
    location / {
        proxy_pass http://127.0.0.1:20030;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    if ($host = wellkorea.mipllab.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name wellkorea.mipllab.com;
    return 404;
}
```

### Backend API (api.wellkorea.mipllab.com)

```nginx
# /etc/nginx/conf.d/wellkorea-api.conf

server {
    listen 80;
    server_name api.wellkorea.mipllab.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.wellkorea.mipllab.com;

    ssl_certificate /etc/letsencrypt/live/wellkorea.mipllab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wellkorea.mipllab.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Request size limit for file uploads
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:20080;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### MinIO Storage (storage.wellkorea.mipllab.com)

```nginx
# /etc/nginx/conf.d/wellkorea-storage.conf

server {
    listen 80;
    server_name storage.wellkorea.mipllab.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name storage.wellkorea.mipllab.com;

    ssl_certificate /etc/letsencrypt/live/wellkorea.mipllab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wellkorea.mipllab.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Important: Large file upload support
    client_max_body_size 100M;

    # Disable buffering for streaming uploads
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass http://127.0.0.1:20090;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Required for MinIO presigned URLs
        proxy_set_header X-NginX-Proxy true;

        # Timeouts for large file transfers
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

### Grafana Dashboard (dashboard.wellkorea.mipllab.com) - Optional

> Only needed if you want external access to Grafana dashboards.

```nginx
# /etc/nginx/conf.d/wellkorea-dashboard.conf

server {
    listen 80;
    server_name dashboard.wellkorea.mipllab.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dashboard.wellkorea.mipllab.com;

    ssl_certificate /etc/letsencrypt/live/wellkorea.mipllab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wellkorea.mipllab.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:20040;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for Grafana Live
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Apply Configuration

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Files in `/etc/nginx/conf.d/` are automatically loaded. No symlinks needed.

---

## SSL/TLS Setup

### Using Let's Encrypt with SAN Certificate (Recommended)

All subdomains can share a single certificate with Subject Alternative Names (SAN):

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain a single certificate for all subdomains
sudo certbot --nginx -d wellkorea.mipllab.com \
    -d api.wellkorea.mipllab.com \
    -d storage.wellkorea.mipllab.com \
    -d dashboard.wellkorea.mipllab.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

All Nginx configs then use the same certificate path:
```nginx
ssl_certificate /etc/letsencrypt/live/wellkorea.mipllab.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/wellkorea.mipllab.com/privkey.pem;
```

### Using Wildcard Certificate

If you have a wildcard certificate for `*.mipllab.com`:

```bash
# Copy certificates
sudo cp fullchain.pem /etc/ssl/certs/mipllab.com.pem
sudo cp privkey.pem /etc/ssl/private/mipllab.com.key

# Update Nginx configs to use:
# ssl_certificate /etc/ssl/certs/mipllab.com.pem;
# ssl_certificate_key /etc/ssl/private/mipllab.com.key;
```

---

## Troubleshooting

### Backend Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Common issues:
# - Database connection failed: Check POSTGRES_* environment variables
# - Port already in use: Check if another service uses port 8080
```

### MinIO Presigned URLs Not Working

1. **Verify MINIO_URL**: Must match the external URL exactly
   ```bash
   # In .env
   MINIO_URL=https://storage.wellkorea.mipllab.com
   ```

2. **Check Nginx proxy headers**: Ensure `X-Forwarded-Proto` is set

3. **Test MinIO directly**:
   ```bash
   curl http://127.0.0.1:20090/minio/health/live
   ```

### Frontend Shows Blank Page

1. Check if frontend container is running:
   ```bash
   docker compose -f docker-compose.prod.yml ps frontend
   docker compose -f docker-compose.prod.yml logs frontend
   ```

2. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Test frontend container directly:
   ```bash
   curl http://127.0.0.1:20030/
   ```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Test connection from backend container
docker compose -f docker-compose.prod.yml exec backend \
  wget -qO- http://localhost:8080/actuator/health
```

### Monitoring Stack Issues

```bash
# Check if all monitoring services are healthy
docker compose -f docker-compose.local.yml ps

# View Promtail logs (log collection issues)
docker compose -f docker-compose.local.yml logs promtail

# Test Loki readiness
docker exec wellkorea-erp-loki wget -qO- http://localhost:3100/ready

# Test Prometheus targets (should show backend as UP)
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].health'
```

---

## Maintenance Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Update and redeploy
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Backup PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql

# Access MinIO console (via SSH tunnel)
ssh -L 9001:localhost:9001 user@production-server
# Then open http://localhost:9001 in browser
```
