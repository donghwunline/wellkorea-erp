# Backend Test Configuration

## Overview

Modernized test infrastructure using Spring Boot 3.1+ `@ServiceConnection` pattern with centralized configuration.

## Test Structure

```
src/test/java/
├── com/wellkorea/backend/
│   ├── BaseIntegrationTest.java          # Base class for integration tests
│   ├── shared/test/
│   │   └── TestFixtures.java             # Centralized test fixtures and configuration
│   ├── auth/                             # Authentication tests
│   ├── document/                         # Document storage tests
│   └── project/                          # Project domain tests
└── resources/
    └── application-test.yml              # Test profile configuration
```

## Test Categories

### Unit Tests (`@Tag("unit")`)

- **Fast**: No Spring context, no external dependencies
- **Examples**: `JwtTokenProviderTest`, `JobCodeGeneratorTest`
- **Run**: `./gradlew test -Dgroups=unit`

### Integration Tests (`@Tag("integration")`)

- **Comprehensive**: Full Spring context + Testcontainers
- **Base Class**: Extend `BaseIntegrationTest`
- **Examples**: `SecurityIntegrationTest`, `MinioFileStorageTest`
- **Run**: `./gradlew test -Dgroups=integration`

## Writing Tests

### Unit Test Template

```java
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

@Tag("unit")
class MyServiceTest {

    @Test
    void shouldDoSomething() {
        // Given

        // When

        // Then
        assertThat(result).isNotNull();
    }
}
```

### Integration Test Template

```java
import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@Tag("integration")
class MyIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MyService myService;

    @Test
    void shouldIntegrateWithDatabase() {
        // Test with real database
    }
}
```

## Test Configuration

### TestFixtures

All test configuration values and fixtures are centralized in `TestFixtures.java`:

- JWT secrets and expiration
- Database credentials
- MinIO configuration
- Test entity IDs
- Sample API request/response payloads

**Always use TestFixtures instead of hardcoding values.**

### BaseIntegrationTest

Provides singleton Testcontainers for all integration tests:

- **PostgreSQL 16**: Auto-configured via `@ServiceConnection`
- **MinIO**: Manually configured for S3-compatible storage

Containers start once per JVM and are reused across all tests for performance.

### application-test.yml

Static configuration for test profile:

- Connection pool settings (HikariCP)
- Logging levels
- Actuator endpoints
- Mail health check (disabled)

## Running Tests

```bash
# All tests
./gradlew test

# Unit tests only (fast)
./gradlew test -Dgroups=unit

# Integration tests only
./gradlew test -Dgroups=integration

# With coverage
./gradlew test jacocoTestReport

# Verify coverage threshold (70%)
./gradlew jacocoTestCoverageVerification
```

## Best Practices

1. **Use `@Tag` annotations** for all tests (`"unit"` or `"integration"`)
2. **Extend `BaseIntegrationTest`** for database/MinIO tests
3. **Import `TestFixtures`** instead of duplicating config values
4. **Use Role enum** for role authorities: `Role.ADMIN.getAuthority()`
5. **Follow Given-When-Then** structure in test methods
6. **Use descriptive test names** starting with "should"
7. **Clean up test data** in `@BeforeEach` or `@AfterEach`

## CI/CD Integration

GitHub Actions runs:

```bash
./gradlew test jacocoTestReport jacocoTestCoverageVerification
```

- **Coverage Requirement**: 70% minimum (enforced by JaCoCo)
- **Testcontainers**: Run via Docker-in-Docker
- **SonarCloud**: Receives coverage reports for quality gate

## Troubleshooting

### Tests fail with "Container not started"

- Ensure Docker is running
- Check `docker ps` for zombie containers
- Clear Testcontainers cache: `rm -rf ~/.testcontainers`

### Tests pass individually but fail when run together

- Likely a test isolation issue
- Check for shared static state
- Verify cleanup in `@AfterEach`

### Slow integration tests

- Testcontainers reuse enabled (`.withReuse(true)`)
- Run unit tests separately: `./gradlew test -Dgroups=unit`
- Container startup is one-time cost per JVM

## References

- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [Testcontainers](https://www.testcontainers.org/)
- [AssertJ Documentation](https://assertj.github.io/doc/)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
