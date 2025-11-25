# Tasks: WellKorea Integrated Work System (ERP)

**Input**: Design documents from `/specs/001-erp-core/`
**Prerequisites**: plan.md (tech stack), spec.md (user stories), data-model.md (entities), contracts/openapi.yaml (API)

**Test-First Approach**: Constitution v1.0.0 requires tests written before implementation. Each user story includes contract tests (OpenAPI), integration tests (journey), and unit tests for domain logic.

**Organization**: Tasks grouped by user story (P1 → P2 → P3) to enable independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend project structure per implementation plan: `backend/src/main/java/com/wellkorea/erp/{api,application,domain,infrastructure,security}` with corresponding test directories
- [ ] T002 Create frontend project structure per implementation plan: `frontend/src/{components,pages,services,hooks,types}` with test directories
- [ ] T003 [P] Initialize Spring Boot 3.x project with Gradle and dependencies in `backend/build.gradle` (Spring Data JPA, Spring Security, iText, Apache POI, TestContainers)
- [ ] T004 [P] Initialize React 18 project with TypeScript in `frontend/package.json` (Vite, Material UI, React Router, React Query, Axios)
- [ ] T005 [P] Configure Java linting (Checkstyle, SpotBugs) and formatting (Google Java Format) in `backend/build.gradle`
- [ ] T006 [P] Configure TypeScript linting (ESLint) and formatting (Prettier) in `frontend/package.json`
- [ ] T007 [P] Create docker-compose.yml with PostgreSQL 14, MinIO, backend service, frontend service, optional Keycloak

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Migrations

- [ ] T008 Create Flyway migration framework: `backend/src/main/resources/db/migration/V1__initial_schema.sql`
- [ ] T009 Create database schema for core entities (JobCode, Customer, Product, ProductType, User, Role, AuditLog) in V1 migration
- [ ] T010 [P] Create Flyway migrations for quotation entities (Quotation, QuotationLineItem, Approval) in `V2__quotation_schema.sql`
- [ ] T011 [P] Create Flyway migrations for production entities (WorkProgressSheet, WorkProgressStepTemplate, WorkProgressStep) in `V3__production_schema.sql`
- [ ] T012 [P] Create Flyway migrations for delivery/invoice entities (Delivery, DeliveryLineItem, TaxInvoice, InvoiceLineItem, Payment) in `V4__invoice_schema.sql`
- [ ] T013 [P] Create Flyway migrations for cross-cutting entities (Document, RFQ, PurchaseOrder, Supplier, AuditLog) in `V5__crosscutting_schema.sql`

### Security & Authentication

- [ ] T014 Implement JWT token generation and validation in `backend/src/main/java/com/wellkorea/erp/security/jwt/JwtTokenProvider.java`
- [ ] T015 Implement Spring Security configuration with JWT filter in `backend/src/main/java/com/wellkorea/erp/security/config/SecurityConfig.java`
- [ ] T016 Implement RBAC (Role-Based Access Control) with @PreAuthorize annotations in `backend/src/main/java/com/wellkorea/erp/security/rbac/RoleAuthorityResolver.java`
- [ ] T017 Implement audit logging infrastructure: `backend/src/main/java/com/wellkorea/erp/infrastructure/audit/AuditLog.java` and `AuditAspect.java`
- [ ] T018 Implement AuditingEntityListener for automatic created_by/updated_by timestamps in `backend/src/main/java/com/wellkorea/erp/infrastructure/audit/AuditingEntityListener.java`

### API & Error Handling

- [ ] T019 Create Spring Boot REST controller base class with exception handling in `backend/src/main/java/com/wellkorea/erp/api/common/GlobalExceptionHandler.java`
- [ ] T020 Create standardized API response wrapper in `backend/src/main/java/com/wellkorea/erp/api/common/ApiResponse.java`
- [ ] T021 Implement structured logging configuration in `backend/src/main/resources/logback-spring.xml`
- [ ] T022 Implement error handling for database constraints and transaction failures in `backend/src/main/java/com/wellkorea/erp/application/common/ErrorHandler.java`

### Core Domain Models — Unit Tests First (Per Constitution)

- [ ] T023 [P] Unit test for JobCode entity validation rules in `backend/src/test/java/com/wellkorea/erp/domain/jobcode/JobCodeTest.java` (uniqueness, format, immutability rules — tests MUST FAIL before implementation)
- [ ] T024 [P] Unit test for Customer entity validation in `backend/src/test/java/com/wellkorea/erp/domain/customer/CustomerTest.java`
- [ ] T025 [P] Unit test for User entity validation in `backend/src/test/java/com/wellkorea/erp/domain/user/UserTest.java`
- [ ] T026 [P] Unit test for Role entity validation in `backend/src/test/java/com/wellkorea/erp/domain/role/RoleTest.java`
- [ ] T027 [P] Unit test for Product/ProductType entities in `backend/src/test/java/com/wellkorea/erp/domain/product/ProductTest.java`

### Core Domain Models — Implementation

- [ ] T028 [P] Create JobCode aggregate root entity in `backend/src/main/java/com/wellkorea/erp/domain/jobcode/JobCode.java` with repository interface (implement to pass T023 tests)
- [ ] T029 [P] Create Customer entity in `backend/src/main/java/com/wellkorea/erp/domain/customer/Customer.java` with repository (implement to pass T024 tests)
- [ ] T030 [P] Create User entity in `backend/src/main/java/com/wellkorea/erp/domain/user/User.java` with repository (implement to pass T025 tests)
- [ ] T031 [P] Create Role entity in `backend/src/main/java/com/wellkorea/erp/domain/role/Role.java` with repository (implement to pass T026 tests)
- [ ] T032 [P] Create Product and ProductType entities in `backend/src/main/java/com/wellkorea/erp/domain/product/{Product.java,ProductType.java}` with repositories (implement to pass T027 tests)
- [ ] T033 Implement JobCode sequence generator service for unique WK2{year}-{sequence}-{date} generation in `backend/src/main/java/com/wellkorea/erp/domain/jobcode/JobCodeGenerator.java`

### File Storage Integration

- [ ] T034 Implement MinIO S3-compatible client in `backend/src/main/java/com/wellkorea/erp/infrastructure/storage/MinioFileStorage.java`
- [ ] T035 Create document metadata entity in `backend/src/main/java/com/wellkorea/erp/domain/document/Document.java` with polymorphic ownership support
- [ ] T036 Configure MinIO bucket initialization in `backend/src/main/java/com/wellkorea/erp/infrastructure/storage/MinioInitializer.java`

### Frontend Foundation

