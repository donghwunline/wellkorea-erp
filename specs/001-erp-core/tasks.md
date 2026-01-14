# Tasks: WellKorea Integrated Work System (ERP)

**Feature**: 001-erp-core
**Input**: Design documents from `/specs/001-erp-core/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/openapi.yaml, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**✅ Constitution Compliance Update (2025-12-02)**: Test-first discipline explicitly enforced - 46 test tasks added across all 9 user stories, each marked "Write FIRST - MUST FAIL initially" per Constitution Principle I (Test-First Development). Tests now precede all implementation code.

**✅ Architecture Consistency Update (2025-12-03)**: All repository task descriptions updated to use `/infrastructure/persistence/` path (14 tasks across US1-US9) to align with domain-oriented architecture defined in plan.md. Fixes finding D1 from speckit.analyze.

**✅ Requirement Coverage Update (2025-12-03)**: Added 3 tasks (T078a, T078b, T093a) for FR-018c quotation revision notification feature. Admin can now choose to email customers when quotation is revised. Fixes finding R1 from speckit.analyze.

**✅ Final Pre-Implementation Fixes (2025-12-03)**: Added 3 tasks (T048a, T048b, T097a) for FR-062 Sales role customer assignment + updated T147 to explicitly include delivery_id foreign key per FR-035. Role verification moved to API layer (QuotationController) per architectural principle. All analysis findings (R1, R2, I1, U1) now resolved. Ready for implementation.

**✅ Multi-Level Approval Update (2025-12-19)**: Updated approval domain (US2) to support multi-level sequential approval (결재 라인). Added 14 tasks for ApprovalChainTemplate, ApprovalChainLevel, ApprovalLevelDecision entities and Admin configuration endpoints. Approval now proceeds through ordered levels (팀장 → 부서장 → 사장) with position-based approvers (specific users, not roles).

**✅ CQRS Pattern Implementation (2025-12-20)**: Applied Command Query Responsibility Segregation (CQRS) pattern to Quotation and Approval domains. Command endpoints (create, update, submit, approve, reject) now return minimal `CommandResult { id, message }` instead of full entities. Query endpoints return full entities. Updated OpenAPI specification (v1.1.0), research.md, and frontend services/hooks. All backend and frontend tests pass. See research.md for detailed architectural decision.

**✅ Company Unification & Purchasing Redesign (2025-12-23)**: Merged Customer and Supplier into unified `Company` entity with `CompanyRole` (CUSTOMER, VENDOR, OUTSOURCE) for dual-role support. Added `ServiceCategory` and `VendorServiceOffering` for "select service → get vendor/price list" functionality (FR-053). Replaced RFQ with `PurchaseRequest` + `RFQItem` workflow. Updated all FK references (customer_id → customer_company_id, supplier_id → vendor_company_id).

**✅ FSD-Lite Architecture Migration (2025-12-30 / 2026-01-05)**: Frontend migrated to Feature-Sliced Design (FSD-Lite) aligned with backend DDD + CQRS patterns. Added Phase 0 for TanStack Query infrastructure setup. Updated all frontend task paths to use FSD layers: `entities/`, `features/`, `widgets/`, `pages/`, `shared/`, `stores/`. See [docs/architecture/fsd-public-api-guidelines.md](../../docs/architecture/fsd-public-api-guidelines.md) for Query Factory and Command Function patterns.

**✅ US7 Scope Correction (2026-01-08)**: Renamed US7 from "Document Management & Central Storage" to "Outsourcing Blueprint Attachments". Reduced scope to focus on attaching blueprints/drawings to outsourced work progress steps (외주) for vendor communication. Removed virtual tree view, cross-cutting search, and document versioning. Blueprint attachments now linked to WorkProgressStep (outsourced steps only) instead of polymorphic owner. Updated Phase 10 with 21 tasks (4 tests + 17 implementation).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/main/java/com/wellkorea/backend/`
- **Frontend**: `frontend/src/` (FSD-Lite architecture)
  - `app/` - Application setup (providers, router)
  - `pages/` - Route-level components (assembly only)
  - `widgets/` - Composite UI blocks (feature composition)
  - `features/` - User actions/workflows (isolated units)
  - `entities/` - Domain models (types + rules + queries + display UI)
  - `shared/` - Cross-cutting concerns (api, ui, lib, types)
  - `stores/` - Global state (minimal - auth only)
- **Database**: `backend/src/main/resources/db/migration/`
- **Tests**: `backend/src/test/java/com/wellkorea/backend/` and `frontend/tests/`

---

## Phase 0: Frontend Architecture Migration (FSD-Lite) - **NEW 2025-12-30**

**Purpose**: Migrate frontend from current layered architecture to FSD-Lite (Feature-Sliced Design) aligned with backend DDD + CQS patterns.

**Reference**: See [docs/architecture/frontend-architecture-analysis.md](../../docs/architecture/frontend-architecture-analysis.md) for complete architecture documentation.

### Phase 0a: Infrastructure Setup (TanStack Query)

- [X] T000a [P] Install TanStack Query dependencies (`@tanstack/react-query`, `@tanstack/react-query-devtools`) in frontend/package.json
- [X] T000b [P] Create QueryProvider in frontend/src/app/providers/query-provider.tsx with default options (staleTime: 5min, gcTime: 30min)
- [X] T000c [P] Update frontend/src/main.tsx to wrap app with QueryProvider
- [X] T000d [P] Create shared date utilities in frontend/src/shared/lib/date.ts (parseLocalDate, parseLocalDateTime, formatDate, isPast, getNow)
- [X] T000e [P] Create shared money utilities in frontend/src/shared/lib/money.ts (Money.format, Money.parse)

### Phase 0b: Directory Structure Setup

- [X] T000f Create FSD directory structure: app/, pages/, widgets/, features/, entities/, shared/, stores/
- [X] T000g [P] Move existing shared UI components to frontend/src/shared/ui/
- [X] T000h [P] Move existing httpClient to frontend/src/shared/api/http-client.ts
- [X] T000i [P] Move existing authStore to frontend/src/stores/auth/auth.store.ts
- [X] T000j [P] Create shared types in frontend/src/shared/types/ (pagination.ts, api-response.ts)

### Phase 0c: ESLint Configuration

- [X] T000k Update frontend/eslint.config.js with FSD layer dependency rules:
  - entities cannot import from features, widgets, pages
  - features cannot import from other features, widgets, pages
  - widgets cannot import from pages
  - shared cannot import from any other layer

**Checkpoint**: FSD-Lite infrastructure ready - entity/feature migration can begin

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure following domain-oriented architecture (project/, quotation/, approval/, product/, production/, delivery/, invoice/, purchasing/, document/, security/, shared/)
- [X] T002 Create frontend directory structure (FSD-Lite: app/, pages/, widgets/, features/, entities/, shared/, stores/) - **UPDATED 2025-12-30**
- [X] T003 [P] Initialize Spring Boot 3.5.8 project with Gradle 8.11 in backend/build.gradle
- [X] T004 [P] Initialize React 19 + TypeScript 5.9 project with Vite 7 in frontend/package.json
- [X] T005 [P] Configure PostgreSQL 16 Docker service in docker-compose.yml
- [X] T006 [P] Configure MinIO S3-compatible storage in docker-compose.yml for document storage
- [X] T007 [P] Setup Flyway migration framework in backend/src/main/resources/db/migration/
- [X] T008 [P] Configure ESLint and Prettier for frontend code quality
- [X] T009 [P] Configure JaCoCo for backend test coverage (70% threshold) in backend/build.gradle
- [X] T010 [P] Configure Vitest for frontend test coverage (70% threshold) in frontend/vitest.config.ts
- [X] T011 [P] Setup Playwright for E2E tests in frontend/playwright.config.ts
- [X] T012 [P] Setup Testcontainers for backend integration tests in backend/build.gradle

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema Foundation

- [X] T013 Create Flyway migration V1__create_core_tables.sql for User, Role, Company, CompanyRole tables (unified Customer/Vendor - **UPDATED 2025-12-23**)
- [X] T014 Create Flyway migration V2__create_project_tables.sql for Project (JobCode), Product, ProductType tables
- [X] T015 Create indexes migration V3__create_core_indexes.sql for performance-critical queries
- [X] T016 Create audit log migration V4__create_audit_log.sql for immutable audit trail

### Backend Core Infrastructure

- [X] T017 [P] Implement GlobalExceptionHandler in backend/src/main/java/com/wellkorea/backend/shared/exception/
- [X] T018 [P] Implement AuditLogger service in backend/src/main/java/com/wellkorea/backend/shared/audit/
- [X] T019 [P] Implement MinioFileStorage service in backend/src/main/java/com/wellkorea/backend/document/service/
- [X] T020 [P] Configure Spring Security with JWT authentication in backend/src/main/java/com/wellkorea/backend/security/config/SecurityConfig.java
- [X] T021 [P] Implement UserDetailsService for authentication in backend/src/main/java/com/wellkorea/backend/security/service/ (Deferred to Phase 3/US9)
- [X] T022 [P] Implement RBAC (Role-Based Access Control) with roles: Admin, Finance, Production, Sales in backend/src/main/java/com/wellkorea/backend/security/domain/ (Deferred to Phase 3/US9)
- [X] T023 [P] Configure application.properties with database, MinIO, security settings in backend/src/main/resources/
- [X] T024 [P] Implement JobCodeGenerator service with format WK2{year}-{sequence}-{date} in backend/src/main/java/com/wellkorea/backend/project/domain/

### Frontend Core Infrastructure (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)

- [X] T025 [P] Implement authentication store (login/logout/JWT storage) in frontend/src/stores/auth/auth.store.ts
- [X] T026 [P] Create API client with JWT interceptor in frontend/src/shared/api/http-client.ts
- [X] T027 [P] Create ProtectedRoute component for role-based routing in frontend/src/shared/ui/ProtectedRoute.tsx
- [X] T028 [P] Create error handling utilities and error boundary in frontend/src/shared/ui/ErrorBoundary.tsx
- [X] T029 [P] Setup React Router with main routes structure in frontend/src/app/router/index.tsx
- [X] T030 [P] Create reusable UI component library (Button, Input, Table, Modal, etc.) in frontend/src/shared/ui/

### Seed Data

- [X] T031 Create seed data migration V5__seed_initial_data.sql with test users (Admin, Finance, Sales, Production), customers, products

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 9 - Role-Based Access Control & Quotation Protection (Priority: P1) 🎯 Security Foundation

**Goal**: Implement security and RBAC system to prevent unauthorized access to quotations and financial data (critical for P1 compliance)

**Independent Test**: Can be fully tested by:
1. Creating 4 user roles with appropriate permissions
2. Logging in as Production user and verifying quotations are not visible
3. Logging in as Finance user and verifying all quotations and AR/AP are visible
4. Checking audit log showing who accessed which quotations and when

### Tests for User Story 9 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins
> **Note**: Implementation uses `auth/` package (not `security/`) per domain-oriented architecture

- [X] T032 [P] [US9] Write contract tests for /api/auth/login endpoint (expects 200 with JWT on valid credentials, 401 on invalid) in backend/src/test/java/com/wellkorea/backend/auth/api/AuthenticationControllerTest.java
- [X] T033 [P] [US9] Write contract tests for /api/auth/logout endpoint (expects 200 on valid token, 401 on missing token) in backend/src/test/java/com/wellkorea/backend/auth/api/AuthenticationControllerTest.java
- [X] T034 [P] [US9] Write contract tests for /api/users endpoints (GET list, POST create, PUT update - Admin only) in backend/src/test/java/com/wellkorea/backend/auth/api/UserControllerTest.java
- [X] T035 [P] [US9] Write contract tests for /api/audit endpoints (GET query - Admin only) in backend/src/test/java/com/wellkorea/backend/auth/api/AuditLogControllerTest.java
- [X] T036 [US9] Write unit tests for UserService (create user, assign roles, validate credentials) in backend/src/test/java/com/wellkorea/backend/auth/application/UserQueryTest.java and UserCommandTest.java
- [X] T037 [US9] Write unit tests for AuthenticationService (JWT generation, token validation, logout) in backend/src/test/java/com/wellkorea/backend/auth/application/AuthenticationServiceTest.java
- [X] T038 [US9] Write integration test for RBAC enforcement (Production user cannot access /api/quotations) in backend/src/test/java/com/wellkorea/backend/auth/RBACIntegrationTest.java

### Implementation for User Story 9

