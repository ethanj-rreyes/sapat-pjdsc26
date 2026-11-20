import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BODY, C, CLAMP, DISPLAY, EASE } from "../theme";

// Fade + rise in, starting at frame `at`.
export const useIn = (at: number, dur = 18, dist = 30) => {
  const f = useCurrentFrame();
  return {
    opacity: interpolate(f, [at, at + dur], [0, 1], { ...CLAMP, easing: EASE }),
    translate: `0px ${interpolate(f, [at, at + dur], [dist, 0], { ...CLAMP, easing: EASE })}px`,
  } as React.CSSProperties;
};

// Fade out at frame `at`.
export const useOut = (at: number, dur = 12) => {
  const f = useCurrentFrame();
  return interpolate(f, [at, at + dur], [1, 0], CLAMP);
};

export const Background: React.FC<{ tint?: string }> = ({ tint = C.bg }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: tint, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", width: 900, height: 900, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.leafSoft} 0%, rgba(223,240,228,0) 70%)`,
          left: -260 + Math.sin(f / 90) * 40, top: -320 + Math.cos(f / 110) * 30,
        }}
      />
      <div
        style={{
          position: "absolute", width: 800, height: 800, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.sunSoft} 0%, rgba(255,242,214,0) 70%)`,
          right: -240 + Math.cos(f / 100) * 40, bottom: -340 + Math.sin(f / 80) * 30,
        }}
      />
    </AbsoluteFill>
  );
};

export const ChapterTag: React.FC<{ n: string; label: string }> = ({ n, label }) => {
  const style = useIn(0, 16, 12);
  return (
    <div
      style={{
        ...style, position: "absolute", left: 96, top: 64, display: "flex", alignItems: "center", gap: 14,
        fontFamily: BODY, fontWeight: 800, fontSize: 26, color: C.leaf, letterSpacing: "0.06em", textTransform: "uppercase",
      }}
    >
      <span style={{ background: C.leaf, color: "#fff", borderRadius: 999, padding: "6px 16px" }}>{n}</span>
      {label}
    </div>
  );
};

export const Wordmark: React.FC<{ size: number; color?: string }> = ({ size, color = C.leaf }) => (
  <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: size, color, lineHeight: 1 }}>
    sapat<span style={{ color: C.sun }}>.</span>
  </span>
);

// The SAPAT pot icon, as in the app's launch splash. Steam drifts with the frame.
export const PotLogo: React.FC<{ size: number }> = ({ size }) => {
  const f = useCurrentFrame();
  const s = (k: number) => ({
    opacity: 0.55 + 0.45 * Math.sin(f / 12 + k * 1.7),
    transform: `translateY(${Math.sin(f / 15 + k) * 2}px)`,
  });
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.29, background: C.leafDeep,
        display: "grid", placeItems: "center", boxShadow: "0 24px 50px -18px rgba(30,138,76,.6)",
      }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.66} height={size * 0.66}>
        <path d="M14 30h36v6c0 9-7 14-15 14h-6c-8 0-15-5-15-14z" fill="#FFF6E3" />
        <path d="M12 30h40" stroke="#FFF6E3" strokeWidth="4" strokeLinecap="round" />
        <path style={s(0)} d="M26 24c-3-3 3-5 0-9" stroke="#FFD27A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path style={s(1)} d="M33 23c-3-3 3-5 0-10" stroke="#FFD27A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path style={s(2)} d="M40 24c-3-3 3-5 0-9" stroke="#FFD27A" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export const Source: React.FC<{ children: React.ReactNode; at?: number }> = ({ children, at = 10 }) => {
  const style = useIn(at, 20, 0);
  return (
    <div
      style={{
        ...style, position: "absolute", right: 96, top: 72, fontFamily: BODY, fontSize: 20, color: C.ink2,
        textAlign: "right", maxWidth: 820,
      }}
    >
      {children}
    </div>
  );
};

// A bullet/callout row used beside the app screens.
export const Callout: React.FC<{ at: number; title: string; body?: string; accent?: string }> = ({
  at, title, body, accent = C.leaf,
}) => {
  const style = useIn(at, 18, 24);
  return (
    <div style={{ ...style, display: "flex", gap: 22, alignItems: "flex-start" }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: accent, marginTop: 20, flex: "none" }} />
      <div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 48, color: C.ink, lineHeight: 1.15 }}>{title}</div>
        {body ? (
          <div style={{ fontFamily: BODY, fontSize: 30, color: C.ink2, marginTop: 6, lineHeight: 1.35 }}>{body}</div>
        ) : null}
      </div>
    </div>
  );
};
