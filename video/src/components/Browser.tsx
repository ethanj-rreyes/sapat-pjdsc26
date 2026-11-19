import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BODY, C, CLAMP, EASE } from "../theme";

// Real screens captured from web/lgu-dashboard (1600 x 900 viewport at 1.2x = 1920 x 1080 px).
export type Shot = { src: string; from: number };
export type Zoom = { at: number; dur: number; scale: number; x: number; y: number }; // x, y = focus point, 0..1

const W = 1360;
const H = (W * 1080) / 1920;
const BAR = 48;

export const Browser: React.FC<{ shots: Shot[]; zooms?: Zoom[]; left: number; top: number; enter?: number; url?: string }> = ({
  shots, zooms = [], left, top, enter = 0, url = "sapat-pjdsc26/web/lgu-dashboard/index.html",
}) => {
  const f = useCurrentFrame();
  let scale = 1, ox = 0.5, oy = 0.5;
  for (const z of zooms) {
    const p = interpolate(f, [z.at, z.at + z.dur], [0, 1], { ...CLAMP, easing: EASE });
    if (p > 0) { scale = 1 + (z.scale - 1) * p + (scale - 1) * (1 - p); ox = ox + (z.x - ox) * p; oy = oy + (z.y - oy) * p; }
  }
  return (
    <div
      style={{
        position: "absolute", left, top, width: W, height: H + BAR, borderRadius: 18, overflow: "hidden", background: C.surface,
        boxShadow: "0 40px 90px -36px rgba(31,45,37,.45)", border: `1px solid ${C.line}`,
        opacity: interpolate(f, [enter, enter + 18], [0, 1], CLAMP),
        translate: `0px ${interpolate(f, [enter, enter + 24], [50, 0], { ...CLAMP, easing: EASE })}px`,
      }}
    >
      <div style={{ height: BAR, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", background: C.soft, borderBottom: `1px solid ${C.line}` }}>
        {["#E46A5A", "#F2B33D", "#4FB37A"].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 18, flex: 1, background: C.surface, borderRadius: 999, padding: "6px 18px", fontFamily: BODY, fontSize: 18, color: C.ink2 }}>
          {url}
        </span>
      </div>
      <div style={{ position: "relative", width: W, height: H, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, scale: `${scale}`, transformOrigin: `${ox * 100}% ${oy * 100}%` }}>
          {shots.map((s, i) => {
            const next = shots[i + 1];
            const op = Math.min(
              i === 0 ? 1 : interpolate(f, [s.from, s.from + 12], [0, 1], CLAMP),
              next ? interpolate(f, [next.from + 12, next.from + 13], [1, 0], CLAMP) : 1,
            );
            if (op <= 0) return null;
            return <Img key={i} src={staticFile(`screens/${s.src}`)} style={{ position: "absolute", inset: 0, width: W, height: H, opacity: op }} />;
          })}
        </div>
      </div>
    </div>
  );
};

export const BROWSER_W = W;
export const BROWSER_H = H + BAR;
