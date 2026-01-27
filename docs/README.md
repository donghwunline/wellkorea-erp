# Documentation

WellKorea ERP documentation organized by category.

## Directory Structure

```
docs/
├── architecture/           # System design and patterns
│   ├── backend/           # Backend architecture (Spring Boot, DDD, Events)
│   ├── frontend/          # Frontend architecture (React, FSD, Auth)
│   ├── concurrency/       # Distributed locking, race condition handling
│   └── domain/            # Domain models and relationships
├── infrastructure/        # CI/CD, monitoring, tooling
└── operations/            # Deployment, migration, maintenance
```

## Quick Links

### Architecture

| Document | Description |
|----------|-------------|
| [Concurrency Control](architecture/concurrency/delivery-concurrency-control.md) | Distributed locking strategy for delivery/invoice |
| [Event & Approval Strategy](architecture/backend/event-and-approval-strategy.md) | Domain events and approval workflow |
| [Frontend Architecture](architecture/frontend/frontend-architecture-analysis.md) | FSD pattern, TanStack Query, state management |
| [FSD Public API Guidelines](architecture/frontend/fsd-public-api-guidelines.md) | Entity layer public API patterns |
| [Authentication](architecture/frontend/authentication-architecture.md) | JWT auth flow, token refresh |

### Domain Models

| Document | Description |
|----------|-------------|
| [Delivery-Quotation Relationship](architecture/domain/delivery-quotation-relationship.md) | How deliveries link to quotations |
| [Approval Domain](architecture/domain/approval-domain-model.md) | Approval workflow domain model |
| [Company Domain](architecture/domain/company-domain-model.md) | Company and customer entities |

### Infrastructure

| Document | Description |
|----------|-------------|
| [CI/CD Setup](infrastructure/ci-cd-setup.md) | Complete CI/CD pipeline guide |
| [CI/CD Quickstart](infrastructure/ci-cd-quickstart.md) | 5-minute setup guide |
| [SonarQube](infrastructure/sonarqube.md) | Code quality analysis setup |

### Operations

| Document | Description |
|----------|-------------|
| [Microsoft Graph Mail Setup](operations/microsoft-graph-mail-setup.md) | OAuth2 mail configuration guide |
| [Keycloak Migration](operations/keycloak-migration.md) | OAuth2/SSO migration plan |
| [Service Management](operations/service-management.md) | Docker, health checks, maintenance |

## Search Tips

- **By topic**: Navigate to the relevant subdirectory
- **By keyword**: Use `grep -r "keyword" docs/`
- **Lock-related**: See `architecture/concurrency/`
- **Domain models**: See `architecture/domain/`
