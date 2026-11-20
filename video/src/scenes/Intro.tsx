import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, ChapterTag, PotLogo, Wordmark, useIn } from "../components/ui";
import { BODY, C, CLAMP, DISPLAY, EASE } from "../theme";
import { useCues } from "../timeline";

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const q = useCues("s3_intro");
  const up = interpolate(f, [q.at(1) - 4, q.at(1) + 20], [0, -90], { ...CLAMP, easing: EASE });
  const logo = interpolate(f, [4, 26], [0.4, 1], { ...CLAMP, easing: EASE });
  const tag = useIn(Math.round(q.at(0) + 30), 18, 20);
  const sub = useIn(Math.round(q.end(0) - 40), 18, 20);
  const promise = useIn(q.at(1) + 6, 22, 30);
  return (
    <AbsoluteFill>
      <Background />
      <ChapterTag n="02" label="Our solution" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", translate: `0px ${up}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40, scale: `${logo}`, opacity: interpolate(f, [4, 16], [0, 1], CLAMP) }}>
          <PotLogo size={190} />
          <Wordmark size={210} />
        </div>
        <div style={{ ...tag, fontFamily: DISPLAY, fontWeight: 600, fontSize: 76, color: C.sunDeep, marginTop: 40 }}>Sustansya na abot-kaya</div>
        <div style={{ ...sub, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.ink2, marginTop: 8 }}>Nutrition within reach</div>
      </AbsoluteFill>
      <div style={{ ...promise, position: "absolute", left: 160, right: 160, top: 760, textAlign: "center", fontFamily: DISPLAY, fontWeight: 500, fontSize: 58, color: C.ink, lineHeight: 1.25 }}>
        The <span style={{ color: C.leaf }}>healthiest week</span> a family's budget can buy,
        <br />
        for <span style={{ color: C.leaf }}>each person</span>, at <span style={{ color: C.leaf }}>local market prices</span>.
      </div>
    </AbsoluteFill>
  );
};
