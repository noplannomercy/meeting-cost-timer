## 작업 시작 전
1. DESIGN.md를 읽는다 — 색상, 폰트, 스페이싱, 모션 기준
2. SRS.md를 읽는다 — FR/NFR 번호로 요구사항 확인
3. docs/superpowers/plans/2026-04-07-meeting-cost-timer.md를 읽는다 — 태스크 순서와 의존성

## 개요
회의 비용을 실시간으로 보여주는 타이머 웹앱.
택시 미터기 감정의 오도미터 + 감정 단계 + 재미 비교.
바닐라 JS, localStorage, file:// 호환.

## 제약 사항
- innerHTML 사용 금지 — textContent만 허용 (XSS 방지)
- 외부 CDN 로드 금지 — 모든 의존성은 vendor/에 벤더링
- ES6+ 문법 금지 — ES5 + IIFE 패턴만 사용
- MeetingCost 외 전역 변수 생성 금지 — 네임스페이스 오염 방지
- setInterval 1초 간격 — rAF 사용 금지 (eng-review 결정: CPU 60x 절감)
- 감정 단계 임계값(15/30/60분) 변경 금지 — 고정값으로 확정됨

## 준수 사항
1. 모듈 간 통신은 CustomEvent로만 한다 (직접 참조 금지)
2. localStorage 접근은 반드시 MeetingCost.Storage를 거친다
3. 통화 포맷은 MeetingCost.Cost.formatCost()를 재사용한다
4. CSS 색상은 Custom Properties(var(--accent) 등)만 사용한다
5. script 로딩 순서: storage → timer → cost → emotion → comparisons → settings → history → stats → app

## 스택
| 기술 | 용도 |
|------|------|
| HTML5 | 구조 |
| CSS3 Custom Properties | 테마 (다크/라이트) |
| Vanilla JS (ES5) | 로직 |
| Canvas API | 스파크라인 |
| localStorage | 데이터 영속 |
| Odometer.js (MIT, vendored) | 숫자 스피닝 애니메이션 |

## 구조
| 경로 | 역할 |
|------|------|
| index.html | HTML 셸, 3개 탭 뷰, script 로딩 |
| css/style.css | 전체 스타일: 테마, 레이아웃, 컴포넌트, 반응형 |
| css/odometer-theme.css | 오도미터 커스텀 테마 |
| js/storage.js | localStorage 래퍼 (try/catch, quota 처리) |
| js/timer.js | 타이머 엔진 (setInterval + Date.now 보정) |
| js/cost.js | 비용 계산 + 오도미터 연동 + formatCost() |
| js/emotion.js | 감정 단계 상태머신 (4단계 고정) |
| js/comparisons.js | 재미 비교 데이터 15개 + 표시 |
| js/settings.js | 설정 관리 + 입력 검증 |
| js/history.js | 히스토리 CRUD + 목록 렌더링 |
| js/stats.js | 통계 요약 + Canvas 스파크라인 |
| js/app.js | 초기화, 탭 라우팅, 테마 토글, 토스트 |
| vendor/odometer.min.js | Odometer.js 벤더링 |

## 하네스 진화 원칙
- 구현 중 발견한 제약은 즉시 이 파일에 추가한다
- 준수 사항이 7개 이상이면 제약으로 승격할지 검토한다
- 실패한 접근법은 제약 사항에 "금지" + 이유로 기록한다

## 완료 조건
```bash
# 1. file://에서 index.html이 에러 없이 열린다
#    → 브라우저 콘솔에 에러 0건

# 2. 타이머 시작/정지/리셋이 동작한다
#    → Start → 숫자 증가 → Stop → 히스토리에 기록 추가

# 3. 감정 단계가 전환된다
#    → 15분 경과 시 배경색 + 이모지 변경 확인

# 4. 설정이 영속된다
#    → 참석자 수 변경 → 새로고침 → 값 유지

# 5. 반응형이 동작한다
#    → 768px 이하에서 Split Panel → Stacked 전환

# 6. 다크/라이트 토글이 동작한다
#    → 토글 클릭 → 테마 변경 → 새로고침 → 유지
```
