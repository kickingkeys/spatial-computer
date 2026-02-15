"""Camera capture module — finds and opens the Logitech C922."""

import cv2
from config import CAMERA_WIDTH, CAMERA_HEIGHT, CAMERA_FPS

# C922 is at index 0 on this system (confirmed via test frames).
# Index 0: C922 (aimed at wall/projector surface)
# Index 1: iPhone continuity camera (unusable)
# Index 2: FaceTime HD (laptop built-in, facing away)
DEFAULT_CAMERA_INDEX = 0


class Camera:
    def __init__(self, index=None):
        if index is None:
            index = DEFAULT_CAMERA_INDEX

        self.index = index
        self.cap = cv2.VideoCapture(index)

        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open camera at index {index}")

        # Set to 720p @ 30fps (C922 does 1080p only at ~5fps on macOS)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
        self.cap.set(cv2.CAP_PROP_FPS, CAMERA_FPS)

        # Read actual settings
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)

        print(f"[camera] Opened index={index}, {self.width}x{self.height} @ {self.fps}fps")

    def read(self):
        """Read a frame. Returns (success, frame)."""
        return self.cap.read()

    def release(self):
        """Release the camera."""
        if hasattr(self, "cap") and self.cap:
            self.cap.release()

    def __del__(self):
        self.release()
