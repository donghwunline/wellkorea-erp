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

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/main/java/com/wellkorea/backend/`
- **Frontend**: `frontend/src/`
- **Database**: `backend/src/main/resources/db/migration/`
- **Tests**: `backend/src/test/java/com/wellkorea/backend/` and `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure following domain-oriented architecture (project/, quotation/, approval/, product/, production/, delivery/, invoice/, purchasing/, document/, security/, shared/)
- [X] T002 Create frontend directory structure (components/, pages/, services/, contexts/, hooks/, types/)
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

- [ ] T013 Create Flyway migration V1__create_core_tables.sql for User, Role, Company, CompanyRole tables (unified Customer/Vendor - **UPDATED 2025-12-23**)
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

### Frontend Core Infrastructure

- [X] T025 [P] Implement authentication context (login/logout/JWT storage) in frontend/src/contexts/AuthContext.tsx
- [X] T026 [P] Create API client with JWT interceptor in frontend/src/services/api.ts
- [X] T027 [P] Create ProtectedRoute component for role-based routing in frontend/src/components/ProtectedRoute.tsx
- [X] T028 [P] Create error handling utilities and error boundary in frontend/src/components/ErrorBoundary.tsx
- [X] T029 [P] Setup React Router with main routes structure in frontend/src/App.tsx
- [X] T030 [P] Create reusable UI component library (Button, Input, Table, Modal, etc.) in frontend/src/components/ui/

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
- [X] T045 [US9] Implement login page in frontend/src/pages/LoginPage.tsx
- [X] T046 [US9] Implement user management UI (Admin only) in frontend/src/pages/admin/UserManagementPage.tsx
- [X] T047 [US9] Implement audit log viewer (Admin only) in frontend/src/pages/admin/AuditLogPage.tsx
- [X] T048 [US9] Add role-based UI rendering (hide quotations from Production users, hide AR/AP from Sales users) in frontend/src/components/AppLayout.tsx and frontend/src/pages/DashboardPage.tsx
- [X] T048a [US9] Implement Sales role customer filtering: Add CustomerAssignment entity, repository, and project filtering service (table exists in V1__create_core_tables.sql) per FR-062
- [X] T048b [US9] Add customer assignment UI in UserManagementPage (Admin can assign Sales users to specific customers) in frontend/src/pages/admin/UserManagementPage.tsx

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
- [ ] T052 [P] [US1] Create Company and CompanyRole entities in backend/src/main/java/com/wellkorea/backend/company/domain/ (unified Customer/Vendor - **UPDATED 2025-12-23**)
- [X] T053 [US1] Create ProjectRepository in backend/src/main/java/com/wellkorea/backend/project/infrastructure/repository/ProjectRepository.java
- [X] T054 [US1] Implement ProjectService with create, read, update, list operations in backend/src/main/java/com/wellkorea/backend/project/application/ProjectService.java
- [X] T055 [US1] Implement JobCodeGenerator with sequence generation and uniqueness check in backend/src/main/java/com/wellkorea/backend/project/domain/JobCodeGenerator.java - implemented in Phase 2
- [X] T056 [US1] Create ProjectController with REST endpoints (/api/projects - GET, POST, PUT, GET /{id}) in backend/src/main/java/com/wellkorea/backend/project/api/ProjectController.java
- [X] T057 [US1] Create DTOs (CreateProjectRequest, UpdateProjectRequest, ProjectResponse) in backend/src/main/java/com/wellkorea/backend/project/api/dto/
- [X] T058 [US1] Add validation for project creation (customer exists, project name non-empty, due date >= today)
- [X] T059 [US1] Add audit logging for project creation and updates - using Spring auditing annotations

### Frontend Implementation for User Story 1

- [X] T060 [US1] Create ProjectService API client in frontend/src/services/projectService.ts
- [X] T061 [US1] Create ProjectListPage with table view in frontend/src/pages/projects/ProjectListPage.tsx
- [X] T062 [US1] Create CreateProjectPage with form in frontend/src/pages/projects/CreateProjectPage.tsx
- [X] T063 [US1] Create EditProjectPage with form in frontend/src/pages/projects/EditProjectPage.tsx
- [X] T064 [US1] Create ProjectDetailPage showing all project information in frontend/src/pages/projects/ProjectViewPage.tsx
- [X] T065 [US1] Add form validation (required fields, date validation)
- [X] T066 [US1] Display generated JobCode prominently after creation

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

