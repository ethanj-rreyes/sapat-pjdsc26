import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import meta from "../screens-meta.json";
import { C, CLAMP, EASE } from "../theme";

// Real screens captured from web/family-app (390 x 844 CSS px at 2.5x).
// Each page = fixed app bar + scrolling content + fixed bottom nav, recomposed here so scrolling is smooth.
type PageKey = keyof typeof meta;
export type Page = { key: PageKey; from: number; scroll?: [number, number][] };
export type Overlay = { src: string; from: number; to?: number };
export type Tap = { at: number; x: number; y: number };

const K = 0.92; // CSS px -> video px
const SW = 390 * K;
const SH = 844 * K;
const BEZEL = 14;

const scrollAt = (f: number, keys?: [number, number][]) => {
  if (!keys || keys.length === 0) return 0;
  if (keys.length === 1) return keys[0][1];
  return interpolate(f, keys.map((k) => k[0]), keys.map((k) => k[1]), { ...CLAMP, easing: EASE });
};

const PageView: React.FC<{ page: Page }> = ({ page }) => {
  const f = useCurrentFrame();
  const m = meta[page.key];
  const y = scrollAt(f, page.scroll);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg }}>
      <div style={{ position: "absolute", left: 0, top: m.mainTop * K, width: SW, height: (m.navTop - m.mainTop) * K, overflow: "hidden" }}>
        <Img src={staticFile(`screens/${page.key}-tall.png`)} style={{ width: SW, translate: `0px ${-y * K}px` }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: m.mainTop * K, overflow: "hidden" }}>
        <Img src={staticFile(`screens/${page.key}-view.png`)} style={{ width: SW, height: SH }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: m.navTop * K, width: SW, height: (844 - m.navTop) * K, overflow: "hidden" }}>
        <Img src={staticFile(`screens/${page.key}-view.png`)} style={{ width: SW, height: SH, translate: `0px ${-m.navTop * K}px` }} />
      </div>
    </div>
  );
};

const TapMark: React.FC<{ tap: Tap }> = ({ tap }) => {
  const f = useCurrentFrame();
  if (f < tap.at - 6 || f > tap.at + 24) return null;
  const p = interpolate(f, [tap.at, tap.at + 20], [0, 1], CLAMP);
  const dot = interpolate(f, [tap.at - 6, tap.at, tap.at + 10, tap.at + 20], [0, 1, 1, 0], CLAMP);
  return (
    <>
      <div style={{ position: "absolute", left: tap.x * K - 40, top: tap.y * K - 40, width: 80, height: 80, borderRadius: 40, border: `5px solid ${C.sun}`, opacity: 1 - p, scale: `${0.4 + p}` }} />
      <div style={{ position: "absolute", left: tap.x * K - 18, top: tap.y * K - 18, width: 36, height: 36, borderRadius: 18, background: "rgba(242,179,61,.55)", opacity: dot }} />
    </>
  );
};

export const Phone: React.FC<{ pages: Page[]; overlays?: Overlay[]; taps?: Tap[]; left: number; top: number; enter?: number }> = ({
  pages, overlays = [], taps = [], left, top, enter = 0,
}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute", left, top, width: SW + BEZEL * 2, height: SH + BEZEL * 2, borderRadius: 56, background: "#1E2722",
        padding: BEZEL, boxShadow: "0 40px 80px -30px rgba(31,45,37,.45)",
        opacity: interpolate(f, [enter, enter + 18], [0, 1], CLAMP),
        translate: `0px ${interpolate(f, [enter, enter + 24], [60, 0], { ...CLAMP, easing: EASE })}px`,
      }}
    >
      <div style={{ position: "relative", width: SW, height: SH, borderRadius: 44, overflow: "hidden", background: C.bg }}>
        {pages.map((p, i) => {
          const next = pages[i + 1];
          const op = Math.min(
            i === 0 ? 1 : interpolate(f, [p.from, p.from + 8], [0, 1], CLAMP),
            next ? interpolate(f, [next.from + 8, next.from + 9], [1, 0], CLAMP) : 1,
          );
          if (op <= 0) return null;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, opacity: op }}>
              <PageView page={p} />
            </div>
          );
        })}
        {overlays.map((o, i) => {
          const op = Math.min(
            interpolate(f, [o.from, o.from + 8], [0, 1], CLAMP),
            o.to !== undefined ? interpolate(f, [o.to, o.to + 8], [1, 0], CLAMP) : 1,
          );
          if (op <= 0) return null;
          return (
            <div key={"o" + i} style={{ position: "absolute", inset: 0, opacity: op, translate: `0px ${interpolate(f, [o.from, o.from + 14], [24, 0], { ...CLAMP, easing: EASE })}px` }}>
              <Img src={staticFile(`screens/${o.src}`)} style={{ width: SW, height: SH }} />
            </div>
          );
        })}
        {taps.map((t, i) => (
          <TapMark key={"t" + i} tap={t} />
        ))}
      </div>
    </div>
  );
};

export const PHONE_W = SW + BEZEL * 2;
export const PHONE_H = SH + BEZEL * 2;
