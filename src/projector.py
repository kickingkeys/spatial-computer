"""Projector rendering module — fullscreen Pygame window on the AAXA P7+."""

import os
import pygame
from config import (
    PROJECTOR_WIDTH,
    PROJECTOR_HEIGHT,
    COLOR_BG,
)


def _get_projector_origin():
    """Get the projector display origin using CoreGraphics."""
    import ctypes, ctypes.util
    lib = ctypes.cdll.LoadLibrary(ctypes.util.find_library("CoreGraphics"))

    max_displays = 10
    active_displays = (ctypes.c_uint32 * max_displays)()
    display_count = ctypes.c_uint32()
    lib.CGGetActiveDisplayList(max_displays, active_displays, ctypes.byref(display_count))

    class CGPoint(ctypes.Structure):
        _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]
    class CGSize(ctypes.Structure):
        _fields_ = [("width", ctypes.c_double), ("height", ctypes.c_double)]
    class CGRect(ctypes.Structure):
        _fields_ = [("origin", CGPoint), ("size", CGSize)]

    lib.CGDisplayBounds.restype = CGRect
    lib.CGDisplayBounds.argtypes = [ctypes.c_uint32]

    for i in range(display_count.value):
        d = active_displays[i]
        if not lib.CGDisplayIsMain(d):
            bounds = lib.CGDisplayBounds(d)
            print(f"[projector] Found secondary display at ({bounds.origin.x}, {bounds.origin.y}) "
                  f"size {bounds.size.width}x{bounds.size.height}")
            return int(bounds.origin.x), int(bounds.origin.y)

    # Fallback: assume projector is to the right of 1440px laptop
    print("[projector] Warning: could not detect projector position, using fallback")
    return 1440, 0


class Projector:
    def __init__(self):
        # Get exact projector position
        proj_x, proj_y = _get_projector_origin()

        # Position the pygame window on the projector display
        os.environ["SDL_VIDEO_WINDOW_POS"] = f"{proj_x},{proj_y}"

        if not pygame.get_init():
            pygame.init()

        # Create window at projector position, then go fullscreen
        self.screen = pygame.display.set_mode(
            (PROJECTOR_WIDTH, PROJECTOR_HEIGHT),
            pygame.NOFRAME,
        )
        pygame.display.set_caption("Spatial Computer")

        # NOFRAME + correct size fills the projector without stealing focus
        # Press 'f' in app to toggle fullscreen if needed

        self.width = PROJECTOR_WIDTH
        self.height = PROJECTOR_HEIGHT
        # Terminal-style monospace fonts — large for spatial readability
        self.font_large = pygame.font.SysFont("Menlo, Courier New, monospace", 42)
        self.font_medium = pygame.font.SysFont("Menlo, Courier New, monospace", 32)
        self.font_small = pygame.font.SysFont("Menlo, Courier New, monospace", 22)
        self.font_mono = pygame.font.SysFont("Menlo, Courier New, monospace", 30)

        print(f"[projector] Display opened: {self.width}x{self.height} at ({proj_x}, {proj_y})")

    def clear(self, color=COLOR_BG):
        """Clear the screen."""
        self.screen.fill(color)

    def flip(self):
        """Swap buffers to display the frame."""
        pygame.display.flip()

    def draw_circle(self, pos, radius, color):
        """Draw a filled circle."""
        pygame.draw.circle(self.screen, color, (int(pos[0]), int(pos[1])), radius)

    def draw_rect(self, rect, color, border_radius=0):
        """Draw a filled rectangle. rect = (x, y, w, h)."""
        pygame.draw.rect(
            self.screen, color,
            pygame.Rect(rect[0], rect[1], rect[2], rect[3]),
            border_radius=border_radius,
        )

    def draw_rect_outline(self, rect, color, width=2, border_radius=0):
        """Draw a rectangle outline."""
        pygame.draw.rect(
            self.screen, color,
            pygame.Rect(rect[0], rect[1], rect[2], rect[3]),
            width=width,
            border_radius=border_radius,
        )

    def draw_text(self, text, pos, color, font_size="medium"):
        """Draw text at position. font_size: 'small', 'medium', 'large'."""
        font = {
            "small": self.font_small,
            "medium": self.font_medium,
            "large": self.font_large,
            "mono": self.font_mono,
        }.get(font_size, self.font_mono)
        surface = font.render(text, True, color)
        self.screen.blit(surface, pos)

    def draw_text_centered(self, text, rect, color, font_size="medium"):
        """Draw text centered within a rect (x, y, w, h)."""
        font = {
            "small": self.font_small,
            "medium": self.font_medium,
            "large": self.font_large,
            "mono": self.font_mono,
        }.get(font_size, self.font_mono)
        surface = font.render(text, True, color)
        text_rect = surface.get_rect()
        cx = rect[0] + rect[2] // 2 - text_rect.width // 2
        cy = rect[1] + rect[3] // 2 - text_rect.height // 2
        self.screen.blit(surface, (cx, cy))

    def quit(self):
        pygame.quit()
