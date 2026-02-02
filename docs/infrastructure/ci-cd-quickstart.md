# CI/CD 빠른 시작 가이드

## 1단계: GitLab CI/CD Variables 설정 (5분)

### Harbor Robot Account 생성 (이미 생성된 경우 건너뛰기)

1. Harbor (harbor.mipllab.com)에 로그인
2. `wellkorea` 프로젝트로 이동
3. **Robot Accounts** > **New Robot Account** 클릭
4. 이름: `wellkorea-ci`
5. 권한: Push/Pull 허용
6. 생성된 토큰 복사 (한 번만 표시됨!)

### GitLab CI/CD Variables 추가

1. GitLab 프로젝트 (gitlab.mipllab.com/wellkorea/erp) 접속
2. **Settings** > **CI/CD** > **Variables** 클릭
3. 다음 변수 추가:

| Key | Value | Protected | Masked |
|-----|-------|-----------|--------|
| `HARBOR_REGISTRY` | `harbor.mipllab.com` | No | No |
| `HARBOR_USERNAME` | `robot$wellkorea-ci` | No | No |
| `HARBOR_PASSWORD` | (복사한 robot token) | Yes | Yes |

> **참고**: `HARBOR_PASSWORD`는 반드시 **Protected**와 **Masked** 체크

✅ **완료!** CI가 이제 Harbor에 이미지를 푸시할 수 있습니다.

---

## 2단계: 로컬 테스트 (10분)

### Backend 테스트

```bash
cd backend

# 의존성 다운로드 및 빌드
./gradlew build

# 테스트 실행 (커버리지 포함)
./gradlew test jacocoTestReport

# 커버리지 확인 (웹 브라우저에서 열림)
open build/reports/jacoco/test/html/index.html

# 커버리지 검증 (70% 임계값)
./gradlew jacocoTestCoverageVerification
```

**예상 결과**: 모든 테스트 통과, 커버리지 70% 이상

### Frontend 테스트

```bash
cd frontend

# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install

# 린트 실행
npm run lint

# 유닛 테스트 실행
npm test

# E2E 테스트 실행
npm run e2e
```

**예상 결과**: 모든 테스트 통과

---

## 3단계: 첫 번째 Merge Request (5분)

### MR 생성

```bash
# 새 브랜치 생성
git checkout -b feature/test-ci-pipeline

# 작은 변경 (예: README 업데이트)
echo "CI/CD 테스트" >> README.md

# 커밋 및 푸시
git add .
git commit -m "test: CI/CD 파이프라인 테스트"
git push origin feature/test-ci-pipeline
```

### GitLab에서 MR 생성

1. GitLab 프로젝트로 이동
2. **Merge requests** > **New merge request** 클릭
3. Source branch: `feature/test-ci-pipeline`
4. Target branch: `main`
5. **Compare branches and continue** 클릭
6. MR 제목: `test: CI/CD 파이프라인 테스트`
7. **Create merge request** 클릭

### CI 확인

1. MR 페이지에서 **Pipelines** 탭 확인
2. 다음 스테이지가 실행되는지 확인:
   - ✅ Security (Trivy, Gitleaks, Semgrep)
   - ✅ Test (Backend, Frontend)

---

## 4단계: CI 결과 확인

### 성공 시

- 모든 job이 녹색 ✅
- 커버리지 백분율이 MR에 표시됨
- MR 병합 가능

### 실패 시

**Security 실패:**
```bash
# Trivy 오류 - 취약점 확인
trivy fs --severity CRITICAL,HIGH .

# Gitleaks 오류 - 시크릿 확인
gitleaks detect --source . --verbose
```

**Backend 실패:**
```bash
# 로컬에서 재현
cd backend
./gradlew clean build

# 커버리지 부족 시
./gradlew test jacocoTestReport
open build/reports/jacoco/test/html/index.html
```

**Frontend 실패:**
```bash
# 로컬에서 재현
cd frontend
npm run lint
npm test

# 오류 확인 및 수정
```

---

## 5단계: 로컬 Docker 테스트 (선택사항, 15분)

### 환경 파일 생성

