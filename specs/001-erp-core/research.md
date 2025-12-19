# Phase 0: Research & Clarifications

**Date**: 2025-11-24 (Updated: 2025-12-01)
**Branch**: `001-erp-core`
**Status**: Complete

**Key Architectural Clarifications (2025-12-01)**:
- **Project is core domain**: JobCode is a unique business identifier for Project, not the domain itself
- **Domain-oriented backend**: Code organized by business domain (Project, Quotation, Approval, etc.) rather than technical layer
- **Approval as separate domain**: Approval workflows extracted from Quotation domain for reusability

---

## Architectural Decisions (Updated 2025-12-01)

### Domain-Oriented Backend Structure

**Decision**: Organize backend code by business domain (vertical slices) rather than technical layer (horizontal slices).

**Structure**:
```
backend/src/main/java/com/wellkorea/backend/
├── project/        # Project domain (core aggregate)
├── quotation/      # Quotation domain
├── approval/       # Approval workflow domain (cross-cutting)
├── product/        # Product catalog domain
├── production/     # Production tracking domain
├── delivery/       # Delivery tracking domain
├── invoice/        # Invoicing & payments domain
├── purchasing/     # Purchasing & RFQ domain
├── document/       # Document management domain
├── security/       # Security & RBAC (cross-cutting)
└── shared/         # Shared infrastructure
```

Each domain contains: `domain/` (entities), `repository/`, `service/`, `controller/`, `dto/`

**Rationale**:
- **Business alignment**: Domain directories mirror actual business capabilities
- **Team scalability**: Different teams can own different domains independently
- **Bounded contexts**: Clear boundaries reduce coupling, increase cohesion
- **Evolution path**: Domains can be extracted into microservices if needed
- **Cognitive load**: Developers can focus on one domain without knowing entire system
- **Single Responsibility**: Changes to one feature stay within one domain directory

**Alternatives Considered**:
- **Layered architecture** (controller/service/repository at top level): Rejected because changes to one feature touch multiple directories; violates Single Responsibility
- **Monolithic domain package**: Rejected due to poor scalability as codebase grows

---

### Project as Core Domain (not JobCode)

**Decision**: **Project** is the core domain entity. **JobCode** (format: WK2{year}-{sequence}-{date}) is a unique business identifier (natural key) on the Project entity.

**Rationale**:
- **Domain clarity**: "Project" is the business concept; "JobCode" is how humans refer to it
- **Database design**: Use surrogate key (ID) as primary key; JobCode as unique index
- **Flexibility**: JobCode format can evolve without breaking foreign key relationships
- **Consistency**: Other domains reference Project by ID, display JobCode to users

**Implementation**:
```java
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // Surrogate primary key

    @Column(unique = true, nullable = false)
    private String jobCode;  // WK2{year}-{sequence}-{date}

    private String customer;
    private String projectName;
    // ...
}
```

**Alternatives Considered**:
- **JobCode as entity name**: Rejected; confuses identifier with domain concept
- **JobCode as primary key**: Rejected; composite keys complicate JPA mapping

---

### Approval as Separate Domain (Multi-Level Sequential Approval)

**Decision**: Extract approval workflows (승인/결재) into dedicated `approval/` domain with **multi-level sequential approval** support.

**Clarification (2025-12-19)**: Approval requires sequential multi-level approval (팀장 → 부서장 → 사장). Each level references a specific user (not RBAC roles). Approval chain is fixed per entity type but configurable by Admin.

**Rationale**:
- **Reusability**: Approval logic shared across quotations, purchase orders, etc.
- **Single Responsibility**: Approval rules separate from quotation business logic
- **Audit compliance**: Centralized approval history meets FR-067
- **Workflow flexibility**: Approval chain configuration independent of entity logic
- **Korean business practice**: Sequential approval (결재 라인) with position-based approvers (팀장, 부서장, 사장)

**Implementation**:

**Multi-Level Approval Schema**:
- `ApprovalChainTemplate` - Defines approval chain per entity type (QUOTATION, PURCHASE_ORDER)
- `ApprovalChainLevel` - Ordered sequence of approvers (level_order, level_name, approver_user_id)
  - Level 1: 팀장 (Team Lead) - User ID X
  - Level 2: 부서장 (Department Head) - User ID Y
  - Level 3: 사장 (CEO) - User ID Z (if needed)
