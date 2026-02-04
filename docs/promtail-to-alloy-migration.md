# Promtail to Grafana Alloy Migration Guide

> **Status:** Planned for future implementation
> **Priority:** Medium (Promtail EOL: March 2, 2026)
> **Created:** 2026-02-04

## Why Migrate?

- **Promtail is deprecated** - [EOL March 2, 2026](https://grafana.com/blog/2025/02/13/grafana-loki-3.4-standardized-storage-config-sizing-guidance-and-promtail-merging-into-alloy/)
- **Alloy is the official successor** - actively developed, unified agent for logs/metrics/traces
- **Same healthcheck situation** - Neither has curl/wget; both use `/dev/tcp` workaround

## Files to Modify

| File | Change |
|------|--------|
| `docker-compose.local.yml` | Replace promtail service with alloy |
| `docker-compose.prod.yml` | Replace promtail service with alloy |
| `monitoring/alloy/config.alloy` | New file - Alloy configuration (River format) |
| `monitoring/promtail/` | Delete directory after migration |

---

## Implementation

### 1. Create Alloy Config

**File:** `monitoring/alloy/config.alloy`

```river
// Docker container discovery
discovery.docker "containers" {
  host = "unix:///var/run/docker.sock"
  refresh_interval = "5s"
}

// Relabel to extract container metadata
discovery.relabel "docker_labels" {
  targets = discovery.docker.containers.targets

  // Keep only wellkorea-erp containers
  rule {
    source_labels = ["__meta_docker_container_label_com_docker_compose_project"]
    regex         = "wellkorea-erp.*"
    action        = "keep"
  }

  // Extract container name
  rule {
    source_labels = ["__meta_docker_container_name"]
    regex         = "/(.*)"
    target_label  = "container"
  }

  // Extract service name
  rule {
    source_labels = ["__meta_docker_container_label_com_docker_compose_service"]
    target_label  = "service"
  }
}

// Collect Docker logs
loki.source.docker "containers" {
  host       = "unix:///var/run/docker.sock"
  targets    = discovery.relabel.docker_labels.output
  forward_to = [loki.process.backend_json.receiver]
}

// Process backend JSON logs
loki.process "backend_json" {
  stage.match {
    selector = "{service=\"backend\"}"

    stage.json {
      expressions = {
        level         = "level",
        logger        = "logger_name",
        correlationId = "correlationId",
        message       = "message",
      }
    }

    stage.labels {
      values = {
        level  = "",
        logger = "",
      }
    }

    stage.structured_metadata {
      values = {
        correlationId = "",
      }
    }

    stage.output {
      source = "message"
    }
  }

  forward_to = [loki.write.local.receiver]
}

// Write to Loki
loki.write "local" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}
```

### 2. Update docker-compose.local.yml

Replace promtail service with:

```yaml
  # Alloy — Log collector (replaces Promtail)
  alloy:
    image: grafana/alloy:v1.5.1
    container_name: wellkorea-erp-alloy
    profiles: [monitoring]
    command:
      - run
      - --server.http.listen-addr=0.0.0.0:12345
      - --storage.path=/var/lib/alloy/data
      - /etc/alloy/config.alloy
    volumes:
      - ./monitoring/alloy/config.alloy:/etc/alloy/config.alloy:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - loki
    healthcheck:
      test: ["CMD-SHELL", "bash -c 'echo -e \"GET /-/ready HTTP/1.1\\r\\nHost: localhost\\r\\nConnection: close\\r\\n\\r\\n\" > /dev/tcp/localhost/12345'"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - wellkorea-network
```

### 3. Update docker-compose.prod.yml

Same as above with `restart: unless-stopped` and network `wellkorea-internal`.

### 4. Update Volumes Section

Remove `promtail` references if any. No new volumes needed (Alloy uses in-container storage).

---

## Verification

```bash
# 1. Stop existing monitoring stack
docker compose -f docker-compose.local.yml --profile monitoring down

# 2. Start with new Alloy config
docker compose -f docker-compose.local.yml --profile monitoring up -d

# 3. Verify all services healthy
docker compose -f docker-compose.local.yml ps

# 4. Check Alloy UI
open http://localhost:12345

# 5. Verify logs flowing to Loki via Grafana
open http://localhost:3000
# Navigate to Explore > Loki > {service="backend"}

# 6. Verify backend structured logs (correlationId, level, etc.)
# Query: {service="backend"} | json
```

---

## Rollback

If issues occur, revert to Promtail by:
1. `git checkout docker-compose.local.yml docker-compose.prod.yml`
2. `docker compose -f docker-compose.local.yml --profile monitoring up -d`

---

## Healthcheck Note

Both Promtail and Alloy Docker images lack `curl`/`wget`. The `/dev/tcp` bash approach is the [community-recommended workaround](https://github.com/grafana/alloy/issues/477#issuecomment-2050541417).

Current Promtail healthcheck (same pattern works for Alloy):
```yaml
healthcheck:
  test: ["CMD-SHELL", "bash -c 'echo -e \"GET /ready HTTP/1.0\\r\\n\\r\\n\" > /dev/tcp/localhost/9080'"]
```

---

## Sources

- [Promtail to Alloy Migration Guide](https://grafana.com/docs/alloy/latest/set-up/migrate/from-promtail/)
- [Alloy Docker Setup](https://grafana.com/docs/alloy/latest/set-up/install/docker/)
- [Alloy HTTP Endpoints](https://grafana.com/docs/alloy/latest/reference/http/)
- [Alloy Healthcheck Workaround](https://github.com/grafana/alloy/issues/477#issuecomment-2050541417)
- [Official Loki Getting Started](https://github.com/grafana/loki/blob/main/examples/getting-started/docker-compose.yaml)
- [Promtail Deprecation Announcement](https://grafana.com/blog/2025/02/13/grafana-loki-3.4-standardized-storage-config-sizing-guidance-and-promtail-merging-into-alloy/)
