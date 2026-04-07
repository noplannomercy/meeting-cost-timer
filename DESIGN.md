# Design System — 몇 분이나 됐지?

## Product Context
- **What this is:** 회의 비용을 실시간으로 보여주는 타이머 웹앱. 택시 미터기처럼 돈이 올라가는 긴장감이 핵심.
- **Who it's for:** GitHub 포트폴리오 데모. 회의 시간을 의식하고 싶은 사람.
- **Space/industry:** 생산성/유틸리티
- **Project type:** 단일 페이지 웹앱 (바닐라 JS, file:// 호환)

## Aesthetic Direction
- **Direction:** Retro-Futuristic — 택시 미터기/계기판 느낌. 어두운 배경에 숫자가 빛나는 대시보드.
- **Decoration level:** intentional — 미묘한 그리드 텍스처, 네온 글로우. 과하지 않게.
- **Mood:** 긴장감 있는 계기판. 돈이 올라가는 걸 보는 불안감. 하지만 유머러스한 비교로 무겁지 않게.
- **Reference sites:** N/A (리서치 미실시)

## Typography
- **Display/Hero:** Geist — 기계적이고 모던. 큰 제목과 숫자 표시에 완벽. tabular-nums 지원.
- **Body:** DM Sans — 깨끗하고 읽기 쉬움. Geist와 무게감이 잘 어울림.
- **UI/Labels:** DM Sans (same as body)
- **Data/Tables:** JetBrains Mono — 타이머 숫자, 비용 표시. tabular-nums로 숫자 정렬.
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN (Geist는 jsDelivr CDN). file:// 환경에서는 fonts 폴더에 로컬 복사.
- **Scale:** 11px(caption) / 13px(small) / 14px(body) / 16px(large) / 20px(h3) / 24px(h2) / 48px(h1) / 64px(display)

## Color
- **Approach:** restrained — 어두운 배경 + 1개 액센트(오렌지) + 감정 단계 시멘틱 색상
- **Primary (Accent):** #FF6B35 — 택시 미터 오렌지. 돈 카운터, CTA, 강조에 사용.
- **Secondary:** N/A (1-accent 시스템)
- **Background:** #0D1117 (다크 네이비)
- **Surface:** #161B22 (카드/모달 배경)
- **Text:** #E6EDF3 (밝은 회색)
- **Text Muted:** #7D8590 (보조 텍스트)
- **Border:** #30363D
- **Accent Glow:** rgba(255, 107, 53, 0.15) — 네온 글로우 효과용
- **Semantic / Emotion Stages:**
  - Calm (0~15min): #3FB950 (초록)
  - Warn (15~30min): #D29922 (노랑)
  - Alert (30~60min): #DB6D28 (주황)
  - Danger (60min+): #F85149 (빨강)
  - Info: #58A6FF (파랑)
- **Dark mode:** 기본값. 다크가 계기판 느낌의 핵심.
- **Light mode:** 서브 옵션.
  - Background: #F6F8FA
  - Surface: #FFFFFF
  - Text: #1F2328
  - Text Muted: #656D76
  - Border: #D0D7DE
  - Accent Glow: rgba(255, 107, 53, 0.08)

## Spacing
- **Base unit:** 8px
- **Density:** comfortable
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** grid-disciplined — 타이머 중앙, 설정/비교 좌우 배치. 단순 직관적.
- **Grid:** single column (모바일), max 2-column (데스크톱 설정/통계)
- **Max content width:** 960px
- **Border radius:** sm(4px) md(8px) lg(12px) full(9999px)

## Motion
- **Approach:** intentional — 오도미터 스핀, 감정 색상 전환, 비교 슬라이드인. 과하지 않게.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out) / cubic-bezier(0.16, 1, 0.3, 1) for spring
- **Duration:** micro(50-100ms) short(150ms) medium(300ms) long(500ms)
- **Key animations:**
  - 오도미터 숫자 스핀: CSS transition on transform
  - 감정 배경색 전환: background-color transition 300ms
  - 비교 카드 등장: translateY + opacity 300ms ease-out
  - 탭 전환: opacity crossfade 150ms

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-07 | Initial design system created | /design-consultation based on office-hours output |
| 2026-04-07 | Dark mode as default | 계기판/택시미터 느낌 강화. 네온 액센트가 다크에서 더 돋보임 |
| 2026-04-07 | #FF6B35 orange accent | 파란/보라 대신 택시 미터의 "돈이 타고 있다" 감정 직관 전달 |
| 2026-04-07 | JetBrains Mono for timer | 오도미터/카운터 컨셉에서 기계적 느낌 강화 |
| 2026-04-07 | Geist for display | 기계적+모던. tabular-nums로 큰 숫자 표시에 최적 |
