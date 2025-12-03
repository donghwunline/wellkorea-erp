# Phase 1: Quick Start Guide

**Date**: 2025-11-24
**Branch**: `001-erp-core`
**Status**: Complete

---

## Development Environment Setup

### Prerequisites

- Java 21+ (JDK)
- Docker & Docker Compose
- Node.js 22+ (for frontend development)
- Git
- IDE: IntelliJ IDEA (recommended for Java) or VS Code

### Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/wellkorea/erp.git
cd erp

# 2. Start full stack with Docker Compose
docker-compose up -d

# 3. Wait for services to be healthy
docker-compose ps

# 4. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api/v1
# Swagger UI: http://localhost:8080/swagger-ui.html
# PostgreSQL: localhost:5432 (postgres/postgres)
# MinIO console: http://localhost:9001 (minioadmin/minioadmin)
```

The docker-compose.yml includes:
- Backend (Spring Boot) on port 8080
- Frontend (React) on port 3000
- PostgreSQL 14 on port 5432
- MinIO S3-compatible storage on port 9000
- (Optional) Keycloak on port 8180
- (Optional) Metabase on port 3001

---

## Database Setup

### Automatic Schema Creation

The Spring Boot application automatically creates the database schema on startup using Flyway migrations:

```
backend/src/main/resources/db/migration/
├── V1__initial_schema.sql
├── V2__add_audit_logging.sql
└── V3__add_indexes.sql
```

If needed, manually initialize:

```bash
# Via Docker
docker exec -it erp-postgres psql -U postgres -d erp -f /docker-entrypoint-initdb.d/schema.sql

# Or via Flyway CLI
./mvnw flyway:migrate
```

### Database Credentials (Development Only)

```
Host: localhost
Port: 5432
Database: erp
Username: postgres
Password: postgres
```

**⚠️ WARNING**: Change credentials before deploying to production. Use environment variables or secret management.

### Database Backup

```bash
# Create backup
docker exec erp-postgres pg_dump -U postgres erp > backup-$(date +%Y%m%d).sql

# Restore backup
docker exec -i erp-postgres psql -U postgres erp < backup-20250101.sql
```

---

## Backend Development

### Project Structure

```
backend/
├── src/main/java/com/wellkorea/erp/
│   ├── api/                    # REST controllers
│   ├── application/            # Use cases / services
│   ├── domain/                 # Entities & value objects
│   ├── infrastructure/         # DB, storage, email
│   ├── security/               # Auth, RBAC, audit
│   └── Application.java        # Spring Boot main
├── src/test/java/com/wellkorea/erp/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── contract/               # Contract tests
└── build.gradle
```

### Running Backend Locally

```bash
# Using Gradle
./gradlew bootRun

# Using IDE (IntelliJ)
Right-click Application.java → Run

# Backend will start on http://localhost:8080
```

### Testing

```bash
# Unit tests (fast, no DB)
./gradlew test

# Integration tests (with Docker PostgreSQL)
./gradlew integrationTest

# Contract tests (verify API contracts)
./gradlew contractTest

# All tests + coverage report
./gradlew build
```

### Code Structure Best Practices

Following the constitution and modular monolith pattern:

**Domain Layer** (`domain/`): Pure business logic, entities, value objects. NO dependencies on Spring or databases.

```java
// domain/jobcode/JobCode.java
public class JobCode {
    private UUID id;
    private String jobcodeString;
    private UUID customerId;
    // ... getters, business methods (validate(), generateJobCode())
}
```

**Application Layer** (`application/`): Use cases, orchestration of domain logic and infrastructure.

```java
// application/jobcode/CreateJobCodeUseCase.java
@Service
public class CreateJobCodeUseCase {
    private final JobCodeRepository repository;
    private final AuditLogger auditLogger;

