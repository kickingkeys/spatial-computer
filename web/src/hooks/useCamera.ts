"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enumerate = useCallback(async () => {
    try {
      // Need a temporary stream to get labels on devices
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);
      tempStream.getTracks().forEach((t) => t.stop());
      return videoDevices;
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
      return [];
    }
  }, []);

  const selectCamera = useCallback(
    async (deviceId: string) => {
      try {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        setSelectedCamera(deviceId);
        setStream(newStream);
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        setError("Failed to access camera.");
      }
    },
    [stream]
  );

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  // Attach stream to videoRef when ref changes
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el && stream) {
        el.srcObject = stream;
      }
    },
    [stream]
  );

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  return {
    cameras,
    selectedCamera,
    stream,
    error,
    videoRef,
    enumerate,
    selectCamera,
    stopCamera,
    setVideoRef,
  };
}
