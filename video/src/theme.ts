import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import { continueRender, delayRender, Easing } from "remotion";

// Palette taken from the SAPAT family app (web/family-app/styles.css)
export const C = {
  bg: "#F3F7F2",
  surface: "#FFFFFF",
  soft: "#EAF2E8",
  ink: "#1F2D25",
  ink2: "#56685C",
  line: "#DCE6D9",
  leaf: "#2C7A52",
  leafDeep: "#1E8A4C",
  leafSoft: "#DFF0E4",
  sun: "#F2B33D",
  sunDeep: "#D9822B",
  sunSoft: "#FFF2D6",
  peach: "#FCE8DC",
  bad: "#AE3B2A",
  badSoft: "#FADFD8",
  cream: "#FBF6EC",
};

export const DISPLAY = '"Fredoka", "Nunito", system-ui, sans-serif';
export const BODY = '"Nunito", system-ui, sans-serif';

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Block rendering until the local fonts are ready, so no frame renders in a fallback font.
const handle = typeof document !== "undefined" ? delayRender("Loading fonts") : null;
if (typeof document !== "undefined") {
  Promise.all([
    document.fonts.load('600 80px "Fredoka"'),
    document.fonts.load('500 80px "Fredoka"'),
    document.fonts.load('400 40px "Nunito"'),
    document.fonts.load('600 40px "Nunito"'),
    document.fonts.load('700 40px "Nunito"'),
    document.fonts.load('800 40px "Nunito"'),
  ])
    .catch(() => undefined)
    .then(() => handle !== null && continueRender(handle));
}
