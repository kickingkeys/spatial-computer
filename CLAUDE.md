# Spatial Canvas - Agent Context

## Project Summary

A spatial computing system: camera + projector aimed at a whiteboard. The user (an architect) draws wireframes and sketches on the whiteboard. Pinching fingers wakes Claude, which sees the whiteboard via the camera, generates HTML/CSS, and projects the rendered result back onto the whiteboard for iterative annotation.

## Owner

- **User**: Surya Narreddi (architect by background)
- **Preference**: Iterative, staged builds. Conversational style. Typos are normal - parse intent not spelling.

## Hardware (Confirmed Connected)

| Device | Model | Details |
|---|---|---|
| Computer | MacBook (Apple M2, 10-core GPU, Metal 4) | Main dev machine |
| External Camera | Logitech C922 Pro Stream Webcam | USB, 720p @ 30fps (1080p only ~5fps on macOS), index 0 |
| Projector | AAXA P7+ | HDMI, 1920x1080 @ 60Hz, secondary display |
| Built-in Camera | FaceTime HD | Available as fallback |

## Current State (v0.4 MVP)

The app is a **blank canvas** projected onto the whiteboard. The user draws on the whiteboard, then **pinches** to wake Claude. Claude sees the whiteboard via camera, generates HTML/CSS, and the result is rendered as a PNG preview projected on the right half of the whiteboard.

### How It Works

1. Pygame fullscreen window on projector (black background, projects nothing by default)
2. Camera feeds to MediaPipe hand tracker — detects index finger + pinch gesture
3. On pinch: saves camera frame, calls `claude -p` CLI in a background thread
4. Claude sees the whiteboard image, generates HTML to `/tmp/spatial_output.html`
5. Chrome headless screenshots the HTML to `/tmp/spatial_preview.png`
6. Preview PNG loaded into pygame, displayed on right half of projector
7. User annotates the whiteboard, pinches again to iterate

### Critical: Projector Dark Mode

The projector adds light to a WHITE wall. It cannot make things darker. Therefore:
- Pygame background: BLACK `(0,0,0)` = projects nothing = wall stays white
- All projected text/UI: bright colors (white, green, red)
- Claude's HTML output: MUST use dark backgrounds (`#000`) with bright text
- Light/white backgrounds are invisible on the whiteboard

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐
│  Laptop Screen   │     │  Projector (Wall)     │
│  (Debug View)    │     │  (Pygame + Preview)   │
│  - Camera feed   │     │  - Left: status text  │
│  - Hand landmarks│     │  - Right: HTML preview│
│  - Status info   │     │  - Cursor overlay     │
└─────────────────┘     └──────────────────────┘
         ▲                         ▲
    OpenCV window            Pygame window
         └────────┬────────────────┘
           Python App (src/app.py)
         ┌────────┼────────┐
    C922 Camera   │   MediaPipe Hands
                  │
         Claude CLI (claude -p)
              │
         Chrome headless → PNG
```

## File Structure

```
spatial-computer/
  CLAUDE.md              — This file
  calibration.json       — Saved 4-point homography (camera→projector)
  requirements.txt       — opencv-contrib-python, pygame, mediapipe, numpy
  models/
    hand_landmarker.task — MediaPipe hand model
  session-logs/
    2026-02-14_session-01.md — Session 1: research, setup, initial build
    2026-02-14_session-02.md — Session 2: MVP, Claude bridge, preview projection
  src/
    app.py               — Main app (v0.4 MVP), event loop, rendering
    camera.py            — C922 capture at 720p/30fps
    hand_tracker.py      — MediaPipe Tasks API, pinch detection
    projector.py         — Pygame fullscreen on AAXA P7+ (CoreGraphics detection)
    calibration.py       — 4-point calibration, homography, save/load JSON
    claude_bridge.py     — Calls claude CLI, renders HTML→PNG via Chrome headless
    config.py            — Constants, colors (dark projector theme)
```

## Running

```bash
cd /Users/suryanarreddi/Documents/prototypes/spatial-computer
python3 -u src/app.py
```

Controls: `q`/ESC = quit, `c` = calibrate, `x` = clear projected content, `s` = save snapshot

## Known Issues

- Camera focus: OpenCV can't control C922 focus on macOS. Use physical focus ring or Logi Tune.
- SDL duplicate class warnings (cv2 + pygame both bundle libSDL2) — harmless.
- Calibration data may need to be redone (camera points 1 & 2 are nearly identical).
- Zombie processes: always verify `ps aux | grep app.py` after killing.

## Next Steps

- [ ] Add always-on audio transcription (speech context for Claude)
- [ ] End-to-end test: sketch a wireframe, pinch, get working HTML projected
- [ ] Consider live browser instead of static PNG preview
- [ ] Redo calibration with better 4-point spread

## How to Continue a Session

1. Read this file first
2. Read the latest session log in `session-logs/`
3. Check no zombie processes: `ps aux | grep app.py`
4. Run: `python3 -u src/app.py`
