export const COLORS = {
  bg: '#000000',
  text: '#ffffff',
  textDim: '#888888',
  accent: '#00c864',
  cursorDefault: '#00dc64',
  cursorPinch: '#ff3c3c',
  cursorDraw: '#ff9500',
  draw: '#ffffff',
  erase: '#000000',
} as const;

export const DRAW_COLORS = [
  '#ffffff',
  '#ff3c3c',
  '#00c864',
  '#3c9cff',
  '#ffcc00',
  '#ff6cff',
] as const;

export const DRAWING = {
  strokeWidth: 4,
  eraserWidth: 30,
} as const;

export const HAND_TRACKING = {
  pinchThreshold: 40,
  debounceFrames: 3,
} as const;
