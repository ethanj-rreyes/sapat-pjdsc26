import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, ChapterTag, Source, useIn } from "../components/ui";
import { BODY, C, CLAMP, DISPLAY, EASE } from "../theme";
import { useCues } from "../timeline";

const Kid: React.FC<{ short?: boolean; size: number }> = ({ short, size }) => {
  const h = short ? size * 0.78 : size;
  const col = short ? C.bad : C.leaf;
  return (
    <svg width={size * 0.55} height={size} viewBox={`0 0 55 100`} style={{ overflow: "visible" }}>
      <g transform={`translate(0 ${100 - (h / size) * 100}) scale(1 ${h / size})`}>
        <circle cx="27.5" cy="16" r="14" fill={col} />
        <rect x="8" y="36" width="39" height="62" rx="18" fill={col} />
      </g>
    </svg>
  );
};

const Stat: React.FC<{ at: number; big: string; color: string; label: string; children?: React.ReactNode; w: number }> = ({
  at, big, color, label, children, w,
}) => {
  const st = useIn(at, 20, 40);
  return (
    <div style={{ ...st, width: w, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 150, color, lineHeight: 1 }}>{big}</div>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 36, color: C.ink, lineHeight: 1.3, minHeight: 96 }}>{label}</div>
      {children}
    </div>
  );
};

export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const q = useCues("s2_problem");
  const poorest = Math.round((q.at(0) + q.end(0)) / 2);
  const poorIn = useIn(poorest, 18, 16);
  const qIn = useIn(q.at(2) + 10, 18, 16);
  const share = interpolate(f, [q.at(1) + 10, q.at(1) + 50], [0, 44], { ...CLAMP, easing: EASE });
  const bar167 = interpolate(f, [q.at(3) + 6, q.at(3) + 46], [0, 1], { ...CLAMP, easing: EASE });
  const bar63 = interpolate(f, [q.at(4) + 4, q.at(4) + 40], [0, 1], { ...CLAMP, easing: EASE });
  const barH = 300;
  return (
    <AbsoluteFill>
      <Background />
      <ChapterTag n="01" label="The problem" />
      <Source>ENNS 2021 (DOST-FNRI) · FIES 2023 (PSA) · PSA 2023 poverty statistics · SAPAT computation, Sep 2026 prices</Source>
      <AbsoluteFill style={{ flexDirection: "row", justifyContent: "space-between", padding: "190px 120px 0" }}>
        <Stat at={q.at(0)} big="1 in 4" color={C.bad} label="Filipino children under 5 are stunted (26.7%)" w={500}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-end", height: 130 }}>
            <Kid size={120} short /> <Kid size={120} /> <Kid size={120} /> <Kid size={120} />
          </div>
          <div style={{ ...poorIn, marginTop: 24 }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: C.ink, marginBottom: 12 }}>
              <span style={{ color: C.bad, fontFamily: DISPLAY, fontSize: 44 }}>4 in 10</span> in the poorest fifth (40.6%)
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 70 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Kid key={i} size={66} short={i < 4} />
              ))}
            </div>
          </div>
        </Stat>
        <Stat at={q.at(1)} big="44%" color={C.sunDeep} label="of the poorest 10%'s home food spending goes to rice and cereals" w={520}>
          <div style={{ height: 64, borderRadius: 32, background: C.leafSoft, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${share}%`, background: C.sun, display: "flex", alignItems: "center", paddingLeft: 22, fontFamily: BODY, fontWeight: 800, fontSize: 24, color: C.ink, whiteSpace: "nowrap" }}>
              Rice & cereals
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 22, fontFamily: BODY, fontWeight: 700, fontSize: 24, color: C.ink2 }}>
              everything else
            </div>
          </div>
          <div style={{ ...qIn, marginTop: 30, background: C.surface, borderRadius: 24, padding: "22px 26px", boxShadow: "0 10px 30px -18px rgba(31,45,37,.3)", fontFamily: BODY, fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.35 }}>
            <span style={{ color: C.sunDeep, fontFamily: DISPLAY, fontSize: 40 }}>?</span>&nbsp; "What would a healthy week cost <i>our</i> family, at <i>this month's</i> prices?"
          </div>
        </Stat>
        <Stat at={q.at(3)} big="₱167" color={C.leaf} label="a nutritious diet, per person per day (national)" w={520}>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end", height: barH + 60 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 40, color: C.leaf, opacity: bar167 }}>₱167</div>
              <div style={{ width: 150, height: barH * bar167, background: C.leaf, borderRadius: "18px 18px 6px 6px" }} />
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, color: C.ink2, textAlign: "center", width: 200 }}>Nutritious diet</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: interpolate(f, [q.at(4) - 4, q.at(4) + 8], [0, 1], CLAMP) }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 40, color: C.ink2 }}>₱63</div>
              <div style={{ width: 150, height: barH * (63 / 167) * bar63, background: "#A6B3A9", borderRadius: "18px 18px 6px 6px" }} />
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, color: C.ink2, textAlign: "center", width: 220 }}>Official food threshold (2023)</div>
            </div>
          </div>
        </Stat>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