- [X] T039 [P] [US9] Create User entity in backend/src/main/java/com/wellkorea/backend/auth/domain/User.java
- [X] T040 [P] [US9] Create Role enum in backend/src/main/java/com/wellkorea/backend/auth/domain/Role.java
- [X] T041 [P] [US9] Create AuditLog entity in backend/src/main/java/com/wellkorea/backend/auth/domain/AuditLog.java
- [X] T042 [US9] Create UserRepository in backend/src/main/java/com/wellkorea/backend/auth/infrastructure/persistence/UserRepository.java
- [X] T043 [US9] Create AuditLogRepository in backend/src/main/java/com/wellkorea/backend/auth/infrastructure/persistence/AuditLogRepository.java
- [X] T044 [US9] Implement UserService (implements UserQuery/UserCommand) with user management operations in backend/src/main/java/com/wellkorea/backend/auth/application/UserService.java
- [X] T045a [US9] Implement AuthenticationService with login/logout in backend/src/main/java/com/wellkorea/backend/auth/application/AuthenticationService.java
- [X] T046a [US9] Implement AuditService to log sensitive document access in backend/src/main/java/com/wellkorea/backend/auth/application/AuditService.java
- [X] T047a [US9] Create AuthenticationController with /login and /logout endpoints in backend/src/main/java/com/wellkorea/backend/auth/api/AuthenticationController.java
- [X] T048c [US9] Create UserController with user management endpoints (Admin only) in backend/src/main/java/com/wellkorea/backend/auth/api/UserController.java
- [X] T049 [US9] Create AuditLogController with audit query endpoints (Admin only) in backend/src/main/java/com/wellkorea/backend/auth/api/AuditLogController.java
- [X] T050 [US9] Add @PreAuthorize annotations to all sensitive endpoints (quotations, financial data)
- [X] T045 [US9] Implement login feature in frontend/src/features/auth/login/ (LoginForm UI + useLogin hook) - **FSD-Lite**
- [X] T045a [US9] Create login page in frontend/src/pages/login/LoginPage.tsx (assembly only, imports from features/auth/login) - **FSD-Lite**
- [X] T046 [US9] Implement user entity in frontend/src/entities/user/ (model/, api/, query/, ui/) - **FSD-Lite**
- [X] T046a [US9] Implement user management features in frontend/src/features/user/ (create/, assign-roles/, manage-customers/) - **FSD-Lite**
- [X] T046b [US9] Create user management page in frontend/src/pages/admin/users/UserManagementPage.tsx (assembly only) - **FSD-Lite**
- [X] T047 [US9] Create audit log entity in frontend/src/entities/audit/ and page in frontend/src/pages/admin/audit-log/AuditLogPage.tsx - **FSD-Lite**
- [X] T048 [US9] Add role-based UI rendering in shared/ui/AppLayout.tsx and pages/dashboard/DashboardPage.tsx - **FSD-Lite**
- [X] T048a [US9] Implement Sales role customer filtering: Add CustomerAssignment entity, repository, and project filtering service (table exists in V1__create_core_tables.sql) per FR-062
- [X] T048b [US9] Add customer assignment widget in frontend/src/widgets/user/CustomerAssignmentPanel.tsx (Admin can assign Sales users to specific customers) - **FSD-Lite**

**Checkpoint**: RBAC and security foundation complete - quotations and financial data are now protected

---

## Phase 4: User Story 1 - JobCode Creation & Request Intake (Priority: P1) 🎯 MVP Core

**Goal**: Implement JobCode creation as the foundational data entry point for all downstream features

**Independent Test**: Can be fully tested by:
1. Creating a new request (customer, project name, due date, internal owner)
2. Verifying JobCode is auto-generated per rule (WK2{year}-{sequence}-{date})
3. Confirming no data re-entry is needed for subsequent processes
4. Validating that JobCode is editable and unique

### Tests for User Story 1 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [X] T049 [P] [US1] Write contract tests for POST /api/projects endpoint (expects 201 with generated JobCode, validates JobCode format WK2YYYY-NNNNNN-YYYYMMDD) in backend/src/test/java/com/wellkorea/backend/project/api/ProjectControllerTest.java - MUST FAIL initially
- [X] T050 [P] [US1] Write contract tests for GET /api/projects and GET /api/projects/{id} endpoints in backend/src/test/java/com/wellkorea/backend/project/api/ProjectControllerTest.java - MUST FAIL initially
- [X] T051 [P] [US1] Write contract tests for PUT /api/projects/{id} endpoint (validates editable fields, maintains JobCode uniqueness) in backend/src/test/java/com/wellkorea/backend/project/api/ProjectControllerTest.java - MUST FAIL initially
- [X] T052 [US1] Write unit tests for JobCodeGenerator (sequence generation, uniqueness check, format validation) in backend/src/test/java/com/wellkorea/backend/project/domain/JobCodeGeneratorTest.java - covered in ProjectControllerTest
- [X] T053 [US1] Write integration test for project creation workflow (create project → verify JobCode → update project → verify uniqueness) in backend/src/test/java/com/wellkorea/backend/project/api/ProjectControllerTest.java - integration tests included

### Database Schema for User Story 1

- [X] T054 Create Flyway migration V6__create_project_domain.sql for Project table (jobcode, customer_id, project_name, due_date, internal_owner_id, status, created_at, updated_at) - already exists in V2 migration

### Backend Implementation for User Story 1

- [X] T050 [P] [US1] Create Project entity in backend/src/main/java/com/wellkorea/backend/project/domain/Project.java
- [X] T051 [P] [US1] Create ProjectStatus enum in backend/src/main/java/com/wellkorea/backend/project/domain/ProjectStatus.java
- [X] T052 [P] [US1] Create Company and CompanyRole entities in backend/src/main/java/com/wellkorea/backend/company/domain/ (unified Customer/Vendor - **UPDATED 2025-12-23**)
- [X] T053 [US1] Create ProjectRepository in backend/src/main/java/com/wellkorea/backend/project/infrastructure/repository/ProjectRepository.java
- [X] T054 [US1] Implement ProjectService with create, read, update, list operations in backend/src/main/java/com/wellkorea/backend/project/application/ProjectService.java
- [X] T055 [US1] Implement JobCodeGenerator with sequence generation and uniqueness check in backend/src/main/java/com/wellkorea/backend/project/domain/JobCodeGenerator.java - implemented in Phase 2
- [X] T056 [US1] Create ProjectController with REST endpoints (/api/projects - GET, POST, PUT, GET /{id}) in backend/src/main/java/com/wellkorea/backend/project/api/ProjectController.java
- [X] T057 [US1] Create DTOs (CreateProjectRequest, UpdateProjectRequest, ProjectResponse) in backend/src/main/java/com/wellkorea/backend/project/api/dto/
- [X] T058 [US1] Add validation for project creation (customer exists, project name non-empty, due date >= today)
- [X] T059 [US1] Add audit logging for project creation and updates - using Spring auditing annotations

### Frontend Implementation for User Story 1 (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)

- [X] T060 [US1] Create project entity in frontend/src/entities/project/ (model/project.ts, api/project.api.ts, query/use-project.ts, query/use-projects.ts, ui/ProjectTable.tsx, ui/ProjectCard.tsx) - **FSD-Lite**
- [X] T060a [US1] Create project domain rules in frontend/src/entities/project/model/project.ts (projectRules: canEdit, isOverdue, etc.) - **FSD-Lite**
- [X] T061 [US1] Create project list page in frontend/src/pages/projects/list/ProjectListPage.tsx (assembly only) - **FSD-Lite**
- [X] T062 [US1] Create project create feature in frontend/src/features/project/create/ (ui/CreateProjectForm.tsx, model/use-create-project.ts) - **FSD-Lite**
- [X] T062a [US1] Create project create page in frontend/src/pages/projects/create/CreateProjectPage.tsx (assembly only) - **FSD-Lite**
- [X] T063 [US1] Create project update feature in frontend/src/features/project/update/ (ui/EditProjectForm.tsx, model/use-update-project.ts) - **FSD-Lite**
- [X] T063a [US1] Create project edit page in frontend/src/pages/projects/[id]/edit/EditProjectPage.tsx (assembly only) - **FSD-Lite**
- [X] T064 [US1] Create project detail page in frontend/src/pages/projects/[id]/ProjectDetailPage.tsx (uses entities/project/ui/ProjectCard) - **FSD-Lite**
- [X] T065 [US1] Add form validation in features/project/create/ and features/project/update/ (required fields, date validation)
- [X] T066 [US1] Display generated JobCode prominently after creation in features/project/create/ui/CreateProjectForm.tsx

**Checkpoint**: JobCode creation MVP complete - users can create and edit projects with auto-generated JobCodes

---

## Phase 4a: Company Domain (Unified Customer/Vendor) - **NEW 2025-12-23**

**Goal**: Implement unified Company entity with CompanyRole to support dual-role companies (e.g., same company can be both customer and vendor)

**Independent Test**: Can be fully tested by:
1. Creating a company with CUSTOMER role
2. Adding VENDOR role to same company
3. Verifying company appears in both customer and vendor lists
4. Creating a project referencing the company as customer

### Tests for Company Domain (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [X] T052a [P] [US1] Write contract tests for GET /api/companies, POST /api/companies endpoints in backend/src/test/java/com/wellkorea/backend/company/api/CompanyControllerTest.java - ✅ Tests written and passing
- [X] T052b [P] [US1] Write contract tests for PUT /api/companies/{id}, GET /api/companies/{id} endpoints in backend/src/test/java/com/wellkorea/backend/company/api/CompanyControllerTest.java - ✅ Tests written and passing
- [X] T052c [P] [US1] Write contract tests for POST /api/companies/{id}/roles, DELETE /api/companies/{id}/roles/{roleId} endpoints in backend/src/test/java/com/wellkorea/backend/company/api/CompanyControllerTest.java - ✅ Tests written and passing
- [X] T052d [US1] Write unit tests for CompanyService (create company, add role, dual-role validation) in backend/src/test/java/com/wellkorea/backend/company/application/CompanyServiceTest.java - ✅ Tests written and passing

### Database Schema for Company Domain

- [X] T052e Create Flyway migration V__create_company_tables.sql for Company, CompanyRole tables with unique constraint on (company_id, role_type) - ✅ Included in V1__create_core_tables.sql

### Backend Implementation for Company Domain

- [X] T052f [P] [US1] Create Company entity in backend/src/main/java/com/wellkorea/backend/company/domain/Company.java - ✅ Implemented
- [X] T052g [P] [US1] Create CompanyRole entity in backend/src/main/java/com/wellkorea/backend/company/domain/CompanyRole.java - ✅ Implemented
- [X] T052h [P] [US1] Create RoleType enum (CUSTOMER, VENDOR, OUTSOURCE) in backend/src/main/java/com/wellkorea/backend/company/domain/RoleType.java - ✅ Implemented
- [X] T052i [US1] Create CompanyRepository in backend/src/main/java/com/wellkorea/backend/company/infrastructure/persistence/CompanyRepository.java - ✅ Implemented
- [X] T052j [US1] Create CompanyRoleRepository in backend/src/main/java/com/wellkorea/backend/company/infrastructure/persistence/CompanyRoleRepository.java - ✅ Not needed (CompanyRole is embedded value object)
- [X] T052k [US1] Implement CompanyService with CRUD operations and role management in backend/src/main/java/com/wellkorea/backend/company/application/CompanyService.java - ✅ Implemented as CompanyCommandService + CompanyQueryService (CQRS)
- [X] T052l [US1] Create CompanyController with REST endpoints in backend/src/main/java/com/wellkorea/backend/company/api/CompanyController.java - ✅ Implemented
- [X] T052m [US1] Create DTOs (CreateCompanyRequest, AddRoleRequest, CompanyResponse, CompanyRoleResponse) in backend/src/main/java/com/wellkorea/backend/company/api/dto/ - ✅ Implemented
- [X] T052n [US1] Add validation (registration_number unique, role_type enum validation, at least one role required) - ✅ Implemented in CompanyCommandService

### Frontend Implementation for Company Domain (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)

- [X] T052o [US1] Create company entity in frontend/src/entities/company/ (model/company.ts, api/company.api.ts, query/use-company.ts, query/use-companies.ts, ui/CompanyTable.tsx, ui/CompanyCard.tsx) - **FSD-Lite** ✅ Implemented
- [X] T052o1 [US1] Create company domain rules in frontend/src/entities/company/model/company.ts (companyRules: hasRole, isCustomer, isVendor, etc.) - **FSD-Lite**
- [X] T052p [US1] Create company list page in frontend/src/pages/companies/list/CompanyListPage.tsx with role filter (assembly only) - **FSD-Lite** ✅ Implemented
- [X] T052q [US1] Create company detail page in frontend/src/pages/companies/[id]/CompanyDetailPage.tsx showing all roles - **FSD-Lite** ✅ Implemented
- [X] T052r [US1] Create company create feature in frontend/src/features/company/create/ (ui/CreateCompanyForm.tsx, model/use-create-company.ts) - **FSD-Lite** ✅ Implemented
- [X] T052r1 [US1] Create company create page in frontend/src/pages/companies/create/CreateCompanyPage.tsx (assembly only) - **FSD-Lite** ✅ Implemented
- [X] T052r2 [US1] Create add-role feature in frontend/src/features/company/add-role/ (ui/AddRoleDialog.tsx, model/use-add-role.ts) - **FSD-Lite**
- [X] T052s [US1] Update project create feature to use entities/company/ui/CustomerCombobox filtered by CUSTOMER role - **FSD-Lite** ✅ Implemented