- [ ] T052a [P] [US1] Write contract tests for GET /api/companies, POST /api/companies endpoints in backend/src/test/java/com/wellkorea/backend/company/api/CompanyControllerTest.java - MUST FAIL initially
- [ ] T052b [P] [US1] Write contract tests for PUT /api/companies/{id}, GET /api/companies/{id} endpoints in backend/src/test/java/com/wellkorea/backend/company/api/CompanyControllerTest.java - MUST FAIL initially
- [ ] T052c [P] [US1] Write contract tests for POST /api/companies/{id}/roles, DELETE /api/companies/{id}/roles/{roleId} endpoints in backend/src/test/java/com/wellkorea/backend/company/api/CompanyControllerTest.java - MUST FAIL initially
- [ ] T052d [US1] Write unit tests for CompanyService (create company, add role, dual-role validation) in backend/src/test/java/com/wellkorea/backend/company/application/CompanyServiceTest.java - MUST FAIL initially

### Database Schema for Company Domain

- [ ] T052e Create Flyway migration V__create_company_tables.sql for Company, CompanyRole tables with unique constraint on (company_id, role_type)

### Backend Implementation for Company Domain

- [ ] T052f [P] [US1] Create Company entity in backend/src/main/java/com/wellkorea/backend/company/domain/Company.java
- [ ] T052g [P] [US1] Create CompanyRole entity in backend/src/main/java/com/wellkorea/backend/company/domain/CompanyRole.java
- [ ] T052h [P] [US1] Create RoleType enum (CUSTOMER, VENDOR, OUTSOURCE) in backend/src/main/java/com/wellkorea/backend/company/domain/RoleType.java
- [ ] T052i [US1] Create CompanyRepository in backend/src/main/java/com/wellkorea/backend/company/infrastructure/persistence/CompanyRepository.java
- [ ] T052j [US1] Create CompanyRoleRepository in backend/src/main/java/com/wellkorea/backend/company/infrastructure/persistence/CompanyRoleRepository.java
- [ ] T052k [US1] Implement CompanyService with CRUD operations and role management in backend/src/main/java/com/wellkorea/backend/company/application/CompanyService.java
- [ ] T052l [US1] Create CompanyController with REST endpoints in backend/src/main/java/com/wellkorea/backend/company/api/CompanyController.java
- [ ] T052m [US1] Create DTOs (CreateCompanyRequest, AddRoleRequest, CompanyResponse, CompanyRoleResponse) in backend/src/main/java/com/wellkorea/backend/company/api/dto/
- [ ] T052n [US1] Add validation (registration_number unique, role_type enum validation, at least one role required)

### Frontend Implementation for Company Domain

- [ ] T052o [US1] Create CompanyService API client in frontend/src/services/companies/companyService.ts
- [ ] T052p [US1] Create CompanyListPage with role filter in frontend/src/pages/companies/CompanyListPage.tsx
- [ ] T052q [US1] Create CompanyDetailPage showing all roles in frontend/src/pages/companies/CompanyDetailPage.tsx
- [ ] T052r [US1] Create CreateCompanyPage with role selection in frontend/src/pages/companies/CreateCompanyPage.tsx
- [ ] T052s [US1] Update project creation form to use Company dropdown filtered by CUSTOMER role

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

### Frontend Implementation for User Story 2

