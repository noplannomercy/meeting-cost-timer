# 몇 분이나 됐지? (Meeting Cost Timer)

회의가 얼마나 비싼지 실시간으로 보여주는 타이머. 택시 미터기처럼 비용이 올라가고, 시간이 길어지면 감정 단계가 바뀝니다.

## 기능

- **실시간 비용 계산** - 참석자 수 x 시급으로 초 단위 비용 계산, 오도미터 애니메이션
- **감정 단계** - 15분/30분/60분 경과 시 이모지와 배경색 변화 (순조롭습니다 → 회의의 늪)
- **재미 비교** - "이 회의 비용 = 치킨 3마리" 같은 비교 카드 15종
- **히스토리** - 회의 기록 자동 저장, 합계 표시, 스와이프 삭제 (되돌리기 지원)
- **회의 메모** - 타이머 정지 시 제목/메모 입력 모달, 히스토리에서 확장하여 메모 확인
- **통계** - 총 회의 수, 총 비용, 평균 시간, 스파크라인 차트
- **다크/라이트 테마** - 토글 + 새로고침 후에도 유지
- **다중 통화** - KRW, USD, EUR
- **반응형** - 데스크톱 Split Panel, 모바일 Stacked

## 사용법

`index.html`을 브라우저에서 열면 됩니다. 빌드 과정 없음, 서버 불필요.

```
# 그냥 더블클릭하거나
open index.html

# 또는 로컬 서버로
python -m http.server 8080
```

## 기술 스택

| 기술 | 용도 |
|------|------|
| Vanilla JS (ES5) | 로직 전체 |
| CSS Custom Properties | 다크/라이트 테마 |
| Canvas API | 스파크라인 차트 |
| localStorage | 설정/히스토리 영속 |
| [Odometer.js](https://github.hubspot.com/odometer/) | 숫자 스피닝 애니메이션 (MIT, vendored) |

## 프로젝트 구조

```
index.html              # HTML 셸
css/style.css           # 테마, 레이아웃, 컴포넌트
css/odometer-theme.css  # 오도미터 커스텀 테마
js/storage.js           # localStorage 래퍼
js/timer.js             # 타이머 엔진
js/cost.js              # 비용 계산 + 오도미터
js/emotion.js           # 감정 단계 상태머신
js/comparisons.js       # 재미 비교 카드
js/settings.js          # 설정 관리
js/history.js           # 히스토리 CRUD
js/stats.js             # 통계 + 스파크라인
js/app.js               # 초기화, 탭 라우팅
vendor/odometer.min.js  # Odometer.js (vendored)
```

## 관련 문서

- [CLAUDE.md](CLAUDE.md) - 프로젝트 제약 사항 및 구조
- [DESIGN.md](DESIGN.md) - 디자인 시스템 (색상, 폰트, 스페이싱)
- [SRS.md](SRS.md) - 요구사항 명세
- [CHANGELOG.md](CHANGELOG.md) - 릴리즈 변경 이력

## 라이선스

MIT
