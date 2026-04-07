# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0.0] - 2026-04-07

### Added
- Real-time meeting cost timer with odometer spinning animation
- Emotion stage system: calm (0-15min), warning (15-30min), alert (30-60min), danger (60min+)
- Fun cost comparisons against everyday items (coffee, chicken, iPad, MacBook, etc.)
- Meeting history with auto-save on timer reset
- Statistics dashboard with canvas sparkline chart
- Settings: attendees, hourly rate, multi-currency (KRW, USD, EUR)
- Dark/light theme toggle with persistence
- Responsive layout: split panel on desktop, stacked on mobile
- localStorage-backed data persistence with quota error handling
- Odometer.js vendored for number spinning animation

### Fixed
- Mixed currency history total now shows "(혼합 통화)" instead of "?"
- CSS 색상값을 Custom Properties로 통일, innerHTML을 textContent로 교체 (보안 규칙 준수)