- [ ] T089 [US2] Create QuotationService API client in frontend/src/services/quotations/quotationService.ts ✅ (also created productService.ts for product search)
- [ ] T090 [US2] Create ApprovalService API client in frontend/src/services/quotations/approvalService.ts
- [ ] T091 [US2] Create QuotationListPage with table view (filtered by role) in frontend/src/pages/quotations/QuotationListPage.tsx ✅ (with QuotationTable feature component)
- [ ] T092 [US2] Create CreateQuotationPage with product selection and line items in frontend/src/pages/quotations/QuotationCreatePage.tsx ✅ (with QuotationForm and ProductSelector components)
- [ ] T093 [US2] Create EditQuotationPage with version management in frontend/src/pages/quotations/EditQuotationPage.tsx
- [ ] T093a [US2] Add email notification checkbox in EditQuotationPage when creating new version (calls POST /api/quotations/{id}/send-revision-notification) in frontend/src/pages/quotations/EditQuotationPage.tsx
- [ ] T094 [US2] Create QuotationDetailPage with approval history in frontend/src/pages/quotations/QuotationDetailPage.tsx
- [ ] T095 [US2] Create ApprovalModal for approve/reject with comments in frontend/src/components/features/quotations/ApprovalRejectModal.tsx ✅ (implemented as ApprovalRejectModal + ApprovalRequestCard)
- [ ] T095a [US2] Create ApprovalChainConfigPage (Admin only) to configure approval levels for entity types in frontend/src/pages/admin/ApprovalChainConfigPage.tsx
- [ ] T095b [US2] Create ApprovalChainService API client (get chain, configure levels) in frontend/src/services/quotations/approvalChainService.ts
- [ ] T095c [US2] Display multi-level approval progress in QuotationDetailPage (show current level, approver, decision status per level)
- [ ] T096 [US2] Add PDF download button that fetches quotation PDF ✅ (downloadPdf in quotationService, button in QuotationTable)
- [ ] T097 [US2] Add role-based visibility (Sales: read-only their quotations, Finance: all quotations)
- [ ] T097a [US2] Filter quotations by assigned customers for Sales role in QuotationController (verify role and apply customer filter using customer_assignment from T048a) in backend/src/main/java/com/wellkorea/backend/quotation/api/QuotationController.java

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

- [ ] T098 [P] [US3] Write contract tests for POST /api/products endpoint (validates SKU uniqueness, name non-empty, base_price >= 0) in backend/src/test/java/com/wellkorea/backend/product/controller/ProductControllerTest.java - MUST FAIL initially
- [ ] T099 [P] [US3] Write contract tests for GET /api/products, GET /api/products/{id}, PUT /api/products/{id}, DELETE /api/products/{id} endpoints in backend/src/test/java/com/wellkorea/backend/product/controller/ProductControllerTest.java - MUST FAIL initially
- [ ] T100 [P] [US3] Write contract tests for GET /api/products/search endpoint (search by name, filter by type) in backend/src/test/java/com/wellkorea/backend/product/controller/ProductControllerTest.java - MUST FAIL initially
- [ ] T101 [US3] Write unit tests for ProductService (product deactivation logic, preserve in old quotations) in backend/src/test/java/com/wellkorea/backend/product/service/ProductServiceTest.java - MUST FAIL initially

### Database Schema for User Story 3

- [ ] T102 Create Flyway migration V9__create_product_domain.sql for Product, ProductType tables

### Backend Implementation for User Story 3

- [ ] T099 [P] [US3] Create Product entity in backend/src/main/java/com/wellkorea/backend/product/domain/Product.java
- [ ] T100 [P] [US3] Create ProductType entity in backend/src/main/java/com/wellkorea/backend/product/domain/ProductType.java
- [ ] T101 [US3] Create ProductRepository with search by name in backend/src/main/java/com/wellkorea/backend/product/infrastructure/persistence/ProductRepository.java (depends on T099)
- [ ] T102 [US3] Implement ProductService with CRUD and search operations in backend/src/main/java/com/wellkorea/backend/product/service/ProductService.java
- [ ] T103 [US3] Create ProductController with REST endpoints (/api/products - GET, POST, PUT, DELETE, GET /search) in backend/src/main/java/com/wellkorea/backend/product/controller/ProductController.java
- [ ] T104 [US3] Create DTOs (CreateProductRequest, UpdateProductRequest, ProductResponse) in backend/src/main/java/com/wellkorea/backend/product/dto/
- [ ] T105 [US3] Add validation (SKU unique, name non-empty, base price >= 0)
- [ ] T106 [US3] Implement product deactivation (is_active flag) while preserving in old quotations

### Frontend Implementation for User Story 3

- [ ] T107 [US3] Create ProductService API client in frontend/src/services/productService.ts
- [ ] T108 [US3] Create ProductListPage with search and filter in frontend/src/pages/products/ProductListPage.tsx
- [ ] T109 [US3] Create CreateProductPage with form in frontend/src/pages/products/CreateProductPage.tsx
- [ ] T110 [US3] Create EditProductPage with form in frontend/src/pages/products/EditProductPage.tsx
- [ ] T111 [US3] Create ProductSearchComponent for quotation product selection in frontend/src/components/products/ProductSearch.tsx
- [ ] T112 [US3] Add role-based access (Admin only can create/edit products)

**Checkpoint**: Product catalog complete - standardized product selection available for quotations

---

## Phase 7: User Story 4 - Production Tracking: Work Progress Sheet Per Product (Priority: P2)

