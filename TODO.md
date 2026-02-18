# Spatial Canvas — TODO

## Current Direction: Overhead Camera + Screen Output

Physical workspace as input, screen as output. Camera watches your desk — reads sketches, post-its, objects. Claude processes what it sees and acts on a screen in front of you.

### MVP — Desk Watcher

- [ ] Overhead camera setup (C922 mounted looking down at desk)
- [ ] Trigger mechanism (voice command? keyboard shortcut? periodic auto-scan?)
- [ ] Camera snapshot → Claude vision → action on screen
- [ ] Post-it note reading (high contrast, structured input)
- [ ] Paper sketch/wireframe recognition
- [ ] Screen output: live browser showing Claude's generated HTML
- [ ] Always-on audio transcription (voice context for Claude)

### Open Design Questions

- Camera placement: overhead vs angled?
- Trigger: "hey Claude, look" vs hotkey vs always-on?
- Output: full browser window? split-screen with camera feed?
- Projector role: desk overlay for highlighting? drop entirely for MVP?
- Post-it conventions: color-coded? labeled? free-form?

---

## Archived: Projector-Based Approaches

*Explored in sessions 01-03. Working but pivoted away from.*

### ~~Virtual Painter (Finger Drawing on Projector)~~ — PAUSED
Explored in session 03. Gesture detection too noisy at distance, air-drawing lacks tactile feedback, projector adds complexity without proportional benefit. See session-03 log for full analysis.

### ~~Projector Canvas + Claude~~ — WORKING, DEPRIORITIZED
Pinch-to-wake Claude, HTML preview projected on whiteboard. Dark mode enforced. Works but projector-as-primary-output has visibility limitations. Code still in repo (app.py v0.5).

---

## Decision Log

| Date | Decision | Why |
|------|----------|-----|
| 2026-02-14 | Use pinch gesture over dwell for clicking | More intentional, less accidental activation |
| 2026-02-14 | Claude CLI (`claude -p`) over Anthropic SDK | No API key needed, leverages existing auth |
| 2026-02-14 | Chrome headless for HTML→PNG rendering | Zero-install, Chrome already present |
| 2026-02-14 | Dark projector theme (black bg, bright text) | Physics: projectors add light, can't show dark on white wall |
| 2026-02-18 | Pivot from projector drawing to overhead camera + screen | Gesture detection too noisy, air-drawing unnatural, physical input is better |
| 2026-02-18 | Post-it notes as structured input | High contrast, easy to read, natural for architects |
