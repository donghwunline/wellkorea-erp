# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WellKorea Integrated Work System (ERP) - A full-stack web application consolidating job lifecycle management from customer request through delivery and invoicing. Built with Spring Boot (Java 21) backend and React (TypeScript) frontend, deployed via Docker Compose.

**Key Architecture**: Monorepo with separate `backend/` and `frontend/` directories. Trunk-based development workflow with comprehensive CI/CD pipeline.

## Tech Stack

**Backend**
- Java 21, Spring Boot 3.5.8, Gradle 8.11
- Spring Data JPA, Spring Security (RBAC), Spring Boot Actuator
- PostgreSQL 16
- JUnit 5 + Testcontainers, JaCoCo (70% coverage requirement)
- SonarCloud integration

**Frontend**
- React 19, TypeScript 5.9, Vite 7
- Vitest (unit tests), Playwright (E2E tests)
- ESLint, Nginx (production)
- SonarCloud integration

**Infrastructure**
- Docker & Docker Compose
- GitHub Container Registry (ghcr.io)
- GitHub Actions CI/CD

## Development Commands

### Backend (from `/backend`)

```bash
# Build project
./gradlew build

# Build without tests
./gradlew build -x test

# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests "com.wellkorea.backend.auth.application.AuthenticationServiceTest"

# Run specific test method
./gradlew test --tests "com.wellkorea.backend.auth.application.AuthenticationServiceTest.testLogin"

# Run tests with coverage
./gradlew test jacocoTestReport

# Verify coverage threshold (70%)
./gradlew jacocoTestCoverageVerification

# Run SonarCloud analysis (requires SONAR_TOKEN)
./gradlew sonar --info

# Run application locally
./gradlew bootRun

# Clean build artifacts
./gradlew clean
```

### Frontend (from `/frontend`)

```bash
# Install dependencies
npm ci

# Development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build (port 4173)
npm run preview

# Run linter
npm run lint

# Run unit tests
npm test

# Run unit tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/components/Button.test.tsx

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run e2e

# Run specific E2E test
npx playwright test smoke.spec.ts

# Run E2E tests in UI mode
npm run e2e:ui

# Install Playwright browsers (first time)
npx playwright install
```

### Docker (from root directory)

```bash
# Copy environment template
cp .env.example .env

# Build and start all services
docker compose up -d

# View logs
docker compose logs -f [service-name]

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart specific service
docker compose restart [backend|frontend|postgres]
```

## Project Structure

```
wellkorea-erp/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/wellkorea/backend/
│   │   └── BackendApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── src/test/              # JUnit tests with Testcontainers
│   ├── build.gradle           # Gradle config with JaCoCo, SonarQube
│   └── Dockerfile             # Multi-stage Docker build
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.test.tsx      # Vitest unit tests
│   │   └── test/setup.ts     # Test configuration
│   ├── e2e/                   # Playwright E2E tests
│   │   └── smoke.spec.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── nginx.conf             # Production Nginx config
│   └── Dockerfile             # Multi-stage Docker build
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml            # Main CI pipeline
│   │   ├── codeql.yml        # Security analysis
│   │   ├── cd-*.yml          # CD workflows (commented)
│   │   └── _shared/          # Reusable workflow components
│   └── dependabot.yml        # Automated dependency updates
│
├── docs/
│   ├── ci-cd-setup.md        # Full CI/CD documentation (Korean)
│   ├── ci-cd-quickstart.md   # Quick start guide (Korean)
│   └── sonarqube.md          # SonarCloud setup
│
├── specs/001-erp-core/       # Feature specifications
│   ├── spec.md               # Main specification
│   ├── plan.md               # Implementation plan
│   ├── tasks.md              # Development tasks
│   └── data-model.md         # Data models
│
├── docker-compose.yml        # Local development stack
└── .env.example              # Environment variables template
```

## Core Domain Concepts

**JobCode**: Central entity (format: `WK2{year}-{sequence}-{date}`). Single source of truth for customer requests, linking quotations, production, delivery, invoicing, and financials.

**Quotation**: Built from product catalog with manual quantity/price entry per quote. Supports internal approval workflow (승인/결재), versioning, and PDF generation. Granular invoicing - any product/quantity combination can be invoiced independently.

**Production Tracking**: Per-product work progress sheets (not per-JobCode). Each product has separate manufacturing steps (Design → Laser → Sheet Metal → Machining → Assembly → Welding → Painting → Packaging). Tracks internal/outsourced work with vendor and ETA.