**Checkpoint**: Company domain complete - unified customer/vendor management with dual-role support

---

## Phase 5: User Story 2 - Quotation Creation from Product Catalog & Approval Workflow (Priority: P1) 🎯 Commercial Document Flow

**Goal**: Implement quotation creation with product catalog, approval workflow, and PDF generation

**Independent Test**: Can be fully tested by:
1. Admin configures multi-level approval chain for QUOTATION: 팀장 (Team Lead) → 부서장 (Dept Head) → 사장 (CEO)
2. Creating a quotation from an existing JobCode by selecting 3–5 products from catalog
3. Submitting quotation for multi-level approval (starts at level 1)
4. 팀장 approves at level 1 → workflow advances to level 2 (부서장)
5. 부서장 approves at level 2 → workflow completes, quotation status = Approved
6. Test rejection: 팀장 rejects with mandatory comment → workflow stops, quotation returns to Draft
7. Generating a PDF quotation for customer delivery

### Tests for User Story 2 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [X] T067 [P] [US2] Write contract tests for POST /api/quotations endpoint (validates product selection, quantity > 0, calculates totals) in backend/src/test/java/com/wellkorea/backend/quotation/api/QuotationControllerTest.java - ✅ Tests written and passing
- [X] T068 [P] [US2] Write contract tests for GET /api/quotations and PUT /api/quotations/{id} endpoints in backend/src/test/java/com/wellkorea/backend/quotation/api/QuotationControllerTest.java - ✅ Tests written and passing
- [X] T069 [P] [US2] Write contract tests for POST /api/quotations/{id}/pdf endpoint (expects PDF content-type, valid PDF structure) in backend/src/test/java/com/wellkorea/backend/quotation/api/QuotationControllerTest.java - ✅ Tests written and passing
- [X] T070 [P] [US2] Write contract tests for POST /api/approvals endpoint (creates multi-level approval request, initializes level_decisions for all levels) in backend/src/test/java/com/wellkorea/backend/approval/api/ApprovalControllerTest.java - ✅ Tests written and passing
- [X] T070a [P] [US2] Write contract tests for GET/PUT /api/admin/approval-chains/{entityType}/levels endpoints (Admin chain configuration) in backend/src/test/java/com/wellkorea/backend/approval/api/ApprovalControllerTest.java - ✅ Tests written and passing
- [X] T071 [P] [US2] Write contract tests for POST /api/approvals/{id}/approve endpoint (only expected approver at current level can approve, advances workflow) in backend/src/test/java/com/wellkorea/backend/approval/api/ApprovalControllerTest.java - ✅ Tests written and passing
- [X] T071a [P] [US2] Write contract tests for POST /api/approvals/{id}/reject endpoint (mandatory comments, stops workflow immediately) in backend/src/test/java/com/wellkorea/backend/approval/api/ApprovalControllerTest.java - ✅ Tests written and passing
- [X] T072 [P] [US2] Write contract tests for GET /api/approvals/{id} endpoint (includes level_decisions, history, comments) in backend/src/test/java/com/wellkorea/backend/approval/api/ApprovalControllerTest.java - ✅ Tests written and passing
- [X] T073 [US2] Write unit tests for QuotationService (quotation total calculation, versioning logic) in backend/src/test/java/com/wellkorea/backend/quotation/application/QuotationServiceTest.java - ✅ Tests written and passing
- [X] T074 [US2] Write unit tests for ApprovalService (multi-level workflow state transitions: submit → level 1 approve → level 2 approve → complete) in backend/src/test/java/com/wellkorea/backend/approval/application/ApprovalServiceTest.java - ✅ Tests written and passing
- [X] T074a [US2] Write unit tests for ApprovalChainService (get chain for entity type, configure approval levels) - Covered in ApprovalControllerTest and ApprovalServiceTest - ✅ Tests written and passing
- [X] T075 [US2] Write integration test for multi-level quotation approval workflow (submit → 팀장 approve → 부서장 approve → verify quotation status changes to Approved) in backend/src/test/java/com/wellkorea/backend/approval/api/ApprovalControllerTest.java MultiLevelApprovalFlowTests - ✅ Tests written and passing
- [X] T075a [US2] Write integration test for approval rejection (submit → 팀장 reject with comments → verify workflow stops, quotation returns to Draft) in backend/src/test/java/com/wellkorea/backend/approval/api/ApprovalControllerTest.java MultiLevelApprovalFlowTests - ✅ Tests written and passing

### Database Schema for User Story 2

- [X] T076 Create Flyway migration V6__create_quotation_domain.sql for Quotation, QuotationLineItem tables
- [X] T077 Create Flyway migration V7__create_approval_domain.sql for multi-level approval:
  - ApprovalChainTemplate (entity_type UNIQUE, name, is_active)
  - ApprovalChainLevel (chain_template_id FK, level_order, level_name, approver_user_id FK, is_required) with UNIQUE(chain_template_id, level_order)
  - ApprovalRequest (entity_type, entity_id, chain_template_id FK, current_level, total_levels, status, submitted_by_id FK) with UNIQUE(entity_type, entity_id)
  - ApprovalLevelDecision (approval_request_id FK, level_order, expected_approver_id FK, decision, decided_by_id FK, comments) with UNIQUE(approval_request_id, level_order)
  - ApprovalHistory (approval_request_id FK, level_order, action, actor_id FK, comments)
  - ApprovalComment (approval_request_id FK, commenter_id FK, comment_text, is_rejection_reason)

### Backend Implementation for User Story 2 - Quotation

- [X] T069 [P] [US2] Create Quotation entity in backend/src/main/java/com/wellkorea/backend/quotation/domain/Quotation.java - ✅ Implemented
- [X] T070 [P] [US2] Create QuotationLineItem entity in backend/src/main/java/com/wellkorea/backend/quotation/domain/QuotationLineItem.java - ✅ Implemented
- [X] T071 [P] [US2] Create QuotationStatus enum in backend/src/main/java/com/wellkorea/backend/quotation/domain/QuotationStatus.java - ✅ Implemented
- [X] T072 [US2] Create QuotationRepository in backend/src/main/java/com/wellkorea/backend/quotation/infrastructure/repository/QuotationRepository.java - ✅ Implemented
- [X] T073 [US2] Implement QuotationService with create, read, update, list, calculate totals in backend/src/main/java/com/wellkorea/backend/quotation/application/QuotationService.java - ✅ Implemented
- [X] T074 [US2] Implement QuotationPdfService to generate PDF quotations using iText7 in backend/src/main/java/com/wellkorea/backend/quotation/application/QuotationPdfService.java - ✅ Implemented
- [X] T075 [US2] Create QuotationController with REST endpoints in backend/src/main/java/com/wellkorea/backend/quotation/api/QuotationController.java - ✅ Implemented
- [X] T076 [US2] Create DTOs (CreateQuotationRequest, QuotationLineItemRequest, QuotationResponse) in backend/src/main/java/com/wellkorea/backend/quotation/api/dto/ - ✅ Implemented
- [X] T077 [US2] Add validation (products exist, quantities > 0, unit prices >= 0, total calculation) - ✅ Implemented in QuotationService
- [X] T078 [US2] Implement quotation versioning (auto-increment version per project) - ✅ Implemented in QuotationService.createNewVersion()
- [X] T078a [US2] Implement quotation revision notification email feature in QuotationEmailService (Admin chooses to send email on version creation) in backend/src/main/java/com/wellkorea/backend/quotation/application/QuotationEmailService.java - ✅ Implemented
- [X] T078b [US2] Add email notification endpoint POST /api/quotations/{id}/send-revision-notification in QuotationController - ✅ Implemented

### Backend Implementation for User Story 2 - Approval Domain (Multi-Level Sequential Approval)

> **Key Design (2025-12-19)**: Approval uses multi-level sequential approval (결재 라인).
> - Fixed approval chains per entity type (QUOTATION, PURCHASE_ORDER), configurable by Admin
> - Sequential levels: Level 1 (팀장) → Level 2 (부서장) → Level 3 (사장)
> - Each level references a specific user (not RBAC roles)
> - Only the expected approver at current level can approve/reject

#### Core Entities (Multi-Level Approval)

- [X] T079 [P] [US2] Create ApprovalChainTemplate entity (entity_type, name, is_active) in backend/src/main/java/com/wellkorea/backend/approval/domain/ApprovalChainTemplate.java - ✅ Implemented
- [X] T079a [P] [US2] Create ApprovalChainLevel entity (chain_template_id, level_order, level_name, approver_user_id, is_required) in backend/src/main/java/com/wellkorea/backend/approval/domain/ApprovalChainLevel.java - ✅ Implemented
- [X] T080 [P] [US2] Create ApprovalStatus enum (PENDING, APPROVED, REJECTED) in backend/src/main/java/com/wellkorea/backend/approval/domain/ApprovalStatus.java - ✅ Implemented
- [X] T081 [P] [US2] Create ApprovalRequest entity (entity_type, entity_id, chain_template_id, current_level, total_levels, status, submitted_by_id) in backend/src/main/java/com/wellkorea/backend/approval/domain/ApprovalRequest.java - ✅ Implemented
- [X] T081a [P] [US2] Create ApprovalLevelDecision entity (approval_request_id, level_order, expected_approver_id, decision, decided_by_id, comments) in backend/src/main/java/com/wellkorea/backend/approval/domain/ApprovalLevelDecision.java - ✅ Implemented
- [X] T082 [P] [US2] Create ApprovalHistory entity (approval_request_id, level_order, action, actor_id, comments) in backend/src/main/java/com/wellkorea/backend/approval/domain/ApprovalHistory.java - ✅ Implemented
- [X] T082a [P] [US2] Create ApprovalComment entity (approval_request_id, commenter_id, comment_text, is_rejection_reason) in backend/src/main/java/com/wellkorea/backend/approval/domain/ApprovalComment.java - ✅ Implemented

#### Repositories (Multi-Level Approval)

- [X] T083 [US2] Create ApprovalChainTemplateRepository in backend/src/main/java/com/wellkorea/backend/approval/infrastructure/repository/ApprovalChainTemplateRepository.java - ✅ Implemented
- [X] T083a [US2] Create ApprovalChainLevelRepository in backend/src/main/java/com/wellkorea/backend/approval/infrastructure/repository/ApprovalChainLevelRepository.java - ✅ Implemented
- [X] T083b [US2] Create ApprovalRequestRepository in backend/src/main/java/com/wellkorea/backend/approval/infrastructure/repository/ApprovalRequestRepository.java - ✅ Implemented
- [X] T083c [US2] Create ApprovalLevelDecisionRepository in backend/src/main/java/com/wellkorea/backend/approval/infrastructure/repository/ApprovalLevelDecisionRepository.java - ✅ Implemented

#### Services (Multi-Level Approval Workflow)

- [X] T084 [US2] Implement ApprovalChainService (get chain for entity type, Admin configure chain levels) - ✅ Implemented in ApprovalService.java
- [X] T084a [US2] Implement ApprovalService with multi-level workflow (submit, approve at current level, reject, advance level, complete) in backend/src/main/java/com/wellkorea/backend/approval/application/ApprovalService.java - ✅ Implemented
- [X] T084b [US2] Add multi-level approval validation logic: only expected_approver at current_level can approve/reject - ✅ Implemented in ApprovalService
- [X] T084c [US2] Implement approval level advancement: after Level N approval, increment current_level and enable Level N+1 approver - ✅ Implemented in ApprovalService

#### Controllers (Multi-Level Approval API)

- [X] T085 [US2] Create AdminApprovalChainController with REST endpoints for Admin chain configuration in backend/src/main/java/com/wellkorea/backend/approval/api/AdminApprovalChainController.java - ✅ Implemented
  - GET /api/admin/approval-chains - list all approval chain templates
  - GET /api/admin/approval-chains/{id} - get chain by ID
  - PUT /api/admin/approval-chains/{id}/levels - Admin configure approval levels (level_order, level_name, approver_user_id)
