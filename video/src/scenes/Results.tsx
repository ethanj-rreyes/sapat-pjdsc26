import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, ChapterTag, Source, useIn } from "../components/ui";
import { BODY, C, CLAMP, DISPLAY, EASE } from "../theme";
import { useCues } from "../timeline";

// outputs/h1_results.csv, decile 1 (poorest 10%), mean of 17 regions
const NUTRIENTS: [string, number, number][] = [
  ["Energy", 71, 79], ["Protein", 75, 84], ["Iron", 30, 49], ["Vitamin A", 12, 74], ["Calcium", 16, 27],
];

const Bar: React.FC<{ at: number; pct: number; color: string; label: string; h: number; textColor?: string }> = ({ at, pct, color, label, h, textColor = "#fff" }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 36], [0, 1], { ...CLAMP, easing: EASE });
  const shown = Math.round(pct * p);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: interpolate(f, [at - 6, at + 4], [0, 1], CLAMP) }}>
      <div style={{ width: 230, fontFamily: BODY, fontWeight: 800, fontSize: 30, color: C.ink2, textAlign: "right" }}>{label}</div>
      <div style={{ width: 760, height: h, background: C.soft, borderRadius: h / 2, overflow: "hidden" }}>
        <div style={{ width: `${pct * p}%`, height: "100%", background: color, borderRadius: h / 2, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 24, fontFamily: DISPLAY, fontWeight: 600, fontSize: h * 0.6, color: textColor }}>
          {shown}%
        </div>
      </div>
    </div>
  );
};

export const Results: React.FC = () => {
  const f = useCurrentFrame();
  const q = useCues("s7_results");
  const titleUp = interpolate(f, [q.at(1) - 6, q.at(1) + 18], [0, 1], { ...CLAMP, easing: EASE });
  const kid = useIn(q.at(3) - 4, 18, 20);
  const side = useIn(q.at(2) + 30, 20, 20);
  const banner = useIn(q.at(4), 20, 24);
  return (
    <AbsoluteFill>
      <Background />
      <ChapterTag n="06" label="Results" />
      <Source at={q.at(1)}>Poorest 10%'s food budget (FIES 2023) · 17 regions · Sep 2026 prices · mean adequacy over 5 nutrients, capped at 100%</Source>
      <div
        style={{
          position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: DISPLAY, fontWeight: 600, color: C.ink,
          top: interpolate(titleUp, [0, 1], [400, 150]), fontSize: interpolate(titleUp, [0, 1], [150, 70]),
          opacity: interpolate(f, [0, 14], [0, 1], CLAMP),
        }}
      >
        Does it work?
      </div>
      <div style={{ position: "absolute", left: 100, top: 300, display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: "0.06em", textTransform: "uppercase", color: C.leaf, opacity: titleUp, marginLeft: 254 }}>
          Share of a family's needs met, same pesos
        </div>
        <Bar at={q.at(1) + 30} pct={41} color="#A6B3A9" label="Usual way" h={96} />
        <Bar at={q.at(2)} pct={62} color={C.leaf} label="SAPAT plan" h={96} />
        <div style={{ ...kid, marginTop: 30, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: "0.06em", textTransform: "uppercase", color: C.sunDeep, marginLeft: 254 }}>For a 3-year-old</div>
          <Bar at={q.at(3)} pct={45} color="#A6B3A9" label="Usual way" h={64} />
          <Bar at={q.at(3) + 14} pct={76} color={C.sun} label="SAPAT plan" h={64} textColor={C.ink} />
        </div>
      </div>
      <div style={{ ...side, position: "absolute", left: 1400, top: 300, width: 420, background: C.surface, borderRadius: 28, padding: "26px 30px", boxShadow: "0 18px 40px -26px rgba(31,45,37,.4)" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 21, letterSpacing: "0.06em", textTransform: "uppercase", color: C.leaf }}>By nutrient · poorest 10%</div>
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {NUTRIENTS.map(([n, a, b]) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: BODY, fontSize: 28, color: C.ink }}>
              <span style={{ fontWeight: 700 }}>{n}</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600 }}>
                <span style={{ color: "#8A988E" }}>{a}%</span> <span style={{ color: C.ink2 }}>→</span> <span style={{ color: C.leaf }}>{b}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...banner, position: "absolute", left: 1400, top: 720, width: 420, background: C.leaf, color: "#fff", borderRadius: 28, padding: "24px 30px" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 44, lineHeight: 1.1 }}>Same money.<br />Better food.</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, marginTop: 8, opacity: 0.92 }}>SAPAT wins in 51 of 51 region–budget cases</div>
      </div>
    </AbsoluteFill>
  );
};
