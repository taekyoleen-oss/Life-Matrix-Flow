# Change History

이 파일은 프로젝트의 주요 변경사항을 기록하고 복구 방법을 제공합니다.

---

## [2026-01-11] - Whole Life.lifx 샘플 업데이트 및 Save 기능 개선

변경 사항:

- samples/Whole Life.lifx 파일을 public/samples/samples.json의 "종신보험" 샘플로 업데이트
- Save 기능 개선: File System Access API 실패 시 자동으로 다운로드 방식으로 fallback
- Save 기능 개선: 파일명에 productName 사용 (기존: pipeline.lifx, 개선: 종신보험.lifx)
- Save 기능 개선: 파일명 특수문자 처리 (<>:"/\|?*를 _로 치환)
- Save 기능 개선: 에러 발생 시 사용자에게 alert 표시
- Additional Variables 모듈: 변경 없이 닫을 때 원래 상태 복원 기능 추가
- Additional Variables 모듈: Var Name 자동 생성 기능 추가 (Column + Row Index Rule)
- Light Mode 추가: Dark Mode는 유지하고 Light Mode 추가
- 글자 크게/작게 아이콘을 ML Auto Flow와 동일한 아이콘으로 변경 (ArrowsPointingOutIcon, ArrowsPointingInIcon)
- NNX MMX Calculator: Nx_ 1개당 4가지 NNX 버전 자동 생성 (Year, Half, Quarter, Month)
- NNX MMX Calculator: DX 컬럼 선택 콤보박스 추가
- Additional Variables: Row Index Rule에 "Entry Age" 옵션 추가

영향받은 파일:

- public/samples/samples.json (종신보험 샘플 업데이트)
- utils/fileOperations.ts (Save 기능 개선)
- utils/samples.ts (파일명 안전성 개선)
- App.tsx (Additional Variables 상태 복원, 초기 로드 로직)
- components/ParameterInputModal.tsx (Var Name 자동 생성, Entry Age 옵션 추가)
- components/icons.tsx (글자 크게/작게 아이콘 변경)
- contexts/ThemeContext.tsx (신규 생성 - Light Mode 지원)
- index.tsx (ThemeProvider 추가)
- index.html (Light Mode CSS 추가)
- components/Canvas.tsx (Light Mode 스타일 추가)
- components/ComponentRenderer.tsx (Light Mode 스타일 추가)

이유:

- Whole Life.lifx 파일을 초기화면으로 설정하여 배포 시 자동으로 표시
- Save 기능의 안정성 향상 및 사용자 경험 개선
- Additional Variables 모듈 사용성 개선
- Light Mode 지원으로 사용자 선택권 확대

복구 방법:

# 백업 및 복구
git stash push -u -m "백업"
git reset --hard 67820d9

# 또는 직접 복구
git reset --hard 67820d9

커밋 해시: 67820d9

---

## [2026-01-XX] - 모듈 입력값 저장 기능 및 닫기 확인 다이얼로그 추가

변경 사항:

- 모듈 타입별 사용자 정의 기본값을 localStorage에 저장하는 기능 추가
- ParameterInputModal에 "저장" 버튼 추가 (우측 상단)
- 모듈 입력값 변경사항 추적 기능 추가 (실제 값 비교 방식)
- 닫기 버튼 클릭 시 저장 여부 확인 다이얼로그 추가 (변경사항이 있을 때만)
- Run 버튼 실행 시 자동으로 저장되도록 기능 추가
- createModule에서 저장된 기본값을 우선 사용하도록 수정
- ParameterInputModal이 열릴 때 저장된 기본값이 있으면 자동으로 적용하도록 수정
- 저장된 기본값이 없으면 기존 DEFAULT_MODULES의 기본값 사용
- BookmarkIcon 아이콘 추가 (저장 버튼용)

영향받은 파일:

- utils/moduleDefaults.ts (신규 생성)
- components/ParameterInputModal.tsx (저장 기능, 변경사항 추적, 닫기 확인 다이얼로그 추가)
- components/icons.tsx (BookmarkIcon 추가)
- App.tsx (저장된 기본값 우선 사용 로직 추가)

이유:

- 모듈을 신규로 생성할 때마다 동일한 입력값을 설정해야 하는 불편함 해소
- 사용자가 자주 사용하는 입력값을 저장하여 재사용 가능하도록 개선
- 실수로 변경사항을 잃어버리는 것을 방지하기 위한 닫기 확인 기능 추가

복구 방법:

# 백업 및 복구
git stash push -u -m "백업"
git reset --hard <커밋해시>

# 또는 직접 복구
git reset --hard <커밋해시>

커밋 해시: (커밋 후 업데이트 예정)

---

## [2026-01-XX] - 모듈 생성 시 입력값 깊은 복사(Deep Copy) 적용

변경 사항:

- `createModule` 함수에서 모듈 생성 시 parameters, inputs, outputs를 얕은 복사(shallow copy)에서 깊은 복사(deep copy)로 변경
- `getModuleDefault` 함수에서도 동일하게 깊은 복사 적용
- `JSON.parse(JSON.stringify())`를 사용하여 중첩된 객체와 배열도 완전히 복사되도록 수정
- 기존 모듈의 입력값이 새 모듈 생성 시 참조로 공유되던 문제 해결

영향받은 파일:

- App.tsx (createModule, getModuleDefault 함수 수정)

이유:

- 모듈을 신규로 생성할 때 기존 모듈의 parameters에 포함된 배열(calculations, basicValues, selections 등)이 참조로 공유되어, 한 모듈의 값을 수정하면 다른 모듈의 값도 함께 변경되는 문제 발생
- 얕은 복사(`{ ...defaultData.parameters }`, `[...defaultData.inputs]`)로는 중첩된 객체나 배열이 참조로 복사됨
- 깊은 복사를 통해 각 모듈이 독립적인 데이터를 가지도록 수정

복구 방법:

# 백업 및 복구
git stash push -u -m "백업"
git reset --hard <커밋해시>

# 또는 직접 복구
git reset --hard <커밋해시>

커밋 해시: (커밋 후 업데이트 예정)

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