**Delivery & Invoicing**: Product-level granularity. Track what's been delivered/invoiced to prevent double-billing. Supports partial deliveries and invoices.

## Architecture Patterns

### Backend Architecture (Layered DDD + CQRS)

Backend follows a layered Domain-Driven Design approach with **CQRS (Command Query Responsibility Segregation)** pattern:

```
com/wellkorea/backend/
├── shared/               # Cross-cutting concerns
│   ├── audit/           # AuditLogger, AuditContextHolder
│   ├── dto/             # ApiResponse, ErrorResponse
│   └── exception/       # GlobalExceptionHandler, ErrorCode
│
├── {domain}/            # Feature-specific packages (auth, project, quotation)
│   ├── api/            # REST controllers
│   │   └── dto/
│   │       ├── command/   # Request DTOs, CommandResult DTOs
│   │       └── query/     # View DTOs (DetailView, SummaryView)
│   ├── application/    # Use cases (CQRS services)
│   │   ├── {Domain}CommandService.java  # Write operations
│   │   ├── {Domain}QueryService.java    # Read operations
│   │   └── {Create/Update}Command.java  # Internal command objects
│   ├── domain/         # Entities, value objects, domain events
│   │   └── event/      # Domain events (e.g., QuotationSubmittedEvent)
│   └── infrastructure/ # Persistence, external services
```

**CQRS Pattern** (see `quotation/` package for reference implementation):
- **Separate Command and Query Services**:
  - `{Domain}CommandService` - `@Transactional`, handles create/update/delete, returns **only entity IDs**
  - `{Domain}QueryService` - `@Transactional(readOnly = true)`, handles reads, returns **View DTOs**
- **DTO Segregation**:
  - `api/dto/command/` - Request DTOs (`CreateXxxRequest`), Result DTOs (`XxxCommandResult`)
  - `api/dto/query/` - View DTOs (`XxxDetailView`, `XxxSummaryView`) populated by MyBatis mappers for optimized read performance
- **Controller Pattern**:
  - Inject both `CommandService` and `QueryService`
  - Command endpoints return `CommandResult` (ID + message), clients fetch fresh data via query endpoints
  - Clear endpoint grouping: `// ========== QUERY ENDPOINTS ==========` and `// ========== COMMAND ENDPOINTS ==========`

**Command Pattern Example**:
```java
// Controller: Request DTO → Command object → CommandService
CreateQuotationCommand command = new CreateQuotationCommand(request.projectId(), ...);
Long quotationId = commandService.createQuotation(command, userId);
return QuotationCommandResult.created(quotationId);  // Returns only ID

// Client fetches fresh data via query endpoint
GET /api/quotations/{id} → queryService.getQuotationDetail(id) → QuotationDetailView
```

**Key Patterns**:
- **Constructor Injection**: All Spring beans use constructor injection (no `@Autowired` fields)
- **ApiResponse<T> Wrapper**: All REST endpoints return `ApiResponse<T>` for consistent response format
- **Global Exception Handling**: `@RestControllerAdvice` with `GlobalExceptionHandler` for centralized error handling
- **JWT Authentication**: Custom `JwtAuthenticationFilter` with token refresh support (temporary, will migrate to Keycloak OAuth2)
- **Audit Logging**: `AuditLogger` with `AuditContextHolder` for request context tracking
- **Domain Events**: Use `DomainEventPublisher` for cross-domain communication (e.g., approval workflow)

### Frontend Architecture (FSD-Lite: Feature-Sliced Design)

**IMPORTANT: See these architecture documents:**
- [frontend/docs/architecture/fsd-public-api-guidelines.md](frontend/docs/architecture/fsd-public-api-guidelines.md) - Entity public API patterns (Query Factory, Command Functions)
- [docs/architecture/frontend-architecture-analysis.md](docs/architecture/frontend-architecture-analysis.md) - Complete architecture documentation

Frontend follows **FSD-Lite (Feature-Sliced Design)** aligned with backend's DDD + CQS patterns:

```
frontend/src/
├── app/                      # Application setup (providers, router, styles)
├── pages/                    # Route-level components (ASSEMBLY ONLY)
├── widgets/                  # Composite UI blocks (FEATURE COMPOSITION)
├── features/                 # User actions/workflows (ISOLATED UNITS)
│   └── {domain}/{action}/   # e.g., quotation/create/, quotation/approve/
│       ├── ui/              # Feature UI components
│       ├── model/           # useMutation hooks
│       └── index.ts         # Public barrel export
├── entities/                 # Domain models (TYPES + RULES + QUERIES)
│   └── {domain}/            # e.g., quotation/, project/, company/
│       ├── model/           # Domain types + pure functions (quotationRules)
│       ├── api/             # Query factory + Command functions
│       │   ├── {entity}.mapper.ts     # Response DTO + mapper (DTO→Domain)
│       │   ├── {entity}.queries.ts    # Query factory with queryOptions()
│       │   ├── get-{entity}-list.ts   # HTTP GET list operation
│       │   ├── get-{entity}-by-id.ts  # HTTP GET single operation
│       │   ├── create-{entity}.ts     # Request DTO inline + Input + POST
│       │   └── update-{entity}.ts     # Request DTO inline + Input + PUT
│       ├── ui/              # Entity display components (read-only)
│       └── index.ts         # Public barrel export
├── shared/                   # Cross-cutting concerns
│   ├── api/                 # HTTP client, error handling
│   ├── ui/                  # Design system components
│   ├── lib/                 # Pure utilities (date, money, validation)
│   └── types/               # Shared types (pagination, api-response)
└── stores/                   # Global state (minimal - auth only)
```

**Dependency Rules** (enforced by ESLint):
```
pages → widgets, features, entities, shared
widgets → features, entities, shared
features → entities, shared (NOT other features - use widgets)
entities → shared ONLY
shared → NOTHING (base layer)
```

**Slice Encapsulation Rules** (what to expose via `index.ts`):

| Segment | Export? | Example |
|---------|---------|---------|
| `model/*.ts` | ✅ YES | Domain types, business rules |
| `api/*.queries.ts` | ✅ YES | Query factory (`quotationQueries`) |
| `api/create-*.ts` | ✅ YES | Command functions + Input types |
| `api/update-*.ts` | ✅ YES | Command functions + Input types |
| `ui/*.tsx` | ✅ YES | Display components |
| `api/*.mapper.ts` | ❌ NO | Response types + mappers are internal |
| `api/get-*.ts` | ❌ NO | GET operations are internal (used by queries) |
| `query/query-keys.ts` | ❌ NO | Use `queries.lists()` instead |

**API Type Distribution Pattern** (no centralized `{entity}.dto.ts`):
- **Response types** (`*Response`) → defined in `{entity}.mapper.ts` (shared across queries/commands)
- **Request types** (`*Request`) → inlined in each command file (private, not exported)
- The `httpClient` auto-unwraps `ApiResponse<T>` → returns `T` directly

**No segment-level barrel exports**: Only `{slice}/index.ts` is public. Never create `model/index.ts`, `api/index.ts`, etc.

**Group Slices** (organizational folders under `features/`):

The `features/` layer uses **Group slices** for domain-based organization:
```
features/
├── approval/           # Group slice (NO index.ts here!)
│   ├── approve/        # Slice - HAS index.ts
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts    # ✅ Public API
│   └── reject/         # Slice - HAS index.ts
│       ├── ui/
│       ├── model/
│       └── index.ts    # ✅ Public API
├── quotation/          # Group slice (NO index.ts here!)
│   ├── form/           # Slice
│   ├── line-items/     # Slice
│   └── notify/         # Slice
```

**Rules**:
- **Group slice** (`approval/`, `quotation/`): Organizational folder only. **NO `index.ts`**.
- **Slice** (`approve/`, `reject/`, `form/`): Actual feature unit. **HAS `index.ts`** as public API.
- Import from slice, not group: `from '@/features/approval/approve'` ✅, `from '@/features/approval'` ❌

**Key Architecture Decisions:**

1. **Domain Models = Plain Objects + Pure Functions** (not classes)
   ```typescript
   // entities/quotation/model/quotation.ts
   export interface Quotation { readonly id: number; readonly status: QuotationStatus; ... }
   export const quotationRules = {
     canEdit(q: Quotation): boolean { return q.status === 'DRAFT'; },
     calculateTotal(q: Quotation): number { ... },
   };
   ```