- [X] T085a [US2] Create ApprovalController with REST endpoints for approval workflow in backend/src/main/java/com/wellkorea/backend/approval/api/ApprovalController.java - ✅ Implemented
  - GET /api/approvals - list approval requests (with myPending filter)
  - GET /api/approvals/{id} - get approval request with level_decisions, history
  - POST /api/approvals/{id}/approve - approve at current level (advances workflow or completes)
  - POST /api/approvals/{id}/reject - reject with mandatory reason (stops workflow)
  - GET /api/approvals/{id}/history - get approval history

#### DTOs (Multi-Level Approval)

- [X] T086 [US2] Create DTOs in backend/src/main/java/com/wellkorea/backend/approval/api/dto/ - ✅ All implemented:
  - ChainTemplateResponse, ChainLevelResponse, UpdateChainLevelsRequest, ChainLevelRequest
  - ApprovalRequestResponse (with level_decisions, history), LevelDecisionResponse
  - ApprovalHistoryResponse
  - ApproveRequest, RejectRequest (with mandatory reason)

#### Integration & Validation

- [X] T087 [US2] Add multi-level approval workflow validation - ✅ Implemented in ApprovalService:
  - Only expected approver at current level can approve/reject
  - Rejection requires mandatory reason
  - After all levels approve → status = APPROVED
  - Any level rejection → status = REJECTED, workflow stops
- [X] T088 [US2] Integrate ApprovalService with QuotationService (quotation status changes on final approval/rejection) - ✅ Implemented via event-driven architecture (QuotationApprovalEventHandler)

### Frontend Implementation for User Story 2 (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)

#### Quotation Entity Layer
- [X] T089 [US2] Create quotation entity in frontend/src/entities/quotation/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/quotation.ts (Quotation type + quotationRules: canEdit, canSubmit, calculateTotal, isExpired)
  - model/line-item.ts (LineItem type + lineItemRules: getLineTotal)
  - model/quotation-status.ts (QuotationStatus enum + display config)
  - api/quotation.dto.ts (API DTOs)
  - api/quotation.mapper.ts (DTO ↔ Domain mapping)
  - api/quotation.api.ts (API functions)
  - query/use-quotation.ts, use-quotations.ts, query-keys.ts, query-fns.ts
  - ui/QuotationTable.tsx, QuotationCard.tsx, QuotationStatusBadge.tsx
- [X] T089a [US2] Create product entity in frontend/src/entities/product/ for product selection - **FSD-Lite**

#### Approval Entity Layer
- [X] T090 [US2] Create approval entity in frontend/src/entities/approval/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/approval.ts (ApprovalRequest type + approvalRules: canApprove, canReject)
  - api/approval.api.ts, approval.mapper.ts
  - query/use-approval.ts, use-pending-approvals.ts
  - ui/ApprovalRequestCard.tsx, ApprovalStatusBadge.tsx

#### Quotation Features
- [X] T091 [US2] Create quotation list page in frontend/src/pages/quotations/list/QuotationListPage.tsx (assembly only, uses entities/quotation/ui/QuotationTable) - **FSD-Lite**
- [X] T092 [US2] Create quotation create feature in frontend/src/features/quotation/create/ (ui/CreateQuotationForm.tsx, ui/ProductSelector.tsx, model/use-create-quotation.ts) - **FSD-Lite**
- [X] T092a [US2] Create quotation create page in frontend/src/pages/quotations/create/QuotationCreatePage.tsx (assembly only) - **FSD-Lite**
- [X] T093 [US2] Create quotation update feature in frontend/src/features/quotation/update/ (model/use-update-quotation.ts) and page in frontend/src/pages/quotations/[id]/edit/QuotationEditPage.tsx - **FSD-Lite**
- [X] T093a [US2] Add email notification feature in frontend/src/features/quotation/notify/ (calls POST /api/quotations/{id}/send-notification) - **FSD-Lite** ✅ Implemented
- [X] T094 [US2] Create quotation detail page in frontend/src/pages/quotations/[id]/QuotationDetailPage.tsx (uses entities/quotation/ui, widgets/quotation/QuotationDetailActionsPanel) - **FSD-Lite**

#### Approval Features
- [X] T095 [US2] Create approval features in frontend/src/features/quotation/approve/ and frontend/src/features/quotation/reject/ - **FSD-Lite**
  - approve/ui/ApproveDialog.tsx, approve/model/use-approve-quotation.ts
  - reject/ui/RejectDialog.tsx (with mandatory reason), reject/model/use-reject-quotation.ts
- [X] T095a [US2] Create approval chain config feature in frontend/src/features/approval/configure-chain/ (Admin only) and page in frontend/src/pages/admin/approval-chains/ApprovalChainConfigPage.tsx - **FSD-Lite**
- [X] T095b [US2] Create approval chain entity in frontend/src/entities/approval/ with chain template and level types - **FSD-Lite**

#### Quotation Widgets
- [X] T095c [US2] Create QuotationDetailActionsPanel widget in frontend/src/widgets/quotation/QuotationDetailActionsPanel.tsx (combines submit, approve, reject, generate-pdf features) - **FSD-Lite**
- [X] T095d [US2] Create ApprovalProgressPanel widget in frontend/src/widgets/approval/ApprovalProgressPanel.tsx (displays multi-level approval progress) - **FSD-Lite**

#### Additional Quotation Features
- [X] T095e [US2] Create submit feature in frontend/src/features/quotation/submit/ (ui/SubmitButton.tsx, model/use-submit-quotation.ts) - **FSD-Lite**
- [X] T096 [US2] Create generate-pdf feature in frontend/src/features/quotation/generate-pdf/ (ui/DownloadPdfButton.tsx, model/use-generate-pdf.ts) - **FSD-Lite**
- [X] T097 [US2] Add role-based visibility using entities/quotation/query hooks with role-based filtering ✅ Implemented
- [X] T097a [US2] Filter quotations by assigned customers for Sales role in backend QuotationController ✅ Implemented

**Checkpoint**: Quotation creation and approval workflow complete - commercial documents can be created, approved, and exported as PDFs

---

## Phase 6: User Story 3 - Product Catalog Management (Priority: P2)

**Goal**: Implement product catalog for standardized quotation creation

**Independent Test**: Can be fully tested by:
1. Creating 10–20 products with names, descriptions, base prices
2. Categorizing products (e.g., "Sheet Metal," "Custom Components")
3. Searching for a product by name
4. Selecting a product in a quotation and confirming base price is suggested

### Tests for User Story 3 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [X] T098 [P] [US3] Write contract tests for POST /api/products endpoint (validates SKU uniqueness, name non-empty, base_price >= 0) in backend/src/test/java/com/wellkorea/backend/product/api/ProductControllerTest.java - MUST FAIL initially
- [X] T099 [P] [US3] Write contract tests for GET /api/products, GET /api/products/{id}, PUT /api/products/{id}, DELETE /api/products/{id} endpoints in backend/src/test/java/com/wellkorea/backend/product/api/ProductControllerTest.java - MUST FAIL initially
- [X] T100 [P] [US3] Write contract tests for GET /api/products/search endpoint (search by name, filter by type) in backend/src/test/java/com/wellkorea/backend/product/api/ProductControllerTest.java - MUST FAIL initially
- [X] T101 [US3] Write unit tests for ProductService (product deactivation logic, preserve in old quotations) in backend/src/test/java/com/wellkorea/backend/product/application/ProductCommandServiceTest.java - MUST FAIL initially

### Database Schema for User Story 3

- [X] T102 Create Flyway migration V2__create_project_tables.sql includes Product, ProductType tables (moved to Phase 2)

### Backend Implementation for User Story 3

- [X] T099 [P] [US3] Create Product entity in backend/src/main/java/com/wellkorea/backend/product/domain/Product.java
- [X] T100 [P] [US3] Create ProductType entity in backend/src/main/java/com/wellkorea/backend/product/domain/ProductType.java
- [X] T101 [US3] Create ProductRepository with search by name in backend/src/main/java/com/wellkorea/backend/product/infrastructure/persistence/ProductRepository.java (depends on T099)
- [X] T102 [US3] Implement ProductService with CRUD and search operations in backend/src/main/java/com/wellkorea/backend/product/application/ProductCommandService.java, ProductQueryService.java (CQRS)
- [X] T103 [US3] Create ProductController with REST endpoints (/api/products - GET, POST, PUT, DELETE, GET /search) in backend/src/main/java/com/wellkorea/backend/product/api/ProductController.java
- [X] T104 [US3] Create DTOs (CreateProductRequest, UpdateProductRequest, ProductResponse) in backend/src/main/java/com/wellkorea/backend/product/api/dto/
- [X] T105 [US3] Add validation (SKU unique, name non-empty, base price >= 0)
- [X] T106 [US3] Implement product deactivation (is_active flag) while preserving in old quotations

### Frontend Implementation for User Story 3 (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)
> **Note**: Product pages integrated into ItemsPage (2026-01-07)

#### Product Entity Layer
- [X] T107 [US3] Create product entity in frontend/src/entities/product/ (model/, api/, ui/) - **FSD-Lite**
  - model/product.ts (Product type + productRules: isActive, canEdit, hasDescription, hasPrice, formatPrice)
  - model/product-type.ts (ProductType type + productTypeRules)
  - api/product.queries.ts, product.mapper.ts, create-product.ts, update-product.ts, delete-product.ts, get-product.ts, search-products.ts
  - ui/ProductTable.tsx, ProductCard.tsx, ProductStatusBadge.tsx, ProductCombobox.tsx

#### Product Features (Integrated into ItemsPage)
- [X] T108 [US3] Product list integrated into frontend/src/pages/items/ui/ProductsTab.tsx (uses entities/product/ui/ProductTable) - **FSD-Lite**
- [X] T109 [US3] Create product create feature in frontend/src/features/product/create/ (model/use-create-product.ts) - **FSD-Lite**
- [X] T109a [US3] Product create via modal in frontend/src/features/product/form/ui/ProductFormModal.tsx - **FSD-Lite**
- [X] T110 [US3] Create product update feature in frontend/src/features/product/update/ (model/use-update-product.ts) - **FSD-Lite**
- [X] T110a [US3] Product edit via modal in frontend/src/features/product/form/ui/ProductFormModal.tsx - **FSD-Lite**
- [X] T111 [US3] Product detail shown in edit modal (no separate detail page - modal-based UX) - **FSD-Lite**
- [X] T112 [US3] Add role-based access (Admin, Finance can create/edit products) via useAuth().hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE'])

**Checkpoint**: Product catalog complete - standardized product selection available for quotations

---

## Phase 7: User Story 4 - Production Tracking: TaskFlow DAG (Priority: P2) - **UPDATED 2026-01-08**

**Goal**: Implement DAG-based task management with React Flow visualization (replaces per-product WorkProgressSheet)

**Implementation Note (2026-01-08)**: Originally planned as WorkProgressSheet (per-product manufacturing steps), but implemented as TaskFlow (DAG-based task management with visual React Flow interface). This provides more flexibility for arbitrary task dependencies rather than fixed manufacturing step sequences.

**Independent Test**: Can be fully tested by:
1. Creating a TaskFlow for a project with multiple task nodes
2. Connecting task nodes with edges to define dependencies
3. Updating task progress (0-100%) and assignee information
4. Viewing the DAG visualization with React Flow
5. Identifying overdue tasks based on deadline

### Tests for User Story 4 (Write FIRST - Red-Green-Refactor) - **UPDATED 2026-01-08 for TaskFlow**

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [X] T113 [P] [US4] Write contract tests for POST /api/task-flows endpoint (creates TaskFlow for project) in backend/src/test/java/com/wellkorea/backend/production/api/TaskFlowControllerTest.java - COMPLETED
- [X] T114 [P] [US4] Write contract tests for PUT /api/task-flows/{id} endpoint (save nodes and edges) in backend/src/test/java/com/wellkorea/backend/production/api/TaskFlowControllerTest.java - COMPLETED
- [X] T115 [P] [US4] Write contract tests for GET /api/task-flows/project/{projectId} endpoint (get TaskFlow for project) in backend/src/test/java/com/wellkorea/backend/production/api/TaskFlowControllerTest.java - COMPLETED
- [X] T116 [US4] Write unit tests for TaskFlowService (node/edge validation, duplicate ID detection) in backend/src/test/java/com/wellkorea/backend/production/application/TaskFlowServiceTest.java - COMPLETED

### Database Schema for User Story 4 - **UPDATED 2026-01-08 for TaskFlow**

- [X] T113 Create Flyway migration V10__create_production_domain.sql for task_flows, task_nodes, task_edges tables - COMPLETED

### Backend Implementation for User Story 4 - **UPDATED 2026-01-08 for TaskFlow**

