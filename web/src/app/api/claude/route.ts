import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const { canvasImage, cameraImage } = await request.json();

    if (!canvasImage) {
      return NextResponse.json(
        { error: "No canvas image provided" },
        { status: 400 }
      );
    }

    const content: Anthropic.Messages.ContentBlockParam[] = [];

    // Add canvas snapshot
    const canvasBase64 = canvasImage.replace(/^data:image\/\w+;base64,/, "");
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: canvasBase64 },
    });
    content.push({
      type: "text",
      text: "This is the user's canvas — their digital drawing/wireframe.",
    });

    // Add camera frame if provided
    if (cameraImage) {
      const cameraBase64 = cameraImage.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: cameraBase64,
        },
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

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("\n");

    // Extract HTML from <html-output> tags
    const htmlMatch = responseText.match(
      /<html-output>([\s\S]*?)<\/html-output>/
    );
    const html = htmlMatch ? htmlMatch[1].trim() : null;
    const text = responseText
      .replace(/<html-output>[\s\S]*?<\/html-output>/, "")
      .trim();

    return NextResponse.json({ text, html });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Claude API error";
    console.error("Claude API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
