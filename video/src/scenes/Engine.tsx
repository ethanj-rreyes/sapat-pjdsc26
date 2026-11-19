import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, ChapterTag, useIn } from "../components/ui";
import { BODY, C, CLAMP, DISPLAY, EASE } from "../theme";
import { useCues } from "../timeline";

const CARD_X = 110, CARD_W = 560, CARD_H = 142, CARD_TOP = 190, GAP = 24;
const NODE_X = 1000, NODE_Y = 420, NODE_R = 150;
const OUT_X = 1380, OUT_W = 430;

const DATA = [
  { q: "What food costs", src: "PSA retail prices", note: "Monthly, by region & province · 2018 to Sep 2026", col: C.sunDeep },
  { q: "What food contains", src: "DOST-FNRI Food Composition Tables", note: "Nutrients per gram, as bought", col: C.leaf },
  { q: "What each person needs", src: "Philippine Dietary Reference Intakes 2015", note: "By age, sex, pregnancy, breastfeeding", col: "#3E7CB1" },
  { q: "What families spend", src: "PSA FIES 2021 & 2023", note: "Real food budgets, and the usual way they're spent", col: C.bad },
];

const RULES = ["Cereals ≤ 65% of energy", "≥ 35% of protein from animal foods or legumes", "~100 g vegetables per 1,000 kcal", "Sugar under 5%"];
const DISHES = ["Ginisang monggo", "Tinola", "Sinigang", "Paksiw", "Ginataang kangkong"];

const Card: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const st = useIn(at, 18, 0);
  const f = useCurrentFrame();
  const d = DATA[i];
  return (
    <div
      style={{
        ...st, translate: `${interpolate(f, [at, at + 18], [-40, 0], { ...CLAMP, easing: EASE })}px 0px`,
        position: "absolute", left: CARD_X, top: CARD_TOP + i * (CARD_H + GAP), width: CARD_W, height: CARD_H,
        background: C.surface, borderRadius: 26, boxShadow: "0 14px 34px -22px rgba(31,45,37,.35)", padding: "20px 28px",
        borderLeft: `10px solid ${d.col}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
      }}
    >
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, letterSpacing: "0.06em", textTransform: "uppercase", color: d.col }}>{d.q}</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 34, color: C.ink, lineHeight: 1.15 }}>{d.src}</div>
      <div style={{ fontFamily: BODY, fontSize: 23, color: C.ink2 }}>{d.note}</div>
    </div>
  );
};

export const Engine: React.FC = () => {
  const f = useCurrentFrame();
  const q = useCues("s4_engine");
  const node = interpolate(f, [q.at(4) - 6, q.at(4) + 16], [0, 1], { ...CLAMP, easing: EASE });
  const lp = useIn(q.at(4), 18, 0);
  const out = useIn(Math.round((q.at(4) + q.end(4)) / 2), 20, 0);
  const protect = useIn(q.at(5), 18, 20);
  const browser = useIn(q.at(6), 18, 20);
  const spin = f * 0.6;
  return (
    <AbsoluteFill>
      <Background />
      <ChapterTag n="03" label="How it works" />
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} i={i} at={q.at(i)} />
      ))}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3].map((i) => {
          const y = CARD_TOP + i * (CARD_H + GAP) + CARD_H / 2;
          const p = interpolate(f, [q.at(i) + 10, q.at(i) + 34], [0, 1], { ...CLAMP, easing: EASE });
          return (
            <path
              key={i}
              d={`M ${CARD_X + CARD_W} ${y} C ${CARD_X + CARD_W + 140} ${y}, ${NODE_X - NODE_R - 140} ${NODE_Y}, ${NODE_X - NODE_R} ${NODE_Y}`}
              stroke={DATA[i].col} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1}
              strokeDasharray="1" strokeDashoffset={1 - p} opacity={0.75}
            />
          );
        })}
        <path
          d={`M ${NODE_X + NODE_R} ${NODE_Y} L ${OUT_X - 10} ${NODE_Y}`}
          stroke={C.leaf} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1"
          strokeDashoffset={1 - interpolate(f, [q.at(4) + 20, q.at(4) + 44], [0, 1], CLAMP)}
        />
      </svg>
      <div
        style={{
          position: "absolute", left: NODE_X - NODE_R, top: NODE_Y - NODE_R, width: NODE_R * 2, height: NODE_R * 2, borderRadius: "50%",
          background: C.leaf, scale: `${node}`, display: "grid", placeItems: "center", textAlign: "center", boxShadow: "0 30px 60px -24px rgba(44,122,82,.7)",
        }}
      >
        <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: `3px dashed ${C.leafSoft}`, rotate: `${spin}deg` }} />
        <div style={{ ...lp, color: "#fff" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 44, lineHeight: 1.05 }}>Linear<br />program</div>
          <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 21, marginTop: 10, opacity: 0.9 }}>most nutrition<br />within budget</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: NODE_X - 330, top: NODE_Y + NODE_R + 40, width: 660, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {RULES.map((r, i) => {
          const at = q.at(4) + 24 + i * 8;
          return (
            <div key={r} style={{ opacity: interpolate(f, [at, at + 12], [0, 1], CLAMP), translate: `0px ${interpolate(f, [at, at + 12], [14, 0], CLAMP)}px`, background: C.surface, border: `2px solid ${C.line}`, borderRadius: 999, padding: "8px 20px", fontFamily: BODY, fontWeight: 700, fontSize: 23, color: C.ink }}>
              {r}
            </div>
          );
        })}
        <div style={{ ...protect, background: C.sunSoft, border: `3px solid ${C.sun}`, borderRadius: 999, padding: "10px 26px", fontFamily: BODY, fontWeight: 800, fontSize: 27, color: C.ink, marginTop: 6 }}>
          Money short? Children under 5 and mothers are covered first
        </div>
      </div>
      <div style={{ ...out, position: "absolute", left: OUT_X, top: 230, width: OUT_W, background: C.surface, borderRadius: 30, padding: "28px 32px", boxShadow: "0 20px 44px -26px rgba(31,45,37,.4)" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 21, letterSpacing: "0.06em", textTransform: "uppercase", color: C.leaf }}>Output</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 38, color: C.ink, lineHeight: 1.15, marginTop: 4 }}>A week of meals for each person</div>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {DISHES.map((d, i) => (
            <div key={d} style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: BODY, fontSize: 26, color: C.ink }}>
              <span style={{ width: 66, fontWeight: 800, color: C.ink2, fontSize: 20 }}>{["MON", "TUE", "WED", "THU", "FRI"][i]}</span>
              {d}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontFamily: BODY, fontWeight: 700, fontSize: 22, color: C.ink2 }}>+ a market list in selling units</div>
      </div>
      <div style={{ ...browser, position: "absolute", left: OUT_X, top: 720, width: OUT_W, background: C.ink, color: "#fff", borderRadius: 24, padding: "20px 28px", fontFamily: BODY, fontWeight: 700, fontSize: 26, lineHeight: 1.35 }}>
        <span style={{ color: C.sun, fontFamily: DISPLAY, fontWeight: 600, fontSize: 34 }}>Runs in the browser</span>
        <br />
        Milliseconds · no server · no account · data stays on the phone
      </div>
    </AbsoluteFill>
  );
};
