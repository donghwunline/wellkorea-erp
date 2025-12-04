# Implementation Plan: WellKorea Integrated Work System (ERP)

**Branch**: `001-erp-core` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-erp-core/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The WellKorea Integrated Work System consolidates fragmented job lifecycle data into a unified web application managing the complete workflow from customer request through project creation, quotation & approval, production tracking, delivery, invoicing, and financial reporting.

**Key Architectural Clarification**: **Project** is the core domain entity representing a customer work request. **JobCode** (format: WK2{year}-{sequence}-{date}) is the unique business identifier for each Project. All business logic centers around the Project entity, with JobCode serving as its human-readable, memorable key for cross-functional communication.

**Technical Approach**: Spring Boot backend with REST APIs, PostgreSQL database, React frontend. Granular quotation-to-invoice tracking at product-quantity level to prevent double-billing. Role-based access control (Admin/Finance/Production/Sales) with audit logging for compliance.

## Technical Context

**Language/Version**: Java 21 (Spring Boot 3.5.8)
**Primary Dependencies**: Spring Boot (Web, Data JPA, Security, Actuator), PostgreSQL driver, Apache POI (Excel), iText/PDFBox (PDF generation)
**Storage**: PostgreSQL 16 (relational database with ACID transactions)
**Testing**: JUnit 5, Testcontainers (backend); Vitest, Playwright (frontend)
**Target Platform**: Linux server (Docker containers), web browsers (desktop/tablet)
**Project Type**: Web application (Spring Boot backend + React frontend)
**Performance Goals**:
- JobCode creation <2 minutes
- Quotation PDF generation <10 seconds
- Document search <3 seconds across 10,000+ documents
- 10+ concurrent users without data loss
  **Constraints**:
- 70% code coverage requirement (JaCoCo for backend, Vitest for frontend)
- PostgreSQL ACID transactions for quotation approval and payment recording
- Audit log immutability (1 year retention)
- File size limit 100MB per document
  **Scale/Scope**:
- 500–1,000 Projects/month (6,000–12,000 Projects in 12 months)
- 50–200 products in catalog at launch
- 100GB–1TB document storage scalability

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-First Development ✅
- **Status**: PASS
- **Evidence**: Spec includes comprehensive acceptance scenarios for all user stories (US1-US9). Test infrastructure defined (JUnit 5 + Testcontainers for backend, Vitest + Playwright for frontend). 70% coverage threshold enforced via build tools.
- **Action**: Phase 1 will generate contract tests for all REST endpoints before implementation.

### II. Code Quality & Simplicity ✅
- **Status**: PASS
- **Evidence**: Using established frameworks (Spring Boot, React) with conventional structure. YAGNI principle enforced—MVP defers complex features (document virtual tree, advanced RFQ automation) to later phases. Single responsibility per service layer.
- **Action**: Code reviews will verify cyclomatic complexity <10, no dead code, explicit type safety (Java 21 types, TypeScript strict mode).

### III. Comprehensive Error Handling & Observability ✅
- **Status**: PASS
- **Evidence**: Spec requires audit logging for all sensitive document access (FR-067). Spring Boot Actuator provides observability. All external operations (database, file storage, PDF generation, email) will have explicit error handling.
- **Action**: Phase 1 will define error response contracts (4xx/5xx) and structured logging format (timestamp, level, context, message).

### IV. User Experience Consistency & Accessibility ✅
- **Status**: PASS
- **Evidence**: Spec defines success criteria with specific time targets (SC-001 to SC-012). Role-based access control ensures consistent permission behavior. Loading/error states will follow React component patterns.
- **Action**: Phase 1 will create UI component library with consistent error messages, loading states, and keyboard accessibility.

### V. Contract Testing & Integration Reliability ✅
- **Status**: PASS
- **Evidence**: REST API contracts will be generated in Phase 1. Integration tests will use Testcontainers for database. All external dependencies (PostgreSQL, file storage) mocked in unit tests.
- **Action**: Phase 1 will generate OpenAPI specification for all endpoints. Contract tests will validate request/response schemas before implementation.

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

