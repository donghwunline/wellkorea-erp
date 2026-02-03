# CI/CD 파이프라인 문서

## 개요

이 문서는 Well Korea ERP 시스템의 CI/CD 파이프라인을 설명합니다. 파이프라인은 자동화된 테스트, 코드 품질 검사, 보안 스캐닝 및 Harbor 레지스트리로의 이미지 푸시를 포함한 트렁크 기반 개발 워크플로우를 구현합니다.

## 아키텍처

```
┌─────────────┐    push     ┌─────────────┐    push      ┌─────────────┐
│   GitLab    │ ─────────▶  │  GitLab CI  │ ──────────▶  │   Harbor    │
│ Repository  │             │ (Security/  │              │  Registry   │
└─────────────┘             │  Test/Build)│              └─────────────┘
                            └─────────────┘
```

### 파이프라인 단계

1. **Security (보안 스캔)** - 모든 브랜치/MR에서 실행
   - Trivy: 취약점 스캔 (CRITICAL/HIGH)
   - Gitleaks: 시크릿 탐지
   - Semgrep: 정적 분석 (경고만, 비차단)

2. **Test (테스트)** - 모든 브랜치/MR에서 실행
   - Backend: JUnit 테스트, JaCoCo 커버리지 (70%)
   - Frontend: ESLint, Vitest 테스트, 커버리지 (70%)

3. **Docker (이미지 빌드/푸시)** - main 브랜치에서만 실행
   - Harbor 레지스트리로 이미지 푸시
   - 태그: commit SHA, branch slug, latest

4. **CD (지속적 배포)** - 추후 추가 예정
   - Dev: 자동 배포
   - Staging: 수동 승인
   - Production: 수동 승인 (protected environment)

## 워크플로우 구조

### 메인 파이프라인 파일

- **`.gitlab-ci.yml`** - 전체 CI 파이프라인 정의
  - security stage: trivy-scan, gitleaks, semgrep
  - test stage: backend-test, frontend-test
  - docker stage: docker-backend, docker-frontend

### 파이프라인 실행 조건

| 스테이지 | 실행 조건 | 비고 |
|---------|----------|------|
| security | 모든 브랜치, MR | 항상 실행 |
| test | 모든 브랜치, MR | 항상 실행 |
| docker | main 브랜치만 | 테스트 통과 후 |

## 기술 스택

### Backend
- Java 21 with Spring Boot 3.5.8
- Gradle 빌드 시스템
- JUnit 5 테스팅
- JaCoCo 코드 커버리지 (70% 임계값)

### Frontend
- React 19 with TypeScript 5.9
- Vite 7 빌드 도구
- Vitest 유닛 테스트
- ESLint 코드 린팅

### 인프라
- Docker & Docker Compose
- Harbor Registry (harbor.mipllab.com)
- GitLab CI (gitlab.mipllab.com)
- PostgreSQL 16

## 시작하기

### 사전 요구사항

#### 1. GitLab CI/CD Variables 설정

GitLab 프로젝트에서 **Settings > CI/CD > Variables**로 이동하여 다음 변수를 추가합니다:

| Variable | Value | Protected | Masked |
|----------|-------|-----------|--------|
| `HARBOR_REGISTRY` | `harbor.mipllab.com` | No | No |
| `HARBOR_USERNAME` | `robot$wellkorea-ci` | No | No |
| `HARBOR_PASSWORD` | (robot token) | Yes | Yes |

#### 2. Harbor 설정

1. Harbor에서 프로젝트 생성: `wellkorea`
2. Robot Account 생성: `robot$wellkorea-ci`
3. Push/Pull 권한 부여
4. Robot token을 GitLab CI 변수로 등록

#### 3. GitLab Runner 설정

Runner는 Docker executor와 Docker-in-Docker (dind) 기능이 필요합니다:

```yaml
# Runner configuration example
[[runners]]
  executor = "docker"
  [runners.docker]
    privileged = true  # Required for dind
    volumes = ["/certs/client", "/cache"]
```

### 로컬 개발 환경

```bash
# Backend 의존성 설치
cd backend
./gradlew build

# Frontend 의존성 설치
cd frontend
npm install

# Playwright 브라우저 설치
npx playwright install
```

### 로컬에서 테스트 실행

#### Backend
```bash
cd backend

# 커버리지와 함께 테스트 실행
./gradlew test jacocoTestReport

# 커버리지 리포트 확인
open build/reports/jacoco/test/html/index.html

# 커버리지 검증 (70% 임계값)
./gradlew jacocoTestCoverageVerification
```

#### Frontend
```bash
cd frontend

# 유닛 테스트 실행
npm test

# 커버리지와 함께 테스트 실행
npm run test:coverage

# E2E 테스트 실행
npm run e2e

# E2E 테스트 UI 모드로 실행
npm run e2e:ui
```

### Docker 이미지 빌드

```bash
# Backend 이미지 빌드
docker build -t wellkorea-erp-backend:local ./backend

# Frontend 이미지 빌드
docker build -t wellkorea-erp-frontend:local ./frontend

# docker-compose로 실행
cp .env.local.example .env
docker compose -f docker-compose.local.yml up -d
```

## 품질 게이트

### CI 품질 검사

다음의 경우 CI 파이프라인이 **MR 병합을 차단**합니다:
- Backend 테스트 실패
- Frontend 테스트 실패
- 코드 커버리지 70% 미만
- ESLint 오류 존재
- 높음/치명적 보안 취약점 탐지 (Trivy)
- 시크릿 탐지 (Gitleaks)

### 코드 커버리지 요구사항

- **Backend**: 최소 70% (JaCoCo jacocoTestCoverageVerification으로 강제)
- **Frontend**: 최소 70% (Vitest coverage로 강제)