    public JobCode execute(CreateJobCodeCommand cmd) {
        JobCode jobCode = JobCode.create(cmd.customerId, cmd.projectName);
        repository.save(jobCode);
        auditLogger.log(Action.CREATE, jobCode);
        return jobCode;
    }
}
```

**API Layer** (`api/`): REST controllers, input validation, HTTP concerns.

```java
// api/jobcode/JobCodeController.java
@RestController
@RequestMapping("/api/v1/jobcodes")
public class JobCodeController {
    private final CreateJobCodeUseCase useCase;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES')")
    public ResponseEntity<JobCodeResponse> create(@RequestBody CreateJobCodeRequest req) {
        JobCode jobCode = useCase.execute(new CreateJobCodeCommand(...));
        return ResponseEntity.created(uri).body(JobCodeResponse.from(jobCode));
    }
}
```

**Infrastructure Layer** (`infrastructure/`): Database, file storage, external services.

```java
// infrastructure/persistence/JobCodeRepositoryJpa.java
@Repository
public interface JobCodeRepositoryJpa extends JpaRepository<JobCodeEntity, UUID> {
    Optional<JobCodeEntity> findByJobcodeString(String jobcodeString);
}
```

### Key Spring Boot Configuration

```yaml
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Let Flyway handle schema
    properties:
      hibernate:
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true

  datasource:
    url: jdbc:postgresql://localhost:5432/erp
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}

  mvc:
    throw-exception-if-no-handler-found: true

logging:
  level:
    com.wellkorea.erp: DEBUG
    org.springframework: INFO
    org.hibernate: WARN
```

---

## Frontend Development

### Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page-level components
│   ├── services/             # API clients, auth
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── tests/                    # Test files
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Running Frontend Locally

```bash
cd frontend
npm install
npm run dev

# Frontend will start on http://localhost:5173
# But docker-compose serves on http://localhost:3000
```

### Testing Frontend

```bash
# Unit tests
npm test

# E2E tests (Playwright)
npm run test:e2e

# Coverage
npm run coverage
```

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.x",
    "@mui/material": "^5.x",
    "@mui/x-data-grid": "^6.x",
    "react-hook-form": "^7.x",
    "axios": "^1.x",
    "react-query": "^3.x",
    "zustand": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^4.x",
    "vitest": "^0.x",
    "@testing-library/react": "^14.x",
    "playwright": "^1.x"
  }
}
```

### Authentication Flow

Frontend handles JWT authentication:

```typescript
// services/auth.ts
export const useAuth = () => {
  const [token, setToken] = useLocalStorage('jwt_token');

  const login = async (username: string, password: string) => {
    const response = await axios.post('/api/v1/auth/login', {
      username,
      password,
    });
    setToken(response.data.token);
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;
  const roles = decodeJwt(token)?.roles || [];

  return { login, logout, isAuthenticated, roles, token };
};
```

All API requests include JWT token:

```typescript
// services/api.ts
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## API Documentation

### Swagger UI

Swagger UI is available at:
```
http://localhost:8080/swagger-ui.html
```

This is auto-generated from the OpenAPI specification in:
```
backend/src/main/resources/api/openapi.yaml
```

### Manual API Testing

Using curl:

```bash
# Create JobCode
curl -X POST http://localhost:8080/api/v1/jobcodes \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "550e8400-e29b-41d4-a716-446655440000",
    "project_name": "Custom Enclosure Project",
    "due_date": "2025-12-31",
    "internal_owner_id": "550e8400-e29b-41d4-a716-446655440001"
  }'

# List JobCodes
curl http://localhost:8080/api/v1/jobcodes \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get quotation PDF
curl http://localhost:8080/api/v1/quotations/{id}/pdf \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o quotation.pdf
```

### OpenAPI Specification

Full OpenAPI 3.0 spec is in:
```
specs/001-erp-core/contracts/openapi.yaml
```

Can be imported into Postman, Insomnia, or other API clients for testing.

---

## File Storage (MinIO)

MinIO provides S3-compatible object storage for documents.

### Accessing MinIO Console

```
http://localhost:9001
Username: minioadmin
Password: minioadmin
```

### Buckets

Automatic setup via docker-compose:

```
erp-documents/         # Quotations, invoices, work photos, CAD files
  └─ jobcodes/
  └─ quotations/
  └─ invoices/
  └─ work-photos/
  └─ drawings/
  └─ rfq-attachments/
```

### Backend Integration

```java
// infrastructure/storage/MinioFileStorage.java
@Service
public class MinioFileStorage {
    private final MinioClient minioClient;

    public String uploadFile(String bucketName, String objectName, InputStream file) {
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket(bucketName)
                .object(objectName)
                .stream(file, file.available(), -1)
                .build()
        );
        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .bucket(bucketName)
                .object(objectName)
                .expiration(7 * 24 * 3600)  // 7 days
                .build()
        ).url();
    }
}
```

---

## Logging & Monitoring

### Application Logs

```bash
# View backend logs
docker logs -f erp-backend