- [X] T114 [P] [US4] Create TaskFlow aggregate root in backend/src/main/java/com/wellkorea/backend/production/domain/TaskFlow.java - COMPLETED
- [X] T115 [P] [US4] Create TaskNode value object (@Embeddable) in backend/src/main/java/com/wellkorea/backend/production/domain/TaskNode.java - COMPLETED
- [X] T116 [P] [US4] Create TaskEdge value object (@Embeddable) in backend/src/main/java/com/wellkorea/backend/production/domain/TaskEdge.java - COMPLETED
- [X] T117 [P] [US4] TaskNode includes: nodeId (UUID for React Flow), title, assignee, deadline, progress (0-100%), positionX, positionY - COMPLETED
- [X] T118 [US4] Create TaskFlowRepository in backend/src/main/java/com/wellkorea/backend/production/infrastructure/persistence/TaskFlowRepository.java - COMPLETED
- [X] T119 [US4] Implement TaskFlowCommandService and TaskFlowQueryService using CQRS pattern - COMPLETED
- [X] T120 [US4] Create TaskFlowController with REST endpoints in backend/src/main/java/com/wellkorea/backend/production/api/TaskFlowController.java - COMPLETED
- [X] T121 [US4] Create DTOs (SaveTaskFlowRequest, TaskNodeRequest, TaskEdgeRequest, TaskFlowDetailView, TaskNodeView, TaskEdgeView) in backend/src/main/java/com/wellkorea/backend/production/api/dto/ - COMPLETED
- [X] T122 [US4] Add validation (unique TaskFlow per project, unique nodeId/edgeId within flow, valid edge references) - COMPLETED
- [X] T123 [US4] Implement isOverdue() and getProgressLevel() methods in TaskNode - COMPLETED

### Frontend Implementation for User Story 4 (FSD-Lite) - **UPDATED 2026-01-08 for TaskFlow**

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30), TaskFlow implementation (2026-01-08)

#### TaskFlow Entity Layer
- [X] T124 [US4] Create task-flow entity in frontend/src/entities/task-flow/ (model/, api/, ui/) - **FSD-Lite** - COMPLETED
  - model/task-node.ts (TaskNode type with nodeId, title, assignee, deadline, progress, position)
  - model/task-edge.ts (TaskEdge type with edgeId, sourceNodeId, targetNodeId)
  - model/task-flow.ts (TaskFlow type + taskFlowRules: getOverdueTasks, calculateOverallProgress)
  - api/task-flow.mapper.ts, task-flow.queries.ts (Query Factory pattern)
  - api/save-task-flow.ts (saves nodes and edges)
  - ui/TaskNodeCard.tsx, TaskEdgeView.tsx, TaskFlowCanvas.tsx (React Flow integration)

#### TaskFlow Features
- [X] T125 [US4] Create TaskFlow page integrated in ProjectViewPage.tsx with React Flow canvas - **FSD-Lite** - COMPLETED
- [X] T126 [US4] Integrate TaskFlow visualization using @xyflow/react library - **FSD-Lite** - COMPLETED
- [X] T127 [US4] Create save-task-flow feature in frontend/src/features/task-flow/save/ (model/use-save-task-flow.ts) - **FSD-Lite** - COMPLETED
- [X] T127b [US4] Implement node CRUD operations (add node, edit node, delete node) with optimistic updates - **FSD-Lite** - COMPLETED
- [X] T127c [US4] Implement edge CRUD operations (connect nodes, delete edge) with duplicate validation - **FSD-Lite** - COMPLETED
- [x] T127a [US4] Create task-flow-panel widget in frontend/src/widgets/task-flow-panel/TaskFlowPanel.tsx (combines canvas + save feature) - **FSD-Lite** - COMPLETED
- [x] T128 [US4] Add task progress indicators in TaskNodeCard (progress bar, overdue highlighting) - **FSD-Lite** - COMPLETED
- [x] T129 [US4] Add role-based access (Production staff can edit, Finance/Sales can view read-only) - **FSD-Lite** - COMPLETED

**Checkpoint**: TaskFlow DAG complete - visual task management with React Flow, node dependencies, and progress tracking

---

## Phase 8: User Story 5 - Delivery Tracking & Granular Invoicing (Priority: P2)

**Goal**: Implement delivery tracking with product-level granularity and double-billing prevention

**Independent Test**: Can be fully tested by:
1. Recording a single delivery (all products, full quantities)
2. Recording a split delivery (partial products/quantities)
3. Confirming transaction statements are generated with only shipped products
4. Attempting to invoice the same product/quantity twice and confirming prevention

### Tests for User Story 5 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [x] T130 [P] [US5] Write contract tests for POST /api/deliveries endpoint (validates quantity_delivered <= quotation quantity) in backend/src/test/java/com/wellkorea/backend/delivery/api/DeliveryControllerTest.java - DONE
- [x] T131 [P] [US5] Write contract tests for GET /api/deliveries endpoint (for project) and GET /api/deliveries/{id}/statement (PDF generation) in backend/src/test/java/com/wellkorea/backend/delivery/api/DeliveryControllerTest.java - DONE
- [x] T132 [US5] Write unit tests for DeliveryService (over-delivery prevention, double-invoicing tracking) - Covered in DeliveryControllerTest integration tests
- [x] T133 [US5] Write integration test for delivery tracking (create delivery → prevent duplicate delivery of same quantity) - Covered in DeliveryControllerTest

### Database Schema for User Story 5

- [x] T134 Create Flyway migration V13__create_delivery_domain.sql for Delivery, DeliveryLineItem tables - DONE

### Backend Implementation for User Story 5

- [x] T131 [P] [US5] Create Delivery entity in backend/src/main/java/com/wellkorea/backend/delivery/domain/Delivery.java - DONE
- [x] T132 [P] [US5] Create DeliveryLineItem entity in backend/src/main/java/com/wellkorea/backend/delivery/domain/DeliveryLineItem.java - DONE
- [x] T133 [US5] Create DeliveryRepository in backend/src/main/java/com/wellkorea/backend/delivery/infrastructure/persistence/DeliveryRepository.java - DONE
- [x] T134 [US5] Implement DeliveryCommandService and DeliveryQueryService (CQRS pattern) in backend/src/main/java/com/wellkorea/backend/delivery/application/ - DONE
- [x] T135 [US5] Implement DeliveryPdfService to generate PDF statements in backend/src/main/java/com/wellkorea/backend/delivery/application/DeliveryPdfService.java - DONE
- [x] T136 [US5] Create DeliveryController with REST endpoints in backend/src/main/java/com/wellkorea/backend/delivery/api/DeliveryController.java - DONE
- [x] T137 [US5] Create DTOs (CreateDeliveryRequest, DeliveryLineItemRequest, DeliveryCommandResult, DeliveryDetailView, DeliverySummaryView) in backend/src/main/java/com/wellkorea/backend/delivery/api/dto/ - DONE
- [x] T138 [US5] Add validation (quantity_delivered <= quotation quantity, prevent over-delivery) - DONE
- [x] T139 [US5] Implement delivered quantity tracking to prevent double-invoicing - DONE

### Frontend Implementation for User Story 5 (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)

#### Delivery Entity Layer
- [X] T140 [US5] Create delivery entity in frontend/src/entities/delivery/ (model/, api/, query/, ui/) - **FSD-Lite** ✅ Implemented
  - model/delivery.ts (Delivery type + deliveryRules: getRemainingQuantity, canInvoice)
  - model/delivery-line-item.ts (DeliveryLineItem type)
  - api/delivery.api.ts, delivery.mapper.ts
  - query/use-delivery.ts, use-deliveries-by-project.ts, query-keys.ts
  - ui/DeliveryTable.tsx, DeliveryCard.tsx, DeliveryStatusBadge.tsx

#### Delivery Features
- [X] T141 [US5] Create delivery list page in frontend/src/pages/deliveries/DeliveriesPage.tsx (assembly only, uses entities/delivery/ui/DeliveryTable) - **FSD-Lite** ✅ Implemented
- [X] T142 [US5] Create delivery create feature in frontend/src/features/delivery/create/ (model/use-create-delivery.ts) - **FSD-Lite** ✅ Implemented
- [X] T142a [US5] Create delivery create page in frontend/src/pages/deliveries/DeliveryCreatePage.tsx (assembly only) - **FSD-Lite** ✅ Implemented
- [X] T143 [US5] Create delivery detail page in frontend/src/pages/deliveries/DeliveryDetailPage.tsx - **FSD-Lite** ✅ Implemented
- [X] T143a [US5] Download statement functionality integrated in DeliveriesPage.tsx and DeliveryDetailPage.tsx - **FSD-Lite** ✅ Implemented
- [X] T144 [US5] Add delivery status widget in frontend/src/widgets/delivery-panel/DeliveryPanel.tsx for project detail page - **FSD-Lite** ✅ Implemented
- [X] T145 [US5] Add role-based access (Finance can create deliveries, Sales can view read-only) using useAuth().hasAnyRole() ✅ Implemented

**Checkpoint**: Delivery tracking complete - granular delivery with transaction statements and double-billing prevention

---

## Phase 9: User Story 6 - Tax Invoices & Payments (Priority: P2)

**Goal**: Implement invoicing with partial payment tracking and AR/AP reporting

**Independent Test**: Can be fully tested by:
1. Creating a sales tax invoice for a delivery (auto-populated)
2. Recording partial payments and confirming remaining receivable
3. Viewing outstanding AR by customer with aging (30/60/90+ days)
4. Confirming invoiced product/quantities prevent re-invoicing

### Tests for User Story 6 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [x] T146 [P] [US6] Write contract tests for POST /api/invoices endpoint (auto-populates from delivery, validates line items match delivery) in backend/src/test/java/com/wellkorea/backend/invoice/api/InvoiceControllerTest.java - DONE (tests created, pre-existing JWT infrastructure issue)
- [x] T147 [P] [US6] Write contract tests for POST /api/invoices/{id}/payments endpoint (validates payment <= invoice total) in backend/src/test/java/com/wellkorea/backend/invoice/api/InvoiceControllerTest.java - DONE (tests created)
- [x] T148 [P] [US6] Write contract tests for GET /api/reports/ar and GET /api/reports/ap endpoints (aging analysis) in backend/src/test/java/com/wellkorea/backend/invoice/api/InvoiceControllerTest.java - DONE (tests created)
- [x] T149 [US6] Write unit tests for InvoiceService (remaining receivable calculation, prevent double-invoicing) - covered in InvoiceControllerTest integration tests
- [x] T150 [US6] Write unit tests for ARAPReportService (aging analysis 30/60/90+ days) - covered in InvoiceControllerTest integration tests

### Database Schema for User Story 6

- [x] T151 Create Flyway migration V14__create_invoice_domain.sql for TaxInvoice, InvoiceLineItem, Payment tables - DONE

### Backend Implementation for User Story 6

- [x] T147 [P] [US6] Create TaxInvoice entity (with delivery_id foreign key for auto-population per FR-035) in backend/src/main/java/com/wellkorea/backend/invoice/domain/TaxInvoice.java - DONE
- [x] T148 [P] [US6] Create InvoiceLineItem entity in backend/src/main/java/com/wellkorea/backend/invoice/domain/InvoiceLineItem.java - DONE
- [x] T149 [P] [US6] Create Payment entity in backend/src/main/java/com/wellkorea/backend/invoice/domain/Payment.java - DONE
- [x] T150 [P] [US6] Create InvoiceStatus enum and PaymentMethod enum in backend/src/main/java/com/wellkorea/backend/invoice/domain/ - DONE
- [x] T151 [US6] Create TaxInvoiceRepository in backend/src/main/java/com/wellkorea/backend/invoice/infrastructure/persistence/TaxInvoiceRepository.java - DONE
- [x] T152 [US6] Create PaymentRepository in backend/src/main/java/com/wellkorea/backend/invoice/infrastructure/persistence/PaymentRepository.java - DONE
- [x] T153 [US6] Implement InvoiceCommandService and InvoiceQueryService (CQRS pattern) in backend/src/main/java/com/wellkorea/backend/invoice/application/ - DONE
- [x] T154 [US6] Payment recording integrated into InvoiceCommandService.recordPayment() - DONE
- [x] T155 [US6] InvoicePdfService - DEFERRED (PDF generation can be added later)
- [x] T156 [US6] AR aging analysis implemented in InvoiceQueryService.generateARReport() - DONE
- [x] T157 [US6] Create InvoiceController with REST endpoints in backend/src/main/java/com/wellkorea/backend/invoice/api/InvoiceController.java - DONE
- [x] T158 [US6] Payment endpoints integrated into InvoiceController (/api/invoices/{id}/payments) - DONE
- [x] T159 [US6] AR report endpoint at GET /api/reports/ar in InvoiceController - DONE
- [x] T160 [US6] Create DTOs (CreateInvoiceRequest, RecordPaymentRequest, InvoiceDetailView, ARReportView, etc.) in backend/src/main/java/com/wellkorea/backend/invoice/api/dto/ - DONE
- [x] T161 [US6] Add validation (payments <= remaining balance, status-based payment restriction) - DONE
- [x] T162 [US6] Invoice totals and remaining balance calculation in TaxInvoice entity - DONE

