# Change History

이 파일은 프로젝트의 주요 변경사항을 기록하고 복구 방법을 제공합니다.

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
