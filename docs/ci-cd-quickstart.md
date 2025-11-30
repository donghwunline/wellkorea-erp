# CI/CD 빠른 시작 가이드

## 1단계: SonarCloud 설정 (5분)

### 프로젝트 생성

1. [SonarCloud](https://sonarcloud.io/)에 로그인
2. 조직 선택: `donghwunline`
3. 두 개의 프로젝트 생성:
   - **Backend**: `wellkorea-erp-backend`
   - **Frontend**: `wellkorea-erp-frontend`

### 토큰 생성

1. My Account > Security > Generate Tokens
2. 토큰 이름: `wellkorea-erp-github-actions`
3. 생성된 토큰 복사

### GitHub 시크릿 추가

1. GitHub 저장소 > Settings > Secrets and variables > Actions
2. **New repository secret** 클릭
3. Name: `SONAR_TOKEN`
4. Value: 복사한 토큰 붙여넣기
5. **Add secret** 클릭

✅ **완료!** CI가 이제 SonarCloud 분석을 실행할 수 있습니다.

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
```

**예상 결과**: 모든 테스트 통과, 커버리지 70% 이상

### Frontend 테스트

```bash
cd frontend

# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install

# 유닛 테스트 실행
npm test

# E2E 테스트 실행
npm run e2e
```

**예상 결과**: 모든 테스트 통과

---

## 3단계: 첫 번째 Pull Request (5분)

### PR 생성

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

### GitHub에서 PR 생성

1. GitHub 저장소로 이동
2. "Compare & pull request" 클릭
3. PR 제목: `test: CI/CD 파이프라인 테스트`
4. **Create pull request** 클릭

### CI 확인

1. PR 페이지에서 "Checks" 탭 확인
2. 다음 워크플로우가 실행되는지 확인:
   - ✅ Backend CI
   - ✅ Frontend CI
   - ✅ Security Checks
   - ✅ CodeQL

**예상 시간**: 5-10분

---

## 4단계: CI 결과 확인

### 성공 시

- 모든 체크가 녹색 ✅
- SonarCloud 품질 게이트 통과
- PR 병합 가능

### 실패 시

**Backend 실패:**
```bash
# 로컬에서 재현
cd backend
./gradlew clean build

# 오류 확인 및 수정
```

**Frontend 실패:**
```bash
# 로컬에서 재현
cd frontend
npm run lint
npm test

# 오류 확인 및 수정
```

**보안 체크 실패:**
- GitHub Security 탭에서 경고 확인
- 취약점 해결 또는 억제

---

## 5단계: 로컬 Docker 테스트 (선택사항, 15분)

### 환경 파일 생성

```bash
cp .env.example .env

# .env 파일 편집 (필요시)
vim .env
```

### Docker Compose로 전체 스택 실행

```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

**접속:**
- Frontend: http://localhost:80
- Backend: http://localhost:8080
- Database: localhost:5432

### 정리

```bash
# 중지 및 삭제
docker-compose down

# 볼륨까지 삭제
docker-compose down -v
```

---

## 다음 단계

### CD 활성화 준비가 되었나요?

**개발 환경 배포 활성화:**

1. 배포 서버 준비 (Docker 설치 필요)
2. GitHub Secrets 추가:
   - `DEV_SSH_HOST`
   - `DEV_SSH_USER`
   - `DEV_SSH_KEY`
3. `.github/workflows/cd-dev.yml` 주석 해제
4. `main` 브랜치에 푸시하여 배포 트리거

자세한 내용은 [CI/CD 설정 문서](./ci-cd-setup.md)를 참조하세요.

---

## 문제 해결

### "SONAR_TOKEN이 없습니다" 오류

```bash
# GitHub Secrets 확인
# Settings > Secrets and variables > Actions

# SONAR_TOKEN이 있는지 확인
# 없으면 1단계로 돌아가서 추가
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

# SonarCloud 분석
./gradlew sonar
```

### Frontend
```bash
# 린트만
npm run lint

# 테스트 (watch 모드)
npm test

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
docker-compose logs [service-name]

# 서비스 재시작
docker-compose restart [service-name]

# 특정 서비스만 빌드
docker-compose build backend

# 스케일링
docker-compose up -d --scale backend=2
```

---

## 추가 리소스

- 📚 [상세 CI/CD 문서](./ci-cd-setup.md)
- 📄 [SonarQube 설정](./sonarqube.md)
- 🐳 [Docker 설정](../docker-compose.yml)
- 🔧 [Backend 설정](../backend/build.gradle)
- ⚛️ [Frontend 설정](../frontend/package.json)

---

## 도움이 필요하신가요?

1. GitHub Issues에 질문 등록
2. CI 로그 확인: Actions 탭 > 실패한 워크플로우 클릭
3. 상세 문서 참조: [ci-cd-setup.md](./ci-cd-setup.md)