```text
backend/                                       # Spring Boot application
├── src/main/java/com/wellkorea/backend/
│   ├── project/                              # Project domain module (core aggregate)
│   │   ├── domain/                           # Business entities & domain logic
│   │   │   ├── Project.java                  # Project entity (JobCode is unique key)
│   │   │   ├── ProjectStatus.java            # Status enum
│   │   │   └── JobCodeGenerator.java         # Domain service
│   │   ├── application/                      # Use cases / application services
│   │   │   └── ProjectService.java           # Business workflow orchestration
│   │   ├── api/                              # REST API layer
│   │   │   ├── ProjectController.java        # REST endpoints
│   │   │   └── dto/                          # Request/Response DTOs
│   │   └── infrastructure/                   # External adapters
│   │       └── persistence/                  # Database adapters
│   │           └── ProjectRepository.java    # JPA repository
│   │
│   ├── quotation/                            # Quotation domain module
│   │   ├── domain/
│   │   │   ├── Quotation.java
│   │   │   ├── QuotationLineItem.java
│   │   │   └── QuotationStatus.java
│   │   ├── application/
│   │   │   ├── QuotationService.java
│   │   │   └── QuotationPdfService.java
│   │   ├── api/
│   │   │   ├── QuotationController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       └── persistence/
│   │           └── QuotationRepository.java
│   │
│   ├── approval/                             # Approval workflow domain module (cross-cutting)
│   │   ├── domain/
│   │   │   ├── ApprovalRequest.java
│   │   │   ├── ApprovalStatus.java
│   │   │   ├── ApprovalHistory.java
│   │   │   └── ApprovalComment.java
│   │   ├── application/
│   │   │   └── ApprovalService.java
│   │   ├── api/
│   │   │   ├── ApprovalController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       └── persistence/
│   │           └── ApprovalRepository.java
│   │
│   ├── product/                              # Product catalog domain module
│   │   ├── domain/
│   │   │   ├── Product.java
│   │   │   └── ProductType.java
│   │   ├── application/
│   │   │   └── ProductService.java
│   │   ├── api/
│   │   │   ├── ProductController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       └── persistence/
│   │           └── ProductRepository.java
│   │
│   ├── production/                           # Production tracking domain module
│   │   ├── domain/
│   │   │   ├── WorkProgressSheet.java
│   │   │   ├── WorkProgressStep.java
│   │   │   └── StepStatus.java
│   │   ├── application/
│   │   │   └── WorkProgressService.java
│   │   ├── api/
│   │   │   ├── WorkProgressController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       └── persistence/
│   │           └── WorkProgressSheetRepository.java
│   │
│   ├── delivery/                             # Delivery tracking domain module
│   │   ├── domain/
│   │   │   ├── Delivery.java
│   │   │   └── DeliveryLineItem.java
│   │   ├── application/
│   │   │   ├── DeliveryService.java
│   │   │   └── TransactionStatementService.java
│   │   ├── api/
│   │   │   ├── DeliveryController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       └── persistence/
│   │           └── DeliveryRepository.java
│   │
│   ├── invoice/                              # Invoicing & payments domain module
│   │   ├── domain/
│   │   │   ├── TaxInvoice.java
│   │   │   ├── InvoiceLineItem.java
│   │   │   ├── Payment.java
│   │   │   └── InvoiceStatus.java
│   │   ├── application/
│   │   │   ├── InvoiceService.java
│   │   │   ├── PaymentService.java
│   │   │   ├── InvoicePdfService.java
│   │   │   └── ARAPReportService.java
│   │   ├── api/
│   │   │   ├── InvoiceController.java
│   │   │   ├── PaymentController.java
│   │   │   ├── ReportController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       └── persistence/
│   │           ├── TaxInvoiceRepository.java
│   │           └── PaymentRepository.java
│   │
│   ├── purchasing/                           # Purchasing & RFQ domain module
│   │   ├── domain/
│   │   │   ├── RFQ.java
│   │   │   ├── PurchaseOrder.java
│   │   │   ├── Supplier.java
│   │   │   └── RFQStatus.java
│   │   ├── application/
│   │   │   ├── RFQService.java
│   │   │   ├── VendorSuggestionService.java
│   │   │   └── EmailService.java
│   │   ├── api/
│   │   │   ├── RFQController.java
│   │   │   ├── PurchaseOrderController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       └── persistence/
│   │           ├── RFQRepository.java
│   │           └── SupplierRepository.java
│   │
│   ├── document/                             # Document management domain module
│   │   ├── domain/
│   │   │   ├── Document.java
│   │   │   └── DocumentType.java
│   │   ├── application/
│   │   │   ├── DocumentService.java
│   │   │   └── MinioStorageService.java
│   │   ├── api/
│   │   │   ├── DocumentController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       ├── persistence/
│   │       │   └── DocumentRepository.java
│   │       └── storage/                      # MinIO/S3 integration
│   │           └── MinioAdapter.java
│   │
│   ├── security/                             # Security & RBAC (cross-cutting module)
│   │   ├── domain/
│   │   │   ├── User.java
│   │   │   ├── Role.java
│   │   │   └── AuditLog.java
│   │   ├── application/
│   │   │   ├── UserService.java
│   │   │   ├── AuthenticationService.java
│   │   │   └── AuditService.java
│   │   ├── api/
│   │   │   ├── AuthenticationController.java
│   │   │   ├── UserController.java
│   │   │   ├── AuditLogController.java
│   │   │   └── dto/
│   │   └── infrastructure/
│   │       ├── persistence/
│   │       │   ├── UserRepository.java
│   │       │   ├── RoleRepository.java
│   │       │   └── AuditLogRepository.java
│   │       └── config/SecurityConfig.java
│   │
│   ├── shared/                               # Shared infrastructure (not a domain)
│   │   ├── exception/GlobalExceptionHandler.java
│   │   ├── audit/AuditLogger.java
│   │   ├── config/
│   │   └── util/
│   │
│   └── BackendApplication.java
│
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/                         # Flyway SQL migrations
│
└── src/test/java/com/wellkorea/backend/
    ├── project/
    ├── quotation/
    └── [domain-specific tests]

frontend/                                     # React application
├── src/
│   ├── components/                          # Reusable UI components
│   ├── pages/                              # Page-level components
│   ├── services/                           # API client layer
│   ├── contexts/                           # React Context (auth, theme)
│   └── App.tsx
├── tests/unit/                             # Vitest unit tests
└── e2e/                                    # Playwright E2E tests
```

