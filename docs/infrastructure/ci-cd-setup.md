# CI/CD 파이프라인 문서

## 개요

이 문서는 Well Korea ERP 시스템의 CI/CD 파이프라인을 설명합니다. 파이프라인은 자동화된 테스트, 코드 품질 검사, 보안 스캐닝 및 여러 환경으로의 배포를 포함한 트렁크 기반 개발 워크플로우를 구현합니다.

## 아키텍처

```
Pull Request → CI (품질 검사) → main 병합 → CD (배포)
```

### 파이프라인 단계

1. **CI (지속적 통합)** - Pull Request 시 실행
   - Backend: 빌드, JUnit 테스트, JaCoCo 커버리지 (70%), SonarCloud
   - Frontend: 빌드, ESLint, Vitest 테스트, SonarCloud
   - Security: Trivy 취약점 스캔, Gitleaks 시크릿 탐지
   - CodeQL: 정적 분석 (주간 스케줄)

2. **CD (지속적 배포)** - main 푸시 또는 버전 태그 시 실행
   - Dev: 자동 배포 (현재 주석 처리)
   - Staging: 자동 배포 (현재 주석 처리)
   - Production: 수동 승인 필요, 버전 태그로 트리거 (현재 주석 처리)

## 워크플로우 구조

### 활성 워크플로우

- **`ci.yml`** - 품질 검사를 위한 메인 CI 워크플로우
- **`codeql.yml`** - CodeQL 보안 분석 (주간 + PR 시)

### 재사용 가능한 워크플로우 컴포넌트

`.github/workflows/_shared/` 위치:

- **`backend-quality.yml`** - Backend 빌드, 테스트, 커버리지
- **`frontend-quality.yml`** - Frontend 빌드, 테스트, 린팅
- **`docker-build.yml`** - Docker 이미지 빌드 및 푸시
- **`e2e-tests.yml`** - Playwright E2E 테스트

### CD 워크플로우 (주석 처리됨)

배포 인프라 구성 시 활성화 가능:

- **`cd-dev.yml`** - 개발 환경 배포
- **`cd-staging.yml`** - 스테이징 환경 배포
- **`cd-prod.yml`** - 프로덕션 환경 배포 (수동 승인 필요)

## 기술 스택

### Backend
- Java 21 with Spring Boot 3.5.8
- Gradle 빌드 시스템
- JUnit 5 테스팅
- JaCoCo 코드 커버리지 (70% 임계값)
- SonarCloud 코드 품질 분석

### Frontend
- React 19 with TypeScript 5.9
- Vite 7 빌드 도구
- Vitest 유닛 테스트
- Playwright E2E 테스트
- ESLint 코드 린팅
- SonarCloud 코드 품질 분석

### 인프라
- Docker & Docker Compose
- GitHub Container Registry (ghcr.io)
- PostgreSQL 16

## 시작하기

### 사전 요구사항

1. **SonarCloud 설정**
   - SonarCloud에 프로젝트 생성:
     - `wellkorea-erp-backend`
     - `wellkorea-erp-frontend`
   - SonarCloud 토큰 생성
   - GitHub 저장소 시크릿에 `SONAR_TOKEN` 추가

2. **로컬 개발 환경**
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

