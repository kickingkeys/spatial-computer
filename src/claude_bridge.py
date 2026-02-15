"""Claude Bridge — sends camera frames to Claude Code CLI, returns response.
Also renders generated HTML to PNG via Chrome headless for projection."""

import subprocess
import os
import threading


CLAUDE_PATH = "/Users/suryanarreddi/.local/bin/claude"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HTML_PATH = "/tmp/spatial_output.html"
PREVIEW_PATH = "/tmp/spatial_preview.png"
PREVIEW_WIDTH = 900
PREVIEW_HEIGHT = 600

SYSTEM_CONTEXT = """⚠️ MANDATORY DARK MODE — THIS IS A PROJECTOR ON A WHITE WALL ⚠️
A projector ADDS light onto a white surface. It CANNOT produce dark colors.
White/light backgrounds become INVISIBLE. Only bright colors on BLACK backgrounds are visible.

Every HTML file you generate MUST start with:
  body { background: #000; color: #fff; }
NEVER use white, light gray, or any light background — it will be completely invisible.
Use ONLY: black/very dark backgrounds (#000, #0a0a0a, #111) with bright text (white, neon green, orange, cyan).
If the user's sketch says "white background" — IGNORE THAT and use black. The physics of projection require it.

You are the AI brain of a spatial canvas — a projector + camera system aimed at a whiteboard.
The user draws wireframes, sketches, and notes on the whiteboard. You see what they drew via the camera.
When woken up, you look at the whiteboard image and help the user.

Rules:
- If you see a wireframe/sketch, generate the HTML/CSS immediately — don't just describe it.
- ALWAYS save generated HTML/CSS to /tmp/spatial_output.html (single self-contained file, inline CSS).
- ALL generated HTML must use dark backgrounds (#000) with bright/vivid text and elements.
- Read the user's whiteboard annotations carefully — they are design instructions.
- If this is an iteration (you see a rendered preview projected alongside new annotations), update the HTML.
- Keep your text response to 2-3 lines max. Just say what you built.
- The user will annotate the whiteboard and pinch again to iterate.
"""


def render_html_to_png():
    """Render /tmp/spatial_output.html to /tmp/spatial_preview.png using Chrome headless."""
    if not os.path.exists(HTML_PATH):
        return False
    try:
        subprocess.run(
            [CHROME_PATH, "--headless", f"--screenshot={PREVIEW_PATH}",
             f"--window-size={PREVIEW_WIDTH},{PREVIEW_HEIGHT}",
             "--disable-gpu", "--hide-scrollbars",
             f"file://{HTML_PATH}"],
            capture_output=True, timeout=15,
        )
        return os.path.exists(PREVIEW_PATH)
    except Exception:
        return False


def call_claude(image_path, transcript=None, callback=None):
    """Call Claude CLI with an image and optional transcript.

    Runs in a background thread. Calls callback(response_text, has_preview) when done.
    """
    def _run():
        prompt_parts = [SYSTEM_CONTEXT, ""]
        prompt_parts.append(f"Read the image at {image_path} to see the whiteboard.")

        if transcript and transcript.strip():
            prompt_parts.append(f"\nThe user said: \"{transcript}\"")

        prompt_parts.append("\nWhat do you see? Help the user. Be concise (projector display).")

        prompt = "\n".join(prompt_parts)

        env = os.environ.copy()
        env.pop("CLAUDECODE", None)  # Allow nested session

        try:
            # Track HTML modification time before Claude runs
            old_mtime = os.path.getmtime(HTML_PATH) if os.path.exists(HTML_PATH) else 0

            result = subprocess.run(
                [CLAUDE_PATH, "-p", "--output-format", "text", "--allowedTools", "Read,Write,Bash"],
                input=prompt,
                capture_output=True,
                text=True,
                timeout=90,
                env=env,
                cwd="/Users/suryanarreddi/Documents/prototypes/spatial-computer",
            )

            response = result.stdout.strip()
            lines = response.split("\n")
            lines = [l for l in lines if not l.startswith("[WARN]")]
            response = "\n".join(lines)

            # Check if Claude generated/updated the HTML
            new_mtime = os.path.getmtime(HTML_PATH) if os.path.exists(HTML_PATH) else 0
            html_updated = new_mtime > old_mtime

            # Render HTML to PNG if updated
            has_preview = False
            if html_updated:
                has_preview = render_html_to_png()

            if callback:
                callback(response if response else "No response.", has_preview)

        except subprocess.TimeoutExpired:
            if callback:
                callback("Claude timed out (90s).", False)
        except Exception as e:
            if callback:
                callback(f"Error: {e}", False)

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return thread
