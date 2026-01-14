# Service Management

This document covers operational procedures for managing the WellKorea ERP services including Docker deployment, health checks, and maintenance tasks.

## Docker Services

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│   │   nginx     │────▶│   backend   │────▶│  postgres   │  │
│   │  (frontend) │     │ (Spring)    │     │     DB      │  │
│   │   :80       │     │   :8080     │     │   :5432     │  │
│   └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Common Commands

```bash
# Start all services
docker compose up -d

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes (clean reset)
docker compose down -v

# Restart specific service
docker compose restart backend

# Rebuild and restart
docker compose up -d --build backend
```

## Health Checks

### Backend Health Endpoint

The backend exposes health endpoints via Spring Boot Actuator:

```bash
# Basic health check
curl http://localhost:8080/actuator/health

# Detailed health (if configured)
curl http://localhost:8080/actuator/health/liveness
curl http://localhost:8080/actuator/health/readiness
```

**Expected Response:**
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

### Frontend Health Check

```bash
# Check nginx is serving
curl -I http://localhost/

# Expected: HTTP/1.1 200 OK
```

### Database Health Check

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U wellkorea -d erp -c "SELECT 1;"
```

## Troubleshooting

### Backend Won't Start

1. **Check logs:**
   ```bash
   docker compose logs backend
   ```

2. **Common issues:**
   - Database not ready: Backend may start before PostgreSQL is ready
   - Port conflict: Another service using port 8080
   - Missing environment variables: Check `.env` file

3. **Solution:**
   ```bash
   # Wait for postgres, then restart backend
   docker compose restart backend
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   docker compose ps postgres
   ```

2. **Check database logs:**
   ```bash
   docker compose logs postgres
   ```

3. **Test connection:**
   ```bash
   docker compose exec postgres pg_isready -U wellkorea -d erp
   ```

### Frontend Not Loading

1. **Check nginx logs:**
   ```bash
   docker compose logs frontend
   ```

2. **Verify nginx configuration:**
   ```bash
   docker compose exec frontend nginx -t
   ```

3. **Common issues:**
   - Build failed: Check `npm run build` output
   - Port conflict: Another service on port 80

## Maintenance Tasks

### Database Backup

```bash
# Create backup
docker compose exec postgres pg_dump -U wellkorea erp > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U wellkorea erp < backup_20250101.sql
```

### Log Rotation

Docker logs can grow large. Configure log rotation in `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Updating Services

```bash
# Pull latest images
docker compose pull

# Rebuild with latest code
docker compose build --no-cache

# Rolling update (minimal downtime)
docker compose up -d --no-deps backend
```

### Cleaning Up

```bash
# Remove stopped containers
docker compose down

# Remove unused images
docker image prune -f

# Remove all unused data (dangerous!)
docker system prune -a
```

## Environment Variables

Required environment variables in `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | `wellkorea` |
| `POSTGRES_PASSWORD` | Database password | `secure_password` |
| `POSTGRES_DB` | Database name | `erp` |
| `SPRING_PROFILES_ACTIVE` | Spring profile | `dev`, `prod` |
| `JWT_SECRET` | JWT signing key | (64+ char secret) |

## Monitoring

### Resource Usage

```bash
# Container resource stats
docker stats

# Check disk usage
docker system df
```

### Application Metrics

If Spring Boot Actuator metrics are enabled:

```bash
# Prometheus metrics
curl http://localhost:8080/actuator/prometheus

# JVM memory
curl http://localhost:8080/actuator/metrics/jvm.memory.used
```

## Security Notes

1. **Never expose** PostgreSQL port (5432) to the internet
2. **Use strong passwords** for database and JWT secrets
3. **Keep images updated** for security patches
4. **Review logs regularly** for suspicious activity