# SonarCloud 분석 실행 (SONAR_TOKEN 필요)
./gradlew sonar
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
cp .env.example .env
docker-compose up -d
```

## CD 워크플로우 활성화

### 1. 개발 환경

1. GitHub에 배포 시크릿 설정:
   - `DEV_SSH_HOST`: 개발 서버 SSH 호스트
   - `DEV_SSH_USER`: SSH 사용자
   - `DEV_SSH_KEY`: SSH 개인 키

2. `cd-dev.yml`에서 배포 URL 업데이트:
   ```yaml
   environment:
     url: https://dev.wellkorea-erp.com  # 실제 개발 URL
   ```

3. `.github/workflows/cd-dev.yml`의 전체 워크플로우 주석 해제

### 2. 스테이징 환경

개발 환경과 동일한 단계 수행:
- `STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY` 사용
- `cd-staging.yml`에서 URL 업데이트
- `.github/workflows/cd-staging.yml` 주석 해제

### 3. 프로덕션 환경

1. GitHub에 "production" 환경 생성:
   - Settings > Environments > New environment
   - 이름: `production`
   - "Required reviewers" 활성화
   - 배포 승인자 추가

2. 시크릿 설정:
   - `PROD_SSH_HOST`, `PROD_SSH_USER`, `PROD_SSH_KEY`

3. `cd-prod.yml`에서 URL 업데이트

4. `.github/workflows/cd-prod.yml` 주석 해제

5. 버전 태그로 배포:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## 품질 게이트

### CI 품질 검사

다음의 경우 CI 파이프라인이 **PR 병합을 차단**합니다:
- Backend 테스트 실패
- Frontend 테스트 실패
- 코드 커버리지 70% 미만
- ESLint 오류 존재
- 높음/치명적 보안 취약점 탐지
- SonarCloud 품질 게이트 실패

### 코드 커버리지 요구사항

- **Backend**: 최소 70% (라인, 브랜치, 함수, 구문)
- **Frontend**: 최소 70% (라인, 브랜치, 함수, 구문)

## 보안 기능

### 자동화된 보안 스캔

1. **Dependabot** - 의존성 업데이트
   - 매주 월요일 오전 9시 실행
   - 모니터링: Gradle, npm, GitHub Actions, Docker
   - 오래된 의존성에 대한 PR 생성

2. **CodeQL** - 정적 애플리케이션 보안 테스트
   - 매주 월요일 오전 3시 실행
   - 분석: Java backend, TypeScript frontend
   - 탐지: SQL 인젝션, XSS, 코드 인젝션 등

3. **Trivy** - 컨테이너 및 파일시스템 취약점 스캔
   - 모든 PR에서 실행
   - 스캔: CVE, 잘못된 구성, 시크릿
   - 보고: 높음 및 치명적 취약점

4. **Gitleaks** - 시크릿 탐지
   - 모든 PR에서 실행
   - 탐지: 코드 내 API 키, 토큰, 비밀번호

### 보안 검사 결과 확인

1. GitHub 저장소의 **Security** 탭으로 이동
2. **Code scanning alerts** 확인 (CodeQL + Trivy)
3. 취약한 의존성에 대한 **Dependabot alerts** 확인
4. **Secret scanning alerts** 확인 (활성화된 경우)

## 모니터링 및 관찰성

### CI/CD 메트릭

워크플로우 실행 확인:
- GitHub Actions 탭 > Workflows
- 빌드 시간, 성공률, 불안정성 모니터링

### 아티팩트

각 실행마다 다음 아티팩트가 업로드됩니다:

- **Backend 테스트 결과** (30일 보관)
- **Backend 커버리지 리포트** (30일 보관)
- **Frontend 테스트 결과** (30일 보관)
- **Frontend 빌드 아티팩트** (7일 보관)
- **Playwright 리포트** (30일 보관)
- **E2E 테스트 결과** (30일 보관)

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

#### 3. E2E 테스트 실패

```bash
# 디버깅을 위해 headed 모드로 실행
npx playwright test --headed

# 특정 테스트 실행
npx playwright test smoke.spec.ts

# 스냅샷 업데이트
npx playwright test --update-snapshots
```

#### 4. SonarCloud 품질 게이트 실패

- CI 로그의 SonarCloud 리포트 링크 확인
- 일반적인 문제:
  - 임계값 미만의 코드 커버리지
  - 감지된 코드 스멜 또는 버그
  - 보안 핫스팟
  - 중복 코드

#### 5. Docker 빌드 실패

```bash
# 로컬에서 빌드 테스트
docker build -t test:local ./backend

# 디스크 공간 확인
docker system df
docker system prune -a
```

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

### Pull Request 워크플로우

1. `main`에서 feature 브랜치 생성
2. 변경 사항 작성 및 커밋
3. GitHub에 푸시하고 PR 생성
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
- 선택적 테스트 실행

### 비용 최적화

- 동시성을 사용하여 오래된 실행 취소
- 아티팩트 보관 기간 제한
- 필요할 때만 매트릭스 빌드 사용

## 로드맵

향후 개선 사항:
- [ ] PR용 미리보기 환경 배포
- [ ] 성능 테스트 추가
- [ ] 카나리 배포 구현
- [ ] Slack/Discord 알림 추가
- [ ] 모니터링 대시보드 설정
- [ ] 실패 시 자동 롤백 구현
- [ ] 부하 테스트 추가

## 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [SonarCloud 문서](https://docs.sonarcloud.io/)
- [Dependabot 문서](https://docs.github.com/en/code-security/dependabot)
- [CodeQL 문서](https://codeql.github.com/docs/)
- [Docker 문서](https://docs.docker.com/)
- [Playwright 문서](https://playwright.dev/)
