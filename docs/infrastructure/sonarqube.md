# SonarCloud Setup & Usage

This document covers SonarCloud integration for code quality analysis in the WellKorea ERP project.

## Overview

SonarCloud provides continuous code quality inspection for:
- **Code smells**: Maintainability issues
- **Bugs**: Potential runtime errors
- **Vulnerabilities**: Security weaknesses
- **Code coverage**: Test coverage metrics
- **Duplications**: Copy-paste detection

### Projects

| Project | Key | Language |
|---------|-----|----------|
| Backend | `wellkorea-erp-backend` | Java |
| Frontend | `wellkorea-erp-frontend` | TypeScript |

## Initial Setup

### 1. Create GitHub Secret

In your GitHub repository:
1. Go to **Settings > Secrets and variables > Actions**
2. Click **New repository secret**
3. Name: `SONAR_TOKEN`
4. Value: Your SonarCloud token (from My Account > Security > Generate Tokens)

### 2. Backend Configuration (Gradle)

Update `build.gradle`:

```groovy
plugins {
    id "org.sonarqube" version "7.1.0.6387"
}

sonar {
    properties {
        property "sonar.projectKey", "wellkorea-erp-backend"
        property "sonar.organization", "donghwunline"
    }
}
```

### 3. Frontend Configuration

Create `sonar-project.properties` in `frontend/`:

```properties
sonar.projectKey=wellkorea-erp-frontend
sonar.organization=donghwunline
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx
sonar.exclusions=**/node_modules/**,**/*.test.ts,**/*.test.tsx
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

## GitHub Actions Integration

### Backend Workflow

```yaml
- name: Build and analyze
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  run: ./gradlew build sonar --info
```

### Frontend Workflow

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: SonarCloud Scan
  uses: SonarSource/sonarqube-scan-action@v6
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    projectBaseDir: frontend
```

## Quality Gates

The CI pipeline enforces quality gates:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Coverage | ≥ 70% | Line and branch coverage |
| Duplications | < 3% | Duplicated code blocks |
| Maintainability | A | Code smell density |
| Reliability | A | Bug density |
| Security | A | Vulnerability density |

**Quality Gate Status**: PRs are blocked if quality gates fail.

## Running Locally

### Backend

```bash
cd backend

# Run with coverage report
./gradlew test jacocoTestReport

# Run SonarCloud analysis (requires SONAR_TOKEN)
SONAR_TOKEN=your_token ./gradlew sonar
```

### Frontend

```bash
cd frontend

# Generate coverage report
npm run test:coverage

# Run SonarCloud scanner (requires sonar-scanner CLI)
npx sonar-scanner -Dsonar.token=your_token
```

## Viewing Results

1. Go to [SonarCloud Dashboard](https://sonarcloud.io/organizations/donghwunline/projects)
2. Select `wellkorea-erp-backend` or `wellkorea-erp-frontend`
3. View:
   - **Overview**: Summary metrics
   - **Issues**: Code smells, bugs, vulnerabilities
   - **Measures**: Detailed metrics
   - **Code**: Issue locations in source

## Troubleshooting

### "Quality Gate Failed" in PR

1. Click the SonarCloud check details in the PR
2. Review failing conditions (coverage, issues, etc.)
3. Common fixes:
   - Add unit tests for new code
   - Fix highlighted code smells
   - Address security hotspots

### "No coverage data"

**Backend:**
```bash
# Ensure JaCoCo runs before Sonar
./gradlew test jacocoTestReport sonar
```

**Frontend:**
```bash
# Ensure coverage is generated first
npm run test:coverage
# Then run sonar-scanner
```

### Analysis Not Appearing

1. Check GitHub Actions logs for errors
2. Verify `SONAR_TOKEN` secret is set correctly
3. Ensure project key matches SonarCloud configuration

### Excluding Files

Add to `sonar-project.properties`:

```properties
# Exclude generated files
sonar.exclusions=**/generated/**,**/node_modules/**

# Exclude test files from main source analysis
sonar.test.inclusions=**/*.test.ts,**/*.spec.ts
```

## Best Practices

### Writing Clean Code

1. **Address issues promptly**: Fix code smells when they appear
2. **Maintain coverage**: Write tests for new features
3. **Review security hotspots**: Don't dismiss without reviewing

### PR Workflow

1. Push code to feature branch
2. SonarCloud analyzes PR automatically
3. Review new issues in PR decoration
4. Fix issues before merging
5. Quality gate must pass for merge

### Coverage Tips

- Focus on business logic, not boilerplate
- Test edge cases and error paths
- Use `@SuppressWarnings` sparingly and document why

## Dashboard URLs

- **Organization**: https://sonarcloud.io/organizations/donghwunline
- **Backend**: https://sonarcloud.io/project/overview?id=wellkorea-erp-backend
- **Frontend**: https://sonarcloud.io/project/overview?id=wellkorea-erp-frontend
