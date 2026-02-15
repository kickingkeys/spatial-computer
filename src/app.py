"""Spatial Canvas — MVP.

Blank canvas. Pinch = wake Claude.
Claude's generated design is projected onto the whiteboard for annotation.

Controls:
  q/ESC   — Quit
  c       — Start calibration
  r       — Reset calibration
  s       — Save snapshot
  x       — Clear projected content
  space   — Record calibration point (during calibration)
"""

import sys
import os
import signal
import time
import subprocess
import cv2
import pygame

from config import (
    PROJECTOR_WIDTH,
    PROJECTOR_HEIGHT,
    CAMERA_WIDTH,
    CAMERA_HEIGHT,
    COLOR_BG,
    COLOR_TEXT,
    COLOR_TEXT_DIM,
    COLOR_ACCENT,
    COLOR_CURSOR,
    COLOR_CURSOR_PINCH,
    COLOR_CALIBRATION_DOT,
    COLOR_BORDER,
    CURSOR_RADIUS,
    CURSOR_PINCH_RADIUS,
    DEBUG_WINDOW_NAME,
    DEBUG_SCALE,
    SNAPSHOT_PATH,
)
from camera import Camera
from hand_tracker import HandTracker
from calibration import Calibration
from claude_bridge import call_claude, PREVIEW_PATH


def log(tag, msg):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}][{tag}] {msg}")


