import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BODY, CLAMP } from "../theme";
import { FPS, SEGMENTS } from "../timeline";

// On-screen captions for every narrated sentence (helps judges follow along, and works with sound off).
const LINES = SEGMENTS.flatMap((s) => s.lines);

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const line = LINES.find((l) => t >= l.start - 0.05 && t <= l.start + l.dur + 0.2);
  if (!line) return null;
  const a = line.start * FPS;
  const b = (line.start + line.dur + 0.2) * FPS;
  const op = Math.min(interpolate(f, [a - 2, a + 4], [0, 1], CLAMP), interpolate(f, [b - 4, b], [1, 0], CLAMP));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center", opacity: op }}>
      <div
        style={{
          maxWidth: 1560, background: "rgba(31,45,37,.86)", color: "#fff", fontFamily: BODY, fontWeight: 600,
          fontSize: 32, lineHeight: 1.35, padding: "12px 28px", borderRadius: 16, textAlign: "center",
        }}
      >
        {line.text}
      </div>
    </div>
  );
};
