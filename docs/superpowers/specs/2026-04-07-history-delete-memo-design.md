# 히스토리 삭제 + 회의 메모 설계

## 피쳐 1: 스와이프 삭제

히스토리 항목을 왼쪽으로 스와이프하면 즉시 삭제. 3초간 "되돌리기" 토스트 표시.

### 동작 흐름

1. 사용자가 히스토리 항목을 왼쪽으로 60px 이상 드래그
2. 항목이 슬라이드 아웃 애니메이션으로 사라짐
3. localStorage에서 삭제, stats 갱신 (history:updated 이벤트)
4. 토스트: "삭제됨 — 되돌리기" (3초, 되돌리기 버튼 포함)
5. 되돌리기 클릭 시 record 복원 + 리스트 재렌더

### 터치 + 마우스

- touchstart/touchmove/touchend + mousedown/mousemove/mouseup
- 수평 이동 > 수직 이동일 때만 스와이프로 인식 (스크롤과 구분)
- 스와이프 중 항목에 빨간 배경 노출 (삭제 힌트)

### history.js 변경

- `remove(id)` — record 삭제 + save + render + history:updated 이벤트
- `_attachSwipeHandlers()` — render() 후 각 항목에 스와이프 이벤트 바인딩
- `_undoDelete(record)` — 토스트 되돌리기용, record 복원

## 피쳐 2: 회의 메모

### 타이머 정지 시 모달

1. Reset 클릭 → elapsed > 0이면 모달 오버레이 등장
2. 제목 input (placeholder: "회의 제목", 최대 50자)
3. 내용 textarea (placeholder: "메모", 3줄, 최대 200자)
4. "저장" 버튼 + "건너뛰기" 링크
5. 저장/건너뛰기 → 히스토리에 record 저장 → 모달 닫힘 → 타이머 리셋

### 히스토리에서 편집

1. 히스토리 항목 탭 → 항목 확장, 메모 표시
2. 메모 영역 탭 → inline 편집 모드 (input + textarea)
3. 저장 버튼으로 확정, localStorage 업데이트

### 데이터

- record에 `title` (string, max 50)과 `memo` (string, max 200) 필드 추가
- 기존 record에 필드 없으면 빈 문자열 처리 (하위 호환)

### 모달 구조

```html
<div class="modal-overlay" id="memo-modal" style="display:none;">
  <div class="modal">
    <div class="modal__title">회의 메모</div>
    <input class="input" id="memo-title" placeholder="회의 제목" maxlength="50">
    <textarea class="input" id="memo-content" placeholder="메모" rows="3" maxlength="200"></textarea>
    <div class="modal__actions">
      <button class="btn btn--primary" id="memo-save">저장</button>
      <button class="btn btn--text" id="memo-skip">건너뛰기</button>
    </div>
  </div>
</div>
```

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| index.html | 메모 모달 HTML 구조 추가 |
| css/style.css | 스와이프 삭제 스타일, 모달 스타일, 히스토리 확장 스타일 |
| js/history.js | remove(), 스와이프 핸들러, 메모 표시/편집, 모달 연동 |
| js/app.js | Reset 플로우 변경 (모달 먼저), 모달 이벤트 바인딩 |

## 제약 사항 준수

- innerHTML 사용 금지 — textContent + createElement만 사용
- ES5 + IIFE 패턴
- CustomEvent로 모듈 간 통신
- CSS Custom Properties만 사용
- MeetingCost 네임스페이스 유지
