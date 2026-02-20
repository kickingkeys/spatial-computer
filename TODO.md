# Spatial Canvas — TODO

## Current Direction: Brilliant Labs Frame + Laptop Screen

Wearable-first spatial computing. Frame glasses as input (POV camera, mic) + notification layer (small display for quick responses). Laptop screen for detailed output (generated HTML, designs, etc.). Physical workspace stays physical — you sketch, write post-its, arrange things. Claude sees it all through your glasses.

### Frame Documentation & Resources

- Hardware specs: https://docs.brilliant.xyz/frame/hardware/
- Building apps: https://docs.brilliant.xyz/frame/building-apps/
- Python SDK (frame-sdk): https://docs.brilliant.xyz/frame/building-apps/frame-sdk-python/
- Lua on-device: https://docs.brilliant.xyz/frame/building-apps/noa-and-frame-app/lua-reference/
- GitHub (open source): https://github.com/brilliantlabs
- Display: 640x400px, 16 colors, 20° FOV, micro OLED
- Camera: 720p, auto-exposure, JPEG capture over BLE
- Audio: mic + speaker, BLE audio streaming
- Connectivity: BLE 5.3 only (no WiFi) — ~40-60 kBps throughput

### MVP — Frame Desk Watcher

- [ ] Get Frame paired and connected via Python SDK (`frame-sdk`)
- [ ] Camera capture: snap photo from Frame → transfer over BLE (~1 sec for JPEG)
- [ ] Photo → Claude vision → response on laptop screen
- [ ] Display quick status/response on Frame's micro OLED (16-color, 640x400)
- [ ] Trigger: tap gesture on Frame? voice command? BLE button?
- [ ] Post-it / sketch reading from POV camera angle
- [ ] Always-on audio: mic stream → transcription → context for Claude
- [ ] Screen output: live browser showing Claude's generated HTML

### Phase 2 — Richer Integration

- [ ] Continuous camera streaming (periodic auto-snap every N seconds)
- [ ] Multi-modal context: combine what Frame sees + what you say + what's on screen
- [ ] Frame display as notification layer (show Claude's short answers in peripheral vision)
- [ ] Lua on-device scripts for quick local processing before sending to host

### Open Design Questions

- Trigger: tap on Frame temple? voice "hey Claude"? always-watching?
- Camera angle: Frame POV is eye-level — good for seeing desk? or needs head tilt?
- BLE latency: 1 sec per photo acceptable for MVP? batch vs on-demand?
- Display strategy: what's worth showing on 640x400 @ 16 colors vs laptop screen?
- Audio: continuous streaming or push-to-talk?

---

## Archived: Previous Approaches

*Explored in sessions 01-04. Working but pivoted away from.*

### ~~Virtual Painter (Finger Drawing on Projector)~~ — PAUSED
Explored in session 03. Gesture detection too noisy at distance, air-drawing lacks tactile feedback, projector adds complexity without proportional benefit. See session-03 log for full analysis.

### ~~Projector Canvas + Claude~~ — WORKING, DEPRIORITIZED
Pinch-to-wake Claude, HTML preview projected on whiteboard. Dark mode enforced. Works but projector-as-primary-output has visibility limitations. Code still in repo (app.py v0.5).

### ~~Overhead Camera + Screen~~ — SUPERSEDED BY FRAME
Planned in session 03: C922 mounted overhead watching desk, screen in front for output. Never built — replaced by Frame glasses which provide POV camera without needing a fixed mount.

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
| 2026-02-19 | Brilliant Labs Frame over projector | Projector painful (calibration, dark mode, visibility), Frame is wearable + open source + has camera/mic/display |
| 2026-02-19 | Frame as input + notification, laptop as primary output | Frame display too small (640x400, 16 colors) for detailed output, but great for POV camera + quick responses |