**Goal**: Implement per-product work progress tracking with manufacturing steps

**Independent Test**: Can be fully tested by:
1. Creating work progress sheets for 2–3 products in a JobCode
2. Marking manufacturing steps as "in progress" with dates and remarks
3. Recording an outsourced step (vendor name, ETA)
4. Viewing production status aggregated across all products

### Tests for User Story 4 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [ ] T113 [P] [US4] Write contract tests for POST /api/work-progress endpoint (creates sheet for project-product) in backend/src/test/java/com/wellkorea/backend/production/controller/WorkProgressControllerTest.java - MUST FAIL initially
- [ ] T114 [P] [US4] Write contract tests for PUT /api/work-progress/{id}/steps/{stepId} endpoint (updates step status, dates, remarks) in backend/src/test/java/com/wellkorea/backend/production/controller/WorkProgressControllerTest.java - MUST FAIL initially
- [ ] T115 [P] [US4] Write contract tests for GET /api/work-progress endpoint (get all sheets for project, calculate aggregated progress %) in backend/src/test/java/com/wellkorea/backend/production/controller/WorkProgressControllerTest.java - MUST FAIL initially
- [ ] T116 [US4] Write unit tests for WorkProgressService (progress calculation, outsourced step tracking) in backend/src/test/java/com/wellkorea/backend/production/service/WorkProgressServiceTest.java - MUST FAIL initially

### Database Schema for User Story 4

- [ ] T113 Create Flyway migration V10__create_production_domain.sql for WorkProgressSheet, WorkProgressStep, WorkProgressStepTemplate tables

### Backend Implementation for User Story 4

- [ ] T114 [P] [US4] Create WorkProgressSheet entity in backend/src/main/java/com/wellkorea/backend/production/domain/WorkProgressSheet.java
- [ ] T115 [P] [US4] Create WorkProgressStep entity in backend/src/main/java/com/wellkorea/backend/production/domain/WorkProgressStep.java
- [ ] T116 [P] [US4] Create WorkProgressStepTemplate entity in backend/src/main/java/com/wellkorea/backend/production/domain/WorkProgressStepTemplate.java
- [ ] T117 [P] [US4] Create StepStatus enum (NotStarted, InProgress, Completed) in backend/src/main/java/com/wellkorea/backend/production/domain/StepStatus.java
- [ ] T118 [US4] Create WorkProgressSheetRepository in backend/src/main/java/com/wellkorea/backend/production/infrastructure/persistence/WorkProgressSheetRepository.java (depends on T114)
- [ ] T119 [US4] Implement WorkProgressService with create sheet, update step, get progress in backend/src/main/java/com/wellkorea/backend/production/service/WorkProgressService.java
- [ ] T120 [US4] Create WorkProgressController with REST endpoints in backend/src/main/java/com/wellkorea/backend/production/controller/WorkProgressController.java
- [ ] T121 [US4] Create DTOs (CreateWorkProgressSheetRequest, UpdateStepRequest, WorkProgressResponse) in backend/src/main/java/com/wellkorea/backend/production/dto/
- [ ] T122 [US4] Add validation (unique sheet per project-product, status progression, completed_by required on completion)
- [ ] T123 [US4] Implement aggregated progress calculation (% complete per product)

### Frontend Implementation for User Story 4

- [ ] T124 [US4] Create WorkProgressService API client in frontend/src/services/workProgressService.ts
- [ ] T125 [US4] Create WorkProgressListPage showing all products for a project in frontend/src/pages/production/WorkProgressListPage.tsx
- [ ] T126 [US4] Create WorkProgressDetailPage with step-by-step tracking in frontend/src/pages/production/WorkProgressDetailPage.tsx
- [ ] T127 [US4] Create UpdateStepModal for updating step status, dates, remarks in frontend/src/components/production/UpdateStepModal.tsx
- [ ] T128 [US4] Add aggregated progress display on project detail page
- [ ] T129 [US4] Add role-based access (Production staff can update, Finance/Sales can view read-only)

**Checkpoint**: Production tracking complete - per-product work progress visible with real-time status updates

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

