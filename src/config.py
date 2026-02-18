"""Configuration constants for the spatial canvas."""

import os

# --- Display ---
PROJECTOR_WIDTH = 1920
PROJECTOR_HEIGHT = 1080
LAPTOP_WIDTH = 1440
LAPTOP_HEIGHT = 900

# --- Camera ---
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720
CAMERA_FPS = 30
PREFERRED_CAMERA_NAME = "C922"

# --- Hand Tracking ---
MAX_HANDS = 2
HAND_DETECTION_CONFIDENCE = 0.7
HAND_TRACKING_CONFIDENCE = 0.6
PINCH_THRESHOLD = 0.05
PINCH_DEBOUNCE_FRAMES = 3              # consecutive frames to confirm pinch on/off

# --- Calibration ---
CALIBRATION_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "calibration.json"
)
CALIBRATION_MARGIN = 200

# --- UI Colors (RGB for pygame) — DARK PROJECTOR THEME ---
# Projector adds light to a white wall. Black = no projection = wall stays white.
# Only bright colors are visible. Dark/light backgrounds wash out.
COLOR_BG = (0, 0, 0)                    # black = project nothing
COLOR_TEXT = (255, 255, 255)             # white text
COLOR_TEXT_DIM = (140, 140, 140)         # gray secondary text
COLOR_ACCENT = (0, 200, 100)            # bright green
COLOR_CURSOR = (0, 220, 100)            # green cursor
COLOR_CURSOR_PINCH = (255, 60, 60)      # red on pinch
COLOR_BORDER = (100, 100, 100)          # dim border
COLOR_CALIBRATION_DOT = (255, 60, 60)   # red calibration dots

# --- Drawing ---
DRAW_COLOR = (255, 255, 255)            # white strokes
DRAW_WIDTH = 5                          # stroke thickness in pixels
ERASER_WIDTH = 30                       # eraser thickness
ERASER_RADIUS = 20                      # eraser preview circle radius

# --- Toolbar ---
TOOLBAR_Y = 20                          # top margin
TOOLBAR_BTN_W = 160                     # button width
TOOLBAR_BTN_H = 60                      # button height
TOOLBAR_BTN_GAP = 30                    # gap between buttons
TOOLBAR_X_START = 100                   # first button x position

# --- Cursor ---
CURSOR_RADIUS = 24
CURSOR_PINCH_RADIUS = 40

# --- Debug View ---
DEBUG_WINDOW_NAME = "Spatial Canvas - Debug"
DEBUG_SCALE = 0.6

# --- File paths for Claude bridge ---
SNAPSHOT_PATH = "/tmp/spatial_frame.jpg"
