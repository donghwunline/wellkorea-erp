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

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run e2e

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

## CI/CD Pipeline

**Trunk-Based Development**: Direct commits to `main` branch. CI runs on all PRs.

**Quality Gates** (blocks PR merge):
- Backend: JUnit tests, JaCoCo 70% coverage, SonarCloud quality gate
- Frontend: ESLint, Vitest tests with 70% coverage, SonarCloud quality gate
- Security: Trivy vulnerability scan, Gitleaks secret detection, CodeQL analysis

**Workflow Files**:
- `.github/workflows/ci.yml` - Main CI (active)
- `.github/workflows/codeql.yml` - Security analysis (active)
- `.github/workflows/_shared/` - Reusable components (backend-quality, frontend-quality, docker-build, e2e-tests)
- `.github/workflows/cd-*.yml` - Deployment workflows (commented out, ready to enable)

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
- Use constructor injection for dependencies
- Write tests with Testcontainers for integration tests
- Gradle buildDir updated to `layout.buildDirectory.get().asFile` (modern API)

**Frontend**:
- TypeScript strict mode
- ESLint enforced
- Component tests using React Testing Library
- E2E tests for critical user flows

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
- `.github/workflows/_shared/` - Reusable workflows (DRY principle)
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
- 001-erp-core: Added Java 21 (Spring Boot 3.5.8) + Spring Boot (Web, Data JPA, Security, Actuator), PostgreSQL driver, Apache POI (Excel), iText/PDFBox (PDF generation)
