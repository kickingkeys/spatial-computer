export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface HandData {
  indexTip: Point;
  thumbTip: Point;
  isPinching: boolean;
  pinchDist: number;
  landmarks: Point[];
  indexOnly: boolean;
}

export type ToolMode = 'draw' | 'erase' | 'claude' | 'clear';

export interface ClaudeResponse {
  text: string;
  html: string | null;
}