```bash
cp .env.local.example .env

# .env 파일 편집 (필요시)
vim .env
```

### Docker Compose로 전체 스택 실행

```bash
# 빌드 및 실행
docker compose -f docker-compose.local.yml up -d

# 로그 확인
docker compose -f docker-compose.local.yml logs -f

# 상태 확인
docker compose -f docker-compose.local.yml ps
```

**접속:**
- Frontend: http://localhost:80
- Backend: http://localhost:8080
- Database: localhost:5432

### 정리

```bash
# 중지 및 삭제
docker compose -f docker-compose.local.yml down

# 볼륨까지 삭제
docker compose -f docker-compose.local.yml down -v
```

---

## 다음 단계

### main 브랜치에 병합하면?

MR이 main에 병합되면 **Docker 스테이지**가 자동으로 실행됩니다:
- Backend/Frontend 이미지가 Harbor로 푸시됨
- 태그: commit SHA, `main`, `latest`

### Harbor에서 이미지 확인

```bash
# 이미지 Pull 테스트
docker pull harbor.mipllab.com/wellkorea/erp-backend:latest
docker pull harbor.mipllab.com/wellkorea/erp-frontend:latest
```

### CD (배포)는?

CD 스테이지는 추후 추가 예정입니다. 자세한 내용은 [CI/CD 설정 문서](./ci-cd-setup.md)를 참조하세요.

---

## 문제 해결

### "HARBOR_PASSWORD가 없습니다" 오류

```bash
# GitLab CI/CD Variables 확인
# Settings > CI/CD > Variables

# HARBOR_PASSWORD가 있는지 확인
# 없으면 1단계로 돌아가서 추가
```

### Harbor 로그인 실패

```bash
# 로컬에서 테스트
docker login harbor.mipllab.com -u robot\$wellkorea-ci

# 주의: 터미널에서 $는 escape 필요 (\$)
```

### Gradle 권한 오류

```bash
# gradlew에 실행 권한 부여
chmod +x backend/gradlew
git add backend/gradlew
git commit -m "fix: gradlew 실행 권한 추가"
```

### npm 설치 실패

```bash
# 캐시 정리 후 재시도
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Docker 빌드 실패

```bash
# 디스크 공간 확인
docker system df

# 미사용 리소스 정리
docker system prune -a
```

---

## 유용한 명령어

### Backend
```bash
# 빌드만
./gradlew build -x test

# 테스트만
./gradlew test

# 커버리지 검증
./gradlew jacocoTestCoverageVerification
```

### Frontend
```bash
# 린트만
npm run lint

# 테스트 (watch 모드)
npm test -- --watch

# 커버리지
npm run test:coverage

# 빌드
npm run build

# E2E (UI 모드)
npm run e2e:ui
```

### Docker
```bash
# 로그 확인
docker compose -f docker-compose.local.yml logs [service-name]

# 서비스 재시작
docker compose -f docker-compose.local.yml restart [service-name]

# 특정 서비스만 빌드
docker compose -f docker-compose.local.yml build backend
```

### Harbor
```bash
# 로그인
docker login harbor.mipllab.com

# 이미지 태그
docker tag local-image:tag harbor.mipllab.com/wellkorea/image:tag

# 이미지 푸시
docker push harbor.mipllab.com/wellkorea/image:tag

# 이미지 풀
docker pull harbor.mipllab.com/wellkorea/erp-backend:latest
```

---

## 추가 리소스

- 📚 [상세 CI/CD 문서](./ci-cd-setup.md)
- 🐳 [Docker Compose 설정](../../docker-compose.local.yml)
- 🔧 [Backend 설정](../../backend/build.gradle)
- ⚛️ [Frontend 설정](../../frontend/package.json)
- 📦 [Harbor 문서](https://goharbor.io/docs/)
- 🦊 [GitLab CI 문서](https://docs.gitlab.com/ee/ci/)

---

## 도움이 필요하신가요?

1. GitLab Issues에 질문 등록
2. CI 로그 확인: CI/CD > Pipelines > 실패한 job 클릭
3. 상세 문서 참조: [ci-cd-setup.md](./ci-cd-setup.md)
