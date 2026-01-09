# Change History

이 파일은 프로젝트의 주요 변경사항을 기록하고 복구 방법을 제공합니다.

---

## [2026-01-09 21:18:26] - shared 폴더 의존성 제거 및 파일 경로 수정

변경 사항:

- shared 폴더에 대한 모든 의존성 제거
- utils/fileOperations.ts 파일 생성 (savePipeline, loadPipeline 함수 직접 구현)
- utils/samples.ts 재작성 (shared 폴더 의존성 제거, 모든 함수 직접 구현)
- components/icons.tsx 재작성 (shared 폴더 의존성 제거, 모든 아이콘 컴포넌트 직접 구현)
- ArrowDownTrayIcon 추가
- App.tsx의 import 경로 수정 (../shared/utils/fileOperations -> ./utils/fileOperations)
- File System Access API를 사용한 파일 저장/로드 기능 구현
- Heroicons 스타일의 SVG 아이콘 컴포넌트 직접 구현

영향받은 파일:

- utils/fileOperations.ts (신규 생성)
- utils/samples.ts (재작성)
- components/icons.tsx (재작성)
- App.tsx (import 경로 수정)

이유:

- 파일 이름과 위치가 변경되어 shared 폴더가 더 이상 존재하지 않음
- 프로젝트 구조 변경에 따른 import 경로 수정 필요
- 모든 의존성을 프로젝트 내부로 이동하여 독립성 확보

복구 방법:

# 백업 및 복구
git stash push -u -m "백업"
git reset --hard 3b03290

# 또는 직접 복구
git reset --hard 3b03290

커밋 해시: 3b03290

---

## [2025-12-12 15:25:48] - Samples와 My Work 기능 분리 및 개선

변경 사항:

- Samples와 My Work 기능을 분리하여 구현
- Samples: 공유 샘플 저장 (파일 다운로드, 커밋/푸시 포함)
- My Work: 개인 작업 저장 (localStorage, 개인 PC 파일 읽기)
- Samples 탭에는 "현재 모델 저장" 버튼만 표시
- My Work 탭에는 "파일에서 로드", "현재 모델 저장", "초기 화면으로 설정" 버튼 추가
- 덮어쓰기 확인 다이얼로그 개선 (Samples와 My Work 모두 지원)
- 공유 샘플은 /public/samples/samples.json에서 로드
- 개인 작업은 localStorage에 저장

영향받은 파일:

- App.tsx
- utils/samples.ts (신규 생성)
- public/samples/samples.json (신규 생성)

이유:
- Samples는 모든 사용자와 공유되는 예시를 저장
- My Work는 개인별로 작업을 저장하고 관리
- 덮어쓰기 확인으로 실수로 데이터를 덮어쓰는 것을 방지

복구 방법:

# 백업 및 복구
git stash push -u -m "백업"
git reset --hard <커밋해시>

# 또는 직접 복구
git reset --hard <커밋해시>

---

## [2025-12-12 15:18:30] - PipelineExecutionModal 타입 오류 수정

변경 사항:

- PipelineExecutionModal.tsx에서 발생한 TypeScript 타입 오류 수정
- Map에서 가져온 값의 타입 추론 문제를 타입 단언으로 해결
- ModuleExecutionState 타입 단언 추가 (7곳)
- logMessage 함수에서 로그 배열 타입 명시

영향받은 파일:

- components/PipelineExecutionModal.tsx

이유:
- TypeScript 컴파일 오류로 인해 프로젝트 실행이 불가능했음
- Map.get()으로 가져온 값의 타입이 제대로 추론되지 않아 발생한 문제

복구 방법:

# 백업 및 복구
git stash push -u -m "백업"
git reset --hard <커밋해시>

# 또는 직접 복구
git reset --hard <커밋해시>

---

## [2025-01-XX] - Reserve Calculator 모듈 추가

변경 사항:

- Reserve Calculator 모듈 신규 추가
- Gross Premium Calculator 결과 및 테이블 데이터를 입력으로 받아 Reserve 열 계산
- Payment Term 조건에 따라 두 가지 수식 적용 (Payment Term ≤ m, Payment Term > m)
- ParameterInputModal에 ReserveCalculatorParams 컴포넌트 추가
  - 테이블 열 이름 표시
  - Gross Premium Calculator 변수 표시
  - 두 개의 수식 입력 필드
  - 화살표 버튼으로 첫 번째 수식에서 두 번째 수식으로 복사 기능
- App.tsx의 executePipeline에 ReserveCalculator 실행 로직 추가
- codeSnippets.ts에 ReserveCalculator 코드 생성 로직 추가
- ModuleInputSummary.tsx에 ReserveCalculator 입력 요약 추가

영향받은 파일:

- components/ParameterInputModal.tsx
- App.tsx
- codeSnippets.ts
- components/ModuleInputSummary.tsx
- components/icons.tsx (ChevronRightIcon import 추가)

복구 방법

# 백업 및 복구

git stash push -u -m "백업"
git reset --hard <커밋해시>

# 또는 직접 복구

git reset --hard <커밋해시>

---

## [2025-12-04 15:40:57] - Scenario Runner와 Pipeline Explainer 모듈 박스상자 기능 추가 및 겹침 방지

변경 사항:

- Scenario Runner와 Pipeline Explainer 모듈이 캔버스에 표시될 때 자동으로 박스상자로 감싸지도록 구현
- 두 모듈의 박스상자가 겹치지 않도록 배치 로직 개선
- Auto Layout 기능에 박스 크기 및 겹침 방지 로직 반영
- 모듈 생성 시 기존 특수 모듈과 겹치지 않는 위치 자동 탐색 기능 추가

영향받은 파일:

- components/Canvas.tsx
- App.tsx

복구 방법

# 특정 커밋으로 되돌리기

git checkout edf721f

# 또는 현재 브랜치에서 이 커밋 상태로 되돌리기 (변경사항 유지)

git reset --soft edf721f

# 완전히 이 커밋 상태로 되돌리기 (변경사항 삭제)

git reset --hard edf721f

---

## [2025-12-04] - Data 카테고리 재구성 및 History 관리 체계 구축

복구 방법

# 특정 커밋으로 되돌리기

git checkout 88b8ac3

# 또는 현재 브랜치에서 이 커밋 상태로 되돌리기 (변경사항 유지)

git reset --soft 88b8ac3

# 완전히 이 커밋 상태로 되돌리기 (변경사항 삭제)

git reset --hard 88b8ac3

---

## [2025-12-04] - .cursorrules 파일 추가 및 History 관리 체계 구축

복구 방법

# 특정 커밋으로 되돌리기

git checkout 88b8ac3

# 또는 현재 브랜치에서 이 커밋 상태로 되돌리기 (변경사항 유지)

git reset --soft 88b8ac3

# 완전히 이 커밋 상태로 되돌리기 (변경사항 삭제)

git reset --hard 88b8ac3

---

## [2025-12-04] - HISTORY.md 복구 정보 업데이트

복구 방법

# 특정 커밋으로 되돌리기

git checkout edf721f

# 또는 현재 브랜치에서 이 커밋 상태로 되돌리기 (변경사항 유지)

git reset --soft edf721f

# 완전히 이 커밋 상태로 되돌리기 (변경사항 삭제)

git reset --hard edf721f

---
