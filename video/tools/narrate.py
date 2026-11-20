# SAPAT demo narration: one clip per sentence, so visuals and captions can cue exactly.
# Syntax: {Display words|IPA} = Filipino words with hand-written pronunciation.
import re, json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
VOICE, SPEED = "af_heart", 1.15
SAPAT = "{SAPAT|sɑːpˈɑːt}"
SCRIPT = {
"s1_hook": [
  "{Kumain ka na ba?|kuːmɑːˈiːn kɑː nɑː bˈɑː?}",
  "Have you eaten? It's how Filipinos say, I care.",
  "But for millions of families, the honest answer is: {busog, pero hindi sapat.|buːsˈoʊɡ, pˈɛɹoʊ hɪndˈiː sɑːpˈɑːt.}",
  "Full, but not nourished."],
"s2_problem": [
  "One in four Filipino children under five is stunted, and four in ten among the poorest.",
  "The poorest tenth of families spend forty-four percent of their food budget on rice and cereals,",
  "because no one can see what a healthy diet costs for their own family, at this month's prices.",
  "A nutritious diet now costs about one hundred sixty-seven pesos per person a day.",
  "The official food threshold is sixty-three."],
"s3_intro": [
  f"So we built {SAPAT}: {{sustansya na abot-kaya.|sʊstˈɑːnʃɑː nɑː ɐbˈoʊt kɑːjˈɑː.}} Nutrition within reach.",
  f"{SAPAT} plans the healthiest week a family's budget can buy, for each person, at local market prices."],
"s4_engine": [
  "It links four public datasets: PSA market prices, every month.",
  "FNRI food composition tables.",
  "The Philippine Dietary Reference Intakes, for each person's needs.",
  "And the Family Income and Expenditure Survey, for real spending.",
  "A linear program picks the most nutritious mix the budget can buy, following healthy food rules,",
  "and protects children under five and mothers first.",
  "It runs right in the browser, in milliseconds."],
"s5a_week": [
  "Here's the family app, with an example family of five in Leyte, on twelve hundred ninety pesos a week.",
  "The Week tab plans every meal as real Filipino {ulam|ˈuːlɑːm}, like {ginisang monggo.|ɡɪnɪsˈɑːŋ mˈɔŋɡoʊ.}",
  "And it's honest: this budget reaches sixty-three percent of needs, against forty-six percent spent the usual way."],
"s5b_market": [
  "The Market tab turns the plan into one list, in the units stalls actually sell: kilos, pieces, bundles, with price ranges from PSA data.",
  "Tap the calculator on any price to see exactly how it was computed."],
"s5c_today": [
  "Today answers the daily question, {Ano'ng ulam natin?|ɐnˈoʊŋ ˈuːlɑːm nɑːtˈɪn?}",
  "Log meals in one tap, even when you eat out.",
  f"And each week, {SAPAT} suggests one cheaper swap, like {{monggo|mˈɔŋɡoʊ}} instead of pork."],
"s5d_family": [
  "And Family shows how each member is doing, from energy and growth to blood, eyes, and bones, with the cheapest food to close each gap."],
"s6a_map": [
  "For local governments, the dashboard maps the cost of a healthy day in every province, every month, with Watch and Alert levels.",
  "Replaying the 2023 rice spike, it flagged eight of seventeen regions."],
"s6b_feeding": [
  "Its feeding program planner builds a five-day Filipino menu.",
  "At thirty pesos a meal, it covers about nine in ten of each child's needs."],
"s7_results": [
  "Does it work?",
  "Across every region, at the poorest ten percent's food budget, the usual way of spending meets forty-one percent of a family's needs.",
  f"Planned with {SAPAT}: sixty-two percent.",
  "For a three-year-old: forty-five to seventy-six.",
  "Same money, better food, in all fifty-one cases."],
"s8_close": [
  f"{SAPAT} doesn't ask families to spend more. It helps every peso do more.",
  f"{SAPAT}. {{Sustansya na abot-kaya.|sʊstˈɑːnʃɑː nɑː ɐbˈoʊt kɑːjˈɑː.}}"],
}
SPELL = {"PSA": "P S A", "FNRI": "F N R I", "PJDSC": "P J D S C"}
def tts_ph(text):
    out = []
    for part in re.split(r"(\{[^}]*\})", text):
        if part.startswith("{"): out.append(part[1:-1].split("|")[1])
        elif part.strip():
            p = part
            for a, b in SPELL.items(): p = re.sub(r"\b%s\b" % a, b, p)
            out.append(k.tokenizer.phonemize(p.strip(), "en-us"))
    return " ".join(x.strip() for x in out if x.strip())
def display(text): return re.sub(r"\{([^|}]*)\|[^}]*\}", r"\1", text)
LEAD, SENT_GAP, SEG_GAP, TAIL = 1.2, 0.28, 0.55, 3.0
t = LEAD; segs = []
for sid, sents in SCRIPT.items():
    seg = {"id": sid, "start": round(t, 3), "lines": []}
    for i, s in enumerate(sents):
        audio, sr = k.create(tts_ph(s), voice=VOICE, speed=SPEED, is_phonemes=True)
        fn = f"{sid}_{i}.wav"; sf.write("out/" + fn, audio, sr)
        d = round(len(audio) / sr, 3)
        seg["lines"].append({"file": fn, "start": round(t, 3), "dur": d, "text": display(s)})
        t += d + SENT_GAP
    t += SEG_GAP - SENT_GAP
    seg["end"] = round(t - SEG_GAP, 3); segs.append(seg)
total = round(t - SEG_GAP + TAIL, 3)
json.dump({"total": total, "segments": segs}, open("out/timeline.json", "w"), indent=1, ensure_ascii=False)
for s in segs: print(s["id"], s["start"], s["end"])
print("TOTAL", total)
