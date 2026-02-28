import { HandData, Point } from "./types";
import { HAND_TRACKING } from "./config";

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Process ml5.js v1.x handPose results into our HandData format.
 *
 * ml5 v1.x hand object has:
 *   - keypoints: Array<{ x, y, name }> (21 landmarks)
 *   - Named convenience props: hand.thumb_tip, hand.index_finger_tip, etc.
 *     each with { x, y, x3D, y3D, z3D }
 *
 * Landmark indices (same as MediaPipe):
 *   0: wrist, 1-4: thumb, 5-8: index, 9-12: middle, 13-16: ring, 17-20: pinky
 *   Tips: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
 *   MCP: 5 (index), 9 (middle), 13 (ring), 17 (pinky)
 *   PIP: 6 (index), 10 (middle), 14 (ring), 18 (pinky)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processHandResult(hand: any): HandData | null {
  if (!hand || !hand.keypoints || hand.keypoints.length < 21) return null;

  const kp = hand.keypoints;
  const landmarks: Point[] = kp.map((k: { x: number; y: number }) => ({
    x: k.x,
    y: k.y,
  }));

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const pinchDist = dist(thumbTip, indexTip);
  const isPinching = pinchDist < HAND_TRACKING.pinchThreshold;

  // Finger-up detection: distance-based, orientation-independent
  // A finger is "up" if tip-to-MCP distance > PIP-to-MCP distance
  const wrist = landmarks[0];
  const fingersUp: boolean[] = [
    dist(landmarks[4], wrist) > dist(landmarks[3], wrist), // thumb
    dist(landmarks[8], landmarks[5]) > dist(landmarks[6], landmarks[5]), // index
    dist(landmarks[12], landmarks[9]) > dist(landmarks[10], landmarks[9]), // middle
    dist(landmarks[16], landmarks[13]) > dist(landmarks[14], landmarks[13]), // ring
    dist(landmarks[20], landmarks[17]) > dist(landmarks[18], landmarks[17]), // pinky
  ];

  const indexOnly = fingersUp[1] && !fingersUp[2];

  return {
    indexTip,
    thumbTip,
    isPinching,
    pinchDist,
    landmarks,
    indexOnly,
  };
}
