/* SAPAT family app · Illustrations (palayok, bayong) and the small celebration burst. Decorative only; respects reduced motion.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- illustrations + small celebrations
const POT = `<svg class="pot" viewBox="0 0 160 124" aria-hidden="true">
  <g class="steam" fill="none" stroke-width="5" stroke-linecap="round"><path class="s1" d="M58 40c-9-8 9-14 0-26"/><path class="s2" d="M80 36c-9-8 9-14 0-28"/><path class="s3" d="M102 40c-9-8 9-14 0-26"/></g>
  <ellipse cx="80" cy="116" rx="58" ry="6" fill="#000" opacity=".08"/>
  <path d="M26 60h108v20c0 20-16 32-34 32H60c-18 0-34-12-34-32z" fill="#C9653F"/>
  <path d="M27 70h106" stroke="#A44E2E" stroke-width="3"/><path d="M42 88c6 6 16 9 26 9" stroke="#E9A07E" stroke-width="4" stroke-linecap="round" fill="none" opacity=".75"/>
  <rect x="12" y="62" width="18" height="10" rx="5" fill="#A44E2E"/><rect x="130" y="62" width="18" height="10" rx="5" fill="#A44E2E"/>
  <g class="lid"><path d="M22 60c0-12 26-19 58-19s58 7 58 19z" fill="#8C3F24"/><rect x="71" y="32" width="18" height="10" rx="5" fill="#6E301B"/></g></svg>`;
const PRODUCE = [
  '<path d="M40 66c-7-20 3-36 14-40 5 15-1 31-14 40z" fill="#3E9B5A"/><path d="M47 64c2-15 11-24 22-26-2 13-9 21-22 26z" fill="#2F8A4E"/>',
  '<ellipse cx="80" cy="44" rx="9" ry="21" transform="rotate(-18 80 44)" fill="#6B3FA0"/><path d="M85 23l7-7" stroke="#3E7B3A" stroke-width="5" stroke-linecap="round"/>',
  '<path d="M96 64c2-17 12-27 22-29l7-9 2 13-9 4c-2 10-10 19-22 21z" fill="#4A90B8"/><circle cx="114" cy="40" r="2" fill="#13324A"/>',
  '<ellipse cx="62" cy="54" rx="8" ry="10" fill="#FFF8EC" stroke="#E5D7B8" stroke-width="1.5"/>',
  '<path d="M104 64c0-12 9-19 19-19s17 8 15 19z" fill="#E8902F"/><path d="M121 45v-6" stroke="#3E7B3A" stroke-width="4" stroke-linecap="round"/>'];
const bayong = (p) => { const k = Math.round(Math.min(Math.max(p, 0), 1) * PRODUCE.length); return `<svg class="bayong" viewBox="0 0 160 124" aria-hidden="true">
  <ellipse cx="80" cy="119" rx="54" ry="5" fill="#000" opacity=".08"/>
  <path d="M50 60c0-38 60-38 60 0" stroke="#8E5D27" stroke-width="6" fill="none" stroke-linecap="round"/>
  ${PRODUCE.map((x, i) => (i < k ? `<g class="${i === k - 1 ? "pop" : ""}">${x}</g>` : "")).join("")}
  <path d="M30 60h100l-10 56H40z" fill="#D9A35B"/>
  <path d="M33 74h94M35 88h90M38 102h84" stroke="#B9813D" stroke-width="3"/><path d="M33 81h94" stroke="#2C7A52" stroke-width="5"/><path d="M33 95h94" stroke="#C8553D" stroke-width="4"/>
  <rect x="26" y="55" width="108" height="10" rx="5" fill="#B9813D"/></svg>`; };
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLYPH = ['<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill="#E8735A"/>',
  '<path d="M5 19c0-9 5-14 14-14 0 8-5 14-14 14z" fill="#3E9B5A"/>', '<ellipse cx="12" cy="12" rx="3.2" ry="6" fill="#F3E7C7" transform="rotate(30 12 12)"/>',
  '<circle cx="12" cy="12" r="5" fill="#F2B33D"/>'];
function burst(rect) {
  if (reduced() || !rect) return;
  const scr = $("screen") || document.body, sr = scr.getBoundingClientRect(), w = document.createElement("div");
  w.className = "burst"; w.style.left = (rect.left - sr.left + rect.width / 2) + "px"; w.style.top = (rect.top - sr.top + rect.height / 2) + "px";
  w.innerHTML = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4, r = 60 + Math.random() * 70;
    return `<span style="--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r - 40).toFixed(0)}px;--rot:${(Math.random() * 300 - 150).toFixed(0)}deg;--d:${(Math.random() * 90).toFixed(0)}ms"><svg viewBox="0 0 24 24">${GLYPH[i % GLYPH.length]}</svg></span>`; }).join("");
  scr.appendChild(w); setTimeout(() => w.remove(), 1400);
}
