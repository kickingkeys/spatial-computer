"use client";
import { useState, useCallback } from "react";
import { ClaudeResponse } from "@/lib/types";

const SYSTEM_PROMPT = `You are the AI brain of Spatial Canvas, a web-based spatial computing tool.
The user draws on a digital canvas (dark background, bright strokes).
When triggered, you see a snapshot of their canvas (and optionally a camera view of their physical workspace).

Rules:
- If you see a wireframe, sketch, or UI drawing, generate the HTML/CSS for it immediately.
- Generated HTML must be a complete, self-contained document with inline CSS and no external dependencies.
- ALL HTML must use dark backgrounds (#000, #0a0a0a, #111) with bright/vivid text and elements.
  This is for projection on a white wall — light backgrounds are INVISIBLE.
- Read any text annotations on the canvas carefully — they are design instructions from the user.
- Keep your text response to 2-3 sentences max. Describe what you built.
- Wrap your generated HTML in <html-output>...</html-output> tags so we can extract it.
- If there's nothing meaningful on the canvas, just respond with a helpful message (no HTML needed).
- The user will iterate by drawing more and triggering you again. Build on previous context.`;

const API_KEY_STORAGE = "spatial-canvas-api-key";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

export function useClaude() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ClaudeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendToClaude = useCallback(
    async (canvasDataUrl: string, cameraDataUrl?: string) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError("No API key. Add your Anthropic API key in settings.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Build content blocks
        const canvasBase64 = canvasDataUrl.replace(/^data:image\/\w+;base64,/, "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content: any[] = [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: canvasBase64 },
          },
          {
            type: "text",
            text: "This is the user's canvas — their digital drawing/wireframe.",
          },
        ];

        if (cameraDataUrl) {
          const cameraBase64 = cameraDataUrl.replace(/^data:image\/\w+;base64,/, "");
          content.push({
            type: "image",
            source: { type: "base64", media_type: "image/png", data: cameraBase64 },
          });
          content.push({
            type: "text",
            text: "This is the camera view of the user's physical workspace.",
          });
        }

        content.push({
          type: "text",
          text: "What do you see on the canvas? If it's a wireframe or UI sketch, generate the HTML/CSS for it.",
        });

        // Call Anthropic API directly
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content }],
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error?.message || `API error: ${res.status}`);
        }

        const data = await res.json();
        const responseText = data.content
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((block: any) => block.type === "text")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((block: any) => block.text)
          .join("\n");

        // Extract HTML from <html-output> tags
        const htmlMatch = responseText.match(
          /<html-output>([\s\S]*?)<\/html-output>/
        );
        const html = htmlMatch ? htmlMatch[1].trim() : null;
        const text = responseText
          .replace(/<html-output>[\s\S]*?<\/html-output>/, "")
          .trim();

        setResponse({ text, html });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
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