2. **TanStack Query v5 with Query Factory Pattern**
   - `entities/*/api/{entity}.queries.ts` - Query factory using `queryOptions()`
   - Direct usage: `useQuery(quotationQueries.detail(id))` - no custom hooks needed
   - `entities/*/api/create-{entity}.ts` - Command functions with built-in validation
   - `features/*/model/` - Mutation hooks wrapping entity command functions
   - All queries return domain models (DTOs mapped via internal mapper)

3. **Cache Data Format = Always Domain Models**
   - All `useQuery`, `prefetchQuery`, `setQueryData` work with domain types
   - Query factory handles DTO→Domain mapping internally

4. **Query Key Stability = Primitives Only**
   ```typescript
   // Use individual primitives, NOT objects
   list: (page, size, search, status) => [...keys.lists(), page, size, search, status]
   ```

5. **Dates = ISO Strings** (not Date objects) for React Query serialization

**Component Placement Quick Reference:**

| Type | Layer | Indicator |
|------|-------|-----------|
| Single entity display (read-only) | `entities/*/ui` | Displays ONE entity, no mutations |
| User action button/form | `features/*/ui` | Triggers mutation, contains action logic |
| Multi-feature composition | `widgets/*` | Combines 2+ features |
| Route-level view | `pages/*` | URL params + layout assembly only |

**entities/ui/ Rules** (keep components reusable):
- ❌ No router dependencies (`useNavigate`, `Link`)
- ❌ No feature-specific buttons ("Approve", "Submit")
- ❌ No mutation hooks
- ✅ Delegate via callback props (`onRowClick`, `renderActions`)

**features/ Rules** (isolated workflows):
- One feature = one user action
- Features do NOT import other features (use widgets for composition)
- UX side-effects (`toast()`, `navigate()`) belong here, NOT in entities

**Command Function Pattern:**
```typescript
// Command functions have built-in validation + mapping
// entities/quotation/api/create-quotation.ts
export async function createQuotation(input: CreateQuotationInput): Promise<CommandResult> {
  validateCreateInput(input);           // Throws DomainValidationError
  const request = toCreateRequest(input); // Input → Request mapping
  return httpClient.post(QUOTATION_ENDPOINTS.BASE, request);
}

// Usage in features/quotation/create/model/use-create-quotation.ts
const mutation = useMutation({
  mutationFn: createQuotation,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: quotationQueries.lists() }),
});
```

**Authentication Flow**:
1. User logs in → `authService.login()` stores tokens in localStorage
2. HttpClient auto-injects token in `Authorization: Bearer {token}` header
3. On 401 response → HttpClient automatically refreshes token
4. Concurrent 401s are queued (prevents multiple refresh calls)
5. If refresh fails → Clear tokens, redirect to login
6. Zustand `authStore` syncs authentication state

## CI/CD Pipeline

**Trunk-Based Development**: Direct commits to `main` branch. CI runs on all PRs.

**Quality Gates** (blocks PR merge):
- Backend: JUnit tests, JaCoCo 70% coverage, SonarCloud quality gate
- Frontend: ESLint, Vitest tests with 70% coverage, SonarCloud quality gate
- Security: Trivy vulnerability scan, Gitleaks secret detection, CodeQL analysis

**Workflow Files**:
- `.github/workflows/ci.yml` - Main CI pipeline (orchestrates quality checks)
- `.github/workflows/codeql.yml` - Security analysis (active)
- `.github/workflows/backend-quality.yml` - Backend tests, coverage, SonarCloud
- `.github/workflows/frontend-quality.yml` - Frontend linting, tests, coverage, SonarCloud
- `.github/workflows/docker-build.yml` - Docker image builds
- `.github/workflows/e2e-tests.yml` - End-to-end tests
- `.github/workflows/cd-dev.yml`, `cd-staging.yml`, `cd-prod.yml` - Deployment workflows
- `.github/workflows/claude.yml`, `claude-code-review.yml` - AI-assisted code review

**To Enable CD**: Uncomment CD workflows and add secrets:
- Dev: `DEV_SSH_HOST`, `DEV_SSH_USER`, `DEV_SSH_KEY`
- Staging: `STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY`
- Prod: `PROD_SSH_HOST`, `PROD_SSH_USER`, `PROD_SSH_KEY` + GitHub Environment protection rules

**SonarCloud Setup Required**:
1. Create projects: `wellkorea-erp-backend`, `wellkorea-erp-frontend`
2. Add `SONAR_TOKEN` to GitHub repository secrets

## Code Quality Standards