- [ ] T130 [P] [US5] Write contract tests for POST /api/deliveries endpoint (validates quantity_delivered <= quotation quantity) in backend/src/test/java/com/wellkorea/backend/delivery/controller/DeliveryControllerTest.java - MUST FAIL initially
- [ ] T131 [P] [US5] Write contract tests for GET /api/deliveries endpoint (for project) and GET /api/deliveries/{id}/statement (PDF generation) in backend/src/test/java/com/wellkorea/backend/delivery/controller/DeliveryControllerTest.java - MUST FAIL initially
- [ ] T132 [US5] Write unit tests for DeliveryService (over-delivery prevention, double-invoicing tracking) in backend/src/test/java/com/wellkorea/backend/delivery/service/DeliveryServiceTest.java - MUST FAIL initially
- [ ] T133 [US5] Write integration test for delivery tracking (create delivery → prevent duplicate delivery of same quantity) in backend/src/test/java/com/wellkorea/backend/delivery/DeliveryIntegrationTest.java - MUST FAIL initially

### Database Schema for User Story 5

- [ ] T134 Create Flyway migration V11__create_delivery_domain.sql for Delivery, DeliveryLineItem tables

### Backend Implementation for User Story 5

- [ ] T131 [P] [US5] Create Delivery entity in backend/src/main/java/com/wellkorea/backend/delivery/domain/Delivery.java
- [ ] T132 [P] [US5] Create DeliveryLineItem entity in backend/src/main/java/com/wellkorea/backend/delivery/domain/DeliveryLineItem.java
- [ ] T133 [US5] Create DeliveryRepository in backend/src/main/java/com/wellkorea/backend/delivery/infrastructure/persistence/DeliveryRepository.java (depends on T131)
- [ ] T134 [US5] Implement DeliveryService with create, get, validate delivered quantities in backend/src/main/java/com/wellkorea/backend/delivery/service/DeliveryService.java
- [ ] T135 [US5] Implement TransactionStatementService to generate PDF statements in backend/src/main/java/com/wellkorea/backend/delivery/service/TransactionStatementService.java
- [ ] T136 [US5] Create DeliveryController with REST endpoints in backend/src/main/java/com/wellkorea/backend/delivery/controller/DeliveryController.java
- [ ] T137 [US5] Create DTOs (CreateDeliveryRequest, DeliveryLineItemRequest, DeliveryResponse) in backend/src/main/java/com/wellkorea/backend/delivery/dto/
- [ ] T138 [US5] Add validation (quantity_delivered <= quotation quantity, prevent over-delivery)
- [ ] T139 [US5] Implement delivered quantity tracking to prevent double-invoicing

### Frontend Implementation for User Story 5

- [ ] T140 [US5] Create DeliveryService API client in frontend/src/services/deliveryService.ts
- [ ] T141 [US5] Create DeliveryListPage for a project in frontend/src/pages/deliveries/DeliveryListPage.tsx
- [ ] T142 [US5] Create CreateDeliveryPage with product-quantity selection in frontend/src/pages/deliveries/CreateDeliveryPage.tsx
- [ ] T143 [US5] Create DeliveryDetailPage with transaction statement download in frontend/src/pages/deliveries/DeliveryDetailPage.tsx
- [ ] T144 [US5] Add delivery status display on project detail page
- [ ] T145 [US5] Add role-based access (Finance can create deliveries, Sales can view read-only)

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

- [ ] T146 [P] [US6] Write contract tests for POST /api/invoices endpoint (auto-populates from delivery, validates line items match delivery) in backend/src/test/java/com/wellkorea/backend/invoice/controller/InvoiceControllerTest.java - MUST FAIL initially
- [ ] T147 [P] [US6] Write contract tests for POST /api/invoices/{id}/payments endpoint (validates payment <= invoice total) in backend/src/test/java/com/wellkorea/backend/invoice/controller/PaymentControllerTest.java - MUST FAIL initially
- [ ] T148 [P] [US6] Write contract tests for GET /api/reports/ar and GET /api/reports/ap endpoints (aging analysis) in backend/src/test/java/com/wellkorea/backend/invoice/controller/ReportControllerTest.java - MUST FAIL initially
- [ ] T149 [US6] Write unit tests for InvoiceService (remaining receivable calculation, prevent double-invoicing) in backend/src/test/java/com/wellkorea/backend/invoice/service/InvoiceServiceTest.java - MUST FAIL initially
- [ ] T150 [US6] Write unit tests for ARAPReportService (aging analysis 30/60/90+ days) in backend/src/test/java/com/wellkorea/backend/invoice/service/ARAPReportServiceTest.java - MUST FAIL initially

### Database Schema for User Story 6