**Structure Decision**: Domain-oriented modular architecture for backend. Each domain module contains all layers needed for that domain (business logic, services, APIs, database access). Frontend maintains simpler component/page structure.

**Layer Organization** (consistent across all 9 domain modules):

| Directory | Purpose | Example Files |
|-----------|---------|---------------|
| `domain/` | Business entities, enums, domain logic | `Project.java`, `ProjectStatus.java`, `JobCodeGenerator.java` |
| `application/` | Business services, use case orchestration | `ProjectService.java`, `QuotationPdfService.java` |
| `api/` | REST endpoints, request/response DTOs | `ProjectController.java`, `dto/CreateProjectRequest.java` |
| `infrastructure/persistence/` | Database repositories (JPA) | `ProjectRepository.java` |
| `infrastructure/storage/` | File storage adapters (MinIO, S3) | `MinioAdapter.java` (document module only) |

**Key Architectural Decisions**:
- **Domain isolation**: Each domain module is self-contained with clear boundaries (no cross-domain imports)
- **Consistent layering**: All 9 domains follow the same 4-layer structure (domain → application → api + infrastructure/persistence)
- **Explicit `/persistence` subfolder**: JPA repositories always under `infrastructure/persistence/` for clarity
- **Dependency direction**: `api/` and `infrastructure/` depend on `application/`; `application/` depends on `domain/`; `domain/` has zero external dependencies
- **Project is core domain**: JobCode is the unique business identifier on Project entity
- **Approval is cross-cutting domain**: Handles approval workflows for quotations and other entities (승인/결재)
- **Shared infrastructure**: Technical utilities (exceptions, config, audit logging) in `shared/` package
- **Test organization**: Tests mirror domain structure (`src/test/java/.../project/`, `.../quotation/`, etc.)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitution principles pass after design phase.

---

## Constitution Check (Post-Design Re-evaluation)

*Re-evaluated after Phase 1 design completion*

### I. Test-First Development ✅
- **Status**: PASS
- **Post-Design Evidence**:
    - OpenAPI contracts generated (`contracts/openapi.yaml`) define all REST endpoints before implementation
    - Data model entities defined with validation rules before code
    - Domain-oriented test structure mirrors domain modules (project/, quotation/, approval/, etc.)
- **No changes needed**: Design phase completed with test-first approach maintained

### II. Code Quality & Simplicity ✅
- **Status**: PASS
- **Post-Design Evidence**:
    - Domain-oriented architecture prevents "God objects"; each domain has single responsibility
    - Approval domain extracted from Quotation (reusable, focused)
    - Project entity properly modeled (JobCode as unique key, not entity name)
- **No changes needed**: Design avoids premature abstractions

### III. Comprehensive Error Handling & Observability ✅
- **Status**: PASS
- **Post-Design Evidence**:
    - OpenAPI spec defines error responses (4xx/5xx) for all endpoints
    - Audit log entity designed with immutable append-only structure
    - Approval domain tracks rejection comments for observability
- **No changes needed**: Error handling designed into contracts

### IV. User Experience Consistency & Accessibility ✅
- **Status**: PASS
- **Post-Design Evidence**:
    - REST API design follows consistent pattern (`/api/{domain}/{resource}`)
    - Data model supports all user scenarios from spec (US1-US9)
    - Frontend structure (components/pages/services) supports consistent UI patterns
- **No changes needed**: UX requirements met by design

### V. Contract Testing & Integration Reliability ✅
- **Status**: PASS
- **Post-Design Evidence**:
    - OpenAPI specification generated and versioned (`contracts/openapi.yaml`)
    - Entity relationships explicitly defined in data-model.md
    - Foreign key constraints designed to prevent data inconsistency
- **No changes needed**: Contract testing enabled by design

---

## Planning Complete

**Branch**: `001-erp-core`
**Implementation Plan**: `/home/lw/workspaces/wellkorea-erp/specs/001-erp-core/plan.md`

**Generated Artifacts**:
- ✅ `plan.md` - Implementation plan with technical context, structure decisions
- ✅ `research.md` - Architectural decisions and technology choices (updated with domain-oriented approach)
- ✅ `data-model.md` - Entity definitions with Project as core domain (updated)
- ✅ `contracts/openapi.yaml` - REST API contracts (updated):
    - Renamed `/jobcodes` → `/projects` (Project is core domain entity)
    - Added `/approvals` endpoints for Approval domain
    - Renamed all `jobcode_id` → `project_id` throughout
    - Added `ApprovalRequestResponse`, `ApprovalHistoryResponse`, `ApprovalCommentResponse` schemas
- ✅ `quickstart.md` - Development setup guide
- ✅ `CLAUDE.md` - Updated with active technologies

**Next Step**: Run `/speckit.tasks` to generate dependency-ordered implementation tasks from this plan.