- `ApprovalRequest` - Workflow instance with current_level and total_levels
- `ApprovalLevelDecision` - Decision at each level (expected_approver_id, decided_by_id, decision)
- `ApprovalHistory` - Audit trail of all actions
- `ApprovalComment` - Discussion and rejection reasons

**Workflow**:
1. Admin configures approval chain with specific users (not roles)
2. Submitter creates approval request → `current_level = 1`
3. Only Level 1 approver (팀장) can approve/reject
4. After Level 1 approval → `current_level = 2`
5. Only Level 2 approver (부서장) can now approve/reject
6. After all levels approve → status = APPROVED
7. Any level rejection → status = REJECTED, workflow stops

**API Design**:
- `GET /approvals/chains` - List approval chain templates
- `GET /approvals/chains/{entityType}` - Get chain config for entity type
- `PUT /approvals/chains/{entityType}/levels` - Admin configures approval levels
- `POST /approvals` - Create approval request for any entity
- `GET /approvals/{id}` - Get approval request with level decisions
- `POST /approvals/{id}/approve` - Approve at current level (must be expected approver)
- `POST /approvals/{id}/reject` - Reject with mandatory comments
- `POST /quotations/{id}/submit-for-approval` - Convenience endpoint

**Alternatives Considered**:
- **Single-level approval**: Rejected; business requires sequential multi-level (팀장 → 부서장 → 사장)
- **Role-based approval levels**: Rejected; positions (팀장, 부서장) are not system roles (ADMIN, FINANCE)
- **Dynamic approval chains per request**: Deferred; fixed chains per entity type sufficient for MVP
- **Generic workflow engine (BPMN)**: Deferred; over-engineering for current sequential workflow

---

## Technology Stack Decisions

### Backend Framework: Java 21 + Spring Boot 3.5.8

**Decision**: Java 17 with Spring Boot 3.x (latest LTS release)

**Rationale**:
- **Transaction Management**: Spring Data JPA with Hibernate ensures ACID compliance for financial data (JobCode creation, invoice registration, payment posting must be atomic)
- **RBAC & Security**: Spring Security provides mature, battle-tested framework for role-based access control with method-level security annotations
- **PDF & Excel Processing**: Extensive library ecosystem (iText 7, PDFBox, Apache POI) for document generation and import/export required by spec
- **Type Safety**: Java's strong typing prevents silent data type conversions common in dynamic languages; critical for financial calculations
- **Production Maturity**: Proven track record in enterprise financial systems; excellent support for complex business rule validation

**Alternatives Considered**:
- Python/Django: Good for rapid development, but less mature RBAC and PDF libraries; weaker transaction semantics
- Node.js/NestJS: Lightweight and modern, but less suitable for complex financial transaction logic; TypeScript less common in accounting integrations
- .NET: Excellent choice but requires Windows licensing and different deployment model for on-premise Linux preference

**Justification**: Java/Spring aligns with financial system best practices and provides proven infrastructure for the complex domain (JobCode generation, quotation versioning, granular invoicing, AR/AP reconciliation).

---

### Database: PostgreSQL 14+

**Decision**: PostgreSQL as primary relational database

**Rationale**:
- **Constraints & Integrity**: Foreign key constraints, unique constraints, and check constraints enforce business rules at the database layer (e.g., prevent double-billing, enforce JobCode uniqueness)
- **ACID Transactions**: Full ACID compliance critical for financial data; PostgreSQL guarantees atomicity even with complex multi-table updates
- **Full-Text Search**: Built-in GIN/GiST indexes support fast searching by JobCode, customer name, product name, project description without separate search engine
- **JSON Support**: jsonb columns enable flexible metadata storage (quotation approval history, audit trail) without denormalization
- **On-Premise Friendly**: No licensing costs; easy backup/restore; widely supported in on-premise environments
- **EXPLAIN/EXPLAIN ANALYZE**: Superior query analysis tools for performance tuning at scale

**Data Volume Baseline**:
- 500–1000 JobCodes/month = 6,000–12,000 annually
- 12–24 months retention = 72,000–288,000 JobCodes in DB
- Per JobCode: ~10–50 related records (quotations, delivery items, invoices, payment installments)
- Estimated total rows: 1–5 million across all tables
- Estimated DB size: 10–50 GB (including document metadata)

