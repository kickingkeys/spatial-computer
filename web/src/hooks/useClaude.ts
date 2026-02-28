"use client";
import { useState, useCallback } from "react";
import { ClaudeResponse } from "@/lib/types";

export function useClaude() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ClaudeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendToClaude = useCallback(
    async (canvasDataUrl: string, cameraDataUrl?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canvasImage: canvasDataUrl,
            cameraImage: cameraDataUrl,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `API error: ${res.status}`);
        }
        const data: ClaudeResponse = await res.json();
        setResponse(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { loading, response, error, sendToClaude, clearResponse };
}