- [ ] T151 Create Flyway migration V12__create_invoice_domain.sql for TaxInvoice, InvoiceLineItem, Payment tables

### Backend Implementation for User Story 6

- [ ] T147 [P] [US6] Create TaxInvoice entity (with delivery_id foreign key for auto-population per FR-035) in backend/src/main/java/com/wellkorea/backend/invoice/domain/TaxInvoice.java
- [ ] T148 [P] [US6] Create InvoiceLineItem entity in backend/src/main/java/com/wellkorea/backend/invoice/domain/InvoiceLineItem.java
- [ ] T149 [P] [US6] Create Payment entity in backend/src/main/java/com/wellkorea/backend/invoice/domain/Payment.java
- [ ] T150 [P] [US6] Create InvoiceStatus enum in backend/src/main/java/com/wellkorea/backend/invoice/domain/InvoiceStatus.java
- [ ] T151 [US6] Create TaxInvoiceRepository in backend/src/main/java/com/wellkorea/backend/invoice/infrastructure/persistence/TaxInvoiceRepository.java (depends on T147)
- [ ] T152 [US6] Create PaymentRepository in backend/src/main/java/com/wellkorea/backend/invoice/infrastructure/persistence/PaymentRepository.java (depends on T149)
- [ ] T153 [US6] Implement InvoiceService with create, calculate remaining receivable, status updates in backend/src/main/java/com/wellkorea/backend/invoice/service/InvoiceService.java
- [ ] T154 [US6] Implement PaymentService with record payment, validate amounts in backend/src/main/java/com/wellkorea/backend/invoice/service/PaymentService.java
- [ ] T155 [US6] Implement InvoicePdfService to generate tax invoice PDFs in backend/src/main/java/com/wellkorea/backend/invoice/service/InvoicePdfService.java
- [ ] T156 [US6] Implement ARAPReportService for aging analysis and customer/supplier reports in backend/src/main/java/com/wellkorea/backend/invoice/service/ARAPReportService.java
- [ ] T157 [US6] Create InvoiceController with REST endpoints in backend/src/main/java/com/wellkorea/backend/invoice/controller/InvoiceController.java
- [ ] T158 [US6] Create PaymentController with REST endpoints in backend/src/main/java/com/wellkorea/backend/invoice/controller/PaymentController.java
- [ ] T159 [US6] Create ReportController with AR/AP report endpoints in backend/src/main/java/com/wellkorea/backend/invoice/controller/ReportController.java
- [ ] T160 [US6] Create DTOs (CreateInvoiceRequest, RecordPaymentRequest, InvoiceResponse, ARReportResponse) in backend/src/main/java/com/wellkorea/backend/invoice/dto/
- [ ] T161 [US6] Add validation (invoice line items match delivery, payments <= invoice total, no negative amounts except refunds)
- [ ] T162 [US6] Implement invoiced quantity tracking to prevent double-invoicing

### Frontend Implementation for User Story 6

- [ ] T163 [US6] Create InvoiceService API client in frontend/src/services/invoiceService.ts
- [ ] T164 [US6] Create PaymentService API client in frontend/src/services/paymentService.ts
- [ ] T165 [US6] Create InvoiceListPage with filters (customer, status, date range) in frontend/src/pages/invoices/InvoiceListPage.tsx
- [ ] T166 [US6] Create CreateInvoicePage with delivery auto-population in frontend/src/pages/invoices/CreateInvoicePage.tsx
- [ ] T167 [US6] Create InvoiceDetailPage with payment history in frontend/src/pages/invoices/InvoiceDetailPage.tsx
- [ ] T168 [US6] Create RecordPaymentModal in frontend/src/components/invoices/RecordPaymentModal.tsx
- [ ] T169 [US6] Create ARReportPage with aging analysis and customer breakdown in frontend/src/pages/reports/ARReportPage.tsx
- [ ] T170 [US6] Create APReportPage with supplier breakdown in frontend/src/pages/reports/APReportPage.tsx
- [ ] T171 [US6] Add role-based access (Finance only for invoices and AR/AP reports)

**Checkpoint**: Invoicing and AR/AP tracking complete - financial visibility with aging analysis

---

## Phase 10: User Story 7 - Document Management & Central Storage (Priority: P3)

**Goal**: Implement document upload, tagging, search, and virtual tree view