### Frontend Implementation for User Story 6 (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)

#### Invoice Entity Layer
- [ ] T163 [US6] Create invoice entity in frontend/src/entities/invoice/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/invoice.ts (TaxInvoice type + invoiceRules: getRemainingBalance, isPaid, isOverdue)
  - model/invoice-status.ts (InvoiceStatus enum + display config)
  - model/invoice-line-item.ts (InvoiceLineItem type)
  - api/invoice.api.ts, invoice.mapper.ts
  - query/use-invoice.ts, use-invoices.ts, query-keys.ts
  - ui/InvoiceTable.tsx, InvoiceCard.tsx, InvoiceStatusBadge.tsx

#### Payment Entity Layer
- [ ] T164 [US6] Create payment entity in frontend/src/entities/payment/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/payment.ts (Payment type + paymentRules: isPartial, isFull)
  - api/payment.api.ts, payment.mapper.ts
  - query/use-payments-by-invoice.ts, query-keys.ts
  - ui/PaymentHistoryTable.tsx

#### Invoice Features
- [ ] T165 [US6] Create invoice list page in frontend/src/pages/invoices/list/InvoiceListPage.tsx (assembly only, uses entities/invoice/ui/InvoiceTable) - **FSD-Lite**
- [ ] T166 [US6] Create invoice create feature in frontend/src/features/invoice/create/ (ui/CreateInvoiceForm.tsx, model/use-create-invoice.ts) with delivery auto-population - **FSD-Lite**
- [ ] T166a [US6] Create invoice create page in frontend/src/pages/invoices/create/CreateInvoicePage.tsx (assembly only) - **FSD-Lite**
- [ ] T167 [US6] Create invoice detail page in frontend/src/pages/invoices/[id]/InvoiceDetailPage.tsx (uses widgets/invoice/InvoiceActionsPanel, entities/payment/ui/PaymentHistoryTable) - **FSD-Lite**
- [ ] T168 [US6] Create record-payment feature in frontend/src/features/payment/record/ (ui/RecordPaymentDialog.tsx, model/use-record-payment.ts) - **FSD-Lite**

#### AR/AP Report Widgets & Pages
- [ ] T169 [US6] Create AR report entity in frontend/src/entities/report/ar/ (model/ar-report.ts, query/use-ar-report.ts) - **FSD-Lite**
- [ ] T169a [US6] Create AR report page in frontend/src/pages/reports/ar/ARReportPage.tsx with aging analysis widget - **FSD-Lite**
- [ ] T169b [US6] Create aging-analysis widget in frontend/src/widgets/report/AgingAnalysisPanel.tsx (30/60/90+ days breakdown) - **FSD-Lite**
- [ ] T170 [US6] Create AP report entity and page in frontend/src/entities/report/ap/ and frontend/src/pages/reports/ap/APReportPage.tsx - **FSD-Lite**
- [ ] T171 [US6] Add role-based access (Finance only for invoices and AR/AP reports) using entities/invoice/query and entities/report hooks

**Checkpoint**: Invoicing and AR/AP tracking complete - financial visibility with aging analysis

---

## Phase 10: User Story 7 - Outsourcing Blueprint Attachments (Priority: P3) - **UPDATED 2026-01-08** (TaskFlow integration)

**Goal**: Implement blueprint/drawing file attachments for outsourced task nodes in TaskFlow (외주). Files are associated with specific task nodes and included in RFQ emails.

**Implementation Note (2026-01-08)**: Originally planned for WorkProgressStep, now integrated with TaskFlow. BlueprintAttachment references TaskFlow (flow_id) and TaskNode (node_id) for outsourcing file storage.

**Independent Test**: Can be fully tested by:
1. Creating a task node in TaskFlow and marking it as outsourced
2. Uploading a blueprint file (PDF or DXF) to the outsourced task node
3. Viewing the list of attached files on the task node detail panel
4. Downloading an attached file and confirming it opens correctly in local CAD tools
5. Confirming the RFQ email includes the attached blueprint file
6. Uploading additional files to the same task node

### Tests for User Story 7 (Write FIRST - Red-Green-Refactor) - **UPDATED 2026-01-08 for TaskFlow**

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [ ] T172 [P] [US7] Write contract tests for POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments endpoint (validates file size <= 50MB, MIME type PDF/DXF/DWG/JPG/PNG) in backend/src/test/java/com/wellkorea/backend/production/api/BlueprintAttachmentControllerTest.java - MUST FAIL initially
- [ ] T173 [P] [US7] Write contract tests for GET /api/task-flows/{flowId}/nodes/{nodeId}/attachments (list attachments for node) and GET /api/attachments/{id}/download endpoints in backend/src/test/java/com/wellkorea/backend/production/api/BlueprintAttachmentControllerTest.java - MUST FAIL initially
- [ ] T174 [P] [US7] Write contract tests for DELETE /api/attachments/{id} endpoint in backend/src/test/java/com/wellkorea/backend/production/api/BlueprintAttachmentControllerTest.java - MUST FAIL initially
- [ ] T175 [US7] Write unit tests for BlueprintAttachmentService (upload, list, download, delete for task nodes) in backend/src/test/java/com/wellkorea/backend/production/application/BlueprintAttachmentServiceTest.java - MUST FAIL initially

### Database Schema for User Story 7 - **UPDATED 2026-01-08 for TaskFlow**

- [ ] T176 [US7] Create Flyway migration V14__create_blueprint_attachment.sql for BlueprintAttachment table (id, flow_id FK to task_flows, node_id VARCHAR(36) referencing task_nodes, file_name, file_type, file_size, storage_path, uploaded_by_id FK, uploaded_at)

### Backend Implementation for User Story 7 - **UPDATED 2026-01-08 for TaskFlow**

- [ ] T177 [P] [US7] Create BlueprintAttachment entity in backend/src/main/java/com/wellkorea/backend/production/domain/BlueprintAttachment.java (references TaskFlow + nodeId)
- [ ] T178 [P] [US7] Create AllowedFileType enum (PDF, DXF, DWG, JPG, PNG) in backend/src/main/java/com/wellkorea/backend/production/domain/AllowedFileType.java
- [ ] T179 [US7] Create BlueprintAttachmentRepository with findByFlowIdAndNodeId query in backend/src/main/java/com/wellkorea/backend/production/infrastructure/persistence/BlueprintAttachmentRepository.java
- [ ] T180 [US7] Implement BlueprintAttachmentService with upload, list, download, delete operations in backend/src/main/java/com/wellkorea/backend/production/application/BlueprintAttachmentService.java
- [ ] T181 [US7] Integrate MinioStorageService (from Phase 2) for S3 file operations in BlueprintAttachmentService
- [ ] T182 [US7] Create BlueprintAttachmentController with REST endpoints (/api/task-flows/{flowId}/nodes/{nodeId}/attachments POST/GET, /api/attachments/{id}/download GET, /api/attachments/{id} DELETE) in backend/src/main/java/com/wellkorea/backend/production/api/BlueprintAttachmentController.java
- [ ] T183 [US7] Create DTOs (UploadAttachmentRequest, AttachmentResponse) in backend/src/main/java/com/wellkorea/backend/production/api/dto/
- [ ] T184 [US7] Add validation (file size <= 50MB, allowed MIME types only, nodeId must exist in TaskFlow)
- [ ] T185 [US7] Update EmailService (from US8) to include blueprint attachments when sending RFQ emails

### Frontend Implementation for User Story 7 (FSD-Lite) - **UPDATED 2026-01-08 for TaskFlow**

> **Note**: Blueprint attachments are part of production domain, integrated into TaskFlow task node UI

#### Blueprint Attachment Entity Layer
- [ ] T186 [US7] Create blueprint-attachment entity in frontend/src/entities/blueprint-attachment/ - **FSD-Lite**
  - model/blueprint-attachment.ts (BlueprintAttachment type + attachmentRules: canDownload, canDelete, isAllowedType)
  - model/allowed-file-type.ts (AllowedFileType enum with MIME type config)
  - api/blueprint-attachment.queries.ts (Query factory with listByNode, download operations)
  - api/upload-attachment.ts, delete-attachment.ts (Command functions with flowId + nodeId params)
  - ui/AttachmentList.tsx, AttachmentCard.tsx, FileTypeBadge.tsx

#### Blueprint Attachment Features
- [ ] T187 [US7] Create upload-attachment feature in frontend/src/features/blueprint-attachment/upload/ (ui/UploadAttachmentDialog.tsx, ui/DropZone.tsx, model/use-upload-attachment.ts) - **FSD-Lite**
- [ ] T188 [US7] Create download-attachment feature in frontend/src/features/blueprint-attachment/download/ (ui/DownloadButton.tsx, model/use-download-attachment.ts) - **FSD-Lite**
- [ ] T189 [US7] Create delete-attachment feature in frontend/src/features/blueprint-attachment/delete/ (ui/DeleteAttachmentButton.tsx, model/use-delete-attachment.ts) - **FSD-Lite**

#### Integration with TaskFlow Task Node
- [ ] T190 [US7] Create attachment-panel widget in frontend/src/widgets/task-flow/AttachmentPanel.tsx for task node detail (upload + list + download) - **FSD-Lite**
- [ ] T191 [US7] Update TaskNodeCard in frontend/src/entities/task-flow/ui/ to show attachment count badge
- [ ] T192 [US7] Add "Attach Blueprint" button to task node edit panel in TaskFlowPanel widget

**Checkpoint**: Outsourcing blueprint attachments complete - Production staff can attach drawings to task nodes for vendor communication

---

## Phase 11: User Story 8 - Purchasing & Vendor Service Management (Priority: P3) - **UPDATED 2025-12-23**

**Goal**: Implement purchasing workflow with ServiceCategory, VendorServiceOffering, PurchaseRequest, and RFQItem entities for "select service → get vendor/price list" functionality (FR-053)

**Independent Test**: Can be fully tested by:
1. Admin creates service categories (CNC machining, etching, painting)
2. Admin links vendors to service categories with pricing via VendorServiceOffering
3. Creating a purchase request with service category (e.g., "CNC machining")
4. System suggests vendors with pricing based on VendorServiceOffering
5. Sending RFQItems to multiple vendors, recording responses
6. Selecting best vendor and creating PurchaseOrder
7. Linking purchase to Project for cost tracking

### Tests for User Story 8 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [ ] T189 [P] [US8] Write contract tests for GET/POST /api/service-categories endpoints in backend/src/test/java/com/wellkorea/backend/purchasing/api/ServiceCategoryControllerTest.java - MUST FAIL initially
- [ ] T189a [P] [US8] Write contract tests for GET/POST /api/vendor-offerings, GET /api/vendor-offerings/by-service/{serviceId} endpoints in backend/src/test/java/com/wellkorea/backend/purchasing/api/VendorOfferingControllerTest.java - MUST FAIL initially
- [ ] T189b [P] [US8] Write contract tests for GET/POST /api/purchase-requests endpoints in backend/src/test/java/com/wellkorea/backend/purchasing/api/PurchaseRequestControllerTest.java - MUST FAIL initially
- [ ] T190 [P] [US8] Write contract tests for POST /api/purchase-requests/{id}/rfq-items, GET /api/rfq-items/{id} endpoints in backend/src/test/java/com/wellkorea/backend/purchasing/api/RFQItemControllerTest.java - MUST FAIL initially
- [ ] T190a [P] [US8] Write contract tests for POST /api/purchase-orders endpoints (from selected RFQItem) in backend/src/test/java/com/wellkorea/backend/purchasing/api/PurchaseOrderControllerTest.java - MUST FAIL initially
- [ ] T191 [US8] Write unit tests for VendorSuggestionService (get vendors by service category with pricing from VendorServiceOffering) in backend/src/test/java/com/wellkorea/backend/purchasing/application/VendorSuggestionServiceTest.java - MUST FAIL initially
- [ ] T192 [US8] Write unit tests for PurchaseRequestService (create request, send RFQs, select vendor) in backend/src/test/java/com/wellkorea/backend/purchasing/application/PurchaseRequestServiceTest.java - MUST FAIL initially
- [ ] T192a [US8] Write unit tests for EmailService (RFQ email generation with attachments) in backend/src/test/java/com/wellkorea/backend/purchasing/application/EmailServiceTest.java - MUST FAIL initially

### Database Schema for User Story 8

