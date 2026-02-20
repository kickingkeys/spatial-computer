# Decision Journal

This is the "why" behind the project. Every pivot, dead end, and breakthrough — written honestly so any future session (human or AI) can understand the reasoning without repeating mistakes.

---

### 2026-02-19 — Pivot: Brilliant Labs Frame replaces projector entirely

After three sessions with two different projectors (AAXA P7+ and Optoma 1080P), the projector is out. It's not a software problem — projectors are fundamentally painful for this use case:

**Why the projector failed us:**
- **Calibration breaks on hardware swap.** Switching from AAXA to Optoma invalidated the homography. Every new surface, distance, or angle needs recalibration.
- **Can't display dark colors.** Projectors add light — black is invisible, white backgrounds are invisible on white walls. Required dark mode hacks throughout the entire stack.
- **Visibility is poor.** Even with dark mode enforced, projected UI is washed out in ambient light. You have to dim the room.
- **Not portable.** A projector is a desk/room fixture. Can't take it to a job site, a client meeting, or even another room easily.

**Why the Frame:**
- **Open source hardware and software.** Full Python SDK, Lua on-device, everything on GitHub. No vendor lock-in, no hacking needed.
- **Camera from your POV.** 720p camera sees exactly what you're looking at — desk, whiteboard, physical models, job site. No overhead mount or tripod needed.
- **Mic for voice context.** Built-in mic means Claude hears you naturally. No separate audio setup.
- **Small display for quick responses.** 640x400 micro OLED, 16 colors, 20° FOV. Not for detailed output, but perfect for status, short answers, notifications in peripheral vision.
- **BLE-only is a limitation we can work with.** ~40-60 kBps means ~1 sec per photo transfer. Fine for snapshot-based interaction. Not great for video streaming, but we don't need that for MVP.

**The new architecture:**
- Frame glasses = input (POV camera, mic) + notification layer (small display)
- Laptop screen = primary output (browser with Claude's generated HTML, designs)
- Physical workspace = unchanged (paper, post-its, physical models — you work naturally)
- Claude bridge = unchanged (`claude -p` CLI, Chrome headless rendering)

**What we keep from the projector work:**
- Claude bridge and Chrome headless pipeline — works exactly the same
- Camera module pattern — swap C922 for Frame's BLE camera
- Debouncing approach — essential for any noisy input
- The core insight: read physical things, show digital things on a screen

**What we drop:**
- Pygame projector display — replaced by laptop screen / browser
- Hand tracking / gesture detection — Frame has tap gestures, simpler
- Calibration system — no projector means no homography needed
- Dark mode enforcement — laptop screen handles colors normally

---

### 2026-02-18 — Pivot: stop drawing on the projector, start reading the desk

We spent a full session trying to make "finger drawing on a projected canvas" work. The idea was compelling: point your finger at a wall, and the projector draws lines where your finger goes. No markers, no whiteboard needed.

It didn't work well, and the reasons are fundamental, not fixable with more code:

**The experience of air-drawing is bad.** There's no tactile feedback. Your hand gets tired. You can't rest your wrist on anything. Compare this to drawing with a real pen on real paper — it's not even close. We were building an inferior version of something a $2 pen already does perfectly.

**Gesture detection at arm's length is unreliable.** MediaPipe flickers between finger states frame-to-frame. We added debouncing, switched from pinch to index-finger detection, rewrote the finger-up algorithm to be orientation-independent — and it was still noisy. Each fix revealed the next layer of fragility.

**The projector is fighting us, not helping.** Dark mode hacks (projectors can only add light), calibration that breaks when you swap hardware, visibility issues on white surfaces. Every projector-specific problem is a distraction from the actual goal: helping an architect design things spatially.

**The realization:** the camera should *read* physical things (paper, post-its, sketches), not *track gestures*. The screen should *show* digital output, not the projector. Let each tool do what it's good at.

**New direction:** Camera overhead watching the desk. You sketch on paper, write post-its, arrange things physically. Claude sees your workspace, understands it, and builds on a screen in front of you. Physical stays physical. Digital stays digital.

---

### 2026-02-14 — First build: projector + camera + hand tracking

Started from zero. Built the full pipeline in one session: camera capture, MediaPipe hand tracking, pygame on projector, 4-point calibration, Claude CLI bridge, Chrome headless rendering.

**What worked well and is reusable:**
- Camera module (C922 at 720p/30fps) — solid, keep it
- Hand tracker with MediaPipe Tasks API — detection works, just don't rely on it for precision drawing
- Claude bridge (`claude -p` CLI with CLAUDECODE env unset) — clever workaround, no API key needed
- Chrome headless HTML→PNG pipeline — simple, zero-dependency rendering

**What was fragile:**
- Projector calibration (homography breaks across hardware swaps)
- Projector visibility on white surfaces (dark mode requirement)
- Gesture precision at distance from camera

**Key technical decisions:**
- Claude CLI over Anthropic SDK (no API key configured, CLI auth works)
- Pinch over dwell for gesture triggers (more intentional)
- Chrome headless over embedded browser (simpler, already installed)

---

## How to use this file

Read it top-down before starting a new session. The most recent entry is the current thinking. Older entries explain what we tried and why we moved on. When you make a significant pivot, add an entry here — write what you tried, what went wrong, what you learned, and where you're going next.
