import React from "react";
import { AbsoluteFill } from "remotion";
import { Browser } from "../components/Browser";
import { Background, ChapterTag, useIn } from "../components/ui";
import { BODY, C, DISPLAY } from "../theme";
import { useCues } from "../timeline";

const BX = 96, BY = 150, SIDE_X = 1500, SIDE_W = 330;

const Side: React.FC<{ at: number; big?: string; title: string; body: string; accent?: string }> = ({ at, big, title, body, accent = C.leaf }) => {
  const st = useIn(at, 18, 24);
  return (
    <div style={{ ...st, background: C.surface, borderRadius: 26, padding: "24px 26px", boxShadow: "0 18px 40px -26px rgba(31,45,37,.4)", borderTop: `8px solid ${accent}` }}>
      {big ? <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 76, color: accent, lineHeight: 1 }}>{big}</div> : null}
      <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 36, color: C.ink, lineHeight: 1.15, marginTop: big ? 8 : 0 }}>{title}</div>
      <div style={{ fontFamily: BODY, fontSize: 24, color: C.ink2, marginTop: 8, lineHeight: 1.35 }}>{body}</div>
    </div>
  );
};

export const LguMap: React.FC = () => {
  const q = useCues("s6a_map");
  const shock = q.at(1) - 6;
  return (
    <AbsoluteFill>
      <Background />
      <ChapterTag n="05" label="LGU dashboard · web" />
      <Browser
        left={BX} top={BY}
        shots={[{ src: "lgu-map.png", from: 0 }, { src: "lgu-rice2023.png", from: shock }]}
        zooms={[{ at: shock + 30, dur: 30, scale: 1.35, x: 0.62, y: 0.55 }]}
      />
      <div style={{ position: "absolute", left: SIDE_X, top: BY, width: SIDE_W, display: "flex", flexDirection: "column", gap: 26 }}>
        <Side at={q.at(0) + 10} title="Every province, every month" body="Cost of a healthy day, 9 map metrics, 24-month trends" />
        <Side at={Math.round((q.at(0) + q.end(0)) / 2)} title="Watch & Alert levels" body="Watch: +5% vs past 3 months. Alert: +10%, or +15% vs last year" accent={C.sun} />
        <Side at={q.at(1) + 20} big="8 of 17" title="regions flagged" body="Back-test on the Aug–Sep 2023 rice price spike" accent={C.bad} />
      </div>
    </AbsoluteFill>
  );
};

export const LguFeeding: React.FC = () => {
  const q = useCues("s6b_feeding");
  return (
    <AbsoluteFill>
      <Background />
      <ChapterTag n="05" label="LGU dashboard · web" />
      <Browser left={BX} top={BY} shots={[{ src: "lgu-menu.png", from: 0 }]} zooms={[{ at: q.at(1) - 4, dur: 30, scale: 1.45, x: 0.62, y: 0.16 }]} />
      <div style={{ position: "absolute", left: SIDE_X, top: BY, width: SIDE_W, display: "flex", flexDirection: "column", gap: 26 }}>
        <Side at={q.at(0) + 6} title="Feeding-program menus" body="5-day rotating menu of Filipino dishes, plus the supplier order for the whole class" />
        <Side at={q.at(1) + 10} big="₱30" title="covers ~9 in 10 of each child's meal targets" body="Eastern Visayas prices, Sep 2026" accent={C.sun} />
      </div>
    </AbsoluteFill>
  );
};