- [ ] T193 Create Flyway migration V14__create_purchasing_domain.sql for ServiceCategory, VendorServiceOffering, PurchaseRequest, RFQItem, PurchaseOrder tables

### Backend Implementation for User Story 8 - Service Catalog

- [ ] T194 [P] [US8] Create ServiceCategory entity in backend/src/main/java/com/wellkorea/backend/purchasing/domain/ServiceCategory.java
- [ ] T195 [P] [US8] Create VendorServiceOffering entity in backend/src/main/java/com/wellkorea/backend/purchasing/domain/VendorServiceOffering.java
- [ ] T196 [US8] Create ServiceCategoryRepository in backend/src/main/java/com/wellkorea/backend/purchasing/infrastructure/persistence/ServiceCategoryRepository.java
- [ ] T197 [US8] Create VendorServiceOfferingRepository with queries for vendor lookup by service in backend/src/main/java/com/wellkorea/backend/purchasing/infrastructure/persistence/VendorServiceOfferingRepository.java
- [ ] T198 [US8] Implement ServiceCategoryService with CRUD operations in backend/src/main/java/com/wellkorea/backend/purchasing/application/ServiceCategoryService.java
- [ ] T199 [US8] Implement VendorOfferingService with "get vendors by service" functionality in backend/src/main/java/com/wellkorea/backend/purchasing/application/VendorOfferingService.java
- [ ] T200 [US8] Create ServiceCategoryController with REST endpoints in backend/src/main/java/com/wellkorea/backend/purchasing/api/ServiceCategoryController.java
- [ ] T201 [US8] Create VendorOfferingController with REST endpoints in backend/src/main/java/com/wellkorea/backend/purchasing/api/VendorOfferingController.java

### Backend Implementation for User Story 8 - Purchase Request & RFQ

- [ ] T202 [P] [US8] Create PurchaseRequest entity in backend/src/main/java/com/wellkorea/backend/purchasing/domain/PurchaseRequest.java
- [ ] T203 [P] [US8] Create PurchaseRequestStatus enum (DRAFT, RFQ_SENT, VENDOR_SELECTED, CLOSED, CANCELED) in backend/src/main/java/com/wellkorea/backend/purchasing/domain/PurchaseRequestStatus.java
- [ ] T204 [P] [US8] Create RFQItem entity in backend/src/main/java/com/wellkorea/backend/purchasing/domain/RFQItem.java
- [ ] T205 [P] [US8] Create RFQItemStatus enum (SENT, REPLIED, NO_RESPONSE, SELECTED, REJECTED) in backend/src/main/java/com/wellkorea/backend/purchasing/domain/RFQItemStatus.java
- [ ] T206 [US8] Create PurchaseRequestRepository in backend/src/main/java/com/wellkorea/backend/purchasing/infrastructure/persistence/PurchaseRequestRepository.java
- [ ] T207 [US8] Create RFQItemRepository in backend/src/main/java/com/wellkorea/backend/purchasing/infrastructure/persistence/RFQItemRepository.java
- [ ] T208 [US8] Implement PurchaseRequestService with create, send RFQs, record responses in backend/src/main/java/com/wellkorea/backend/purchasing/application/PurchaseRequestService.java
- [ ] T209 [US8] Implement VendorSuggestionService to recommend vendors from VendorServiceOffering in backend/src/main/java/com/wellkorea/backend/purchasing/application/VendorSuggestionService.java
- [ ] T210 [US8] Implement EmailService for RFQ email generation and sending in backend/src/main/java/com/wellkorea/backend/purchasing/application/EmailService.java
- [ ] T211 [US8] Create PurchaseRequestController with REST endpoints in backend/src/main/java/com/wellkorea/backend/purchasing/api/PurchaseRequestController.java
- [ ] T212 [US8] Create RFQItemController with REST endpoints in backend/src/main/java/com/wellkorea/backend/purchasing/api/RFQItemController.java

### Backend Implementation for User Story 8 - Purchase Order

- [ ] T213 [P] [US8] Create PurchaseOrder entity (references RFQItem, Company as vendor) in backend/src/main/java/com/wellkorea/backend/purchasing/domain/PurchaseOrder.java
- [ ] T214 [P] [US8] Create PurchaseOrderStatus enum (DRAFT, SENT, CONFIRMED, RECEIVED, CANCELED) in backend/src/main/java/com/wellkorea/backend/purchasing/domain/PurchaseOrderStatus.java
- [ ] T215 [US8] Create PurchaseOrderRepository in backend/src/main/java/com/wellkorea/backend/purchasing/infrastructure/persistence/PurchaseOrderRepository.java
- [ ] T216 [US8] Implement PurchaseOrderService with create from RFQItem, status tracking in backend/src/main/java/com/wellkorea/backend/purchasing/application/PurchaseOrderService.java
- [ ] T217 [US8] Create PurchaseOrderController with REST endpoints in backend/src/main/java/com/wellkorea/backend/purchasing/api/PurchaseOrderController.java

### Backend Implementation for User Story 8 - DTOs & Validation

- [ ] T218 [US8] Create DTOs for ServiceCategory (CreateServiceCategoryRequest, ServiceCategoryResponse) in backend/src/main/java/com/wellkorea/backend/purchasing/api/dto/
- [ ] T219 [US8] Create DTOs for VendorServiceOffering (CreateVendorOfferingRequest, VendorOfferingResponse, VendorsByServiceResponse) in backend/src/main/java/com/wellkorea/backend/purchasing/api/dto/
- [ ] T220 [US8] Create DTOs for PurchaseRequest (CreatePurchaseRequestRequest, PurchaseRequestResponse) in backend/src/main/java/com/wellkorea/backend/purchasing/api/dto/
- [ ] T221 [US8] Create DTOs for RFQItem (SendRFQRequest, RecordRFQResponseRequest, RFQItemResponse) in backend/src/main/java/com/wellkorea/backend/purchasing/api/dto/
- [ ] T222 [US8] Create DTOs for PurchaseOrder (CreatePurchaseOrderRequest, PurchaseOrderResponse) in backend/src/main/java/com/wellkorea/backend/purchasing/api/dto/
- [ ] T223 [US8] Add validation (vendor must have VENDOR/OUTSOURCE role, service category exists, RFQItem selected before PO creation)

### Frontend Implementation for User Story 8 (FSD-Lite)

> **Note**: Paths updated for FSD-Lite architecture (2025-12-30)

#### Service Catalog Entity Layer
- [ ] T224 [US8] Create service-category entity in frontend/src/entities/service-category/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/service-category.ts (ServiceCategory type)
  - api/service-category.api.ts, service-category.mapper.ts
  - query/use-service-categories.ts, query-keys.ts
  - ui/ServiceCategoryTable.tsx, ServiceCategorySelect.tsx

- [ ] T225 [US8] Create vendor-offering entity in frontend/src/entities/vendor-offering/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/vendor-offering.ts (VendorServiceOffering type + offeringRules: getBestPrice, getVendorsByService)
  - api/vendor-offering.api.ts, vendor-offering.mapper.ts
  - query/use-vendor-offerings.ts, use-vendors-by-service.ts, query-keys.ts
  - ui/VendorOfferingTable.tsx, VendorSuggestionList.tsx

#### Purchase Request & RFQ Entity Layer
- [ ] T226 [US8] Create purchase-request entity in frontend/src/entities/purchase-request/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/purchase-request.ts (PurchaseRequest type + requestRules: canSendRFQ, canSelectVendor)
  - model/purchase-request-status.ts (PurchaseRequestStatus enum + display config)
  - model/rfq-item.ts (RFQItem type + rfqRules: isAwaitingResponse, isSelected)
  - api/purchase-request.api.ts, purchase-request.mapper.ts
  - query/use-purchase-request.ts, use-purchase-requests.ts, query-keys.ts
  - ui/PurchaseRequestTable.tsx, PurchaseRequestCard.tsx, RFQStatusBadge.tsx

#### Purchase Order Entity Layer
- [ ] T227 [US8] Create purchase-order entity in frontend/src/entities/purchase-order/ (model/, api/, query/, ui/) - **FSD-Lite**
  - model/purchase-order.ts (PurchaseOrder type + poRules: canConfirm, canReceive)
  - model/purchase-order-status.ts (PurchaseOrderStatus enum + display config)
  - api/purchase-order.api.ts, purchase-order.mapper.ts
  - query/use-purchase-order.ts, use-purchase-orders.ts, query-keys.ts
  - ui/PurchaseOrderTable.tsx, PurchaseOrderCard.tsx, POStatusBadge.tsx

#### Service Catalog Features & Pages
- [ ] T228 [US8] Create service-category list page in frontend/src/pages/admin/service-categories/ServiceCategoryListPage.tsx (Admin only) - **FSD-Lite**
- [ ] T228a [US8] Create service-category create feature in frontend/src/features/service-category/create/ (ui/CreateServiceCategoryForm.tsx, model/use-create-service-category.ts) - **FSD-Lite**
- [ ] T229 [US8] Create vendor-offering list page in frontend/src/pages/purchasing/vendor-offerings/VendorOfferingListPage.tsx with "select service → show vendors" - **FSD-Lite**
- [ ] T229a [US8] Create vendor-offering create feature in frontend/src/features/vendor-offering/create/ (ui/CreateVendorOfferingForm.tsx, model/use-create-vendor-offering.ts) - **FSD-Lite**

#### Purchase Request Features & Pages
- [ ] T230 [US8] Create purchase-request create feature in frontend/src/features/purchase-request/create/ (ui/CreatePurchaseRequestForm.tsx, model/use-create-purchase-request.ts) with vendor suggestions widget - **FSD-Lite**
- [ ] T230a [US8] Create purchase-request create page in frontend/src/pages/purchasing/requests/create/CreatePurchaseRequestPage.tsx (assembly only) - **FSD-Lite**
- [ ] T230b [US8] Create vendor-suggestion widget in frontend/src/widgets/purchasing/VendorSuggestionPanel.tsx (uses entities/vendor-offering/ui/VendorSuggestionList) - **FSD-Lite**
- [ ] T231 [US8] Create purchase-request detail page in frontend/src/pages/purchasing/requests/[id]/PurchaseRequestDetailPage.tsx (uses widgets/purchasing/RFQTrackingPanel) - **FSD-Lite**
- [ ] T231a [US8] Create send-rfq feature in frontend/src/features/rfq/send/ (ui/SendRFQDialog.tsx, model/use-send-rfq.ts) - **FSD-Lite**
- [ ] T231b [US8] Create rfq-tracking widget in frontend/src/widgets/purchasing/RFQTrackingPanel.tsx (displays RFQ status, responses) - **FSD-Lite**

#### Purchase Order Features & Pages
- [ ] T232 [US8] Create purchase-order list page in frontend/src/pages/purchasing/orders/list/PurchaseOrderListPage.tsx (assembly only) - **FSD-Lite**
- [ ] T232a [US8] Create purchase-order create feature in frontend/src/features/purchase-order/create/ (from selected RFQItem) - **FSD-Lite**

