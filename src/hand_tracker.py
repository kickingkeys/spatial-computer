"""Hand tracking module using MediaPipe Tasks API (0.10.x+)."""

import os
import math
import cv2
import mediapipe as mp
from config import (
    MAX_HANDS,
    HAND_DETECTION_CONFIDENCE,
    HAND_TRACKING_CONFIDENCE,
    PINCH_THRESHOLD,
)

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "models", "hand_landmarker.task"
)


class HandData:
    """Data for a single detected hand."""
    __slots__ = ("index_tip", "thumb_tip", "is_pinching", "pinch_dist",
                 "fingers_up", "landmarks")

    def __init__(self, index_tip, thumb_tip, is_pinching, pinch_dist,
                 fingers_up, landmarks):
        self.index_tip = index_tip        # (x, y) in pixel coords
        self.thumb_tip = thumb_tip        # (x, y) in pixel coords
        self.is_pinching = is_pinching    # bool
        self.pinch_dist = pinch_dist      # normalized thumb-index distance
        self.fingers_up = fingers_up      # [thumb, index, middle, ring, pinky] bools
        self.landmarks = landmarks        # all 21 landmarks as [(x,y), ...]

    @property
    def index_only(self):
        """True when index is up and middle is down (draw gesture).
        Ignores ring/pinky — they flicker too much at distance."""
        return self.fingers_up[1] and not self.fingers_up[2]

    @property
    def index_middle_up(self):
        """True when index + middle are both extended (move/select gesture)."""
        return self.fingers_up[1] and self.fingers_up[2]


class HandTracker:
    def __init__(self):
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(
                f"Hand landmarker model not found at {MODEL_PATH}. "
                "Download from: https://storage.googleapis.com/mediapipe-models/"
                "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
            )

        base_options = mp.tasks.BaseOptions(model_asset_path=MODEL_PATH)
        options = mp.tasks.vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_hands=MAX_HANDS,
            min_hand_detection_confidence=HAND_DETECTION_CONFIDENCE,
            min_tracking_confidence=HAND_TRACKING_CONFIDENCE,
        )
        self.landmarker = mp.tasks.vision.HandLandmarker.create_from_options(options)

        # Connection list for drawing skeleton
        self.hand_connections = mp.tasks.vision.HandLandmarksConnections.HAND_CONNECTIONS

        print(f"[hand_tracker] Initialized with model: {MODEL_PATH}")

    def process(self, frame):
        """Process a BGR frame and return list of HandData.

        Args:
            frame: BGR numpy array from OpenCV

        Returns:
            list of HandData objects
        """
        h, w, _ = frame.shape

        # Convert BGR to RGB for MediaPipe
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        # Detect hands
        result = self.landmarker.detect(mp_image)

        hands = []
        if result.hand_landmarks:
            for hand_landmarks in result.hand_landmarks:
                # Extract all landmarks as pixel coordinates
                landmarks = []
                for lm in hand_landmarks:
                    px = int(lm.x * w)
                    py = int(lm.y * h)
                    landmarks.append((px, py))

                # Index finger tip = landmark 8
                index_tip = landmarks[8]
                # Thumb tip = landmark 4
                thumb_tip = landmarks[4]

                # Pinch detection: normalized distance between thumb tip and index tip
                dx = hand_landmarks[8].x - hand_landmarks[4].x
                dy = hand_landmarks[8].y - hand_landmarks[4].y
                dist = math.sqrt(dx * dx + dy * dy)
                is_pinching = dist < PINCH_THRESHOLD

                # Detect which fingers are extended (orientation-independent).
                # A finger is "up" if its tip is farther from its MCP base than its PIP joint is.
                # This works regardless of hand angle/rotation.
                #   Index:  tip=8,  PIP=6,  MCP=5
                #   Middle: tip=12, PIP=10, MCP=9
                #   Ring:   tip=16, PIP=14, MCP=13
                #   Pinky:  tip=20, PIP=18, MCP=17
                #   Thumb:  tip=4,  IP=3,   MCP=2
                def _dist(a, b):
                    return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)

                fingers_up = [False] * 5
                wrist = hand_landmarks[0]
                fingers_up[0] = _dist(hand_landmarks[4], wrist) > _dist(hand_landmarks[3], wrist)  # thumb
                fingers_up[1] = _dist(hand_landmarks[8], hand_landmarks[5]) > _dist(hand_landmarks[6], hand_landmarks[5])   # index
                fingers_up[2] = _dist(hand_landmarks[12], hand_landmarks[9]) > _dist(hand_landmarks[10], hand_landmarks[9])  # middle
                fingers_up[3] = _dist(hand_landmarks[16], hand_landmarks[13]) > _dist(hand_landmarks[14], hand_landmarks[13]) # ring
                fingers_up[4] = _dist(hand_landmarks[20], hand_landmarks[17]) > _dist(hand_landmarks[18], hand_landmarks[17]) # pinky

                hands.append(HandData(index_tip, thumb_tip, is_pinching, dist, fingers_up, landmarks))

        return hands

    def draw_on_frame(self, frame, hands):
        """Draw hand info onto a debug frame given processed HandData list."""
        for hand in hands:
            # Draw index finger tip
            color = (0, 0, 255) if hand.is_pinching else (0, 255, 0)
            cv2.circle(frame, hand.index_tip, 12, color, -1)
            cv2.circle(frame, hand.thumb_tip, 8, (255, 200, 0), -1)

            # Draw pinch line
            if hand.is_pinching:
                cv2.line(frame, hand.index_tip, hand.thumb_tip, (0, 0, 255), 3)

            # Draw skeleton
            for conn in self.hand_connections:
                start = hand.landmarks[conn.start]
                end = hand.landmarks[conn.end]
                cv2.line(frame, start, end, (200, 200, 200), 1)

            for lm in hand.landmarks:
                cv2.circle(frame, lm, 3, (255, 255, 255), -1)

        return frame

    def release(self):
        if hasattr(self, "landmarker"):
            self.landmarker.close()