**Coverage**: Minimum 70% for both backend (JaCoCo) and frontend (Vitest)

**Backend**:
- Follow Spring Boot conventions
- Use constructor injection for dependencies (no `@Autowired` fields)
- All controllers return `ApiResponse<T>` wrapper
- Write tests with Testcontainers for integration tests
- Gradle buildDir updated to `layout.buildDirectory.get().asFile` (modern API)

**Frontend**:
- TypeScript strict mode with explicit type imports (`import type`)
- ESLint enforced
- All API calls through service layer (never call `httpClient` directly)
- Component tests using React Testing Library
- E2E tests for critical user flows
- Zustand for minimal global state (auth only)

**Docker**:
- Multi-stage builds for optimal image size
- Non-root user in backend container
- Health checks for all services
- Nginx for frontend production serving

## Important Files

**Configuration**:
- `backend/build.gradle` - Gradle build, JaCoCo, SonarQube config
- `frontend/package.json` - npm scripts, dependencies
- `docker-compose.yml` - Local development stack
- `.env.example` - Environment variables template

**Documentation**:
- `docs/ci-cd-setup.md` - Complete CI/CD guide (Korean)
- `docs/ci-cd-quickstart.md` - 5-min setup guide (Korean)
- `specs/001-erp-core/spec.md` - Feature specification with user stories

**CI/CD**:
- `.github/workflows/` - All workflow files (modular design: separate workflows for backend, frontend, docker, e2e, deployments)
- `.github/dependabot.yml` - Weekly dependency updates (Mondays 09:00)

## Testing Strategy

**Backend**:
- Unit tests: JUnit 5
- Integration tests: Testcontainers with PostgreSQL
- Coverage: JaCoCo with 70% threshold enforced in `build.gradle`

**Frontend**:
- Unit tests: Vitest with React Testing Library
- E2E tests: Playwright (chromium browser in CI)
- Coverage: Vitest with 70% threshold enforced in `vitest.config.ts`

**E2E in CI**: Playwright runs against preview server (port 4173). `BASE_URL` automatically set to `http://localhost:4173` in CI environment.

## Local Development Setup

1. **Prerequisites**: Java 21, Node.js 22, Docker, PostgreSQL 16 (optional if using Docker)

2. **Backend**:
   ```bash
   cd backend
   ./gradlew build
   ./gradlew bootRun
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

4. **Full Stack (Docker)**:
   ```bash
   cp .env.example .env
   docker compose up -d
   ```
   Access: Frontend http://localhost:80, Backend http://localhost:8080

5. **Install Playwright browsers** (first time):
   ```bash
   cd frontend
   npx playwright install
   ```

## Troubleshooting

**Gradle Build Fails**: Clear cache with `./gradlew clean --no-daemon`

**Frontend Build Fails**: Remove `node_modules` and `package-lock.json`, then `npm install`

**E2E Tests Fail**: Run in headed mode `npx playwright test --headed` to debug

**Docker Build Fails**: Check disk space with `docker system df`, clean with `docker system prune -a`

**Health Checks Failing**: Backend requires Spring Boot Actuator dependency (already added to `build.gradle`)

## Commit Conventions

Use conventional commits format:
- `feat(backend): add user authentication`
- `fix(frontend): resolve navigation bug`
- `chore(ci): update dependencies`
- `docs(readme): update setup instructions`

All commits include Claude Code attribution:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Active Technologies
- Java 21 (Spring Boot 3.5.8) + Spring Boot (Web, Data JPA, Security, Actuator), PostgreSQL driver, Apache POI (Excel), iText/PDFBox (PDF generation) (001-erp-core)
- PostgreSQL 16 (relational database with ACID transactions) (001-erp-core)

From feature spec `001-erp-core`:
- Spring Boot (REST API, transaction management)
- Spring Data JPA (ORM/repositories)
- Spring Security (RBAC)
- Apache POI (Excel import/export)
- iText/PDFBox (PDF generation)
- Keycloak (optional SSO)

## Recent Changes
- 001-erp-core: Frontend entity pattern updated - Query Factory Pattern with `queryOptions()`, Command Functions with built-in validation (see `quotation/` as reference)
- 001-erp-core: Added Java 21 (Spring Boot 3.5.8) + Spring Boot (Web, Data JPA, Security, Actuator), PostgreSQL driver, Apache POI (Excel), iText/PDFBox (PDF generation)
