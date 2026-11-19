import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Phone, Page, Overlay, Tap } from "../components/Phone";
import { Background, Callout, ChapterTag, useIn } from "../components/ui";
import meta from "../screens-meta.json";
import { BODY, C, CLAMP, DISPLAY } from "../theme";
import { useCues } from "../timeline";

const PX = 330, PY = 118;

const Layout: React.FC<{ tab: string; tl: string; pages: Page[]; overlays?: Overlay[]; taps?: Tap[]; children: React.ReactNode; first?: boolean }> = ({
  tab, tl, pages, overlays, taps, children, first,
}) => {
  const head = useIn(4, 18, 20);
  return (
    <AbsoluteFill>
      <Background />
      <ChapterTag n="04" label="Family app · mobile" />
      <Phone pages={pages} overlays={overlays} taps={taps} left={PX} top={PY} enter={first ? 0 : -100} />
      <div style={{ position: "absolute", left: 900, top: 190, width: 900, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={head}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 96, color: C.leaf, lineHeight: 1 }}>
            {tab} <span style={{ color: C.ink2, fontSize: 52, fontWeight: 500 }}>· {tl}</span>
          </div>
        </div>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const BigStat: React.FC<{ at: number; from: string; to: string; label: string }> = ({ at, from, to, label }) => {
  const st = useIn(at, 20, 24);
  return (
    <div style={{ ...st, background: C.surface, borderRadius: 30, padding: "26px 34px", boxShadow: "0 18px 40px -26px rgba(31,45,37,.4)" }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 92, lineHeight: 1 }}>
        <span style={{ color: "#8A988E" }}>{from}</span> <span style={{ color: C.ink2, fontSize: 70 }}>→</span>{" "}
        <span style={{ color: C.leaf }}>{to}</span>
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.ink2, marginTop: 8 }}>{label}</div>
    </div>
  );
};

// ---- Week (Linggo): the plan
export const FamilyWeek: React.FC = () => {
  const q = useCues("s5a_week");
  const scroll: [number, number][] = [
    [q.at(1) - 4, 0], [q.at(1) + 36, 400], [q.at(2) - 4, 400], [q.at(2) + 40, 1040],
  ];
  return (
    <Layout tab="Week" tl="Linggo" pages={[{ key: "week", from: 0, scroll }]} first>
      <Callout at={q.at(0) + 10} title="Example family of 5" body="Leyte · ₱1,290 a week · PSA prices, Sep 2026" />
      <Callout at={q.at(1)} title="Real Filipino ulam" body="Ginisang monggo, ginataang kangkong, tinola, sinigang; cooking styles rotate through the week" />
      <BigStat at={q.at(2) + 30} from="46%" to="63%" label="of the family's needs, same ₱1,290: usual shopping vs SAPAT plan" />
    </Layout>
  );
};

// ---- Market (Palengke): the shopping list
export const FamilyMarket: React.FC = () => {
  const q = useCues("s5b_market");
  const m = meta.shop;
  const S = 300;
  const scroll: [number, number][] = [[q.at(0) + 30, 0], [q.at(0) + 80, S]];
  const tapAt = q.at(1) + 14;
  return (
    <Layout tab="Market" tl="Palengke" pages={[{ key: "shop", from: 0, scroll }]} overlays={[{ src: "shop-calc.png", from: tapAt + 8 }]} taps={[{ at: tapAt, x: 314, y: m.mainTop + 506 - S }]}>
      <Callout at={q.at(0) + 10} title="One list, in selling units" body="Kilos, pieces, bundles: what market stalls actually sell" />
      <Callout at={q.at(0) + 120} title="Price ranges from PSA data" body="How the same food's price varies across the region's provinces this month" accent={C.sun} />
      <Callout at={q.at(1)} title={'"How was this computed?"'} body="Tap the calculator on any price: source, amount, math and rounding, step by step" />
    </Layout>
  );
};

// ---- Today (Ngayon): eat and log
export const FamilyToday: React.FC = () => {
  const q = useCues("s5c_today");
  const m = meta.today;
  const t1 = q.at(1) + 2, t2 = q.at(1) + 24;
  const scroll: [number, number][] = [[q.at(2) + 14, 0], [q.at(2) + 50, 760]];
  return (
    <Layout
      tab="Today" tl="Ngayon"
      pages={[{ key: "today", from: 0, scroll }]}
      overlays={[{ src: "today-other.png", from: t2 + 8, to: q.at(2) + 6 }]}
      taps={[{ at: t1, x: 112, y: m.mainTop + 498 }, { at: t2, x: 195, y: m.mainTop + 570 }]}
    >
      <Callout at={q.at(0) + 6} title={'"Ano\'ng ulam natin?"'} body="Tonight's dish, what it costs the family, and who it's good for" />
      <Callout at={q.at(1)} title="One-tap meal log" body="Even when the family eats out: karinderya, street food, baon, handaan or ayuda" accent={C.sun} />
      <Callout at={q.at(2) + 20} title="One cheaper swap a week" body="½ kilo pork → ½ kilo monggo: about ₱100 saved, with at least as much protein" />
    </Layout>
  );
};

// ---- Family (Pamilya): how each member is doing
export const FamilyCheck: React.FC = () => {
  const q = useCues("s5d_family");
  const f = useCurrentFrame();
  const m = meta.family;
  const tap = q.at(0) + 70;
  return (
    <Layout tab="Family" tl="Pamilya" pages={[{ key: "family", from: 0 }, { key: "person", from: tap + 8, scroll: [[tap + 60, 0], [tap + 100, 150]] }]} taps={[{ at: tap, x: 292, y: m.mainTop + 170 }]}>
      <Callout at={q.at(0) + 6} title="How each member is doing" body="Plain words, not scores out of 10" />
      <Callout at={tap + 10} title="Energy, growth, blood, eyes, bones" body="Each person's gaps, with the cheapest food to close them" accent={C.sun} />
      <div style={{ opacity: interpolate(f, [tap + 90, tap + 110], [0, 1], CLAMP), fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.leaf, background: C.leafSoft, borderRadius: 20, padding: "16px 24px", alignSelf: "flex-start" }}>
        "For blood: add 1 cup of cooked monggo · about ₱8"
      </div>
    </Layout>
  );
};