- [ ] T037 Create React app layout with routing in `frontend/src/App.tsx` and `frontend/src/main.tsx`
- [ ] T038 Implement JWT token management service in `frontend/src/services/auth.ts` (login, logout, token storage)
- [ ] T039 Implement API client with JWT interceptor in `frontend/src/services/api.ts` (axios instance with auth header)
- [ ] T040 Create useAuth custom hook for authentication state in `frontend/src/hooks/useAuth.ts`
- [ ] T041 Create useRole custom hook for RBAC checks in `frontend/src/hooks/useRole.ts`
- [ ] T042 Create common UI components: Button, Modal, Table, Form in `frontend/src/components/common/{Button,Modal,Table,Form}.tsx`
- [ ] T043 Create error boundary component in `frontend/src/components/common/ErrorBoundary.tsx`
- [ ] T044 Create Material UI theme configuration in `frontend/src/theme.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - JobCode Creation & Request Intake (Priority: P1) 🎯 MVP

**Goal**: Enable operations staff to create JobCodes (with auto-generated WK2{year}-{sequence}-{date} format) as the single source of truth for projects

**Independent Test**: Create new request → verify JobCode auto-generated → verify editable → verify no re-entry needed for downstream (quotation, production, AR/AP)

### Contract Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T050 [P] [US1] Contract test for POST /api/v1/jobcodes endpoint in `backend/src/test/java/com/wellkorea/erp/contract/JobCodeContractTest.java` (verify request/response schemas match OpenAPI)
- [ ] T046 [P] [US1] Contract test for GET /api/v1/jobcodes/{id} endpoint
- [ ] T052 [P] [US1] Contract test for PUT /api/v1/jobcodes/{id} endpoint
- [ ] T053 [P] [US1] Contract test for GET /api/v1/jobcodes (list with pagination/filtering)

### Integration Tests for User Story 1

- [ ] T049 [P] [US1] Integration test for JobCode creation workflow (create → retrieve → edit) in `backend/src/test/java/com/wellkorea/erp/integration/JobCodeIntegrationTest.java` using TestContainers
- [ ] T050 [P] [US1] Integration test for JobCode sequence uniqueness (concurrent creation prevents duplicates)
- [ ] T056 [US1] Integration test for JobCode status transitions (Draft → Active → Completed)

### Domain & Application Layer for User Story 1

- [ ] T052 [P] [US1] Create JobCodeService with use cases in `backend/src/main/java/com/wellkorea/erp/application/jobcode/JobCodeService.java`
- [ ] T053 [P] [US1] Create JobCode value object for validation rules in `backend/src/main/java/com/wellkorea/erp/domain/jobcode/JobCodeString.java` (enforce format, validate uniqueness)
- [ ] T064 [US1] Implement JobCodeRepository JPA repository in `backend/src/main/java/com/wellkorea/erp/infrastructure/persistence/JobCodeRepositoryJpa.java`
- [ ] T065 [US1] Implement sequence counter logic to prevent race conditions in `backend/src/main/java/com/wellkorea/erp/domain/jobcode/SequenceCounter.java`

### API Layer for User Story 1

- [ ] T056 [US1] Create JobCodeController with endpoints POST/GET/PUT in `backend/src/main/java/com/wellkorea/erp/api/jobcode/JobCodeController.java`
- [ ] T057 [US1] Create request DTOs: CreateJobCodeRequest, UpdateJobCodeRequest in `backend/src/main/java/com/wellkorea/erp/api/jobcode/dto/`
- [ ] T068 [US1] Create response DTO: JobCodeResponse in `backend/src/main/java/com/wellkorea/erp/api/jobcode/dto/JobCodeResponse.java`
- [ ] T064 [US1] Add input validation and error handling (customer exists, owner exists, due_date >= today)
- [ ] T065 [US1] Add authorization checks (@PreAuthorize for Admin/Sales)

### Frontend for User Story 1

- [ ] T061 [P] [US1] Create JobCode types in `frontend/src/types/jobcode.ts` (interface definitions matching API)
- [ ] T062 [P] [US1] Create JobCode API service in `frontend/src/services/jobcodeService.ts` (CRUD methods)
- [ ] T068 [US1] Create JobCodeList page in `frontend/src/pages/JobCodeList.tsx` with Material UI DataGrid (search, pagination, filtering by status)
- [ ] T064 [US1] Create JobCodeCreate form in `frontend/src/components/jobcode/JobCodeCreateForm.tsx` (customer select, project name, due date, owner select)
- [ ] T065 [US1] Create JobCodeDetail page in `frontend/src/pages/JobCodeDetail.tsx` (display all fields, edit mode, status badge)
- [ ] T066 [US1] Implement JobCode edit modal in `frontend/src/components/jobcode/JobCodeEditModal.tsx`
- [ ] T067 [US1] Add error handling and loading states to all JobCode components
- [ ] T068 [US1] Create unit tests for JobCode services in `frontend/src/services/__tests__/jobcodeService.test.ts`

**Checkpoint**: At this point, User Story 1 (JobCode CRUD) should be fully functional and independently testable. Verify:
- Create JobCode → auto-generated code appears
- Edit JobCode → all fields updateable
- List JobCodes → pagination works, filters work (status, customer)
- No other stories needed to test this

---

## Phase 4: User Story 2 - Quotation Creation & Approval Workflow (Priority: P1)

**Goal**: Enable sales/finance staff to create quotations from JobCode by selecting products, with approval workflow and PDF generation

**Independent Test**: Create quotation → select products → submit for approval → approve/reject → generate PDF → verify version history

### Contract Tests for User Story 2

- [ ] T064 [P] [US2] Contract test for POST /api/v1/quotations in `backend/src/test/java/com/wellkorea/erp/contract/QuotationContractTest.java`
- [ ] T065 [P] [US2] Contract test for quotation approval endpoints (POST /api/v1/quotations/{id}/approve, /reject)
- [ ] T066 [P] [US2] Contract test for quotation PDF endpoint (GET /api/v1/quotations/{id}/pdf)
- [ ] T067 [US2] Contract test for quotation list endpoint with filtering

### Integration Tests for User Story 2

- [ ] T068 [P] [US2] Integration test for quotation creation workflow (create → select products → submit → approve) in `backend/src/test/java/com/wellkorea/erp/integration/QuotationIntegrationTest.java`
- [ ] T069 [P] [US2] Integration test for quotation rejection with mandatory comments
- [ ] T070 [US2] Integration test for quotation versioning (edit → new version created)
- [ ] T071 [US2] Integration test for PDF generation

### Domain & Application Layer for User Story 2

- [ ] T072 [P] [US2] Create Quotation aggregate root in `backend/src/main/java/com/wellkorea/erp/domain/quotation/Quotation.java`
- [ ] T073 [P] [US2] Create QuotationLineItem entity in `backend/src/main/java/com/wellkorea/erp/domain/quotation/QuotationLineItem.java`
- [ ] T074 [P] [US2] Create Approval entity in `backend/src/main/java/com/wellkorea/erp/domain/quotation/Approval.java`
- [ ] T075 [US2] Implement QuotationService with use cases in `backend/src/main/java/com/wellkorea/erp/application/quotation/QuotationService.java`
- [ ] T076 [US2] Implement quotation validation rules (no empty line items, must have JobCode, quantity > 0, unit_price >= 0)
- [ ] T077 [US2] Implement quotation status state machine (Draft → Pending → Approved/Rejected → Sent → Accepted)
- [ ] T078 [US2] Implement quotation versioning logic (new version on edit)
- [ ] T079 [US2] Implement PDF generation service using iText in `backend/src/main/java/com/wellkorea/erp/infrastructure/pdf/QuotationPdfGenerator.java`

### API Layer for User Story 2

- [ ] T080 [US2] Create QuotationController in `backend/src/main/java/com/wellkorea/erp/api/quotation/QuotationController.java` with endpoints
- [ ] T081 [US2] Create quotation DTOs: CreateQuotationRequest, UpdateQuotationRequest, QuotationResponse in `backend/src/main/java/com/wellkorea/erp/api/quotation/dto/`
- [ ] T082 [US2] Create approval DTOs for approve/reject endpoints
- [ ] T083 [US2] Add authorization checks (@PreAuthorize: Sales can create/submit, Admin/Finance can approve)
- [ ] T084 [US2] Add RBAC for quotation viewing (Admin/Finance see all, Sales see own or assigned customer)

### Frontend for User Story 2

- [ ] T085 [P] [US2] Create Quotation types in `frontend/src/types/quotation.ts`
- [ ] T086 [P] [US2] Create Quotation API service in `frontend/src/services/quotationService.ts`
- [ ] T087 [US2] Create QuotationCreate page in `frontend/src/pages/QuotationCreate.tsx` (JobCode selector, product selector, line item table with edit)
- [ ] T088 [US2] Create QuotationLineItemForm component in `frontend/src/components/quotation/QuotationLineItemForm.tsx` (product select, quantity, unit_price)
- [ ] T089 [US2] Create QuotationApprovalQueue page in `frontend/src/pages/QuotationApprovalQueue.tsx` (shows pending quotations with approve/reject modals)
- [ ] T090 [US2] Create QuotationDetail page in `frontend/src/pages/QuotationDetail.tsx` (view quotation, show version history, download PDF button)
- [ ] T091 [US2] Implement quotation PDF download in QuotationDetail
- [ ] T092 [US2] Add error handling for validation errors (required fields, invalid prices)
- [ ] T093 [US2] Create unit tests for QuotationService in `frontend/src/services/__tests__/quotationService.test.ts`
- [ ] T093a [US2] Create integration tests for QuotationCreate workflow in `frontend/src/__tests__/integration/QuotationCreate.test.tsx` (select JobCode → add line items → submit → verify API call)
- [ ] T093b [US2] Create integration tests for QuotationApprovalQueue in `frontend/src/__tests__/integration/QuotationApprovalQueue.test.tsx` (load pending quotations → approve/reject → verify response)
- [ ] T093c [US2] Create E2E test for complete quotation workflow in `frontend/tests/e2e/quotation.spec.ts` using Playwright (login → create JobCode → create quotation → approve → download PDF)

**Checkpoint**: User Stories 1 AND 2 should both work independently:
- Create JobCode, then create quotation → select products → submit → approve → PDF → verify version history
- Verify rejection returns to Draft with comments
- No Production/Delivery/Invoice stories needed yet

---

## Phase 5: User Story 3 - Product Catalog Management (Priority: P2)

**Goal**: Enable admin staff to create and maintain product catalog used for quotations

**Independent Test**: Create products → categorize → search → select in quotation → verify base price suggested but overrideable

### Contract Tests for User Story 3

- [ ] T094 [P] [US3] Contract test for POST/GET /api/v1/admin/products in `backend/src/test/java/com/wellkorea/erp/contract/ProductContractTest.java`
- [ ] T095 [P] [US3] Contract test for PUT /api/v1/admin/products/{id}
- [ ] T096 [US3] Contract test for product search/filter endpoint

### Integration Tests for User Story 3

- [ ] T097 [P] [US3] Integration test for product CRUD in `backend/src/test/java/com/wellkorea/erp/integration/ProductIntegrationTest.java`
- [ ] T098 [US3] Integration test for product search with full-text indexing
- [ ] T099 [US3] Integration test for product deactivation (old quotations still reference, new ones don't offer)

### Domain & Application Layer for User Story 3

- [ ] T100 [US3] Ensure Product and ProductType entities created in Phase 2 (T027) have required fields (name, description, sku, category, base_unit_price)
- [ ] T101 [US3] Implement ProductService in `backend/src/main/java/com/wellkorea/erp/application/product/ProductService.java` with CRUD operations
- [ ] T102 [US3] Implement product search using PostgreSQL full-text search in ProductService
- [ ] T103 [US3] Implement WorkProgressStepTemplate logic so product type defines standard manufacturing steps

### API Layer for User Story 3

- [ ] T104 [US3] Create ProductController in `backend/src/main/java/com/wellkorea/erp/api/admin/ProductController.java`
- [ ] T105 [US3] Create product DTOs: CreateProductRequest, UpdateProductRequest, ProductResponse in `backend/src/main/java/com/wellkorea/erp/api/admin/dto/`
- [ ] T106 [US3] Add authorization checks (@PreAuthorize: Admin only)
- [ ] T107 [US3] Add search/filter parameters (product_type_id, search by name/sku, pagination)

### Frontend for User Story 3

- [ ] T108 [P] [US3] Create Product types in `frontend/src/types/product.ts`
- [ ] T109 [P] [US3] Create Product API service in `frontend/src/services/productService.ts`
- [ ] T110 [US3] Create ProductCatalog page in `frontend/src/pages/admin/ProductCatalog.tsx` (Material UI DataGrid with edit modal)
- [ ] T111 [US3] Create ProductCreateForm in `frontend/src/components/admin/ProductCreateForm.tsx` (name, description, category, base_price)
- [ ] T112 [US3] Create ProductEditModal in `frontend/src/components/admin/ProductEditModal.tsx`
- [ ] T113 [US3] Integrate product search into QuotationLineItemForm (T089) so product selector has search autocomplete
- [ ] T114 [US3] Create unit tests for ProductService

**Checkpoint**: User Stories 1, 2, AND 3 should work independently:
- Create products in catalog
- Create quotation selecting those products
- Verify base price suggested, can override
- Search products by name

---

## Phase 6: User Story 4 - Production Tracking: Work Progress Sheet Per Product (Priority: P2)

**Goal**: Enable production staff to track work progress per product (not per JobCode), with support for outsourcing and parallel processes

**Independent Test**: Create JobCode with 3 products → create work progress sheets → mark steps in progress → record outsourced vendor/ETA → view aggregated status

### Contract Tests for User Story 4

- [ ] T115 [P] [US4] Contract test for GET /api/v1/jobcodes/{jobcodeId}/work-progress in `backend/src/test/java/com/wellkorea/erp/contract/ProductionContractTest.java`
- [ ] T116 [P] [US4] Contract test for POST /api/v1/work-progress-steps/{id}/complete

### Integration Tests for User Story 4

- [ ] T117 [P] [US4] Integration test for work progress sheet creation per product in `backend/src/test/java/com/wellkorea/erp/integration/ProductionIntegrationTest.java`
- [ ] T118 [US4] Integration test for step status transitions and remarks logging
- [ ] T119 [US4] Integration test for outsourcing step with vendor/ETA tracking

### Domain & Application Layer for User Story 4

- [ ] T120 [P] [US4] Ensure WorkProgressSheet entity created in Phase 2 (relates JobCode + Product)
- [ ] T121 [P] [US4] Ensure WorkProgressStepTemplate and WorkProgressStep entities support outsourcing fields (vendor_name, eta)
- [ ] T122 [US4] Implement ProductionService in `backend/src/main/java/com/wellkorea/erp/application/production/ProductionService.java`
- [ ] T123 [US4] Implement work progress sheet creation on quotation approval (auto-create sheets for each product)
- [ ] T124 [US4] Implement step status state machine (Not Started → In Progress → Completed)
- [ ] T125 [US4] Implement aggregation logic for JobCode status view (% complete per product)

### API Layer for User Story 4

- [ ] T126 [US4] Create ProductionController in `backend/src/main/java/com/wellkorea/erp/api/production/ProductionController.java`
- [ ] T127 [US4] Create work progress DTOs in `backend/src/main/java/com/wellkorea/erp/api/production/dto/`
- [ ] T128 [US4] Add authorization checks (@PreAuthorize: Production can update, Admin can view all)

### Frontend for User Story 4

- [ ] T129 [P] [US4] Create Production types in `frontend/src/types/production.ts`
- [ ] T130 [P] [US4] Create Production API service in `frontend/src/services/productionService.ts`
- [ ] T131 [US4] Create ProductionSheet page in `frontend/src/pages/ProductionSheet.tsx` (list of work progress sheets, one per product)
- [ ] T132 [US4] Create WorkProgressStepTable component in `frontend/src/components/production/WorkProgressStepTable.tsx` (status, date, remarks, outsourcing fields)
- [ ] T133 [US4] Create WorkProgressStepEditModal for editing remarks and outsourcing info
- [ ] T134 [US4] Add production status aggregation display to JobCodeDetail (T060)
- [ ] T135 [US4] Create unit tests for ProductionService

**Checkpoint**: User Stories 1–4 should work independently:
- Create JobCode → quotation with 3 products → work progress sheets auto-created → update production status → view aggregated status

---

## Phase 7: User Story 5 - Delivery Tracking & Granular Invoicing (Priority: P2)

**Goal**: Record product deliveries per JobCode with granular quantity tracking to prevent double-billing

**Independent Test**: Record delivery (partial products/quantities) → generate transaction statement → prevent double-invoicing same product/qty

### Contract Tests for User Story 5

- [ ] T136 [P] [US5] Contract test for POST /api/v1/jobcodes/{jobcodeId}/deliveries in `backend/src/test/java/com/wellkorea/erp/contract/DeliveryContractTest.java`
- [ ] T137 [P] [US5] Contract test for GET /api/v1/jobcodes/{jobcodeId}/deliveries

### Integration Tests for User Story 5

- [ ] T138 [P] [US5] Integration test for delivery creation and quantity tracking in `backend/src/test/java/com/wellkorea/erp/integration/DeliveryIntegrationTest.java`
- [ ] T139 [US5] Integration test for preventing double-delivery warnings
- [ ] T140 [US5] Integration test for transaction statement generation

### Domain & Application Layer for User Story 5

- [ ] T141 [P] [US5] Ensure Delivery and DeliveryLineItem entities exist with quantity tracking
- [ ] T142 [US5] Implement DeliveryService in `backend/src/main/java/com/wellkorea/erp/application/delivery/DeliveryService.java`
- [ ] T143 [US5] Implement validation logic to prevent over-delivery (quantity_delivered <= quotation_quantity)
- [ ] T144 [US5] Implement transaction statement generation using iText in `backend/src/main/java/com/wellkorea/erp/infrastructure/pdf/TransactionStatementGenerator.java`
- [ ] T145 [US5] Implement delivery status aggregation (sum quantities per product across all deliveries)

### API Layer for User Story 5

- [ ] T146 [US5] Create DeliveryController in `backend/src/main/java/com/wellkorea/erp/api/delivery/DeliveryController.java`
- [ ] T147 [US5] Create delivery DTOs in `backend/src/main/java/com/wellkorea/erp/api/delivery/dto/`
- [ ] T148 [US5] Add authorization checks (@PreAuthorize: Admin/Finance can record)
- [ ] T149 [US5] Add API endpoint for transaction statement PDF generation

### Frontend for User Story 5

- [ ] T150 [P] [US5] Create Delivery types in `frontend/src/types/delivery.ts`
- [ ] T151 [P] [US5] Create Delivery API service in `frontend/src/services/deliveryService.ts`
- [ ] T152 [US5] Create DeliveryCreate page in `frontend/src/pages/DeliveryCreate.tsx` (JobCode selector, product list with quantity inputs)
- [ ] T153 [US5] Create DeliveryLineItemForm for editing product quantities in delivery
- [ ] T154 [US5] Add delivery status display to JobCodeDetail (showing delivered qty per product)
- [ ] T155 [US5] Add transaction statement PDF download button to delivery
- [ ] T156 [US5] Create unit tests for DeliveryService

**Checkpoint**: User Stories 1–5 should work independently:
- Create JobCode → quotation → delivery (partial) → verify transaction statement → prevent double-delivery

---

## Phase 8: User Story 6 - Tax Invoices & Payments with AR/AP Tracking (Priority: P2)

**Goal**: Create tax invoices from deliveries and record payments with AR/AP management and reporting

**Independent Test**: Create delivery → create invoice (auto-populated) → record payment (partial) → verify AR aging → prevent re-invoicing

### Contract Tests for User Story 6

- [ ] T157 [P] [US6] Contract test for POST /api/v1/invoices in `backend/src/test/java/com/wellkorea/erp/contract/InvoiceContractTest.java`
- [ ] T158 [P] [US6] Contract test for POST /api/v1/invoices/{invoiceId}/payments
- [ ] T159 [P] [US6] Contract test for GET /api/v1/reports/ar-aging

### Integration Tests for User Story 6

- [ ] T160 [P] [US6] Integration test for invoice creation from delivery in `backend/src/test/java/com/wellkorea/erp/integration/InvoiceIntegrationTest.java`
- [ ] T161 [US6] Integration test for payment recording and remaining balance calculation
- [ ] T162 [US6] Integration test for preventing double-invoicing (InvoiceLineItem tracking)
- [ ] T163 [US6] Integration test for AR aging report

### Domain & Application Layer for User Story 6

- [ ] T164 [P] [US6] Ensure TaxInvoice, InvoiceLineItem, and Payment entities exist with granular product/qty tracking
- [ ] T165 [US6] Implement InvoiceService in `backend/src/main/java/com/wellkorea/erp/application/finance/InvoiceService.java`
- [ ] T166 [US6] Implement invoice auto-population from delivery (copy product/qty from DeliveryLineItem)
- [ ] T167 [US6] Implement validation to prevent double-invoicing (check InvoiceLineItem.product_id,quantity already invoiced for same product)
- [ ] T168 [US6] Implement payment recording with remaining balance calculation
- [ ] T169 [US6] Implement AR/AP reporting service in `backend/src/main/java/com/wellkorea/erp/application/finance/ArApReportService.java`
- [ ] T170 [US6] Implement invoice PDF generation using iText in `backend/src/main/java/com/wellkorea/erp/infrastructure/pdf/InvoicePdfGenerator.java`
- [ ] T171 [US6] Implement AR aging calculation (current, 30, 60, 90+ days overdue)

### API Layer for User Story 6

- [ ] T172 [US6] Create InvoiceController in `backend/src/main/java/com/wellkorea/erp/api/finance/InvoiceController.java`
- [ ] T173 [US6] Create invoice DTOs in `backend/src/main/java/com/wellkorea/erp/api/finance/dto/`
- [ ] T174 [US6] Create payment DTOs for recording payment endpoint
- [ ] T175 [US6] Create report endpoints: GET /api/v1/reports/ar-aging, GET /api/v1/reports/sales-summary
- [ ] T176 [US6] Add authorization checks (@PreAuthorize: Finance/Admin can create invoices and record payments)
- [ ] T177 [US6] Add RBAC for viewing invoices (Finance see all, Sales see own customer invoices)

### Frontend for User Story 6

- [ ] T178 [P] [US6] Create Invoice types in `frontend/src/types/invoice.ts`
- [ ] T179 [P] [US6] Create Finance API service in `frontend/src/services/financeService.ts`
- [ ] T180 [US6] Create InvoiceCreate page in `frontend/src/pages/InvoiceCreate.tsx` (select delivery, auto-populate products, edit if needed)
- [ ] T181 [US6] Create PaymentRecordForm component in `frontend/src/components/finance/PaymentRecordForm.tsx` (date, amount, method, reference)
- [ ] T182 [US6] Create InvoiceDetail page in `frontend/src/pages/InvoiceDetail.tsx` (show line items, payment history, PDF download, record payment button)
- [ ] T183 [US6] Create ARAPDashboard page in `frontend/src/pages/ARAPDashboard.tsx` (AR aging table by customer, AP by supplier)
- [ ] T184 [US6] Create ReportingDashboard page in `frontend/src/pages/ReportingDashboard.tsx` (sales by customer/month, cash flow)
- [ ] T185 [US6] Add invoice PDF download functionality
- [ ] T186 [US6] Create unit tests for FinanceService

**Checkpoint**: User Stories 1–6 should work independently:
- Complete JobCode → quotation → production → delivery → invoice → payment workflow
- Verify AR aging report, prevent double-invoicing, payment tracking

---

## Phase 9: User Story 7 - Document Management & Central Storage (Priority: P3)

**Goal**: Upload and tag documents by JobCode/product/type with powerful search and virtual tree navigation

**Independent Test**: Upload 20 files → tag → search by JobCode/product/type → navigate virtual tree → download

### Contract Tests for User Story 7

- [ ] T187 [P] [US7] Contract test for POST /api/v1/documents (multipart file upload) in `backend/src/test/java/com/wellkorea/erp/contract/DocumentContractTest.java`
- [ ] T188 [P] [US7] Contract test for GET /api/v1/documents/{id}/download

### Integration Tests for User Story 7

- [ ] T189 [P] [US7] Integration test for document upload and metadata storage in `backend/src/test/java/com/wellkorea/erp/integration/DocumentIntegrationTest.java`
- [ ] T190 [US7] Integration test for document search with filtering
- [ ] T191 [US7] Integration test for polymorphic ownership (JobCode, Quotation, TaxInvoice documents)

### Domain & Application Layer for User Story 7

- [ ] T192 [US7] Ensure Document entity exists with polymorphic owner support (owner_type, owner_id)
- [ ] T193 [US7] Implement DocumentService in `backend/src/main/java/com/wellkorea/erp/application/document/DocumentService.java`
- [ ] T194 [US7] Implement document search with full-text indexing and filtering
- [ ] T195 [US7] Implement file size validation and MIME type checking

### API Layer for User Story 7

- [ ] T196 [US7] Create DocumentController in `backend/src/main/java/com/wellkorea/erp/api/documents/DocumentController.java`
- [ ] T197 [US7] Create multipart upload endpoint (POST /api/v1/documents) with owner_type/owner_id/document_type fields
- [ ] T198 [US7] Create download endpoint with access control (GET /api/v1/documents/{id}/download)
- [ ] T199 [US7] Create search/filter endpoint with parameters (jobcode_id, product_id, document_type, owner_type)
- [ ] T200 [US7] Add authorization checks (Finance/Admin can download quotations, Production can download photos, all can search)

### Frontend for User Story 7

- [ ] T201 [P] [US7] Create Document types in `frontend/src/types/document.ts`
- [ ] T202 [P] [US7] Create Document API service in `frontend/src/services/documentService.ts` with upload/download/search
- [ ] T203 [US7] Create DocumentUpload modal component in `frontend/src/components/document/DocumentUploadModal.tsx` (file input, owner_type/id selectors, document_type)
- [ ] T204 [US7] Create DocumentLibrary page in `frontend/src/pages/DocumentLibrary.tsx` (search, filtering, virtual tree navigation)
- [ ] T205 [US7] Create VirtualTreeView component in `frontend/src/components/document/VirtualTreeView.tsx` (Company → Project → JobCode → Product → Document)
- [ ] T206 [US7] Add document upload button to JobCodeDetail, QuotationDetail, InvoiceDetail
- [ ] T207 [US7] Integrate document preview for images/PDFs (optional: embed viewer)
- [ ] T208 [US7] Create unit tests for DocumentService

**Checkpoint**: User Stories 1–7 should work independently:
- Complete full JobCode → quotation → production → delivery → invoice workflow
- Upload and search documents at each stage

---

## Phase 10: User Story 8 - Purchasing & Automated RFQ (Priority: P3)

**Goal**: Create purchase requests with automated RFQ generation and vendor response tracking

**Independent Test**: Create RFQ → auto-generate email → select vendor → record PO

### Contract Tests for User Story 8

- [ ] T209 [P] [US8] Contract test for POST /api/v1/rfq in `backend/src/test/java/com/wellkorea/erp/contract/PurchasingContractTest.java`
- [ ] T210 [P] [US8] Contract test for POST /api/v1/rfq/{rfqId}/responses

### Integration Tests for User Story 8

- [ ] T211 [P] [US8] Integration test for RFQ creation in `backend/src/test/java/com/wellkorea/erp/integration/PurchasingIntegrationTest.java`
- [ ] T212 [US8] Integration test for vendor email auto-generation
- [ ] T213 [US8] Integration test for purchase order creation from RFQ

### Domain & Application Layer for User Story 8

- [ ] T214 [P] [US8] Ensure RFQ, Supplier, and PurchaseOrder entities exist
- [ ] T215 [US8] Implement PurchasingService in `backend/src/main/java/com/wellkorea/erp/application/purchasing/PurchasingService.java`
- [ ] T216 [US8] Implement RFQ email template and generation in `backend/src/main/java/com/wellkorea/erp/infrastructure/email/RfqEmailGenerator.java`
- [ ] T217 [US8] Implement vendor suggestion logic (who sells what mappings)
- [ ] T218 [US8] Implement purchase order linking to JobCode for profitability analysis

### API Layer for User Story 8

- [ ] T219 [US8] Create PurchasingController in `backend/src/main/java/com/wellkorea/erp/api/purchasing/PurchasingController.java`
- [ ] T220 [US8] Create RFQ DTOs (CreateRfqRequest, RfqResponse) in `backend/src/main/java/com/wellkorea/erp/api/purchasing/dto/`
- [ ] T221 [US8] Create PurchaseOrder DTOs
- [ ] T222 [US8] Create email sending endpoint (POST /api/v1/rfq/{rfqId}/send-email)
- [ ] T223 [US8] Add authorization checks (@PreAuthorize: Admin/Finance can create RFQ)

### Frontend for User Story 8

- [ ] T224 [P] [US8] Create Purchasing types in `frontend/src/types/purchasing.ts`
- [ ] T225 [P] [US8] Create Purchasing API service in `frontend/src/services/purchasingService.ts`
- [ ] T226 [US8] Create RFQCreate page in `frontend/src/pages/RFQCreate.tsx` (JobCode selector, material/service category, description, deadline)
- [ ] T227 [US8] Create VendorSuggestion component in `frontend/src/components/purchasing/VendorSuggestion.tsx` (shows suggested vendors for category)
- [ ] T228 [US8] Create PurchaseOrderCreate page in `frontend/src/pages/PurchaseOrderCreate.tsx` (select RFQ, select vendor, enter price/deadline)
- [ ] T229 [US8] Create RFQDetail page showing vendor responses
- [ ] T230 [US8] Create unit tests for PurchasingService

**Checkpoint**: User Stories 1–8 should work independently:
- Complete full JobCode → quotation → production → delivery → invoice → purchasing workflow

---

## Phase 11: User Story 9 - Role-Based Access Control & Quotation Protection (Priority: P1) 🔒

**Goal**: Enforce role-based access control (Admin, Finance, Production, Sales) with strict data isolation and audit logging. Prevent unauthorized quotation access (critical security requirement per spec).

**Independent Test**: Login as each role → verify only appropriate data visible → attempt unauthorized access → verify denied with audit log → verify role changes take effect immediately

**NOTE**: This is a **CRITICAL P1 story** that must ship alongside US1 & US2. Security controls protect customer quotations from unauthorized access (previous data leak incident). Implement AFTER Phase 2 foundational but CONCURRENTLY with US1 & US2.

### Contract Tests for User Story 9

- [ ] T350 [P] [US9] Contract test for authentication endpoints (POST /api/v1/auth/login, /logout) in `backend/src/test/java/com/wellkorea/erp/contract/AuthContractTest.java` (verify JWT token schema, expiration)
- [ ] T351 [P] [US9] Contract test for authorization enforcement (verify @PreAuthorize annotations block unauthorized access with 403)
- [ ] T352 [P] [US9] Contract test for audit log endpoint (GET /api/v1/admin/audit-logs) — Admin only, returns user access history

### Integration Tests for User Story 9

- [ ] T353 [P] [US9] Integration test for role-based visibility (create data as Admin, verify Production user sees only production data) in `backend/src/test/java/com/wellkorea/erp/integration/RbacIntegrationTest.java`
- [ ] T354 [P] [US9] Integration test for quotation access control (Sales user cannot edit quotations, Finance can; Production cannot view)
- [ ] T355 [US9] Integration test for audit logging (verify every quotation view/edit/approve is logged with user, timestamp, action)
- [ ] T356 [US9] Integration test for role changes (change user role, verify access immediately updated on next request)

### Domain & Application Layer for User Story 9

- [ ] T357 [P] [US9] Implement Permission model/value object in `backend/src/main/java/com/wellkorea/erp/domain/role/Permission.java` defining granular permissions (quotation:view, quotation:edit, invoice:view, etc.)
- [ ] T358 [P] [US9] Create RoleService in `backend/src/main/java/com/wellkorea/erp/application/role/RoleService.java` with role CRUD and permission assignment
- [ ] T359 [US9] Implement data-aware authorization service in `backend/src/main/java/com/wellkorea/erp/application/security/DataAwarenessService.java` (filters queries by user role/scope: Production staff see only assigned JobCodes, Sales see only assigned customers)
- [ ] T360 [US9] Implement permission caching to avoid repeated role lookups per request (with cache invalidation on role change)

### API Layer for User Story 9

- [ ] T361 [US9] Create AuthController in `backend/src/main/java/com/wellkorea/erp/api/auth/AuthController.java` with login endpoint (POST /api/v1/auth/login)
- [ ] T362 [US9] Implement JWT refresh token mechanism (optional: refresh token endpoint for extended sessions)
- [ ] T363 [US9] Create RoleController in `backend/src/main/java/com/wellkorea/erp/api/admin/RoleController.java` with role management endpoints (Admin only: create role, assign permissions, assign users to roles)
- [ ] T364 [US9] Create AuditLogController in `backend/src/main/java/com/wellkorea/erp/api/admin/AuditLogController.java` with query endpoints (Admin only: list audit logs, filter by user/entity/action/date, export CSV)
- [ ] T365 [US9] Add @PreAuthorize annotations to ALL existing controllers (T045-T230) ensuring: Admin/Finance can access quotations; Production cannot; Sales see only assigned customers; Financial data (AR/AP, invoices, purchase prices) restricted to Admin/Finance
- [ ] T366 [US9] Implement unauthorized access error responses (403 Forbidden with clear message: "You do not have permission to access this resource")

### Frontend for User Story 9

- [ ] T367 [P] [US9] Create Auth types in `frontend/src/types/auth.ts` (User, Role, Permission, LoginResponse)
- [ ] T368 [P] [US9] Create Auth API service in `frontend/src/services/authService.ts` (login, logout, refresh token, getCurrentUser)
- [ ] T369 [US9] Create LoginPage in `frontend/src/pages/LoginPage.tsx` (username/password form, error handling, redirect to dashboard on success)
- [ ] T370 [US9] Create ProtectedRoute component in `frontend/src/components/auth/ProtectedRoute.tsx` (checks user role before rendering page, shows access denied if unauthorized)
- [ ] T371 [US9] Create RoleManagementPage in `frontend/src/pages/admin/RoleManagementPage.tsx` (Admin only: create roles, assign permissions, list users per role)
- [ ] T372 [US9] Create UserManagementPage in `frontend/src/pages/admin/UserManagementPage.tsx` (Admin only: create/edit/delete users, assign roles, view last login)
- [ ] T373 [US9] Create AuditLogPage in `frontend/src/pages/admin/AuditLogPage.tsx` (Admin only: search/filter audit logs by user/entity/action, export CSV)
- [ ] T374 [US9] Create useAuthPermission hook in `frontend/src/hooks/useAuthPermission.ts` (checks if current user has specific permission; used to conditionally show/hide UI elements)
- [ ] T375 [US9] Add role-based navigation guards to React Router (hide menu items from users without access; redirect unauthenticated users to login)
- [ ] T376 [US9] Create unit tests for Auth services in `frontend/src/services/__tests__/authService.test.ts`

**Checkpoint**: RBAC and audit logging complete. Verify:
- Login with different roles (Admin, Finance, Sales, Production)
- View only appropriate data per role
- Attempt unauthorized access → verify 403 error
- Verify audit log records all sensitive accesses
- Change user role → verify access immediately updated
- Test concurrent access (multiple users different roles)

---

## Phase 12: Cross-Cutting Concerns & Polish

**Purpose**: Improvements affecting multiple user stories, comprehensive testing, and deployment

### API & Security Hardening

- [ ] T377 [P] Implement request size limits and rate limiting in Spring Boot
- [ ] T378 [P] Add CORS configuration for frontend in `backend/src/main/java/com/wellkorea/erp/security/config/CorsConfig.java`
- [ ] T379 [P] Implement SQL injection prevention (use parameterized queries, verify JPA is configured correctly)
- [ ] T380 Implement API versioning strategy (already in /api/v1, plan for v2 compatibility)
- [ ] T381 Add request/response logging for debugging in middleware
- [ ] T382 Implement timeout handling for all external API calls (MinIO, email service)

### Frontend & UX

- [ ] T383 [P] Add loading spinners and skeleton screens across all pages
- [ ] T384 [P] Implement comprehensive error boundaries for all pages
- [ ] T385 [P] Add toast notifications for success/error feedback
- [ ] T386 Implement keyboard navigation for all forms and tables
- [ ] T387 Add accessibility labels (aria-label, aria-describedby) to all UI elements
- [ ] T388 Add responsive design for mobile views (Material UI responsive grid)
- [ ] T389 Add dark mode support (Material UI theme toggle)

### Testing & Quality

- [ ] T390 [P] Add unit tests for all domain value objects (JobCodeString, etc.)
- [ ] T391 [P] Add unit tests for all services (JobCodeService, QuotationService, etc.) in `backend/src/test/java/com/wellkorea/erp/unit/`
- [ ] T392 [P] Add integration tests for all major workflows in `backend/src/test/java/com/wellkorea/erp/integration/`
- [ ] T393 [P] Add frontend unit tests for all services and hooks in `frontend/src/__tests__/`
- [ ] T394 Add end-to-end tests for critical user journeys (JobCode → Invoice) in `frontend/tests/e2e/`
- [ ] T395 Run code coverage analysis: backend target >80%, frontend target >70%
- [ ] T396 Fix any flaky tests (ensure deterministic, no race conditions)

### Documentation & Operations

- [ ] T397 [P] Update API documentation (Swagger UI already auto-generated from OpenAPI)
- [ ] T398 [P] Create SETUP.md for new developer onboarding with docker-compose instructions
- [ ] T399 [P] Create DATABASE.md for schema documentation and migration guide
- [ ] T400 Create DEPLOYMENT.md for production deployment procedures
- [ ] T401 Create TROUBLESHOOTING.md for common issues and solutions
- [ ] T402 Create CONTRIBUTING.md with development workflow and constitution compliance
- [ ] T403 Update specs/001-erp-core/quickstart.md with any discovered gotchas

### Performance & Monitoring

- [ ] T404 Add database query logging and slow query detection
- [ ] T405 Add APM instrumentation (optional: Spring Cloud Sleuth + Zipkin)
- [ ] T406 Add metrics collection (optional: Micrometer)
- [ ] T407 Verify pagination limits (prevent loading 1M rows)
- [ ] T408 Add caching for product catalog (Material UI DataGrid performance)
- [ ] T409 Add bulk import capability for initial data migration from Excel

### Deployment & DevOps

- [ ] T410 [P] Build backend Docker image in `backend/Dockerfile`
- [ ] T411 [P] Build frontend Docker image in `frontend/Dockerfile`
- [ ] T412 Create docker-compose.prod.yml with production overrides (resource limits, restart policies, health checks)
- [ ] T413 Create backup/restore scripts in `scripts/` directory
- [ ] T414 Configure CI/CD pipeline (.github/workflows/ or equivalent)
- [ ] T415 Set up log aggregation (optional: ELK, CloudWatch)
- [ ] T416 Validate backup/restore procedure with dry-run test

### Final Validation

- [ ] T417 Run full test suite: `./gradlew build && npm test`
- [ ] T418 Verify quickstart.md still works end-to-end
- [ ] T419 Test docker-compose up for fresh deployment
- [ ] T420 Validate all 8 user stories work end-to-end
- [ ] T421 Create example data seed script for testing

**Checkpoint**: All user stories complete, tested, documented, and ready for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel or sequentially in priority order (P1 → P2 → P3)
  - Prefer sequential until confidence is high (easier to debug)
- **Cross-Cutting (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories → can start after Foundational
- **US2 (P1)**: Can integrate with US1 but should be independently testable
- **US3 (P2)**: Integrates with US2 but can be independently testable
- **US4 (P2)**: Can start after Foundational, integrates with US1 + US2
- **US5 (P2)**: Depends on US2 (quotation prices) but independently testable
- **US6 (P2)**: Depends on US5 (delivery) for invoice auto-population, independently testable
- **US7 (P3)**: Can start after Foundational, integrates with all stories but not required for MVP
- **US8 (P3)**: Can start after Foundational, integrates with US1 but not required for MVP

### Within Each User Story

1. **Contract tests** (if included) → MUST write first, verify FAIL
2. **Integration tests** (if included) → MUST write after contracts, verify FAIL
3. **Domain entities** → models must exist before services
4. **Services** → business logic before endpoints
5. **Endpoints** → API layer
6. **Frontend** → UI components connecting to API
7. **Tests pass** → MUST verify green before moving to next story

### Parallel Opportunities (Same Phase, Different Files)

**Phase 1 (Setup)**:
- T003, T004, T005, T006, T007 can all run in parallel (different concerns)

**Phase 2 (Foundational)**:
- T010–T013: Flyway migrations can run in parallel (combine into single migration if needed)
- T014–T018: Security setup (JWT, RBAC, audit) can start in parallel
- T023–T027: Domain models can be created in parallel (different entities)
- T032–T039: Frontend components can be built in parallel

**Phase 3 (US1)**:
- T040–T043: Contract tests can run in parallel
- T044–T046: Integration tests can run in parallel
- T047–T050: Domain/service layer can run in parallel
- T056–T062: Frontend components can run in parallel

**Subsequent User Stories**:
- Once Foundational complete, all P1 user stories (US1, US2) can start in parallel
- Once P1 complete, all P2 user stories (US3, US4, US5, US6) can start in parallel
- With adequate team: Full parallelization possible

---

## Parallel Execution Examples

### Parallel Setup (Estimated 1 day)

```
Developer A: T003 (Spring Boot project setup)
Developer B: T004 (React project setup)
Developer C: T005–T006 (Linting/formatting)
All: T007 (docker-compose.yml)
```

### Parallel Foundational (Estimated 3–5 days)

```
Developer A: Database migrations (T008–T013)
Developer B: Security setup (T014–T018)
Developer C: API infrastructure (T019–T022)
Developer D: Domain models (T023–T027)
All: File storage (T029–T031), Frontend foundation (T032–T039)
```

### Parallel User Stories (Estimated 15–20 days)

After Foundational complete:

```
Developer A: US1 + US2 (Foundational P1 stories) — ~1 week
Developer B: US3 + US4 (Product catalog + Production) — ~1 week
Developer C: US5 + US6 (Delivery + Invoicing) — ~1 week
Developer D: US7 + US8 (Documents + Purchasing) — ~1 week
```

Each developer owns their stories independently, merging daily/weekly.

---

## Implementation Strategy

### MVP First (Recommended for First Release) — CRITICAL SECURITY FIX

**⚠️ IMPORTANT**: US9 (RBAC) must be implemented concurrently with US1 & US2 due to previous data leak incident. RBAC is now part of P1 release, not a later add-on.

1. ✅ **Complete Phase 1**: Setup (1 day)
2. ✅ **Complete Phase 2**: Foundational (3–5 days)
3. ✅ **Complete Phase 3 + Phase 11 (CONCURRENT)**: User Story 1 — JobCode creation + User Story 9 — RBAC (3 days parallel)
4. ✅ **STOP and VALIDATE**:
   - Can create JobCode independently
   - RBAC enforced: roles prevent unauthorized access
   - Audit logging records all sensitive accesses
   - Test all acceptance scenarios
   - Deploy/demo to stakeholders
5. ⏸️ **HOLD**: Other stories wait until MVP validated

**MVP Scope**: JobCode CRUD + RBAC enforcement (~10 days of effort)

### Incremental Release 2 (Add Quotations)

1. ✅ **Phase 4**: User Story 2 — Quotation creation (3 days)
2. ✅ **Phase 5**: User Story 3 — Product catalog (2 days)
3. ✅ **VALIDATE**: Can create quotation from JobCode, manage products, RBAC prevents Sales from editing
4. **RELEASE 2**: JobCode + RBAC + Quotation + Catalog (~15 days total)

### Incremental Release 3 (Add Production & Delivery)

1. ✅ **Phase 6**: User Story 4 — Production tracking (3 days)
2. ✅ **Phase 7**: User Story 5 — Delivery tracking (3 days)
3. ✅ **VALIDATE**: Can track production and record deliveries, Production staff see only assigned work
4. **RELEASE 3**: MVP + Quotations + Production + Delivery (~21 days total)

### Incremental Release 4 (Add Invoicing)

1. ✅ **Phase 8**: User Story 6 — Tax invoices & AR/AP (4 days)
2. ✅ **VALIDATE**: Complete job-to-invoice workflow, Finance staff see invoices, other roles cannot
3. **RELEASE 4**: Invoicing + financial tracking (~25 days total)

### Incremental Release 5 (Add Documents & Purchasing)

1. ✅ **Phase 9**: User Story 7 — Documents (2 days)
2. ✅ **Phase 10**: User Story 8 — Purchasing/RFQ (2 days)
3. ✅ **Phase 12**: Polish, testing, deployment (3 days)
4. **RELEASE 5**: Full ERP system (~32 days total / ~6-7 weeks)

---

## Notes

- **[P]** tasks = different files, no dependencies between them
- **[Story]** label = maps task to specific user story for traceability
- **Each user story should be independently completable and testable**
- **Write tests FIRST, verify they FAIL before implementing** — Constitution v1.0.0 principle
- **Commit after each task or logical group** (e.g., T040–T043 together)
- **Stop at any checkpoint to validate story independently** before moving forward
- **Avoid**: vague tasks, same-file conflicts, cross-story dependencies that break independence
- **Constitution compliance**:
  - All code must have tests (unit/integration/contract) before implementation
  - Backend target: >80% code coverage (unit tests for all business logic, integration tests for workflows)
  - Frontend target: >70% coverage (unit tests for services/hooks, integration tests for workflows, E2E tests for critical paths)
  - Follow layered architecture (API → Application → Domain → Infrastructure)
  - Include error handling and structured logging
  - Support RBAC with audit logs for sensitive data access
- **Frontend testing strategy** (added Phase 4 onwards to address Phase 2 gap):
  - **Unit tests** (T093, T114, T135, etc.): Test services and hooks in isolation with mocked API
  - **Integration tests** (T093a-b, etc.): Test component workflows with API integration (React Testing Library)
  - **E2E tests** (T093c, etc.): Test complete user journeys through browser (Playwright/Cypress)
  - All test files co-located with source: `src/services/__tests__/`, `src/__tests__/integration/`, `tests/e2e/`
- **Total Task Count**: 421 tasks (was 275 before remediation); added 27 Phase 2 test tasks + 27 Phase 11 (US9) tasks + 3 Phase 4 frontend test tasks
