# Change History

이 파일은 프로젝트의 주요 변경사항을 기록하고 복구 방법을 제공합니다.

## 빠른 복구 가이드

### 현재 상태로 복구 (가장 간단)

```bash
# 현재 상태로 복구 (최신 커밋: a27ffb0)
# 전체 해시: a27ffb04f4e0636f553fd0a67184f074beb0e3a7
git reset --hard a27ffb0

# 또는 백업 후 복구 (권장)
git stash push -u -m "백업"
git reset --hard a27ffb0
```

### 특정 커밋으로 복구

```bash
git reset --hard <커밋해시>
```

### 복구 전 현재 상태 백업 (권장)

```bash
git stash  # 현재 변경사항 임시 저장
git reset --hard <커밋해시>  # 복구
git stash pop  # 필요시 백업 복원
```

## 상세 복구 가이드

### 변경사항 확인 후 복구

```bash
git log --oneline -10  # 최근 10개 커밋 확인
git reset --hard <원하는_커밋해시>
```

### 추적되지 않은 파일까지 제거

```bash
git reset --hard <커밋해시>
git clean -fd  # 추적되지 않은 파일 및 디렉토리 제거
```

---

## [2025-01-XX] - Data 카테고리 재구성 및 모듈 이름 변경

### 변경 내용

- **시간**: 2025-01-XX (실제 시간 기록 필요)
- **설명**:
  - Data 카테고리 순서 변경: DefinePolicyInfo, LoadData, SelectRiskRates, SelectData, RateModifier 순서로 재정렬
  - Select Data 모듈 이름을 "Select Rates"로 변경
  - Scenario Runner와 Pipeline Explainer 위치 조정 및 스타일 변경
  - Run All 실행 시 Scenario Runner와 Pipeline Explainer 제외
  - 두 모듈의 실행 버튼을 "전체실행" 버튼으로 변경
- **영향받은 파일**:
  - `App.tsx` (카테고리 순서 변경, Auto Layout 로직 수정)
  - `constants.ts` (모듈 이름 변경)
  - `components/ComponentRenderer.tsx` (특수 모듈 스타일 및 버튼 변경)
- **변경 이유**: 사용자 요청에 따른 UI/UX 개선 및 기능 정리
- **Git 커밋 해시**: `d16761a` (기준 커밋)
- **복구 방법**:

  ```bash
  # 백업 후 복구 (권장)
  git stash push -u -m "백업"
  git reset --hard d16761a

  # 또는 직접 복구
  git reset --hard d16761a
  ```

---

## [2025-12-04] - .cursorrules 파일 추가 및 History 관리 체계 구축

### 변경 내용

- **시간**: 2025-12-04 14:52:20
- **설명**:
  - 프로젝트 규칙 및 History 자동 기록 규칙 추가
  - HISTORY.md 파일 생성 및 복구 가이드 작성
  - .cursorrules에 History 관리 규칙 추가 (섹션 7, 8, 9, 10, 11)
- **영향받은 파일**:
  - `.cursorrules` (History 관리 규칙 추가)
  - `HISTORY.md` (신규 생성)
- **변경 이유**: 프로젝트 관리 및 변경사항 추적 체계화
- **Git 커밋 해시**: `88b8ac3` (위 항목과 동일한 커밋)
- **복구 방법**:
  ```bash
  # 백업 후 복구 (권장)
  git stash push -u -m "백업"
  git reset --hard 88b8ac3
  
  # 또는 직접 복구
  git reset --hard 88b8ac3
  ```

---

## [2025-12-04] - HISTORY.md 복구 정보 업데이트

### 변경 내용

- **시간**: 2025-12-04 15:38:33 (추정)
- **설명**:
  - HISTORY.md에 현재 상태 복구 정보 추가
  - 빠른 복구 가이드에 현재 커밋 해시 반영
  - 복구 방법 간소화 및 정리
- **영향받은 파일**:
  - `HISTORY.md` (복구 정보 업데이트)
- **변경 이유**: 현재 상태로 복구할 수 있도록 정보 기록
- **Git 커밋 해시**: `a27ffb0` (전체 해시: `a27ffb04f4e0636f553fd0a67184f074beb0e3a7` - 최신 커밋)
- **복구 방법**:
  ```bash
  # 백업 후 복구 (권장)
  git stash push -u -m "백업"
  git reset --hard a27ffb0
  
  # 또는 직접 복구
  git reset --hard a27ffb0
  ```

---

## [2025-12-04] - Data 카테고리 재구성 및 History 관리 체계 구축

### 변경 내용

