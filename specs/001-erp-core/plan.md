# Implementation Plan: WellKorea Integrated Work System (ERP)

**Branch**: `001-erp-core` | **Date**: 2025-11-24 | **Spec**: [specs/001-erp-core/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-erp-core/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The WellKorea ERP system consolidates fragmented job lifecycle data (ledgers, Excel, legacy software) into a unified web application managing JobCode creation, product-based quotations with approval workflows, per-product production tracking, granular delivery/invoicing (preventing double-billing), AR/AP management, and financial reporting.

**Technical approach**: Modular monolith (single backend + React frontend) with PostgreSQL (relational data), S3-compatible object storage (documents/files), JWT-based RBAC, and optional Keycloak for SSO. Designed for small internal team (500–1000 JobCodes/month), supporting roles (Admin, Finance, Sales, Production) with data-aware access control and comprehensive audit logging.

## Technical Context

**Language/Version**: Java 17+ with Spring Boot 3.x
**Primary Dependencies**: Spring Boot (REST API, transaction management), Spring Data JPA (ORM/repositories), Spring Security (RBAC), Apache POI (Excel import/export), iText/PDFBox (PDF generation), Keycloak (optional SSO)
**Storage**: PostgreSQL 14+ (relational data), MinIO or S3-compatible (documents/files)
**Testing**: JUnit 5, Mockito (unit tests), TestContainers (integration tests), contract tests (OpenAPI/Swagger)
**Target Platform**: Linux server (Docker), deployed on-premise or single cloud VM
**Project Type**: Web application (backend API + React SPA frontend)
**Performance Goals**: 100 concurrent users baseline; JobCode creation <2 sec; quotation generation <5 sec; search/filter <1 sec
**Constraints**: On-premise data residency (financial data sensitivity); daily backups required; audit logging for all financial transactions
**Scale/Scope**: 500–1000 JobCodes/month; 50–200 products in catalog; 4 user roles; 12–24 months operational data; estimated 15–20 core entities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Required Gates (from constitution v1.0.0)

| Principle | Requirement | Status |
|-----------|------------|--------|
| **Test-First Development** | Write tests before implementation; all tests must pass before merge; >80% unit coverage | ✅ GATE: Design must include test structure (unit/integration/contract) |
| **Code Quality & Simplicity** | Type-safe, no premature abstraction, YAGNI principle, <10 cyclomatic complexity | ✅ GATE: Modular design with single-responsibility layers; no over-engineering |
| **Error Handling & Observability** | Explicit error handling, structured logging, timeouts on async ops, context logging | ✅ GATE: Design includes logging strategy for financial transactions; timeouts on external calls |
| **UX Consistency & Accessibility** | Consistent UI patterns, keyboard navigation, screen reader support, accessible error messages | ✅ GATE: React + Material UI ensures consistency; validation required in data-model phase |
| **Contract Testing** | All API contracts explicitly tested, breaking changes detected before merge | ✅ GATE: OpenAPI contracts required; contract tests in /contracts/ directory |

**Gate Status**: ✅ **PASS** — Technical context aligns with all constitution principles. Java/Spring Stack supports enterprise RBAC, transaction management, and robust error handling. Modular layers prevent premature complexity. React + Material UI provides UX consistency. Testing strategy (unit/integration/contract) embedded in Spring Boot ecosystem.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

Selected: **Option 2: Web Application** (backend API + React frontend SPA)

```text
backend/
├── src/main/java/com/wellkorea/erp/
│   ├── api/                          # REST controllers
│   │   ├── jobcode/
│   │   ├── quotation/
│   │   ├── production/
│   │   ├── delivery/
│   │   ├── finance/                  # AR/AP
│   │   ├── purchasing/
│   │   ├── documents/
│   │   └── admin/
│   ├── application/                  # Use cases (services)
│   │   ├── jobcode/
│   │   ├── quotation/
│   │   ├── production/
│   │   ├── delivery/
│   │   ├── finance/
│   │   ├── purchasing/
│   │   └── documents/
│   ├── domain/                       # Entities & aggregates
│   │   ├── jobcode/
│   │   ├── product/
│   │   ├── quotation/
│   │   ├── workprogress/
│   │   ├── delivery/
│   │   ├── invoice/
│   │   ├── payment/
│   │   ├── purchasing/
│   │   ├── document/
│   │   └── shared/                   # Common value objects
│   ├── infrastructure/               # DB, storage, email
│   │   ├── persistence/              # JPA repositories
│   │   ├── storage/                  # S3/MinIO client
│   │   ├── email/
│   │   └── pdf/
│   ├── security/                     # Auth, RBAC, audit logging
│   │   ├── jwt/
│   │   ├── rbac/
│   │   └── audit/
│   └── Application.java              # Spring Boot main
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── db/migration/                 # Flyway/Liquibase scripts
├── src/test/java/com/wellkorea/erp/
│   ├── unit/                         # Unit tests (domain, services)
│   ├── integration/                  # Integration tests (DB, API)
│   └── contract/                     # Contract tests (OpenAPI)
├── build.gradle                      # or pom.xml
├── Dockerfile
└── docker-compose.yml

frontend/
├── src/
│   ├── components/
│   │   ├── common/                   # Shared UI (Button, Modal, Table, etc.)
│   │   ├── jobcode/                  # JobCode management
│   │   ├── quotation/                # Quotation creation & approval
│   │   ├── production/               # Production tracking
│   │   ├── delivery/                 # Delivery & invoicing
│   │   ├── finance/                  # AR/AP dashboards
│   │   ├── purchasing/               # RFQ, POs
│   │   ├── documents/                # Document upload/download
│   │   └── admin/                    # User, role, product catalog mgmt
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── JobCodeList.tsx
│   │   ├── JobCodeDetail.tsx
│   │   ├── QuotationForm.tsx
│   │   ├── ApprovalQueue.tsx
│   │   ├── ProductionSheet.tsx
│   │   ├── DeliveryForm.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── ARAPView.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── services/
│   │   ├── api.ts                    # REST client (axios/fetch)
│   │   ├── auth.ts                   # JWT token management
│   │   ├── storage.ts                # Document upload
│   │   └── useRole.ts                # RBAC hook
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useRole.ts
│   ├── types/
│   │   ├── jobcode.ts
│   │   ├── quotation.ts
│   │   ├── invoice.ts
│   │   └── common.ts                 # Shared types
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile

docs/
├── API.md                             # OpenAPI reference
├── DATA_MODEL.md                      # Entity relationships
├── SETUP.md                           # Docker Compose setup
└── ARCHITECTURE.md                    # Detailed architecture

docker-compose.yml                     # Full stack (backend, frontend, PostgreSQL, MinIO, etc.)
```

**Structure Decision**: Modular monolith pattern with clear domain separation. Backend uses layered architecture (API → Application → Domain → Infrastructure) matching business domains (JobCode, Sales, Production, Finance, Purchasing, Documents). Frontend uses component-based React with pages, services, and type-safe hooks. Testing embedded at each layer.

## Complexity Tracking

> **No violations detected.** Constitution check passed. Design follows YAGNI principle (no over-engineering) and enforces single responsibility at each layer.

---

## Phase 0 Completion: Research

✅ **Complete** — All technology stack decisions researched and documented in `research.md`:
- Backend: Java 17 + Spring Boot 3.x (chosen for mature RBAC, transaction management, PDF/Excel libraries)
- Database: PostgreSQL 14+ (ACID, constraints, full-text search)
- File Storage: S3-compatible (MinIO or AWS) with database metadata
- Frontend: React 18 + TypeScript + Material UI (complex data tables, forms, accessibility)
- Authentication: JWT + Spring Security RBAC with optional Keycloak SSO
- Testing: Test-first (unit/integration/contract) per constitution
- Deployment: Docker Compose on single Linux VM (pragmatic for SME)
- Reporting: Built-in dashboards + optional Metabase

**Key Decisions**:
- Modular monolith (not microservices) for current scale (500–1000 JobCodes/month)
- Layered architecture (API → Application → Domain → Infrastructure) matching business domains
- On-premise deployment with data residency requirements met
- All financial transactions auditable and immutable

---

## Phase 1 Completion: Design & Contracts

✅ **Complete** — All design artifacts generated:

### Data Model (`data-model.md`)
- **22 Core Entities**: JobCode, Customer, Product, Quotation, QuotationLineItem, Approval, WorkProgressSheet, WorkProgressStep, Delivery, DeliveryLineItem, TaxInvoice, InvoiceLineItem, Payment, Document, RFQ, PurchaseOrder, Supplier, User, Role, AuditLog
- **Key Design Patterns**:
  - JobCode as aggregate root (single source of truth for project)
  - Per-product work progress sheets (enables partial delivery/invoicing)
  - Granular invoicing (prevents double-billing via InvoiceLineItem tracking)
  - Immutable audit logs (financial compliance)
  - Soft deletes (preserves history)
- **Relationships**: 50+ foreign keys with ON DELETE constraints defined
- **Unique Constraints**: Enforced at DB level (JobCode uniqueness, invoice number uniqueness, etc.)
- **Indexes**: Performance optimized for search, list, and reporting queries
- **State Machines**: JobCode, Quotation, TaxInvoice, WorkProgressStep status flows defined

### API Contracts (`contracts/openapi.yaml`)
- **OpenAPI 3.0 Specification** with 30+ endpoints:
  - JobCode CRUD (create, read, update, list)
  - Quotation creation, approval, rejection, versioning, PDF generation
  - Work progress tracking (per-product sheet, step completion)
  - Delivery & invoicing (granular by product-quantity)
  - Payment recording (supports partial payments)
  - Document upload/download (with RBAC enforcement)
  - Purchasing (RFQ, POs)
  - Admin (users, roles, products, audit logs)
  - Reporting (AR aging, sales summary)
- **Security**: JWT Bearer authentication on all endpoints
- **RBAC**: Method-level access control (@PreAuthorize annotations)
- **Request/Response Schemas**: Full OpenAPI models for request validation, response serialization
- **Error Handling**: Standardized error responses (BadRequest, Unauthorized, Forbidden, NotFound)

### Quick Start Guide (`quickstart.md`)
- **5-minute setup**: Docker Compose, all services running
- **Database**: Flyway migrations, backup/restore procedures
- **Backend**: Code structure (layered, domain-driven), Spring Boot configuration, testing strategy
- **Frontend**: React setup, authentication flow, Material UI usage
- **API Testing**: Swagger UI, curl examples, Postman integration
- **File Storage**: MinIO bucket configuration, presigned URLs
- **Logging & Monitoring**: Structured logs, query performance, health checks
- **Common Workflows**: Feature creation, migrations, testing
- **Deployment**: Docker image build, production docker-compose override, backup strategy
- **Troubleshooting**: Common issues and solutions

---

## Constitution Re-Check (Post-Phase 1)

All design decisions align with project constitution v1.0.0:

| Principle | Design Alignment | Verified |
|-----------|-----------------|----------|
| **Test-First Development** | Test structure embedded: unit/ integration/ contract/ directories in both backend and frontend | ✅ |
| **Code Quality & Simplicity** | Layered architecture (API, Application, Domain, Infrastructure) enforces single responsibility; no premature abstractions | ✅ |
| **Error Handling & Observability** | AuditLog entity (immutable), structured logging strategy, exception handling via Spring Global@ExceptionHandler, context in all logs | ✅ |
| **UX Consistency & Accessibility** | React + Material UI ensures WCAG 2.1 compliance, consistent design patterns, keyboard navigation built-in | ✅ |
| **Contract Testing** | OpenAPI 3.0 specification auto-validated by Spring Cloud Contract; all endpoints have explicit request/response schemas | ✅ |

**Re-check Status**: ✅ **PASS** — Design ready for implementation phase.
