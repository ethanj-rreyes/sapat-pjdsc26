import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PotLogo, Wordmark, useIn } from "../components/ui";
import { C, CLAMP, DISPLAY, EASE } from "../theme";
import { useCues } from "../timeline";

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const q = useCues("s8_close");
  const l1 = useIn(q.at(0) - 2, 18, 30);
  const l2 = useIn(Math.round((q.at(0) + q.end(0)) / 2) - 4, 18, 30);
  const out = interpolate(f, [q.at(1) - 10, q.at(1) + 4], [1, 0], CLAMP);
  const logo = interpolate(f, [q.at(1) - 4, q.at(1) + 18], [0.5, 1], { ...CLAMP, easing: EASE });
  const logoOp = interpolate(f, [q.at(1) - 4, q.at(1) + 8], [0, 1], CLAMP);
  const tag = useIn(q.at(1) + 16, 18, 20);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 40%, #FFEFCC, #FBF6EC 70%)" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out, gap: 20 }}>
        <div style={{ ...l1, fontFamily: DISPLAY, fontWeight: 500, fontSize: 84, color: C.ink2, textAlign: "center" }}>SAPAT doesn't ask families to spend more.</div>
        <div style={{ ...l2, fontFamily: DISPLAY, fontWeight: 600, fontSize: 104, color: C.leaf, textAlign: "center" }}>It helps every peso do more.</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40, scale: `${logo}`, opacity: logoOp }}>
          <PotLogo size={180} />
          <Wordmark size={200} />
        </div>
        <div style={{ ...tag, fontFamily: DISPLAY, fontWeight: 600, fontSize: 72, color: C.sunDeep, marginTop: 36 }}>Sustansya na abot-kaya</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