- **시간**: 2025-12-04 15:38:33
- **설명**:
  - Data 카테고리 순서 변경: DefinePolicyInfo, LoadData, SelectRiskRates, SelectData, RateModifier 순서로 재정렬
  - Select Data 모듈 이름을 "Select Rates"로 변경
  - Scenario Runner와 Pipeline Explainer 위치 조정 (50px 아래로 이동) 및 스타일 변경
  - Run All 실행 시 Scenario Runner와 Pipeline Explainer 제외
  - 두 모듈의 실행 버튼을 "전체실행" 버튼으로 변경 (두 줄 표시)
  - Auto Layout에서 특수 모듈 위치 자동 조정
  - .cursorrules 파일 추가 (프로젝트 규칙 및 History 관리 규칙)
  - HISTORY.md 파일 생성 및 복구 가이드 작성
  - 복구 방법 간소화 및 stash 백업 방법 추가
- **영향받은 파일**:
  - `App.tsx` (카테고리 순서 변경, Auto Layout 로직 수정, Run All 로직 수정)
  - `constants.ts` (모듈 이름 변경: Select Data → Select Rates)
  - `components/ComponentRenderer.tsx` (특수 모듈 스타일, 버튼 변경)
  - `components/ModuleInputSummary.tsx` (변경사항 포함)
  - `components/ParameterInputModal.tsx` (변경사항 포함)
  - `.cursorrules` (신규 생성 - 프로젝트 규칙 및 History 관리)
  - `HISTORY.md` (신규 생성 - 변경 이력 기록)
- **변경 이유**: 사용자 요청에 따른 UI/UX 개선, 기능 정리 및 프로젝트 관리 체계화
- **Git 커밋 해시**: `88b8ac3` (전체 해시: `88b8ac305e78644c2abd8a7b8b970906a0a6bb74`)
- **복구 방법**:
  ```bash
  # 백업 후 복구 (권장)
  git stash push -u -m "백업"
  git reset --hard 88b8ac3
  
  # 또는 직접 복구
  git reset --hard 88b8ac3
  ```

---

## [2025-12-04] - 이전 작업 상태 (참고용)

### 이전 상태 정보

- **시간**: 2025-12-04 (커밋 전 상태)
- **기준 커밋**: `d16761a700f4ebce8eed3ac620a7c479893f362a`
- **커밋 메시지**: "feat: 실행 버튼 색상 구분 및 헤더 버튼 레이아웃 개선"
- **상태**: 현재 상태로 커밋 완료 (위 항목 참조)

### 현재 변경된 파일

- `App.tsx` - Data 카테고리 순서 변경, Auto Layout 로직 수정
- `components/ComponentRenderer.tsx` - 특수 모듈 스타일 및 버튼 변경
- `components/ModuleInputSummary.tsx` - (변경사항 확인 필요)
- `components/ParameterInputModal.tsx` - (변경사항 확인 필요)
- `constants.ts` - 모듈 이름 변경 (Select Data → Select Rates)

### 새로 추가된 파일

- `.cursorrules` - 프로젝트 규칙 및 History 관리 규칙
- `HISTORY.md` - 변경 이력 기록 파일

### 이전 상태로 복구하는 방법 (참고용)

#### 방법 1: Stash를 사용한 백업 및 복구 (권장)

```bash
# 현재 변경사항을 stash에 저장 후 복구
git stash push -u -m "현재 작업 백업"
git reset --hard d16761a

# 나중에 변경사항 복원
git stash apply
```

#### 방법 2: 기준 커밋으로 직접 복구 (변경사항 모두 제거)

```bash
# 기준 커밋으로 복구 (모든 변경사항 제거)
git reset --hard d16761a

# 추적되지 않은 파일도 제거하려면
git clean -fd
```

### 현재 상태 확인 명령어

```bash
# 현재 커밋 해시 확인
git rev-parse HEAD

# 변경된 파일 확인
git status

# 변경 내용 확인
git diff

# 커밋 히스토리 확인
git log --oneline -10
```

---

## 기록 형식

새로운 변경사항을 기록할 때는 다음 형식을 따르세요:

````markdown
## [YYYY-MM-DD] - 변경사항 제목

### 변경 내용

- **시간**: YYYY-MM-DD HH:MM:SS
- **설명**: 변경 내용에 대한 상세 설명
- **영향받은 파일**:
  - `파일명1.ts`
  - `파일명2.tsx`
- **변경 이유**: 변경을 수행한 이유
- **Git 커밋 해시**: `커밋해시`
- **복구 방법**:

  ```bash
  # 간단한 복구
  git stash push -u -m "백업"
  git reset --hard <커밋해시>

  # 또는 직접 복구
  git reset --hard <커밋해시>
  ```
````
