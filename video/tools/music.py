# Original lo-fi background track for the SAPAT video (synthesized, no samples, no copyright).
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt
SR = 44100
TOTAL = json.load(open("out/timeline.json"))["total"] + 0.5
N = int(TOTAL * SR); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
BPM = 86; beat = 60 / BPM; bar = 4 * beat
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(sig, t0, pan=0.5, gain=1.0):
    i = int(t0 * SR)
    if i >= N: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(1 - pan); R[i:i + len(s)] += s * np.sqrt(pan)
def ep(m, dur, vel=1.0):  # soft electric-piano tone
    t = np.arange(int(dur * SR)) / SR; f = hz(m)
    env = np.exp(-t * 1.6) * (1 - np.exp(-t * 300))
    s = (np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*2*f*t)*np.exp(-t*3) + 0.12*np.sin(2*np.pi*3*f*t)*np.exp(-t*6)
         + 0.5*np.sin(2*np.pi*f*1.003*t))
    s *= 1 + 0.08*np.sin(2*np.pi*4.5*t)
    return s * env * vel * 0.09
def pad(ms, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.2)
    s = sum(np.sin(2*np.pi*hz(m)*t + rng.random()*6) + 0.6*np.sin(2*np.pi*hz(m)*1.004*t) for m in ms)
    return s * env * 0.018
def bass(m, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * 2.2) * (1 - np.exp(-t * 200))
    return (np.sin(2*np.pi*hz(m)*t) + 0.2*np.sin(2*np.pi*2*hz(m)*t)) * env * 0.22
def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 45 + 80 * np.exp(-t * 30)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t * 9) * 0.5
hp = butter(2, 6000, "hp", fs=SR, output="sos"); bp = butter(2, [900, 3500], "bp", fs=SR, output="sos")
def hat(v=1):
    t = np.arange(int(0.06 * SR)) / SR
    return sosfilt(hp, rng.standard_normal(len(t))) * np.exp(-t * 70) * 0.05 * v
def snare():
    t = np.arange(int(0.25 * SR)) / SR
    return sosfilt(bp, rng.standard_normal(len(t))) * np.exp(-t * 18) * 0.12
# Cmaj9 - Am9 - Fmaj9 - G6/9  (voicings around middle C)
prog = [((36,), [60, 64, 67, 71, 74]), ((33,), [60, 64, 67, 69, 71]), ((41,), [57, 60, 64, 65, 69]), ((43,), [59, 62, 64, 67, 69])]
nbars = int(TOTAL / bar) + 1
segs = {s["id"]: s for s in json.load(open("out/timeline.json"))["segments"]}
drums_in = segs["s2_problem"]["start"] - 0.2
break_at, break_end = segs["s7_results"]["start"], segs["s7_results"]["start"] + 4 * beat
end_at = segs["s8_close"]["end"] - 1.0
mel = [76, 74, 72, 74, 76, 79, 76, 74]
for b in range(nbars):
    t0 = b * bar
    if t0 > end_at: break
    (root,), ch = prog[b % 4]
    add(pad(ch, bar + 1.2), t0, 0.5, 1.0)
    for i, m in enumerate(ch):
        add(ep(m, bar, 0.9), t0 + i * 0.012, 0.3 + 0.1 * i)
        add(ep(m, bar * 0.6, 0.45), t0 + 2.5 * beat + i * 0.01, 0.6 - 0.05 * i)
    if t0 >= drums_in - bar:
        add(bass(root, beat * 1.8), t0); add(bass(root + 7 if b % 2 else root, beat * 1.2), t0 + 2.5 * beat)
    if t0 >= drums_in and not (break_at <= t0 < break_end):
        for k in range(4):
            if k in (0, 2): add(kick(), t0 + k * beat + (0.18 * beat if k == 2 and b % 2 else 0))
            if k in (1, 3): add(snare(), t0 + k * beat, 0.55)
        for k in range(8):
            sw = 0.09 * beat if k % 2 else 0
            add(hat(0.6 + 0.4 * (k % 2 == 0)), t0 + k * beat / 2 + sw, 0.65)
    # light melody every other phrase after the intro section
    if b % 8 in (4, 5) and t0 > drums_in:
        for i, m in enumerate(mel[(b % 2) * 4:(b % 2) * 4 + 4]):
            add(ep(m, beat * 1.5, 0.55), t0 + i * beat, 0.7)
# final ringing chord
add(pad([48, 55, 60, 64, 67, 71, 74], 6), end_at, 0.5, 1.6)
for i, m in enumerate([48, 60, 64, 67, 71, 74, 79]): add(ep(m, 5, 1.0), end_at + i * 0.04, 0.4 + 0.03 * i)
# vinyl crackle + warmth
crack = (rng.random(N) > 0.9996) * rng.standard_normal(N) * 0.05
L += crack; R += crack
lp = butter(2, 7000, "lp", fs=SR, output="sos"); L = sosfilt(lp, L); R = sosfilt(lp, R)
fade = np.ones(N); fi = int(2 * SR); fade[:fi] = np.linspace(0, 1, fi); fo = int(3 * SR); fade[-fo:] = np.linspace(1, 0, fo)
mix = np.stack([L * fade, R * fade], 1)
mix = np.tanh(mix * 1.4) / np.tanh(1.4); mix *= 0.85 / np.abs(mix).max()
sf.write("out/music.wav", mix.astype(np.float32), SR)
print("music", TOTAL, "s, peak ok")