**Alternatives Considered**:
- MySQL 8: Similar ACID support; PostgreSQL has superior constraint enforcement and JSON handling
- Oracle: Enterprise grade but requires licensing; PostgreSQL sufficient for this scale
- MongoDB: Document model doesn't match relational JobCode-centric workflows; double-billing prevention requires complex application logic

**Justification**: PostgreSQL provides the constraint enforcement and ACID guarantees needed to prevent financial data corruption in a system managing money and invoices.

---

### File Storage: S3-Compatible (MinIO or AWS S3)

**Decision**: S3-compatible object storage with metadata in PostgreSQL

**Rationale**:
- **Scalability**: Object storage designed for large files (3D drawings, PDF quotations, photos) without bloating relational DB
- **Versioning**: S3 versioning enables audit trail (e.g., all versions of a drawing preserved for compliance)
- **Access Control**: S3 presigned URLs allow backend to enforce RBAC (e.g., production staff can't download quotations)
- **On-Premise Option**: MinIO provides self-hosted S3-compatible alternative for data residency concerns
- **Backup & Restore**: Standard tools and practices for object storage backup

**Document Types Expected**:
- Quotations (PDF): 1–2 MB each; high confidentiality (Admin/Finance only)
- Work progress photos: 5–10 MB each; shared with production staff and customer
- 3D CAD files (drawings): 50–500 MB; high confidentiality; version control required
- Tax invoices (PDF): 1–2 MB; archived for 7 years
- RFQ attachments: variable size; shared with suppliers
- Purchase orders (PDF): 1–2 MB; archived

**Estimated Volume**: 50–200 documents per JobCode × 72,000–288,000 JobCodes = 3.6M–57.6M documents; total storage ~500 GB–5 TB

**Alternatives Considered**:
- File system storage: Works for on-premise but harder to backup and share; no versioning
- PostgreSQL bytea: Bloats database; poor performance for large files; no native versioning

**Justification**: S3-compatible storage is industry standard for financial document management; scales to support long-term archival requirements.

---

### Frontend: React 18+ with TypeScript + Material UI

**Decision**: React 18 with TypeScript SPA, Material UI component library, Vite build tool

**Rationale**:
- **Complex Data Tables**: Material UI DataGrid component handles 10,000+ row tables with sorting, filtering, pagination needed for JobCode lists, ledgers, work progress sheets
- **Form Complexity**: React Hook Form + Material UI supports complex forms (quotations with variable product counts, work progress sheets with many steps)
- **Type Safety**: TypeScript prevents passing wrong data types to API (e.g., string instead of ID)
- **Accessibility**: Material UI components built with WCAG 2.1 compliance; keyboard navigation and screen reader support built-in
- **Component Reusability**: Consistent design system reduces bugs from inconsistent UI patterns (required by constitution)
- **Vite Build Tool**: Fast development server and bundle size optimization

**State Management Decision**:
- React Context API for global auth state (JWT token, current user, roles)
- React Query for API data caching and synchronization
- No Redux needed (overcomplicated for this domain size)

**Key Pages** (tied to user stories):
- JobCode management (list, create, edit, status view)
- Quotation form (product selection, line items, pricing, approval queue)
- Production tracking (work progress sheet per product, step completion)
- Delivery/invoicing (partial delivery recording, invoice generation)
- AR/AP dashboard (outstanding invoices, payment posting, aging analysis)
- Reporting (sales by customer, project profitability, cash flow)
- Admin panel (product catalog, user management, roles, audit logs)

**Alternatives Considered**:
- Vue 3: Good ecosystem but smaller community and fewer enterprise component libraries
- Angular: Overkill for this application; steeper learning curve
- Svelte: Smaller ecosystem; fewer charting libraries for reporting dashboards

**Justification**: React + Material UI strikes balance between powerful capabilities and team productivity; Material UI accessibility compliance directly supports constitution UX principle.

---

### Authentication & Authorization: JWT + Spring Security (with optional Keycloak)

**Decision**: JWT-based stateless authentication with Spring Security RBAC

**Rationale**:
- **Stateless**: JWT tokens eliminate need for session storage; enables horizontal scaling if needed later
- **Fine-Grained RBAC**: Spring Security's @PreAuthorize annotations enable method-level access control (e.g., "only Finance role can post payments")
- **Data-Aware Filtering**: Custom Spring Security components can filter queries by user scope (e.g., Sales staff sees only their assigned JobCodes)
- **Audit Logging**: Every API call includes authenticated user; AuditingEntityListener logs all changes with user context
- **Optional SSO**: Keycloak integration available if organization needs Active Directory/LDAP integration later

**User Roles & Permissions**:
- **Admin**: Full system access; user management; audit log access; can override approvals
- **Finance**: Create/approve quotations; post tax invoices; post payments; view AR/AP
- **Sales**: Create quotations (READ-ONLY if not approver); view approved quotations for assigned customers; cannot edit approved quotations
- **Production**: View JobCode and work progress; update work progress; upload work photos; cannot see quotations or pricing

**Audit Logging Strategy**:
- Every transaction (JobCode creation, quotation approval, invoice registration, payment posting) logged with:
  - User ID, timestamp, action type, entity ID, before/after values
  - Immutable audit table with no delete capability (even admins can't modify audit logs)
  - Regular export for compliance audits

**Alternatives Considered**:
- OAuth 2.0 (e.g., Google/Microsoft login): Not suitable for internal company app; adds external dependency
- Simple password hashing: Insufficient for financial system; no audit trail; no RBAC enforcement

**Justification**: JWT + Spring Security is lightweight yet robust; audit logging meets financial compliance requirements (invoices must be traceable to user who created them).

---

### Testing Strategy

**Decision**: Test-first development (Red-Green-Refactor) with three test levels

**Test Structure**:

1. **Unit Tests** (70% of test suite)
   - Test individual domain classes, value objects, business logic
   - Example: JobCode generation rule (WK2{year}-{sequence}-{date})
   - Example: Quotation version comparison logic
   - Tool: JUnit 5 + Mockito
   - Coverage target: >80% of business logic code

2. **Integration Tests** (20% of test suite)
   - Test API endpoints end-to-end with real database (TestContainers)
   - Example: Create JobCode → Create Quotation → Register Delivery → Generate Invoice
   - Example: RBAC checks (Sales staff cannot see Finance-only data)
   - Tool: TestContainers (PostgreSQL) + REST Assured
   - Coverage: All critical user workflows

3. **Contract Tests** (10% of test suite)
   - Verify API contracts (OpenAPI/Swagger) match actual implementation
   - Detect breaking changes before merge
   - Tool: Spring Cloud Contract or Pact

**Frontend Testing**:
- Unit: React component rendering, hooks, services (Jest + React Testing Library)
- Integration: Page-level tests (form submission, API interaction)
- E2E: Critical user journeys (create JobCode → quotation → invoice) using Playwright/Cypress
- Accessibility: axe-core assertions in every component test

**Constitution Compliance**:
- All tests must pass before any merge (CI/CD gate)
- >80% code coverage required on backend
- Tests written before implementation code
- No flaky tests (must be fixed or removed)

**Alternatives Considered**:
- Behavior-driven testing (Cucumber): Adds complexity; cucumber-speak often diverges from actual code
- Manual testing: Insufficient for complex business rules and RBAC; regression risk too high

**Justification**: Test-first development enforces clarity of intent; three test levels provide confidence in both unit logic and integration behavior (critical for financial workflows).

---

### Reporting & Analytics

**Decision**: Built-in basic dashboards + optional Metabase for ad-hoc queries

**Built-In Dashboards** (in React frontend):
- Sales dashboard: Revenue by customer, by month, by product type
- Project profitability: Revenue vs. production cost per JobCode
- Cash flow: AR aging (30/60/90 day buckets), AP due dates, outstanding payments
- Workload: Production staff utilization, time to complete work by JobCode
- Inventory/stock dashboard: If materials tracking added later

**Chart Libraries**:
- Recharts: Simple line/bar/pie charts (native to React, good TypeScript support)
- Plotly: More advanced for scientific/financial visualizations if needed

**Optional Advanced Analytics** (external Metabase):
- Allow finance team to write custom SQL queries without code changes
- Materialized views in PostgreSQL for heavy aggregations (e.g., monthly sales report)
- Scheduled exports to Excel for audits

**Alternatives Considered**:
- Tableau/Power BI: Enterprise grade but require separate licensing and deployment
- Custom analytics service: Over-engineering for current scale

**Justification**: Metabase approach balances built-in user convenience (daily dashboards) with flexibility (ad-hoc queries for audits) without adding microservice overhead.

---

### Deployment & Infrastructure

**Decision**: On-premise Docker Compose deployment for single VM (pragmatic for SME)

**Architecture**:
```
Single Linux VM (Ubuntu 20.04 LTS or similar)
│
├── Docker Engine
│   ├── Backend Container (Spring Boot JAR)
│   ├── Frontend Container (Nginx serving React SPA)
│   ├── PostgreSQL Container (persistent volume)
│   ├── MinIO Container (persistent volume)
│   ├── Keycloak Container (optional, for SSO)
│   └── Metabase Container (optional, for analytics)
│
├── Nginx (reverse proxy, HTTPS termination)
│
├── Volume Mounts
│   ├── /data/postgres (PostgreSQL data)
│   ├── /data/minio (object storage)
│   └── /backups (nightly backups)
│
└── Cron Jobs
    ├── Nightly PostgreSQL backup to external storage
    ├── Nightly MinIO backup/snapshot
    └── Weekly integrity check script
```

**Docker Compose File** includes:
- Service health checks
- Resource limits (CPU, memory)
- Restart policies (auto-restart on failure)
- Network isolation (internal network for services, only Nginx exposed)

**Backup Strategy**:
- Daily automated PostgreSQL backup (pg_dump compressed)
- Daily MinIO backup (s3cmd sync to external storage or second MinIO instance)
- 30-day backup retention
- Monthly off-site backup copy (for disaster recovery)
- Backup test procedure documented (quarterly dry-run restore test)

**Scaling Path** (if needed later):
- Horizontal: Replicate backend containers behind load balancer; PostgreSQL read replicas for reporting
- Vertical: Increase VM CPU/memory
- Microservices: Extract document processing or reporting into separate services (not now)

**Alternatives Considered**:
- Kubernetes: Overkill for single-company internal app; adds operational complexity
- Multi-region cloud: On-premise requirement rules this out
- Serverless (Lambda/Functions): Financial workflows have state and long-running tasks; serverless unsuitable

**Justification**: Docker Compose is pragmatic for on-premise deployment; easy to backup, version control (docker-compose.yml in git), and scale vertically if needed.

---

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| JobCode uniqueness race condition | High | Database unique constraint + pessimistic locking on sequence counter |
| Double-billing (invoicing same products twice) | High | Invoice line items table tracks every invoice-product pair; application logic prevents duplicate |
| Data residency (sensitive financial data) | High | On-premise deployment; all data stays within company network; no cloud uploads |
| Quotation version confusion (staff uses old price) | Medium | Clear "version" column on quotation; PDF generation timestamps version; audit trail |
| Performance degradation as data grows | Medium | Index strategy: indexed JobCode, invoice number, customer_id; materialized views for reports; query monitoring |
| Audit log tampering | Medium | Audit log table immutable (no deletes); separate DB credentials for audit access |
| Staff accidentally emails sensitive quotations | Medium | RBAC enforces quotation download only by Admin/Finance; email integration enforces recipient whitelist |
| Timezone confusion (international dates) | Low | All timestamps stored as UTC in PostgreSQL; frontend localizes for display; test all edge cases |

---

## Decisions Summary

| Component | Decision | Confidence |
|-----------|----------|-----------|
| Backend Language | Java 17 + Spring Boot 3.x | ✅ High |
| Database | PostgreSQL 14+ | ✅ High |
| File Storage | S3-compatible (MinIO/AWS) | ✅ High |
| Frontend | React 18 + TypeScript + Material UI | ✅ High |
| Authentication | JWT + Spring Security RBAC | ✅ High |
| Testing | Test-first (unit/integration/contract) | ✅ High |
| Reporting | Built-in dashboards + optional Metabase | ✅ Medium |
| Deployment | Docker Compose on single Linux VM | ✅ High |
| Backup | Nightly PostgreSQL + MinIO snapshots | ✅ High |

**All NEEDS CLARIFICATION items resolved.** Specification is fully researchable. Ready to proceed to Phase 1 (data model design).

---

## Next: Phase 1 (Data Modeling)

Phase 1 will produce:
1. `data-model.md`: Entity diagrams, field definitions, relationships, validation rules
2. `/contracts/`: OpenAPI specification for all API endpoints
3. `quickstart.md`: Database schema creation, Docker Compose setup instructions
