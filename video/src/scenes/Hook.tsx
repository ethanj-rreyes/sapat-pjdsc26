import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PotLogo, useIn } from "../components/ui";
import { BODY, C, CLAMP, DISPLAY, EASE } from "../theme";
import { useCues } from "../timeline";

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const q = useCues("s1_hook");
  const swap = q.at(2) - 6;
  const firstOut = interpolate(f, [swap, swap + 14], [1, 0], CLAMP);
  const firstUp = interpolate(f, [swap, swap + 18], [0, -60], { ...CLAMP, easing: EASE });
  const potScale = interpolate(f, [0, 30], [0.7, 1], { ...CLAMP, easing: EASE });
  const q1 = useIn(q.at(0) - 4, 20, 40);
  const q2 = useIn(q.at(1), 18, 24);
  const b1 = useIn(q.at(2) + 30, 20, 40);
  const b2 = useIn(q.at(3), 18, 24);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 35%, #FFEFCC, #FBF6EC 70%)" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
        <div style={{ scale: `${potScale}`, opacity: interpolate(f, [0, 20], [0, 1], CLAMP), marginBottom: 56 }}>
          <PotLogo size={200} />
        </div>
        <div style={{ position: "relative", width: 1700, height: 300, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "absolute", textAlign: "center", opacity: firstOut, translate: `0px ${firstUp}px` }}>
            <div style={{ ...q1, fontFamily: DISPLAY, fontWeight: 600, fontSize: 150, color: C.leafDeep, lineHeight: 1.05 }}>
              Kumain ka na ba?
            </div>
            <div style={{ ...q2, fontFamily: BODY, fontWeight: 700, fontSize: 56, color: C.ink2, marginTop: 24 }}>
              "Have you eaten?" It's how Filipinos say <i>I care</i>.
            </div>
          </div>
          <div style={{ position: "absolute", textAlign: "center" }}>
            <div style={{ ...b1, fontFamily: DISPLAY, fontWeight: 600, fontSize: 132, color: C.ink, lineHeight: 1.05 }}>
              Busog, pero <span style={{ color: C.sunDeep }}>hindi sapat.</span>
            </div>
            <div style={{ ...b2, fontFamily: BODY, fontWeight: 700, fontSize: 56, color: C.ink2, marginTop: 24 }}>
              Full, but not nourished.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
