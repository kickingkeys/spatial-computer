"""Camera-to-projector calibration via 4-point homography."""

import json
import os
import cv2
import numpy as np
from config import (
    PROJECTOR_WIDTH,
    PROJECTOR_HEIGHT,
    CALIBRATION_FILE,
    CALIBRATION_MARGIN,
)


# The 4 calibration points in projector space (corners with margin)
CALIBRATION_POINTS_PROJECTOR = [
    (CALIBRATION_MARGIN, CALIBRATION_MARGIN),                                          # top-left
    (PROJECTOR_WIDTH - CALIBRATION_MARGIN, CALIBRATION_MARGIN),                        # top-right
    (PROJECTOR_WIDTH - CALIBRATION_MARGIN, PROJECTOR_HEIGHT - CALIBRATION_MARGIN),     # bottom-right
    (CALIBRATION_MARGIN, PROJECTOR_HEIGHT - CALIBRATION_MARGIN),                       # bottom-left
]


class Calibration:
    def __init__(self):
        self.homography = None          # 3x3 numpy array
        self.camera_points = []         # Collected during calibration
        self.projector_points = CALIBRATION_POINTS_PROJECTOR
        self.is_calibrated = False
        self.calibrating = False
        self.current_point_index = 0    # Which calibration point we're collecting

        # Try to load existing calibration
        self._load()

    def start_calibration(self):
        """Begin the calibration process."""
        self.calibrating = True
        self.current_point_index = 0
        self.camera_points = []
        self.homography = None
        self.is_calibrated = False
        print("Calibration started. Touch the projected dots with your index finger.")

    def get_current_target(self):
        """Get the current calibration target point in projector space.

        Returns (x, y) or None if not calibrating.
        """
        if not self.calibrating:
            return None
        if self.current_point_index >= len(self.projector_points):
            return None
        return self.projector_points[self.current_point_index]

    def record_point(self, camera_point):
        """Record a camera-space point for the current calibration target.

        Call this when the user pinches at the projected dot.

        Args:
            camera_point: (x, y) in camera pixel coordinates

        Returns:
            True if calibration is complete after this point.
        """
        if not self.calibrating:
            return False

        self.camera_points.append(camera_point)
        self.current_point_index += 1
        print(f"Calibration point {self.current_point_index}/4 recorded: {camera_point}")

        if self.current_point_index >= 4:
            self._compute_homography()
            self.calibrating = False
            return True

        return False

    def transform_point(self, camera_point):
        """Transform a camera-space point to projector-space.

        Args:
            camera_point: (x, y) in camera pixels

        Returns:
            (x, y) in projector pixels, or None if not calibrated.
        """
        if not self.is_calibrated or self.homography is None:
            return None

        pt = np.array([[[camera_point[0], camera_point[1]]]], dtype=np.float64)
        transformed = cv2.perspectiveTransform(pt, self.homography)
        x = int(transformed[0][0][0])
        y = int(transformed[0][0][1])
        return (x, y)

    def _compute_homography(self):
        """Compute the homography matrix from collected points."""
        src = np.array(self.camera_points, dtype=np.float64)
        dst = np.array(self.projector_points, dtype=np.float64)

        self.homography, status = cv2.findHomography(src, dst)

        if self.homography is not None:
            self.is_calibrated = True
            self._save()
            print("Calibration complete! Homography computed and saved.")
        else:
            print("Calibration failed — could not compute homography.")

    def _save(self):
        """Save calibration to JSON."""
        if self.homography is None:
            return
        data = {
            "homography": self.homography.tolist(),
            "camera_points": self.camera_points,
            "projector_points": self.projector_points,
        }
        with open(CALIBRATION_FILE, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Calibration saved to {CALIBRATION_FILE}")

    def _load(self):
        """Load calibration from JSON if it exists."""
        if not os.path.exists(CALIBRATION_FILE):
            return
        try:
            with open(CALIBRATION_FILE, "r") as f:
                data = json.load(f)
            self.homography = np.array(data["homography"], dtype=np.float64)
            self.camera_points = data["camera_points"]
            self.is_calibrated = True
            print(f"Calibration loaded from {CALIBRATION_FILE}")
        except Exception as e:
            print(f"Failed to load calibration: {e}")
