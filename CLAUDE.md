# Spatial Computer - Agent Context

## Project Summary

A spatial computing system that replaces keyboard/trackpad interaction with a camera + projector setup on a physical desk. The user (an architect) draws on paper/whiteboards/tables and the system watches, listens, projects, and collaborates in their physical space.

## Owner

- **User**: Surya Narreddi (architect by background)
- **Preference**: Iterative, staged builds. Conversational style. Typos are normal - parse intent not spelling.

## Hardware (Confirmed Connected)

| Device | Model | Details |
|---|---|---|
| Computer | MacBook (Apple M2, 10-core GPU, Metal 4) | Main dev machine |
| External Camera | Logitech C922 Pro Stream Webcam | USB, 1080p, good autofocus, wide FOV. Device ID: `0x1140000046d085c` |
| Projector | AAXA P7+ (detected as P7+ not P6) | HDMI, 1920x1080 @ 60Hz, secondary display |
| Built-in Camera | FaceTime HD | Available as fallback |
| iPhone Camera | iPhone 16 (Continuity Camera) | Available as additional camera |

## Vision & Architecture

### Core Idea

Move away from screen-based computing. The user works on physical surfaces (paper, notebooks, whiteboards, tables with large paper/stickies). A camera watches the workspace. A projector projects interactive UI, guidance, and content onto the workspace. Claude acts as the AI brain - always seeing and hearing.

### Two Primary Use Cases

1. **Web/UI Design**: User sketches wireframes on paper. System projects alongside to guide. User annotates with stickies. System reads annotations and uses them as design references. Can project a small browser preview window onto the physical canvas.

2. **Physical Computing**: User works on Arduino/hardware projects. System sees the workspace, identifies components, projects wiring diagrams, pinouts, instructions. Guides the build process.

### Interaction Model

- **OpenCV app** renders to the projector (fullscreen on secondary display)
- **Projected buttons** the user can interact with (detected via camera)
- **Always-listening audio** via microphone + speech-to-text
- **Claude Vision API** sees the workspace via camera frames
- **Claude Tool Use** controls what gets projected
- User can tell it to "open a window" and it projects a small viewport of a website, code, etc.
- ArUco markers on physical objects for tracking

### Staged Build Plan

| Stage | Description | Status |
|---|---|---|
| 1 | OpenCV app + projector + camera + ArUco markers + projected buttons | NOT STARTED |
| 2 | Claude integration (vision API + audio transcription + tool use) | NOT STARTED |
| 3 | Rich interactions (OCR stickies, drawing recognition, projected windows, contextual projection) | NOT STARTED |
| 4 | Folk Computer integration (full reactive database, AprilTags, paper programs) | NOT STARTED |

### Tech Stack

- **Language**: Python
- **Computer Vision**: `opencv-contrib-python`, `numpy`, `mediapipe`
- **Projector Rendering**: `pygame` (fullscreen on projector display)
- **Audio**: `RealtimeSTT` (wraps faster-whisper + Silero VAD)
- **AI**: Claude API (vision + tool use), Anthropic Python SDK
- **Marker Tracking**: ArUco markers (built into OpenCV)
- **Calibration**: Homography matrix via `cv2.findHomography()` or `cv2.getPerspectiveTransform()`

### Key Reference Projects

- **PROGAF** (github.com/jcfandinocal/progaf) - Python projection mapping framework
- **Touch-Projectors** (github.com/huzz/Touch-Projectors) - Simple interactive projector demo
- **procam-calibration** (github.com/kamino410/procam-calibration) - Projector-camera calibration
- **Folk Computer** (github.com/FolkComputer/folk) - Long-term inspiration, eventual integration target

### Important Notes

- The AAXA projector is borrowed, so the system should be flexible about projector specs
- Start simple, iterate fast. Don't over-engineer early stages.
- The user wants to physically draw/annotate and have the system understand and respond
- "OpenClaw" was mentioned in conversation but is UNRELATED (it's an AI chat agent). The user meant Folk Computer.

## Directory Structure

```
spatial-computer/
  CLAUDE.md           -- This file. Agent context for all sessions.
  session-logs/       -- Timestamped session logs for continuity across conversations.
  src/                -- Source code (when we start building)
```

## How to Continue a Session

1. Read this file first for full project context
2. Read the latest session log in `session-logs/` for recent progress
3. Check hardware connectivity: `system_profiler SPCameraDataType` and `system_profiler SPDisplaysDataType`
4. Pick up from the current stage in the build plan