**Independent Test**: Can be fully tested by:
1. Uploading 20 mixed files (PDF, DXF, JPG, XLSX) with tagging
2. Searching by JobCode and finding all related documents
3. Searching by product name and finding documents across JobCodes
4. Navigating virtual tree (company → project → JobCode → product → document)

### Tests for User Story 7 (Write FIRST - Red-Green-Refactor)

> **⚠️ Constitution Requirement**: These tests MUST be written FIRST and MUST FAIL before implementation begins

- [ ] T172 [P] [US7] Write contract tests for POST /api/documents endpoint (validates file size <= 100MB, MIME type, metadata tagging) in backend/src/test/java/com/wellkorea/backend/document/controller/DocumentControllerTest.java - MUST FAIL initially
- [ ] T173 [P] [US7] Write contract tests for GET /api/documents/search endpoint (search by JobCode, product name, owner_type) in backend/src/test/java/com/wellkorea/backend/document/controller/DocumentControllerTest.java - MUST FAIL initially
- [ ] T174 [P] [US7] Write contract tests for GET /api/documents/{id}/download endpoint and DELETE /api/documents/{id} in backend/src/test/java/com/wellkorea/backend/document/controller/DocumentControllerTest.java - MUST FAIL initially
- [ ] T175 [US7] Write unit tests for DocumentService (virtual tree structure, document access audit logging) in backend/src/test/java/com/wellkorea/backend/document/service/DocumentServiceTest.java - MUST FAIL initially

### Database Schema for User Story 7

- [ ] T172 Create Flyway migration V13__create_document_domain.sql for Document table

### Backend Implementation for User Story 7

- [ ] T173 [P] [US7] Create Document entity in backend/src/main/java/com/wellkorea/backend/document/domain/Document.java
- [ ] T174 [P] [US7] Create DocumentType enum in backend/src/main/java/com/wellkorea/backend/document/domain/DocumentType.java
- [ ] T175 [US7] Create DocumentRepository with search queries in backend/src/main/java/com/wellkorea/backend/document/infrastructure/persistence/DocumentRepository.java (depends on T173)
- [ ] T176 [US7] Implement DocumentService with upload, download, search, version management in backend/src/main/java/com/wellkorea/backend/document/service/DocumentService.java
- [ ] T177 [US7] Implement MinioStorageService for S3 file operations in backend/src/main/java/com/wellkorea/backend/document/service/MinioStorageService.java
- [ ] T178 [US7] Create DocumentController with REST endpoints (/api/documents - GET, POST, DELETE, GET /{id}/download, GET /search) in backend/src/main/java/com/wellkorea/backend/document/controller/DocumentController.java
- [ ] T179 [US7] Create DTOs (UploadDocumentRequest, DocumentResponse, DocumentSearchRequest) in backend/src/main/java/com/wellkorea/backend/document/dto/
- [ ] T180 [US7] Add validation (file size <= 100MB, MIME type validation, metadata tagging)
- [ ] T181 [US7] Implement document access audit logging (who accessed which documents)
- [ ] T182 [US7] Implement virtual tree structure (owner_type + owner_id for polymorphic relationships)

### Frontend Implementation for User Story 7

- [ ] T183 [US7] Create DocumentService API client in frontend/src/services/documentService.ts
- [ ] T184 [US7] Create DocumentListPage with search and filters in frontend/src/pages/documents/DocumentListPage.tsx
- [ ] T185 [US7] Create UploadDocumentModal with drag-and-drop in frontend/src/components/documents/UploadDocumentModal.tsx
- [ ] T186 [US7] Create VirtualTreeView for hierarchical navigation in frontend/src/components/documents/VirtualTreeView.tsx
- [ ] T187 [US7] Add document upload/view on project detail page
- [ ] T188 [US7] Add role-based access (Production can upload/view work photos, Finance can view quotations)

**Checkpoint**: Document management complete - centralized storage with powerful search and virtual tree navigation

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

### Frontend Implementation for User Story 8