# View PostgreSQL logs
docker logs -f erp-postgres

# View all service logs
docker-compose logs -f
```

### Structured Logging

Backend uses SLF4J with Logback:

```java
// Example: audit logging for invoice creation
logger.info("invoice_created",
    Map.ofEntries(
        Map.entry("invoice_id", invoice.getId()),
        Map.entry("jobcode_id", invoice.getJobcodeId()),
        Map.entry("amount", invoice.getTotalAmount()),
        Map.entry("user_id", currentUser.getId()),
        Map.entry("timestamp", Instant.now())
    )
);
```

Logs include:
- Timestamp (UTC)
- Log level (INFO, WARN, ERROR)
- Logger name (class)
- Structured fields (key-value pairs)
- Message

### Query Performance Monitoring

Enable Hibernate query logging (development only):

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

Use PostgreSQL EXPLAIN to analyze slow queries:

```sql
EXPLAIN ANALYZE
SELECT * FROM job_codes
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440000'
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

---

## Common Workflows

### Creating a New Feature

1. Create a new domain entity in `domain/`
2. Create a repository interface in `infrastructure/persistence/`
3. Create a use case service in `application/`
4. Create a REST controller in `api/`
5. Add Flyway migration to `db/migration/`
6. Write unit tests for domain logic
7. Write integration tests for API endpoint
8. Add contract tests for OpenAPI compliance
9. Update OpenAPI spec in `contracts/openapi.yaml`

### Database Migrations

Create a new Flyway migration file:

```sql
-- backend/src/main/resources/db/migration/V4__add_new_table.sql
CREATE TABLE IF NOT EXISTS new_entity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_new_entity_name ON new_entity(name);
```

Flyway automatically runs all V*.sql files in order on application startup.

### Testing a Feature

```bash
# 1. Write unit test for domain logic
# src/test/java/com/wellkorea/erp/domain/jobcode/JobCodeTest.java

# 2. Write integration test for API
# src/test/java/com/wellkorea/erp/api/jobcode/JobCodeControllerTest.java

# 3. Write contract test for OpenAPI compliance
# src/test/java/com/wellkorea/erp/contract/JobCodeContractTest.java

# 4. Run all tests
./gradlew build
```

---

## Deployment

### Build Docker Images

```bash
# Backend image
docker build -f backend/Dockerfile -t wellkorea/erp-backend:1.0.0 .

# Frontend image
docker build -f frontend/Dockerfile -t wellkorea/erp-frontend:1.0.0 .
```

### Production Deployment

Use docker-compose with production overrides:

```bash
# Set environment variables
export DB_PASSWORD=$(openssl rand -base64 32)
export JWT_SECRET=$(openssl rand -base64 32)
export MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Start stack with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Backup & Restore

```bash
# Backup everything
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backup-20250101.tar.gz
```

### Health Checks

```bash
# Backend health
curl http://localhost:8080/actuator/health

# Database connectivity
curl http://localhost:8080/actuator/db

# All metrics
curl http://localhost:8080/actuator
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process using port 8080
lsof -i :8080
kill -9 <PID>

# Or use different port
docker-compose up -e BACKEND_PORT=9080
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec erp-postgres psql -U postgres -c "SELECT 1"

# View logs
docker logs erp-postgres
```

### MinIO Bucket Not Created

```bash
# Create bucket manually
docker exec erp-minio mc mb minio/erp-documents
```

### Tests Failing

```bash
# Clean build
./gradlew clean build

# Run specific test with verbose output
./gradlew test --tests JobCodeTest -i

# Debug test failure
# Set breakpoint in IDE and run test in debug mode
```

---

## Next Steps

1. **Create initial seed data**: Run SQL script to populate test customers, products, users
2. **Set up authentication**: Configure JWT secret and implement login endpoint
3. **Implement first feature**: Start with JobCode CRUD (P1 user story)
4. **Add tests**: Unit, integration, and contract tests for JobCode feature
5. **Deploy**: Build Docker images and test docker-compose deployment
6. **Monitor**: Set up logging, metrics, and alerting

See `tasks.md` for detailed implementation tasks.
