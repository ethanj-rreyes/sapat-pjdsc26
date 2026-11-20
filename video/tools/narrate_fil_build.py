# Filipino narration (fil-PH-BlessicaNeural), one clip per sentence, plus timeline.json.
import re, json, os, asyncio, subprocess, sys
import edge_tts
RATE = sys.argv[1] if len(sys.argv) > 1 else "+0%"
src = open("narrate.py").read()
ns = {}
exec(src.split("SPELL =")[0].replace("from kokoro_onnx import Kokoro", "").replace('k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")', ""), ns)
SCRIPT = ns["SCRIPT"]
def display(t): return re.sub(r"\{([^|}]*)\|[^}]*\}", r"\1", t)
def spoken(t): return display(t).replace("SAPAT", "Sapat")
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())
async def gen(text, path):
    for a in range(4):
        try:
            await edge_tts.Communicate(text, "fil-PH-BlessicaNeural", rate=RATE, proxy=os.environ.get("HTTPS_PROXY")).save(path); return
        except Exception as e:
            print("retry", path, e); await asyncio.sleep(2)
    raise SystemExit("failed " + path)
async def main():
    LEAD, SENT_GAP, SEG_GAP, TAIL = 1.2, 0.28, 0.55, 3.2
    t = LEAD; segs = []
    for sid, sents in SCRIPT.items():
        seg = {"id": sid, "start": round(t, 3), "lines": []}
        for i, s in enumerate(sents):
            mp3 = f"fil/{sid}_{i}.mp3"; wav = f"fil/{sid}_{i}.wav"
            await gen(spoken(s), mp3)
            # trim leading/trailing silence so timing is tight
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af",
                "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.05",
                "-ar", "24000", "-ac", "1", wav], check=True)
            d = round(dur(wav), 3)
            seg["lines"].append({"file": f"{sid}_{i}.wav", "start": round(t, 3), "dur": d, "text": display(s)})
            t += d + SENT_GAP
        t += SEG_GAP - SENT_GAP
        seg["end"] = round(t - SEG_GAP, 3); segs.append(seg)
        print(sid, seg["start"], seg["end"])
    total = round(t - SEG_GAP + TAIL, 3)
    json.dump({"total": total, "segments": segs}, open("fil/timeline.json", "w"), indent=1, ensure_ascii=False)
    print("TOTAL", total, "rate", RATE)
asyncio.run(main())
