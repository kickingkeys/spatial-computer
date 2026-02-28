"use client";
import { useState, useEffect, useRef } from "react";
import { HandData } from "@/lib/types";
import { HAND_TRACKING } from "@/lib/config";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ml5: any;
  }
}

/**
 * Hand tracking hook using ml5.js v1.x handPose directly.
 *
 * Key patterns (from debugging):
 * - Use { video: true } or { deviceId: { ideal: id } }, never { exact: id }
 * - await ml5.handPose() returns the instance
 * - detectStart(video, callback) fires continuously
 */
export function useHandPose(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraId?: string | null
) {
  const [hand, setHand] = useState<HandData | null>(null);
  const [modelReady, setModelReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hpRef = useRef<any>(null);
  const stoppedRef = useRef(false);

  // Debounce
  const pinchCounterRef = useRef(0);
  const confirmedPinchRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    let streamRef: MediaStream | null = null;

    async function init() {
      const video = videoRef.current;
      if (!video) return;

      // 1. Camera — use { ideal } not { exact }, match working test pattern
      const constraints = cameraId
        ? { video: { deviceId: { ideal: cameraId } } }
        : { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stoppedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef = stream;
      video.srcObject = stream;
      await new Promise<void>(r => {
        if (video.readyState >= 2) return r();
        video.onloadeddata = () => r();
      });
      if (stoppedRef.current) return;

      // 2. Wait for ml5
      while (!window.ml5?.handPose) {
        await new Promise(r => setTimeout(r, 200));
        if (stoppedRef.current) return;
      }

      // 3. Load model
      const hp = await window.ml5.handPose();
      if (stoppedRef.current) return;
      hpRef.current = hp;
      setModelReady(true);

      // 4. Detect
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hp.detectStart(video, (results: any[]) => {
        if (stoppedRef.current) return;

        if (!results || results.length === 0) {
          setHand(null);
          return;
        }

        const h = results[0];
        const thumb = h.thumb_tip;
        const idx = h.index_finger_tip;
        if (!thumb || !idx) { setHand(null); return; }

        const pinchDist = Math.sqrt((thumb.x - idx.x) ** 2 + (thumb.y - idx.y) ** 2);
        const rawPinching = pinchDist < HAND_TRACKING.pinchThreshold;

        // Frame-debounce pinch
        if (rawPinching !== confirmedPinchRef.current) {
          pinchCounterRef.current += 1;
          if (pinchCounterRef.current >= HAND_TRACKING.debounceFrames) {
            confirmedPinchRef.current = rawPinching;
            pinchCounterRef.current = 0;
          }
        } else {
          pinchCounterRef.current = 0;
        }

        const landmarks = (h.keypoints || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (kp: any) => ({ x: kp.x, y: kp.y })
        );

        setHand({
          thumbTip: { x: thumb.x, y: thumb.y },
          indexTip: { x: idx.x, y: idx.y },
          isPinching: confirmedPinchRef.current,
          pinchDist,
          landmarks,
          indexOnly: false,
        });
      });
    }

    init().catch(e => console.error("Hand tracking init failed:", e));

    return () => {
      stoppedRef.current = true;
      try { hpRef.current?.detectStop(); } catch { /* */ }
      hpRef.current = null;
      streamRef?.getTracks().forEach(t => t.stop());
      setHand(null);
      setModelReady(false);
    };
  }, [videoRef, cameraId]);

  return { hand, modelReady };
}