class SpatialCanvasApp:
    def __init__(self):
        print("=" * 50)
        print("  SPATIAL CANVAS v0.4 — MVP")
        print("=" * 50)

        log("init", "Opening camera...")
        self.camera = Camera()

        log("init", "Initializing hand tracker...")
        self.tracker = HandTracker()

        log("init", "Setting up projector display...")
        from projector import Projector
        self.projector = Projector()

        log("init", "Loading calibration...")
        self.calibration = Calibration()

        # State
        self.running = True
        self.cursor_pos = None
        self.is_pinching = False
        self._was_pinching = False
        self.hands = []
        self.current_frame = None
        self.fps = 0
        self.frame_count = 0
        self.fps_timer = time.time()
        self.claude_busy = False

        # Projected content
        self.projected_lines = []        # Text response from Claude
        self.preview_surface = None      # Rendered HTML as pygame surface
        self.preview_rect = None         # Where to show it on projector

        # Debug window
        cv2.namedWindow(DEBUG_WINDOW_NAME, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(
            DEBUG_WINDOW_NAME,
            int(self.camera.width * DEBUG_SCALE),
            int(self.camera.height * DEBUG_SCALE),
        )

        log("init", "Ready! Pinch to wake Claude.")
        log("init", "x = clear projected content")
        print("=" * 50)

    def _load_preview(self):
        """Load the rendered HTML preview PNG into a pygame surface."""
        if not os.path.exists(PREVIEW_PATH):
            return
        try:
            img = pygame.image.load(PREVIEW_PATH)
            # Scale to fit right portion of projector (with margin)
            margin = 40
            max_w = PROJECTOR_WIDTH // 2 - margin * 2
            max_h = PROJECTOR_HEIGHT - margin * 2 - 60  # room for status text

            img_w, img_h = img.get_size()
            scale = min(max_w / img_w, max_h / img_h, 1.0)
            new_w = int(img_w * scale)
            new_h = int(img_h * scale)

            self.preview_surface = pygame.transform.smoothscale(img, (new_w, new_h))
            # Position on right half, vertically centered
            px = PROJECTOR_WIDTH // 2 + (PROJECTOR_WIDTH // 2 - new_w) // 2
            py = (PROJECTOR_HEIGHT - new_h) // 2
            self.preview_rect = (px, py, new_w, new_h)
            log("preview", f"Loaded {new_w}x{new_h} at ({px}, {py})")
        except Exception as e:
            log("preview", f"Failed to load: {e}")

    def _on_pinch(self):
        """Pinch detected — wake Claude."""
        if self.claude_busy:
            log("pinch", "Claude is busy, ignoring")
            return

        log("pinch", "Waking Claude...")
        self.claude_busy = True
        self.projected_lines = ["$ waking claude..."]

        # Save camera frame
        if self.current_frame is not None:
            cv2.imwrite(SNAPSHOT_PATH, self.current_frame)
            log("pinch", f"Frame saved to {SNAPSHOT_PATH}")

        # Call Claude in background thread
        def on_response(response, has_preview):
            log("claude", f"Response ({len(response)} chars), preview={has_preview}")
            # Split into lines for projection
            lines = []
            for line in response.split("\n"):
                while len(line) > 60:
                    lines.append(line[:60])
                    line = line[60:]
                lines.append(line)
            self.projected_lines = lines
            self.claude_busy = False

            # Load rendered preview
            if has_preview:
                self._load_preview()

        call_claude(SNAPSHOT_PATH, transcript=None, callback=on_response)

    def run(self):
        signal.signal(signal.SIGINT, lambda *_: setattr(self, 'running', False))
        signal.signal(signal.SIGTERM, lambda *_: setattr(self, 'running', False))

        log("app", "Main loop... (q to quit, pinch to wake Claude)")
        try:
            while self.running:
                self._handle_events()
                self._update()
                try:
                    self._render_projector()
                except pygame.error as e:
                    log("WARN", f"Projector render failed: {e}")
                self._render_debug()
                self._update_fps()
        except KeyboardInterrupt:
            pass
        except Exception as e:
            log("ERROR", f"{e}")
            import traceback
            traceback.print_exc()
        finally:
            self._cleanup()

    def _handle_events(self):
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27):
            self.running = False
        elif key == ord("c"):
            self.calibration.start_calibration()
        elif key == ord("r"):
            self.calibration = Calibration()
            log("action", "Calibration reset.")
        elif key == ord("s"):
            if self.current_frame is not None:
                ts = time.strftime("%H%M%S")
                path = f"/tmp/spatial_capture_{ts}.jpg"
                cv2.imwrite(path, self.current_frame)
                log("capture", f"Saved to {path}")
        elif key == ord("x"):
            self.projected_lines = []
            self.preview_surface = None
            self.preview_rect = None
            log("action", "Cleared projected content")
        elif key == ord(" "):
            if self.calibration.calibrating and self.hands:
                done = self.calibration.record_point(self.hands[0].index_tip)
                if done:
                    log("calibration", "Complete!")

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_q, pygame.K_ESCAPE):
                    self.running = False

    def _update(self):
        ret, frame = self.camera.read()
        if not ret:
            return
        self.current_frame = frame
        self.hands = self.tracker.process(frame)

        self.cursor_pos = None
        self.is_pinching = False
        camera_cursor = None

        if self.hands:
            primary = self.hands[0]
            camera_cursor = primary.index_tip
            self.is_pinching = primary.is_pinching

            if self.frame_count % 30 == 0:
                log("hand", f"pos={camera_cursor} pinch={self.is_pinching}")

            if self.calibration.is_calibrated:
                self.cursor_pos = self.calibration.transform_point(camera_cursor)
            elif not self.calibration.calibrating:
                self.cursor_pos = (
                    int(camera_cursor[0] / CAMERA_WIDTH * PROJECTOR_WIDTH),
                    int(camera_cursor[1] / CAMERA_HEIGHT * PROJECTOR_HEIGHT),
                )

        # Calibration pinch
        if self.calibration.calibrating and camera_cursor and self.is_pinching and not self._was_pinching:
            done = self.calibration.record_point(camera_cursor)
            if done:
                log("calibration", "Complete!")

        # Pinch = wake Claude
        if self.is_pinching and not self._was_pinching and not self.calibration.calibrating:
            self._on_pinch()

        self._was_pinching = self.is_pinching

    # --- Projector rendering ---

    def _render_projector(self):
        self.projector.clear(COLOR_BG)

        if self.calibration.calibrating:
            self._render_calibration()
            self.projector.flip()
            return

        # --- Preview image (right half) ---
        if self.preview_surface and self.preview_rect:
            px, py, pw, ph = self.preview_rect
            # Subtle glow behind preview
            shadow_rect = pygame.Rect(px + 4, py + 4, pw, ph)
            pygame.draw.rect(self.projector.screen, (40, 40, 40), shadow_rect, border_radius=8)
            # Border
            border_rect = pygame.Rect(px - 2, py - 2, pw + 4, ph + 4)
            pygame.draw.rect(self.projector.screen, COLOR_BORDER, border_rect, width=2, border_radius=8)
            # Image
            self.projector.screen.blit(self.preview_surface, (px, py))

        # --- Claude thinking ---
        if self.claude_busy:
            dots = "." * (int(time.time() * 2) % 4)
            self.projector.draw_text(
                f"$ claude thinking{dots}",
                (60, PROJECTOR_HEIGHT // 2 - 20), COLOR_ACCENT, font_size="large",
            )

        # --- Text response (left half, above or below drawing area) ---
        if self.projected_lines and not self.claude_busy:
            y = 40
            for line in self.projected_lines:
                if y > PROJECTOR_HEIGHT - 80:
                    break
                color = COLOR_ACCENT if line.startswith("$") or line.startswith("#") else COLOR_TEXT
                self.projector.draw_text(line, (40, y), color, font_size="small")
                y += 32

        # --- Cursor ---
        if self.cursor_pos:
            cx, cy = int(self.cursor_pos[0]), int(self.cursor_pos[1])
            color = COLOR_CURSOR_PINCH if self.is_pinching else COLOR_CURSOR
            radius = CURSOR_PINCH_RADIUS if self.is_pinching else CURSOR_RADIUS
            gap, thickness = 8, 4
            pygame.draw.line(self.projector.screen, color, (cx - radius - 10, cy), (cx - gap, cy), thickness)
            pygame.draw.line(self.projector.screen, color, (cx + gap, cy), (cx + radius + 10, cy), thickness)
            pygame.draw.line(self.projector.screen, color, (cx, cy - radius - 10), (cx, cy - gap), thickness)
            pygame.draw.line(self.projector.screen, color, (cx, cy + gap), (cx, cy + radius + 10), thickness)
            self.projector.draw_circle(self.cursor_pos, 6, color)

        # --- Status ---
        cal = "calibrated" if self.calibration.is_calibrated else "uncalibrated (c)"
        self.projector.draw_text(
            f"{self.fps:.0f}fps | {cal} | pinch=claude  x=clear",
            (12, PROJECTOR_HEIGHT - 34), COLOR_TEXT_DIM, font_size="small",
        )

        self.projector.flip()

    def _render_calibration(self):
        self.projector.draw_text("$ calibrate --points 4", (30, 30), COLOR_TEXT, font_size="large")
        idx = self.calibration.current_point_index
        self.projector.draw_text(f"  pinch dot {idx + 1}/4", (30, 85), COLOR_TEXT_DIM, font_size="mono")

        for i, pt in enumerate(self.calibration.projector_points):
            if i < idx:
                self.projector.draw_circle(pt, 30, COLOR_ACCENT)
                self.projector.draw_circle(pt, 10, (255, 255, 255))
            elif i == idx:
                pulse = int(abs((time.time() * 3) % 2 - 1) * 15) + 35
                gap, th = 10, 5
                pygame.draw.line(self.projector.screen, COLOR_CALIBRATION_DOT, (pt[0]-pulse, pt[1]), (pt[0]-gap, pt[1]), th)
                pygame.draw.line(self.projector.screen, COLOR_CALIBRATION_DOT, (pt[0]+gap, pt[1]), (pt[0]+pulse, pt[1]), th)
                pygame.draw.line(self.projector.screen, COLOR_CALIBRATION_DOT, (pt[0], pt[1]-pulse), (pt[0], pt[1]-gap), th)
                pygame.draw.line(self.projector.screen, COLOR_CALIBRATION_DOT, (pt[0], pt[1]+gap), (pt[0], pt[1]+pulse), th)
                self.projector.draw_circle(pt, 8, COLOR_CALIBRATION_DOT)
            else:
                self.projector.draw_circle(pt, 20, COLOR_BORDER)

        if self.hands:
            h = self.hands[0]
            cx = int(h.index_tip[0] / self.camera.width * PROJECTOR_WIDTH)
            cy = int(h.index_tip[1] / self.camera.height * PROJECTOR_HEIGHT)
            color = COLOR_CURSOR_PINCH if h.is_pinching else COLOR_ACCENT
            self.projector.draw_circle((cx, cy), 14, color)

    # --- Debug (laptop) ---

    def _render_debug(self):
        if self.current_frame is None:
            return
        debug = self.current_frame.copy()
        debug = self.tracker.draw_on_frame(debug, self.hands)

        if self.calibration.is_calibrated:
            cv2.putText(debug, "CALIBRATED", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 0), 2)
        elif self.calibration.calibrating:
            cv2.putText(debug, "CALIBRATING...", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        else:
            cv2.putText(debug, "UNCALIBRATED (c)", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        if self.claude_busy:
            cv2.putText(debug, "CLAUDE THINKING...", (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)

        if self.is_pinching:
            cv2.putText(debug, "PINCH!", (debug.shape[1] - 150, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        info = f"FPS: {self.fps:.0f} | Hands: {len(self.hands)}"
        cv2.putText(debug, info, (10, debug.shape[0] - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        cv2.imshow(DEBUG_WINDOW_NAME, debug)

    def _update_fps(self):
        self.frame_count += 1
        elapsed = time.time() - self.fps_timer
        if elapsed >= 1.0:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.fps_timer = time.time()

    def _cleanup(self):
        log("app", "Shutting down...")
        self.camera.release()
        self.tracker.release()
        self.projector.quit()
        cv2.destroyAllWindows()
        log("app", "Done.")


if __name__ == "__main__":
    app = SpatialCanvasApp()
    app.run()
