# Spatial Canvas — TODO

## Up Next

### Virtual Painter (Finger Drawing)
Replace physical whiteboard markers with projected digital ink. Track fingertip via MediaPipe, render strokes through the projector onto any surface (desk, wall, paper).

**What to build:**
- Drawing state machine: pinch = draw, release = lift pen (or index-only = draw, two fingers = move)
- Stroke buffer: list of polylines stored as coordinate lists
- Render strokes in bright colors (green, cyan, orange) on the black pygame canvas
- Use existing calibration homography so projected lines align with finger position
- Feed stroke canvas to Claude alongside camera frame for context

**Why it matters:**
- Works on any surface — no whiteboard marker needed
- Enables spatial use on desks, tables, notebooks, bare walls
- ~50-80 lines added to app.py

### Always-On Audio Transcription
Add speech-to-text so Claude gets voice context alongside the camera frame when woken up.

### End-to-End Design Test
Sketch a real wireframe (drawn or finger-painted), pinch to wake Claude, get working HTML projected back. Full loop.

### Redo Calibration
Current calibration has points 1 & 2 nearly identical. Redo with better 4-point spread.

## Future Ideas

- Live browser preview instead of static PNG screenshot
- Color/brush selection via hand gestures
- Undo gesture (e.g. open palm swipe)
- Multi-layer canvas (strokes + Claude preview + annotations)
- Folk Computer integration