- [ ] T224 [US8] Create ServiceCategoryService API client in frontend/src/services/purchasing/serviceCategoryService.ts
- [ ] T225 [US8] Create VendorOfferingService API client in frontend/src/services/purchasing/vendorOfferingService.ts
- [ ] T226 [US8] Create PurchaseRequestService API client in frontend/src/services/purchasing/purchaseRequestService.ts
- [ ] T227 [US8] Create PurchaseOrderService API client in frontend/src/services/purchasing/purchaseOrderService.ts
- [ ] T228 [US8] Create ServiceCategoryListPage (Admin) in frontend/src/pages/purchasing/ServiceCategoryListPage.tsx
- [ ] T229 [US8] Create VendorOfferingListPage with "select service → show vendors" in frontend/src/pages/purchasing/VendorOfferingListPage.tsx
- [ ] T230 [US8] Create CreatePurchaseRequestPage with vendor suggestions in frontend/src/pages/purchasing/CreatePurchaseRequestPage.tsx
- [ ] T231 [US8] Create PurchaseRequestDetailPage with RFQ tracking in frontend/src/pages/purchasing/PurchaseRequestDetailPage.tsx
- [ ] T232 [US8] Create PurchaseOrderListPage with filters in frontend/src/pages/purchasing/PurchaseOrderListPage.tsx
- [ ] T233 [US8] Add purchasing display on project detail page with cost aggregation
- [ ] T234 [US8] Add role-based access (Admin/Finance can manage service categories and vendor offerings)

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
- **US7 - Documents (Phase 10)**: Depends on Foundational - Can run in parallel with any user story
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
- **US7 (Documents)**: Independent - can run in parallel with any story
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

- US9 (RBAC), US3 (Products), US7 (Documents), Company Domain can all run in parallel
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
10. **Documents**: + US7 → Document management complete (~16 tasks)
11. **Purchasing**: + US8 → Vendor service management complete (~46 tasks) **← UPDATED 2025-12-23**
12. **Polish**: Final validation and deployment (~23 tasks)

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

- **Developer A**: US9 (RBAC) → US1 (JobCode) → US4 (Production)
- **Developer B**: US3 (Products) → US2 (Quotation) → US5 (Delivery) → US6 (Invoicing)
- **Developer C**: US7 (Documents) → US8 (Purchasing) → Polish

Stories integrate at natural boundaries (e.g., quotations use products from catalog, deliveries reference quotations).

---

## Summary

**Total Tasks**: ~340 tasks (280 implementation + 60 test-first tasks)
**MVP Tasks (P1)**: ~160 tasks (Setup + Foundational + US9 + US1 + Company Domain + US2 including test-first tasks + multi-level approval + FR-062 customer assignment)
**P2 Tasks**: ~105 tasks (US3 + US4 + US5 + US6 including test-first tasks)
**P3 Tasks**: ~52 tasks (US7 + US8 including test-first tasks)
**Polish Tasks**: ~23 tasks (Phase 12)

**Constitution Compliance**: ✅ **Test-First Development enforced** - 60 test tasks explicitly marked "Write FIRST - MUST FAIL initially" across all 9 user stories + Company domain

**Task Distribution by User Story** (including test-first tasks):
- Setup (Phase 1): 12 tasks
- Foundational (Phase 2): 19 tasks
- US9 - RBAC (Phase 3): 26 tasks (7 tests + 19 implementation)
- US1 - JobCode (Phase 4): 22 tasks (5 tests + 17 implementation)
- Company Domain (Phase 4a): 19 tasks (4 tests + 15 implementation) **← NEW 2025-12-23**
- US2 - Quotation (Phase 5): 57 tasks (13 tests + 44 implementation) **← Multi-Level Approval (+14 tasks)**
- US3 - Product Catalog (Phase 6): 19 tasks (4 tests + 15 implementation)
- US4 - Production Tracking (Phase 7): 20 tasks (4 tests + 16 implementation)
- US5 - Delivery (Phase 8): 20 tasks (4 tests + 16 implementation)
- US6 - Invoicing (Phase 9): 30 tasks (5 tests + 25 implementation)
- US7 - Documents (Phase 10): 20 tasks (4 tests + 16 implementation)
- US8 - Purchasing (Phase 11): 46 tasks (8 tests + 38 implementation) **← UPDATED 2025-12-23**
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
- User stories after Foundational: US3, US7 can run in parallel with any story
- US4, US8 can run in parallel after US1 completes
- Within each story: 2-5 entity/component tasks marked [P]
- **Within Approval Domain**: 7 entity tasks marked [P] (can create entities in parallel)

**Suggested MVP Scope**: Complete through Phase 5 (US2 Quotation) = ~138 tasks for first production-ready release (includes multi-level approval + FR-018c quotation revision notification + FR-062 Sales role customer assignment)

**Format Validation**: ✅ All tasks follow `- [ ] [ID] [P?] [Story?] Description with file path` format
