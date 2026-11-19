import data from "./timeline.json";

// timeline.json is written by the narration script: one audio clip per sentence, with exact start times.
export const FPS = 30;
export type Line = { file: string; start: number; dur: number; text: string };
export type Segment = { id: string; start: number; end: number; lines: Line[] };

export const SEGMENTS = data.segments as Segment[];
export const TOTAL_FRAMES = Math.ceil(data.total * FPS);

// Each scene starts a beat before its narration, and runs until the next scene starts.
const LEAD_IN = 0.3;
export const sceneStartSec = (i: number) => (i === 0 ? 0 : SEGMENTS[i].start - LEAD_IN);
export const sceneEndSec = (i: number) => (i === SEGMENTS.length - 1 ? data.total : sceneStartSec(i + 1));
export const sceneFrames = (i: number) => Math.round(sceneEndSec(i) * FPS) - Math.round(sceneStartSec(i) * FPS);

export const segIndex = (id: string) => SEGMENTS.findIndex((s) => s.id === id);

// Frames from the scene's start to the start (or end) of sentence n.
export const useCues = (id: string) => {
  const i = segIndex(id);
  const s0 = sceneStartSec(i);
  const seg = SEGMENTS[i];
  return {
    at: (n: number) => Math.round((seg.lines[n].start - s0) * FPS),
    end: (n: number) => Math.round((seg.lines[n].start + seg.lines[n].dur - s0) * FPS),
    frames: sceneFrames(i),
  };
};
