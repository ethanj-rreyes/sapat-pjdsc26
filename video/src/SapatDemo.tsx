import React from "react";
import { AbsoluteFill, interpolate, Series, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "./components/Captions";
import { Close } from "./scenes/Close";
import { Engine } from "./scenes/Engine";
import { FamilyCheck, FamilyMarket, FamilyToday, FamilyWeek } from "./scenes/FamilyApp";
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { LguFeeding, LguMap } from "./scenes/Lgu";
import { Problem } from "./scenes/Problem";
import { Results } from "./scenes/Results";
import { CLAMP } from "./theme";
import { FPS, SEGMENTS, TOTAL_FRAMES, sceneFrames, sceneStartSec } from "./timeline";

// One scene per narration segment, in order (ids match timeline.json).
export const SCENES: { id: string; name: string; component: React.FC }[] = [
  { id: "s1_hook", name: "Hook", component: Hook },
  { id: "s2_problem", name: "Problem", component: Problem },
  { id: "s3_intro", name: "Intro", component: Intro },
  { id: "s4_engine", name: "Engine", component: Engine },
  { id: "s5a_week", name: "FamilyWeek", component: FamilyWeek },
  { id: "s5b_market", name: "FamilyMarket", component: FamilyMarket },
  { id: "s5c_today", name: "FamilyToday", component: FamilyToday },
  { id: "s5d_family", name: "FamilyCheck", component: FamilyCheck },
  { id: "s6a_map", name: "LguMap", component: LguMap },
  { id: "s6b_feeding", name: "LguFeeding", component: LguFeeding },
  { id: "s7_results", name: "Results", component: Results },
  { id: "s8_close", name: "Close", component: Close },
];

// Background music ducks under the voice: louder in pauses, softer while someone is speaking.
const LINES = SEGMENTS.flatMap((s) => s.lines);
const RAW = Array.from({ length: TOTAL_FRAMES }, (_, f) => {
  const t = f / FPS;
  return LINES.some((l) => t >= l.start - 0.15 && t <= l.start + l.dur + 0.1) ? 0.13 : 0.32;
});
const DUCK = RAW.map((_, f) => {
  let s = 0, n = 0;
  for (let k = f - 8; k <= f + 8; k++) if (k >= 0 && k < RAW.length) { s += RAW[k]; n++; }
  return s / n;
});

// Soft dip between scenes, drawn on top so each scene stays a direct child of its sequence.
// (No dip between the four family-app scenes or the two dashboard scenes: the phone/browser stays put.)
const SAME_FRAME = ["FamilyMarket", "FamilyToday", "FamilyCheck", "LguFeeding"];
const BOUNDS = SCENES.map((s, i) => ({ s, b: Math.round(sceneStartSec(i) * FPS) }))
  .slice(1)
  .filter(({ s }) => !SAME_FRAME.includes(s.name))
  .map(({ b }) => b);
const SceneDip: React.FC = () => {
  const f = useCurrentFrame();
  const op = Math.max(0, ...BOUNDS.map((b) => interpolate(f, [b - 6, b, b + 8], [0, 1, 0], CLAMP)));
  return <AbsoluteFill style={{ backgroundColor: "#F3F7F2", opacity: op, pointerEvents: "none" }} />;
};

export const SapatDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#F3F7F2" }}>
      <Series>
        {SCENES.map((s, i) => (
          <Series.Sequence key={s.id} name={s.name} durationInFrames={sceneFrames(i)}>
            <s.component />
          </Series.Sequence>
        ))}
      </Series>
      <SceneDip />
      <Captions />
      <Audio src={staticFile("music.mp3")} volume={(f) => DUCK[Math.min(DUCK.length - 1, Math.max(0, f))]} />
      {LINES.map((l) => (
        <Audio key={l.file} from={Math.round(l.start * FPS)} src={staticFile(`narration/${l.file}`)} />
      ))}
    </AbsoluteFill>
  );
};