## 보안 기능

### 자동화된 보안 스캔

1. **Trivy** - 파일시스템 취약점 스캔
   - 모든 브랜치/MR에서 실행
   - CRITICAL 및 HIGH 취약점 탐지
   - 취약점 발견 시 파이프라인 차단

2. **Gitleaks** - 시크릿 탐지
   - 모든 브랜치/MR에서 실행
   - 코드 내 API 키, 토큰, 비밀번호 탐지
   - 시크릿 발견 시 파이프라인 차단

3. **Semgrep** - 정적 분석
   - 모든 브랜치/MR에서 실행
   - 코드 품질 및 보안 패턴 분석
   - 경고만 (파이프라인 비차단)

## 이미지 태깅 전략

```
harbor.mipllab.com/wellkorea/erp-backend:{tag}
harbor.mipllab.com/wellkorea/erp-frontend:{tag}
```

| Tag | 생성 시점 | 예시 |
|-----|----------|------|
| `{commit-sha}` | main 브랜치 빌드마다 | `abc1234f` |
| `{branch-slug}` | main 브랜치 빌드마다 | `main` |
| `latest` | main 브랜치 빌드마다 | `latest` |

## 모니터링 및 관찰성

### CI/CD 메트릭

파이프라인 실행 확인:
- GitLab CI/CD > Pipelines
- 빌드 시간, 성공률, 불안정성 모니터링

### 아티팩트

각 실행마다 다음 아티팩트가 업로드됩니다:

- **Backend 테스트 결과** (30일 보관)
- **Backend 커버리지 리포트** (30일 보관)
- **Frontend 빌드 아티팩트** (7일 보관)
- **Frontend 커버리지** (7일 보관)

## 문제 해결

### 일반적인 문제

#### 1. Gradle 빌드 실패

```bash
# 로컬 Gradle 캐시 정리
./gradlew clean --no-daemon
rm -rf ~/.gradle/caches

# CI에서는 캐시가 자동으로 관리됨
```

#### 2. Frontend 빌드 실패

```bash
# npm 캐시 정리
rm -rf node_modules package-lock.json
npm install

# 재빌드
npm run build
```

#### 3. Docker 빌드 실패

```bash
# 로컬에서 빌드 테스트
docker build -t test:local ./backend

# 디스크 공간 확인
docker system df
docker system prune -a
```

#### 4. Harbor 푸시 실패

```bash
# 로컬에서 로그인 테스트
docker login harbor.mipllab.com -u robot$wellkorea-ci

# 이미지 푸시 테스트
docker tag test:local harbor.mipllab.com/wellkorea/test:local
docker push harbor.mipllab.com/wellkorea/test:local
```

#### 5. GitLab CI Runner 문제

- Runner가 privileged 모드인지 확인
- dind 서비스가 활성화되어 있는지 확인
- TLS 인증서 경로가 올바른지 확인

## 모범 사례

### 브랜치 전략

- **Main 브랜치**: 프로덕션 준비 코드
- **Feature 브랜치**: `feature/설명`
- **Bugfix 브랜치**: `fix/설명`
- **Hotfix 브랜치**: `hotfix/설명`

### 커밋 메시지

Conventional Commits 따르기:
```
feat(backend): 사용자 인증 추가
fix(frontend): 네비게이션 버그 해결
chore(ci): 의존성 업데이트
docs(readme): 설정 지침 업데이트
```

### Merge Request 워크플로우

1. `main`에서 feature 브랜치 생성
2. 변경 사항 작성 및 커밋
3. GitLab에 푸시하고 MR 생성
4. CI 자동 실행
5. 실패 사항 해결
6. 리뷰 요청
7. 승인 및 CI 통과 시 병합

### 버전 관리

Semantic Versioning (SemVer) 사용:
- **Major**: 호환성 없는 변경 (v2.0.0)
- **Minor**: 새 기능, 하위 호환 (v1.1.0)
- **Patch**: 버그 수정 (v1.0.1)

## 성능 최적화

### 빌드 속도

현재 최적화:
- Gradle 의존성 캐싱
- npm 의존성 캐싱
- Docker 레이어 캐싱
- 병렬 작업 실행

### 비용 최적화

- 아티팩트 보관 기간 제한
- 필요할 때만 Docker 빌드 실행 (main 브랜치만)

## CD (배포) - 추후 추가 예정

배포 인프라 구성 시 다음 스테이지를 추가할 예정입니다:

```yaml
stages:
  - security
  - test
  - docker
  - deploy-dev      # 자동 배포
  - deploy-staging  # 수동 승인
  - deploy-prod     # 수동 승인 (protected environment)
```

배포 설정에 필요한 정보:
- SSH 접속 정보 (host, user, key)
- 환경별 `.env` 파일
- Docker Compose 배포 스크립트

## 로드맵

향후 개선 사항:
- [ ] CD 스테이지 추가 (dev/staging/prod)
- [ ] MR용 미리보기 환경 배포
- [ ] 성능 테스트 추가
- [ ] 카나리 배포 구현
- [ ] Slack/Discord 알림 추가
- [ ] 모니터링 대시보드 설정
- [ ] 실패 시 자동 롤백 구현

## 참고 자료

- [GitLab CI 문서](https://docs.gitlab.com/ee/ci/)
- [Harbor 문서](https://goharbor.io/docs/)
- [Docker 문서](https://docs.docker.com/)
- [Playwright 문서](https://playwright.dev/)
- [Trivy 문서](https://aquasecurity.github.io/trivy/)
- [Gitleaks 문서](https://github.com/gitleaks/gitleaks)
