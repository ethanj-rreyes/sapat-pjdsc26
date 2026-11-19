# SAPAT demo video (PJDSC 2026)

The 2:52 demonstration video for SAPAT, built with [Remotion](https://www.remotion.dev) (React → MP4).
Every app screen in it is a real capture of `web/family-app` and `web/lgu-dashboard`; every number comes from
the repository (README, `docs/problem_solution.html`, `outputs/h1_results.csv`).

## Preview and edit

```bash
cd video
npm install
npx remotion studio        # opens the editor at http://localhost:3000
```

- `SapatDemo` is the full video. Each scene is also listed on its own under **SapatDemo-Scenes**.
- To export: `npm run render` → `out/SAPAT_demo.mp4`.

## Structure

| Path | What |
|---|---|
| `src/SapatDemo.tsx` | The full video: scene order, captions, narration clips, music ducking |
| `src/scenes/` | One file per part: Hook, Problem, Intro, Engine, FamilyApp (4 scenes), Lgu (2), Results, Close |
| `src/components/` | Phone frame (scrolls the real screens), browser frame, captions, shared UI |
| `src/theme.ts` | Colors and fonts, taken from `web/family-app/styles.css` (Fredoka + Nunito) |
| `src/timeline.json` | Exact start time and text of every narrated sentence (written by `tools/narrate.py`) |
| `public/screens/` | App screenshots (captured by `tools/shots.js`) |
| `public/narration/` | One voice clip per sentence |
| `public/music.mp3` | Original background track (synthesized by `tools/music.py`; no samples, no copyright issues) |

## Changing the narration

The voice is Microsoft's Filipino neural voice **Blessica** (`fil-PH-BlessicaNeural`), generated with
`edge-tts`. The script lives in `tools/narrate.py` (the `SCRIPT` dict; ignore the `{word|IPA}` parts, only the
words before `|` are used). After editing it, run from `tools/`'s parent folder of the TTS work:

```bash
pip install edge-tts
python tools/narrate_fil_build.py "+3%"     # writes fil/*.wav and fil/timeline.json
```

Copy the clips to `public/narration/` and `fil/timeline.json` to `src/timeline.json`; scenes and captions follow
the new timing automatically. Run `tools/music.py` afterwards so the music matches the new length.

To use your own recorded voice instead: record one file per sentence with the names in `timeline.json`,
put them in `public/narration/`, and update each `dur` (and `start`) in `timeline.json`.

Keep the total under 3:00 (PJDSC rule): the current length is shown as `total` in `timeline.json`.