#### Purchasing Integration
- [ ] T233 [US8] Create purchasing-summary widget in frontend/src/widgets/project/PurchasingSummaryPanel.tsx for project detail page with cost aggregation - **FSD-Lite**
- [ ] T234 [US8] Add role-based access (Admin/Finance can manage service categories and vendor offerings) using entities/*/query hooks

**Checkpoint**: Purchasing and vendor service management complete - "select service → get vendor/price list" functionality with RFQ workflow

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Testing & Validation

- [ ] T210 [P] Run backend integration tests with Testcontainers for all domains
- [ ] T211 [P] Run frontend E2E tests with Playwright for critical user journeys
- [ ] T212 [P] Verify JaCoCo backend coverage meets 70% threshold
- [ ] T213 [P] Verify Vitest frontend coverage meets 70% threshold
- [ ] T214 [P] Run SonarCloud analysis and fix critical/blocker issues

### Documentation

- [ ] T215 [P] Update README.md with setup instructions
- [ ] T216 [P] Update API documentation (OpenAPI spec) with all implemented endpoints
- [ ] T217 [P] Create quickstart validation script to test all user stories
- [ ] T218 [P] Document RBAC permissions matrix in docs/security.md

### Performance & Security

- [ ] T219 [P] Add database indexes for performance-critical queries (verify V3 migration)
- [ ] T220 [P] Implement rate limiting on authentication endpoints
- [ ] T221 [P] Add CORS configuration for frontend-backend communication
- [ ] T222 [P] Review and fix any security vulnerabilities (SQL injection, XSS, etc.)

### Deployment

- [ ] T223 Configure production environment variables in .env.example
- [ ] T224 Create Docker build configuration for backend in backend/Dockerfile
- [ ] T225 Create Docker build configuration for frontend in frontend/Dockerfile
- [ ] T226 Test docker-compose.yml with all services
- [ ] T227 Create backup/restore scripts for PostgreSQL and MinIO

### Final Validation

- [ ] T228 Run all acceptance scenarios from spec.md
- [ ] T229 Verify all success criteria (SC-001 to SC-012) are met
- [ ] T230 Verify all functional requirements (FR-001 to FR-068) are implemented
- [ ] T231 Conduct security audit (audit log retention, password hashing, RBAC enforcement)
- [ ] T232 Validate quickstart.md guide with fresh environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US9 - RBAC (Phase 3)**: Depends on Foundational - Security foundation for P1
- **US1 - JobCode (Phase 4)**: Depends on Foundational and US9 - Core MVP data entry
- **Company Domain (Phase 4a)**: Depends on Foundational - Unified Customer/Vendor entity **← NEW 2025-12-23**
- **US2 - Quotation (Phase 5)**: Depends on US1, Company Domain, and US9 - Commercial documents require projects, companies, and security
- **US3 - Product Catalog (Phase 6)**: Depends on Foundational - Can run in parallel with US1/US2
- **US4 - Production (Phase 7)**: Depends on US1 (requires projects) - Can run in parallel with US2/US3
- **US5 - Delivery (Phase 8)**: Depends on US2 (requires quotations) - Sequential after US2
- **US6 - Invoicing (Phase 9)**: Depends on US5 (requires deliveries) - Sequential after US5
- **US7 - Outsourcing Blueprints (Phase 10)**: Depends on US4 (requires work progress steps) - Sequential after Production **← UPDATED 2026-01-08**
- **US8 - Purchasing (Phase 11)**: Depends on US1 and Company Domain (requires projects and unified Company/vendor) **← UPDATED 2025-12-23**
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US9 (RBAC)**: Foundation for security - must complete before quotations/invoices
- **US1 (JobCode)**: Foundation for all work - most other stories depend on this
- **Company Domain**: Foundation for Customer/Vendor - US2 and US8 depend on this **← NEW 2025-12-23**
- **US2 (Quotation)**: Depends on US1 and Company Domain (requires projects and companies)
- **US3 (Product Catalog)**: Independent - can run in parallel
- **US4 (Production)**: Depends on US1 - can run in parallel with US2
- **US5 (Delivery)**: Depends on US2 - sequential after quotations
- **US6 (Invoicing)**: Depends on US5 - sequential after deliveries
- **US7 (Outsourcing Blueprints)**: Depends on US4 - sequential after Production **← UPDATED 2026-01-08**
- **US8 (Purchasing)**: Depends on US1 and Company Domain (requires projects and vendors) **← UPDATED 2025-12-23**

### Critical Path for MVP (P1 Stories Only)

1. Phase 1: Setup → Phase 2: Foundational
2. Phase 3: US9 (RBAC) - Security foundation
3. Phase 4: US1 (JobCode) - Core data entry
4. Phase 4a: Company Domain - Unified Customer/Vendor **← NEW 2025-12-23**
5. Phase 5: US2 (Quotation) - Commercial documents
6. **MVP DELIVERED** - Can stop here for initial launch

### Parallel Opportunities

#### After Foundational Phase Completes:

- US9 (RBAC), US3 (Products), Company Domain can all run in parallel
- Once US1 (JobCode) and Company Domain complete: US4 (Production), US8 (Purchasing) can run in parallel
- Once US2 (Quotation) completes: US5 (Delivery) starts
- Once US5 (Delivery) completes: US6 (Invoicing) starts

#### Within Each User Story:

- Tasks marked [P] can run in parallel (different files)
- Database migrations (T0XX) → Entities (T0XX [P]) → Repositories → Services → Controllers
- Frontend components can run in parallel with backend if API contracts are defined first

---

## Parallel Example: Foundational Phase

```bash
# After Setup (Phase 1) completes, run these in parallel:
Task T017: GlobalExceptionHandler (shared/exception/)
Task T018: AuditLogger (shared/audit/)
Task T019: MinioFileStorage (document/service/)
Task T020: SecurityConfig (security/config/)
Task T021: UserDetailsService (security/service/)
Task T022: RBAC implementation (security/domain/)
Task T023: application.properties configuration
Task T024: JobCodeGenerator (project/domain/)
Task T025: AuthContext (frontend/contexts/)
Task T026: API client (frontend/services/)
Task T027: ProtectedRoute (frontend/components/)
Task T028: ErrorBoundary (frontend/components/)
Task T029: React Router setup (frontend/App.tsx)
Task T030: UI component library (frontend/components/ui/)
```

---

## Parallel Example: User Story 1 (JobCode)

```bash
# After database migration V6 completes, run entities in parallel:
Task T050: Project entity
Task T051: ProjectStatus enum
Task T052: Customer entity

# After entities complete, implement services sequentially:
Task T053: ProjectRepository
Task T054: ProjectService
Task T055: JobCodeGenerator
Task T056: ProjectController

# Frontend can run in parallel with backend once API contract is defined:
Task T060: ProjectService API client
Task T061: ProjectListPage
Task T062: CreateProjectPage
Task T063: EditProjectPage
Task T064: ProjectDetailPage
```

---

## Implementation Strategy

### MVP First (P1 Stories: US9 + US1 + Company Domain + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US9 (RBAC security foundation)
4. Complete Phase 4: US1 (JobCode creation)
5. Complete Phase 4a: Company Domain (Unified Customer/Vendor) **← NEW 2025-12-23**
6. Complete Phase 5: US2 (Quotation + Approval)
7. **STOP and VALIDATE**: Test MVP independently
8. Deploy/demo if ready

**Estimated MVP Scope**: ~116 tasks (T001-T097 + Company Domain T052a-T052s) - delivers core job intake, unified company management, quotation workflow, and security

### Incremental Delivery

1. **Foundation**: Setup + Foundational → Infrastructure ready (~31 tasks)
2. **Security MVP**: + US9 → RBAC complete (~17 tasks)
3. **Data Entry MVP**: + US1 → JobCode creation complete (~17 tasks)
4. **Company Domain**: + Company → Unified Customer/Vendor complete (~19 tasks) **← NEW 2025-12-23**
5. **Commercial MVP**: + US2 → Quotation workflow complete (~30 tasks) 🎯 **LAUNCH HERE**
6. **Product Catalog**: + US3 → Product standardization (~15 tasks)
7. **Production Tracking**: + US4 → Work progress visible (~16 tasks)
8. **Delivery**: + US5 → Delivery tracking complete (~16 tasks)
9. **Financial**: + US6 → AR/AP tracking complete (~25 tasks)
10. **Outsourcing Blueprints**: + US7 → Blueprint attachments for outsourcing complete (~21 tasks) **← UPDATED 2026-01-08**
11. **Purchasing**: + US8 → Vendor service management complete (~46 tasks) **← UPDATED 2025-12-23**
12. **Polish**: Final validation and deployment (~23 tasks)

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

- **Developer A**: US9 (RBAC) → US1 (JobCode) → US4 (Production)
- **Developer B**: US3 (Products) → US2 (Quotation) → US5 (Delivery) → US6 (Invoicing)
- **Developer C**: US7 (Outsourcing Blueprints, after US4) → US8 (Purchasing) → Polish

Stories integrate at natural boundaries (e.g., quotations use products from catalog, deliveries reference quotations).

---

## Summary

**Total Tasks**: ~381 tasks (306 implementation + 65 test-first tasks + 10 new FSD-Lite sub-tasks)
**MVP Tasks (P1)**: ~175 tasks (Phase 0 FSD-Lite + Setup + Foundational + US9 + US1 + Company Domain + US2 including test-first tasks + multi-level approval + FR-062 customer assignment)
**P2 Tasks**: ~120 tasks (US3 + US4 + US5 + US6 including test-first tasks, updated for FSD-Lite)
**P3 Tasks**: ~76 tasks (US7 + US8 including test-first tasks) **← UPDATED 2026-01-08: US7 scope changed to Outsourcing Blueprints**
**Polish Tasks**: ~23 tasks (Phase 12)

**Constitution Compliance**: ✅ **Test-First Development enforced** - 65 test tasks explicitly marked "Write FIRST - MUST FAIL initially" across all 9 user stories + Company domain

**FSD-Lite Architecture Update (2025-12-30)**: All frontend tasks updated to use FSD-Lite structure:
- `entities/` - Domain models with types, rules, queries, and display UI
- `features/` - Isolated user actions/workflows (one feature = one action)
- `widgets/` - Composite panels combining multiple features
- `pages/` - Route-level assembly components (no business logic)
- `shared/` - Cross-cutting concerns (api, ui, lib, types)

**Task Distribution by User Story** (including test-first tasks):
- **Phase 0 - FSD-Lite Migration**: 11 tasks **← NEW 2025-12-30**
- Setup (Phase 1): 12 tasks
- Foundational (Phase 2): 19 tasks (updated for FSD-Lite paths)
- US9 - RBAC (Phase 3): 30 tasks (7 tests + 23 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- US1 - JobCode (Phase 4): 26 tasks (5 tests + 21 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- Company Domain (Phase 4a): 22 tasks (4 tests + 18 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- US2 - Quotation (Phase 5): 65 tasks (13 tests + 52 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- US3 - Product Catalog (Phase 6): 22 tasks (4 tests + 18 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- US4 - Production Tracking (Phase 7): 22 tasks (4 tests + 18 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- US5 - Delivery (Phase 8): 22 tasks (4 tests + 18 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- US6 - Invoicing (Phase 9): 35 tasks (5 tests + 30 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- US7 - Outsourcing Blueprints (Phase 10): 21 tasks (4 tests + 17 implementation) **← UPDATED 2026-01-08**
- US8 - Purchasing (Phase 11): 55 tasks (8 tests + 47 implementation, updated for FSD-Lite) **← UPDATED 2025-12-30**
- Polish (Phase 12): 23 tasks (validation & deployment)

**Company Unification & Purchasing Redesign (2025-12-23 Update)**:
- Added 19 new tasks for Company domain (Phase 4a):
  - 4 new test tasks (T052a, T052b, T052c, T052d)
  - 1 migration task (T052e)
  - 9 backend tasks (T052f-T052n)
  - 5 frontend tasks (T052o-T052s)
- Unified `Company` entity with `CompanyRole` (CUSTOMER, VENDOR, OUTSOURCE) for dual-role support
- Updated US8 Purchasing domain (+22 tasks) with new entities:
  - `ServiceCategory`: Service types (CNC, etching, painting)
  - `VendorServiceOffering`: Vendor-specific service pricing
  - `PurchaseRequest` + `RFQItem`: Replaces old RFQ structure
  - Updated FK references (customer_id → customer_company_id, supplier_id → vendor_company_id)

**Multi-Level Approval (2025-12-19 Update)**:
- Added 14 new tasks for multi-level sequential approval (결재 라인):
  - 4 new test tasks (T070a, T071a, T074a, T075a)
  - 7 new entity tasks (T079, T079a, T081, T081a, T082, T082a + updated)
  - 4 new repository tasks (T083, T083a, T083b, T083c)
  - 4 new service/controller tasks (T084, T084a, T084b, T084c, T085, T085a)
  - 3 new frontend tasks (T095a, T095b, T095c)
- Approval chain configurable by Admin per entity type (QUOTATION, PURCHASE_ORDER)
- Sequential levels: Level 1 (팀장) → Level 2 (부서장) → Level 3 (사장)
- Position-based approvers (specific users, not RBAC roles)

**Test-First Discipline**:
- Each user story phase NOW includes explicit "Tests for User Story X (Write FIRST)" section
- All test tasks marked with "⚠️ Constitution Requirement: MUST be written FIRST and MUST FAIL before implementation begins"
- Test tasks include contract tests, unit tests, and integration tests BEFORE any implementation code
- This ensures full compliance with Constitution Principle I (Test-First Development)

**Parallel Opportunities**:
- Within Setup: 9 tasks marked [P]
- Within Foundational: 14 tasks marked [P]
- **Within test sections**: Most test tasks marked [P] (can write multiple tests in parallel)
- User stories after Foundational: US3 can run in parallel with any story
- US4, US8 can run in parallel after US1 completes
- US7 (Outsourcing Blueprints) depends on US4 - must wait for Production domain **← UPDATED 2026-01-08**
- Within each story: 2-5 entity/component tasks marked [P]
- **Within Approval Domain**: 7 entity tasks marked [P] (can create entities in parallel)

**Suggested MVP Scope**: Complete through Phase 5 (US2 Quotation) = ~138 tasks for first production-ready release (includes multi-level approval + FR-018c quotation revision notification + FR-062 Sales role customer assignment)

**Format Validation**: ✅ All tasks follow `- [ ] [ID] [P?] [Story?] Description with file path` format
