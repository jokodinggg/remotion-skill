# Fondasi + Motion Graphics 2D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pipeline in Claude Code that turns an idea or a script into a 15–60 s vertical jokoding MP4. It runs in two phases: Fase Naskah (output: `naskah.md` with audio tags), then a manual ElevenLabs handoff, then Fase Produksi (local transcription → alignment → scene → QA → render).

**Architecture:** One Remotion 4.0.539 project at the repo root. Pure logic (alignment, timeline, caption, ducking, QA frames) lives in `src/fondasi/` and is tested with vitest. Node scripts in `scripts/` (run with `tsx`) handle files, ffmpeg, and whisper.cpp. Remotion components:
- `VideoShell` locks audio, caption, logo, and CTA in place.
- Claude writes only `videos/<slug>/Scenes.tsx`, using `src/library/` and `src/archetypes/`.

**Tech Stack:** Remotion 4.0.539 (`remotion`, `@remotion/cli`, `@remotion/media`, `@remotion/google-fonts`, `@remotion/transitions`, `@remotion/install-whisper-cpp`), React 19.2.3, TypeScript 5.9.3, zod 4.5.4, vitest 5.0.5, tsx 4.23.15, ffmpeg (Homebrew), whisper.cpp 1.7.4 + model `large-v3-turbo`.

**Spec:** `docs/superpowers/specs/2026-11-02-fondasi-motion-graphics-2d-design.md`. Read it together with this plan. Section numbers (§) refer to the spec.

## Global Constraints

- Composition: 1080×1920, 60 fps. Duration is always computed from `timeline.json`. Never hardcode it.
- Brand palette (exact): Lawn Green `#44AA00`, Thunder `#322F30`, Mint Cream `#F9FDF7`, Hijau Tua `#2E7A00`, Hijau Terang `#7BDB2E`, Layar `#262324`, Glow `#B9FF7A`, Kuning `#FFD400`, Merah `#FF6B57` (angry/error only). Font: Poppins.
- Safe area: top 250 px, bottom 420 px, right rail x > 960 at y 900–1500.
- Logo: right 60, top 262, width 210. No animation, no effects, no transparency, no rotation, no recolor.
- Caption: Thunder pill at opacity 0.94, radius 18, padding 16/28, Poppins 600 ±46 px, all lowercase.
  - Colors: Kuning for normal words, Hijau Terang for "jokoding", Glow for Kata Kunci (scale 1.0→1.08).
  - Unspoken words at opacity 0.45. Max 2 rows, max width 840 (x 120–960), bottom edge y ≤ 1480.
- Alignment: `MIN_MATCH = 0.85`, checked on the total and on each line. Per-line gap 450 ms. Pause ≥ 350 ms.
- Ducking: base −14 dB, under speech −24 dB, attack 120 ms, release 400 ms. Music loop crossfade 1 s, cut fade out 1.2 s.
- Loudness: VO `loudnorm` −16 LUFS.
- `Scenes.tsx` must not contain `<Audio>`, caption, or logo. The only audio a scene may add is `<Sfx>`.
- `remotion.config.ts` must keep `setChromiumOpenGlRenderer("angle")` and `setBrowserExecutable(\`${process.env.HOME}/Library/Caches/remotion-chrome/chrome-headless-shell-mac-arm64/chrome-headless-shell\`)` (ADR 0003).
- Do not import anything from `spikes/`. Code there is reference only.
- Composition IDs: `v-<slug>` (video) and `v-<slug>-qa` (QA sheet).
- **Deviation from spec §5, agreed in this plan:**
  - Scripts are `.ts` and run via `npx tsx`, because they import TS logic from `src/fondasi/`.
  - `qa-stills` and `render` are not Node scripts. They are direct calls to `npx remotion still|render`, because only `npx remotion *` is excluded from the Claude Code sandbox (`.claude/settings.local.json`).
  - The QA contact sheet is a Remotion composition (`QaSheet`).
- Identifiers and code comments are in English. Project docs (`MOTION.md`, `SKILL.md`), on-screen copy, and `naskah.md` are in Indonesian, matching the existing docs.

## Review Focus

1. **Leading silence or breath at the start of the owner's audio** (ElevenLabs often leaves 0.3–1.5 s). The video should not open on a blank stretch. The single-file timeline shifts audio with `voOffsetMs = max(0, firstWordStart − 150)`. Test in Task 5.
2. **Captions with tokens the speller cannot pronounce** ("v3", "GPT-5", "24/7"). `naskah.ts` must stop with a message naming the token and its line. It must not crash and must not produce a mismatched caption. Test in Task 3.
3. **Audio in another format or with junk files** (`.m4a`, stereo 44.1 kHz `.wav`, `.DS_Store`, `vo.mp3` alongside `01.mp3`). Detection ignores hidden files and rejects mixed formats with a clear message. ffmpeg normalizes everything. Test in Task 9.
4. **Re-running `lanjut` after the owner replaces the audio.** The old transcript must not be reused. Transcript cache is keyed by the audio file hash. Test in Task 9.
5. **Messy titles** (uppercase, spaces, Indonesian letters/emoji, a slug that already exists). The slug stays ASCII-lowercase-dash and gets suffix `-2`, `-3` on collision. Test in Task 7.

---

## File Structure

```
package.json, tsconfig.json, vitest.config.ts, eslint.config.mjs, remotion.config.ts, .gitignore
brand/jokoding/brand.ts                 BrandKit value
brand/jokoding/seri.ts                  SERI list + effectiveTailMs
src/index.ts                            registerRoot
src/Root.tsx                            registers VIDEOS + QA + gallery
src/videos.generated.ts                 generated by scripts/lib/registry.ts (committed)
src/fondasi/schema.ts                   zod Script/Timeline + types
src/fondasi/brand/types.ts              BrandKit, Seri types
src/fondasi/brand/BrandProvider.tsx     BrandProvider, useBrand
src/fondasi/brand/Logo.tsx, SeriChip.tsx, CtaEnd.tsx, fonts.ts
src/fondasi/timeline/normalize.ts       tokenize, spellNumber, caption check
src/fondasi/timeline/align.ts           alignTokens, similarity
src/fondasi/timeline/build.ts           buildTimeline, AlignError
src/fondasi/timeline/TimelineProvider.tsx  useTimeline, useLine, useAtWord, useTalk
src/fondasi/motion/timing.ts            atWord, atKeyword, talkAmount (pure)
src/fondasi/motion/*.tsx                Pop, SceneExit, Camera, transitions, springs.ts
src/fondasi/caption/chunk.ts            chunkWords
src/fondasi/caption/Subtitle.tsx
src/fondasi/audio/ducking.ts            musicVolumeAt, dbToGain
src/fondasi/audio/VoTrack.tsx, MusicBed.tsx, Sfx.tsx
src/fondasi/expression.ts               defaultExpression(tag)
src/fondasi/layout/safeArea.ts, QaOverlay.tsx
src/fondasi/qa/frames.ts                qaFrames, qaPages
src/fondasi/qa/QaSheet.tsx
src/fondasi/VideoShell.tsx
src/library/joks/{Joks.tsx,poses.ts,JoksCompare.tsx}
src/library/characters/{Person.tsx,Crowd.tsx}
src/library/props/*.tsx, src/library/stages/*.tsx, src/library/style.ts, src/library/LibraryGallery.tsx
src/archetypes/*.tsx, src/archetypes/ArchetypeGallery.tsx
scripts/new-video.ts, naskah.ts, transcribe.ts, prepare.ts, sync-assets.ts
scripts/lib/{slug,naskah,vo-files,music,registry,hash,whisper,ffmpeg}.ts
test/**/*.test.ts, test/fixtures/
videos/0000-contoh/                     fixture video (spike VO audio)
MOTION.md, .claude/skills/jokoding-video/SKILL.md
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, `remotion.config.ts`, `src/index.ts`, `src/Root.tsx`, `test/smoke.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run lint` (`eslint src scripts && tsc --noEmit`), `npm run studio` (`remotion studio`).

- [ ] **Step 1: Write `package.json`.** Pin the versions from Tech Stack exactly. Add `"type": "module"`, engines `node >=20.19`, and devDependencies `@remotion/eslint-config-flat@4.0.539`, `eslint@10.12.0`, `prettier@3.8.1`, `@types/react@19.2.7`, `vitest@5.0.5`, `tsx@4.23.15`.
- [ ] **Step 2: Write `remotion.config.ts`.** Copy the spike version (`spikes/remotion-spike/remotion.config.ts`): rspack, jpeg, overwrite, premount 2 s, angle, and `setBrowserExecutable`, with a comment pointing to ADR 0003.
- [ ] **Step 3: Write `src/Root.tsx`** with one placeholder `Composition` `v-smoke` (1080×1920, 60 fps, 60 frames, solid Mint Cream).
- [ ] **Step 4: Add to `.gitignore`:** `public/brand/`, `public/videos/`, `public/library/**/*.mp3`, `public/library/**/*.wav`, `videos/*/vo/`, `videos/*/music.*`, `test/fixtures/.cache/`.
- [ ] **Step 5: Write `test/smoke.test.ts`** asserting `1 + 1 === 2`. Run `npm install && npm test`. Expected: 1 passed.
- [ ] **Step 6: Run `npm run lint`.** Expected: exit 0.
- [ ] **Step 7: Run `npx remotion compositions src/index.ts`.** Expected: lists `v-smoke`.
- [ ] **Step 8: Commit** `chore: scaffold remotion project for fondasi`.

### Task 2: Schema, BrandKit, Seri

**Files:**
- Create: `src/fondasi/schema.ts`, `src/fondasi/brand/types.ts`, `brand/jokoding/brand.ts`, `brand/jokoding/seri.ts`
- Test: `test/fondasi/schema.test.ts`, `test/brand/seri.test.ts`

**Interfaces:**
- Produces (`schema.ts`):
  - `ScriptSchema` / `type Script = { slug: string; seri: string; voice: string | null; cta?: boolean; title: string; music: { mood: string; bpm: number; prompt: string }; lines: ScriptLine[] }`
  - `type ScriptLine = { id: string /* "01".."99" */; speaker: string; tag: string; spoken: string; caption?: string; keywords: string[]; visual: string }`
  - `TimelineSchema` / `type Timeline = { slug; seri; title; cta: boolean; fps: 60; durationMs; tailMs; voOffsetMs; vo: VoSource; lines: TimelineLine[]; music: { src: string; loop: boolean; durationMs: number } | null; diffs: Diff[] }`
  - `type VoSource = { mode: "single"; src: string } | { mode: "perLine"; files: { lineId: string; src: string; startMs: number }[] }`
  - `type TimelineLine = { id; speaker; tag; startMs; durMs; words: TimedWord[]; pauses: Pause[] }`
  - `type TimedWord = { text: string; startMs: number; endMs: number; keyword: boolean; inserted: boolean }`
  - `type Pause = { atMs: number; durMs: number }`
  - `type Diff = { line: string; kind: "missing" | "inserted" | "changed"; expected?: string; heard?: string }`
  - `type HeardWord = { text: string; startMs: number; endMs: number }`
  - All ms values are absolute from the start of the video.
- Produces (`brand/types.ts`):
  - `type BrandKit = { id: string; palette: Record<"lawnGreen"|"thunder"|"mintCream"|"hijauTua"|"hijauTerang"|"layar"|"glow"|"kuning"|"merah", string>; font: { family: "Poppins"; weights: ("400"|"500"|"600"|"700"|"800")[] }; logo: { color: string; light: string; right: number; top: number; width: number }; voices: Record<string, { name: string; elevenLabsId: string | null }>; cta: { title: string; sub: string; closing: string }; safeArea: { top: number; bottom: number; rail: { xMin: number; yMin: number; yMax: number } } }`
  - `type Seri = { id: string; chip: string | null; voice: string; musicMood: string; durationRange: [number, number]; cta: boolean; tailMs: number }`
- Produces:
  - `JOKODING: BrandKit` (`brand/jokoding/brand.ts`). Logo paths are `brand/jokoding/logo/logo-color.png` and `.../logo-light.png`, relative to `public/`. `cta = { title: "Chat WhatsApp", sub: "link di bio · jokoding.id", closing: "Apa pilihanmu?" }`. Voices: `{ utama: { name: "Voice utama", elevenLabsId: null } }`. The owner fills in the ID later.
  - `SERI: Seri[]`, `getSeri(id): Seri` (throws if unknown), and `effectiveTailMs(seri, script): number` (`brand/jokoding/seri.ts`).

- [ ] **Step 1: Write failing tests.**
  - `ScriptSchema.parse` accepts the example in spec §4.1.
  - It rejects a line `id` that is not `/^\d{2}$/`, an empty `lines`, and a missing `spoken`, each with a message containing the field path.
  - `getSeri("joki-cepat").durationRange` equals `[15, 30]`, and `getSeri("kalau-ai")` equals `[30, 60]`.
  - `getSeri("x")` throws `/Seri tidak dikenal: x/`.
  - `effectiveTailMs(joki, {cta: undefined})` = 2500. `effectiveTailMs(kalauAi, {cta: undefined})` = 800. `effectiveTailMs(kalauAi, {cta: true})` = 2500.
  - `JOKODING.palette.thunder` = `"#322F30"`.
- [ ] **Step 2: Run `npx vitest run test/fondasi/schema.test.ts test/brand`.** Expected: FAIL, module not found.
- [ ] **Step 3: Implement.** Seri values:
  - `joki-cepat`: chip `null`, voice `utama`, mood `tense-to-upbeat`, `[15,30]`, cta `true`, tailMs `2500`.
  - `kalau-ai`: chip `"KALAU AI · SIMULASI"`, voice `utama`, mood `curious-lofi`, `[30,60]`, cta `false`, tailMs `2500`.
  - `effectiveTailMs` returns `seri.tailMs` when `script.cta ?? seri.cta` is true, otherwise `800`.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(fondasi): script/timeline schema, brand kit and seri`.

### Task 3: Text normalization and Indonesian numbers

**Files:**
- Create: `src/fondasi/timeline/normalize.ts`
- Test: `test/fondasi/normalize.test.ts`

**Interfaces:**
- Produces:
  - `stripTags(s: string): string`. Removes `[tag]` and collapses whitespace.
  - `spellNumber(n: number): string`. Integers 0 to 999 999 999 in Indonesian.
  - `type DisplayToken = { display: string; spoken: string[] }`
  - `tokenize(displayText: string): DisplayToken[]`. Split on whitespace. `display` keeps the original token with punctuation. `spoken` is the normalized form: lowercase, no punctuation, numbers spelled out, `%` becomes `persen`, decimal comma `2,5` becomes `dua koma lima`.
  - `normalizeWord(w: string): string`. Lowercase, removes everything except `a-z0-9`.
  - `class UnspeakableTokenError extends Error { token: string; lineId: string }`
  - `checkCaption(line: ScriptLine): void`. Throws `UnspeakableTokenError` when a token mixes letters and digits, or contains `/`. Throws `Error("Caption baris <id> tidak cocok dengan spoken")` when the flattened `spoken` of `tokenize(caption)` differs from that of `tokenize(stripTags(spoken))`.

- [ ] **Step 1: Write failing tests.**
  - `spellNumber`: 0→`nol`, 11→`sebelas`, 12→`dua belas`, 21→`dua puluh satu`, 100→`seratus`, 115→`seratus lima belas`, 1000→`seribu`, 2024→`dua ribu dua puluh empat`, 1500000→`satu juta lima ratus ribu`.
  - `tokenize("progres 0%?")` → `[{display:"progres",spoken:["progres"]},{display:"0%?",spoken:["nol","persen"]}]`.
  - `tokenize("2,5 detik")[0].spoken` → `["dua","koma","lima"]`.
  - `stripTags("[panicked] Deadline besok... [sighs] ya")` → `"Deadline besok... ya"`.
  - `checkCaption` accepts spoken `"progres masih nol persen?"` with caption `"progres masih 0%?"`.
  - `checkCaption` throws `UnspeakableTokenError` with `token === "GPT-5"` for caption `"pakai GPT-5"`, and for `"24/7"`.
  - `checkCaption` throws a mismatch error for caption `"progres sudah 0%"`.
- [ ] **Step 2: Run `npx vitest run test/fondasi/normalize.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement** to match the interfaces above.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(fondasi): indonesian text normalization and caption check`.

### Task 4: Word alignment

**Files:**
- Create: `src/fondasi/timeline/align.ts`
- Test: `test/fondasi/align.test.ts`

**Interfaces:**
- Consumes: `normalizeWord` (Task 3), `HeardWord` (Task 2).
- Produces:
  - `similarity(a: string, b: string): number`. Computed as `1 − levenshtein(a,b)/max(len)` on `normalizeWord`.
  - `type AlignPair = { e: number | null; h: number | null; kind: "match" | "changed" | "missing" | "inserted" }`
  - `alignTokens(expected: string[], heard: HeardWord[]): AlignPair[]`. Global alignment (Needleman–Wunsch):
    - pairs with similarity ≥ 0.7 count as `match` (score +2);
    - other substitutions are `changed` (−1);
    - gaps are `missing` or `inserted` (−1).
    - Ties prefer `match`. Output is in sequence order.

- [ ] **Step 1: Write failing tests.** Heard fixtures are `HeardWord`s with timings of 300 ms per word.
  - Exact: `["deadline","besok"]` vs heard `deadline besok` → 2 `match`.
  - Fuzzy: `["jokoding"]` vs heard `joko ding`. Expected: one pair `match` or `changed` plus one `inserted`, never a crash. Also assert `similarity("deadline","dedline") ≥ 0.7`.
  - Missing: `["tenang","konsultasi","dulu"]` vs `tenang dulu` → `match, missing, match`.
  - Insertion: `["chat","aja"]` vs `chat aja ya` → `match, match, inserted`.
  - Changed: `["konsultasi"]` vs `konsul` → `changed` (similarity 0.6).
  - Whisper casing and punctuation: expected `["nol","persen"]` vs heard `"Nol"`, `"persen?"` → 2 `match`.
- [ ] **Step 2: Run `npx vitest run test/fondasi/align.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement `alignTokens`** with an O(n·m) DP table and a traceback.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(fondasi): fuzzy word alignment`.

### Task 5: Timeline builder

**Files:**
- Create: `src/fondasi/timeline/build.ts`
- Test: `test/fondasi/build.test.ts`, `test/fixtures/scripts/deadline.json` (3-line script from the Deadline spike)

**Interfaces:**
- Consumes: `tokenize`, `stripTags` (Task 3), `alignTokens` (Task 4), schema types (Task 2), `effectiveTailMs` (Task 2).
- Produces:
  - Constants: `MIN_MATCH = 0.85`, `PER_LINE_GAP_MS = 450`, `PAUSE_MIN_MS = 350`, `LEAD_MS = 150`.
  - `class AlignError extends Error { kind: "low-match" | "ambiguous-line"; lineId?: string; ratio: number; diffs: Diff[] }`
  - `type BuildInput = { script: Script; seri: Seri; vo: { mode: "single"; src: string; heard: HeardWord[] } | { mode: "perLine"; files: { lineId: string; src: string; durMs: number; heard: HeardWord[] }[] } }`
  - `buildTimeline(input: BuildInput): Timeline`

**Rules** (behaviors the tests pin down):
- **Expected tokens per line.** Use `tokenize(line.caption ?? stripTags(line.spoken))`. Each `spoken` sub-token is one alignment unit.
- **Caption word timing.** A caption word (`display`) gets `startMs` from its first matched sub-token and `endMs` from its last matched sub-token. If no sub-token matched, the word is dropped and recorded as a `missing` diff. Heard words that were `inserted` become `TimedWord` with `inserted: true` at their own position. `changed` keeps the naskah text with the heard word's timing.
- **Keywords.** `keyword = true` when `normalizeWord(display)` equals the `normalizeWord` of an entry in `line.keywords`.
- **Single mode.** Align all lines in one pass. Then:
  - `voOffsetMs = max(0, firstWordStart − LEAD_MS)`, and every time is shifted by `−voOffsetMs`.
  - Line `i ≥ 1` starts at the midpoint between the last word of line `i−1` and the first word of line `i`. Line 0 starts at 0.
  - The last line ends at its last word + 300 ms.
  - A line with 0 matches throws `AlignError("ambiguous-line")`.
- **Per-line mode.** `startMs` of line `i` = sum over previous lines of `(durMs + PER_LINE_GAP_MS)`. `voOffsetMs = 0`. `vo.files[].startMs` = the line's `startMs`.
- **Pauses.** A gap ≥ `PAUSE_MIN_MS` between adjacent words in one line becomes a `Pause`.
- **Match threshold.** Ratio = matched sub-tokens / expected sub-tokens. Below `MIN_MATCH`, either on the total or on any line, throw `AlignError("low-match")` with `lineId` (for the per-line case) and `diffs`.
- **Duration.** `durationMs` = end of the last line + `effectiveTailMs`. `tailMs` is stored in the timeline. `cta = script.cta ?? seri.cta`.

- [ ] **Step 1: Write failing tests** using `deadline.json`:
  - Single mode, heard is exactly the spoken words starting at 1200 ms → `voOffsetMs === 1050`, and the first word of line 01 has `startMs === 150` (Review Focus #1).
  - `line[1].startMs` is the midpoint between line 01's last word and line 02's first word.
  - Caption `"0%?"` in line 01 → one `TimedWord` with text `"0%?"` covering the times of `nol` and `persen`, `keyword: true`.
  - A 450 ms gap inside a line → one `Pause` with `durMs: 450`.
  - Per-line mode with file durations 3062/2661/2708 → startMs `0`, `3512`, `6623`. `durationMs` = 6623 + 2708 + 2500.
  - One extra heard word `"ya"` at the end → a `TimedWord` with `inserted: true` plus a `Diff` of kind `inserted`.
  - Removing 3 of the 6 heard words of line 02 → `AlignError` with `kind === "low-match"` and `lineId === "02"`.
  - Heard words for line 02 replaced entirely by an unrelated sentence, in single mode → `AlignError`, either `ambiguous-line` or `low-match` for line 02.
- [ ] **Step 2: Run `npx vitest run test/fondasi/build.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement `buildTimeline`** following the rules above.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(fondasi): timeline builder for single and per-line VO`.

### Task 6: Pure render helpers

**Files:**
- Create: `src/fondasi/caption/chunk.ts`, `src/fondasi/audio/ducking.ts`, `src/fondasi/expression.ts`, `src/fondasi/motion/timing.ts`, `src/fondasi/qa/frames.ts`
- Test: `test/fondasi/{chunk,ducking,expression,timing,frames}.test.ts`

**Interfaces:**
- Produces:
  - `type CaptionChunk = { words: TimedWord[]; showFromMs: number; showUntilMs: number }`
  - `chunkWords(words: TimedWord[], lineEndMs: number): CaptionChunk[]`. Start a new chunk when the current one has 6 words, or when it has ≥ 3 words and the gap to the next word is ≥ 300 ms. `showFromMs` = first word start − 150 (min: line start). `showUntilMs` = next chunk's `showFromMs`, or `lineEndMs`.
  - `dbToGain(db: number): number`
  - `musicVolumeAt(ms: number, lines: TimelineLine[], opts?: { baseDb?: number; duckDb?: number; attackMs?: number; releaseMs?: number }): number`. Defaults −14 / −24 / 120 / 400. Speech spans are `[first word start, last word end]` of each line. The ramp down ends exactly at span start, and the ramp up starts at span end. Interpolation is linear in dB.
  - `type JoksExpression = "netral"|"halo"|"senang"|"kaget"|"sedih"|"marah"|"bingung"|"jempol"|"nunjuk"`
  - `type PersonMood = "netral"|"panik"|"senang"|"bingung"|"sedih"|"kagum"`
  - `defaultExpression(tag: string): { joks: JoksExpression; person: PersonMood }`. Mapping as in spec §6.4, taking the first Joks option in each row: excited/happy→senang, panicked/surprised→kaget, sighs/sad→sedih, curious/confused→bingung, angry/frustrated→marah, calm/whispers→netral. Unknown tags → netral/netral.
  - `atWord(t: Timeline, lineId: string, which: string | number, fps: number): number`. Returns a frame. A string matches `normalizeWord`. Throws `Error("Kata tidak ditemukan: <which> di baris <lineId>")`.
  - `atKeyword(t: Timeline, lineId: string, i: number, fps: number): number`
  - `talkAmount(t: Timeline, lineId: string, ms: number): number`. Inside a word span: `0.35 + 0.55·|sin(ms/55)|`. Otherwise 0.
  - `qaFrames(t: Timeline): number[]`. Sorted, unique frames for: each line start + 300 ms, each keyword word start, each line's midpoint, and `durationMs − 1000` (CTA).
  - `qaPages(frames: number[], perPage = 6): number[][]`

- [ ] **Step 1: Write failing tests.**
  - `chunkWords`: 8 words without gaps → chunk sizes `[6,2]`. 5 words with a 400 ms gap after word 3 → `[3,2]`. A 2-word chunk does not split on a gap. `showUntilMs` of the last chunk equals `lineEndMs`.
  - `musicVolumeAt`:
    - Far from speech → `dbToGain(-14)` (≈0.1995).
    - Inside speech → `dbToGain(-24)` (≈0.0631).
    - 60 ms before speech starts → `dbToGain(-19)`.
    - 200 ms after speech ends → `dbToGain(-19)`.
  - `defaultExpression("excited").joks === "senang"`, `("panicked").person === "panik"`, `("unknown")` → netral/netral.
  - `atWord(...,"besok",60)` returns `Math.round(startMs/1000*60)`. An unknown word throws.
  - `talkAmount` returns 0 in a pause and > 0.3 inside a word.
  - `qaFrames` contains no duplicates and is sorted. `qaPages` of 13 frames → page sizes `[6,6,1]`.
- [ ] **Step 2: Run `npx vitest run test/fondasi`.** Expected: the new tests FAIL.
- [ ] **Step 3: Implement** all five modules.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(fondasi): caption chunking, ducking, expression map, timing and qa frames`.

### Task 7: Fase Naskah scripts (new-video + naskah.md)

**Files:**
- Create: `scripts/lib/slug.ts`, `scripts/lib/naskah.ts`, `scripts/new-video.ts`, `scripts/naskah.ts`
- Test: `test/scripts/slug.test.ts`, `test/scripts/naskah.test.ts`

**Interfaces:**
- Consumes: `ScriptSchema`, `checkCaption`, `stripTags`, `getSeri`, `JOKODING`.
- Produces:
  - `makeSlug(date: string /* YYYY-MM-DD */, title: string, existing: string[]): string`
  - `estimateDurationMs(script: Script): number`. Formula: `words(stripTags(spoken)) × 380 + (lines − 1) × 450`.
  - `renderNaskah(script: Script, seri: Seri, brand: BrandKit): string`
  - CLI `npx tsx scripts/new-video.ts "<title>" [--date YYYY-MM-DD]`. Creates `videos/<slug>/` with a skeleton `script.json` (`lines: []`) and prints the slug.
  - CLI `npx tsx scripts/naskah.ts <slug>`. Validates `script.json` (zod, plus `checkCaption` per line) and writes `videos/<slug>/naskah.md`.

**Exact `naskah.md` format:**

```
# Naskah: <title>

<!-- tempel bagian di bawah ini ke ElevenLabs -->

[<tag>] <spoken baris 01>

[<tag>] <spoken baris 02>

---

- Voice: <brand.voices[voiceKey].name> (<elevenLabsId atau "ID belum diset di brand/jokoding/brand.ts">)
- Model: Eleven v3 (atau versi lebih baru di akunmu)
- Perkiraan durasi: <s> detik (rentang Seri: <min>–<max> detik)
- Musik (opsional, Eleven Music, instrumental): "<music.prompt>", durasi <s+2> detik → simpan sebagai videos/<slug>/music.mp3
- Simpan audio sebagai salah satu:
  - videos/<slug>/vo/vo.mp3 (satu file utuh, disarankan)
  - videos/<slug>/vo/01.mp3 … <NN>.mp3 (per baris)
```

`voiceKey` = `script.voice ?? seri.voice`. If `spoken` already starts with a tag, do not add another tag.

- [ ] **Step 1: Write failing tests.**
  - `makeSlug("2026-11-05","Deadline Besok, Progres 0%?!",[])` → `"2026-11-05-deadline-besok-progres-0"`.
  - `"Kenapa Hermes Agent Viral? 🤖"` → `"2026-11-05-kenapa-hermes-agent-viral"`.
  - With `existing` containing that slug → suffix `-2`. With `-2` also present → `-3`. Slug length ≤ 60 characters (Review Focus #5).
  - `renderNaskah` on `deadline.json` produces a string that contains `"[panicked] Deadline besok... progres masih nol persen?"`, `"ID belum diset"`, and `"vo/03.mp3"`, and equals an inline snapshot.
  - `scripts/naskah.ts` logic (exported `runNaskah(slug, root)`) on a script containing caption `"GPT-5"` throws `UnspeakableTokenError` with a message that names line `01` and the token (Review Focus #2).
- [ ] **Step 2: Run `npx vitest run test/scripts`.** Expected: FAIL.
- [ ] **Step 3: Implement** the libraries and both CLIs. Each CLI is a thin wrapper over an exported `run*` function.
- [ ] **Step 4: Run tests.** Expected: PASS. Then run `npx tsx scripts/new-video.ts "Uji Coba" --date 2026-11-02`. Expected: prints `2026-11-02-uji-coba`, and the folder exists. Delete that folder afterwards.
- [ ] **Step 5: Commit** `feat(scripts): new-video and naskah generator`.

### Task 8: Local transcription (whisper.cpp)

**Files:**
- Create: `scripts/lib/ffmpeg.ts`, `scripts/lib/whisper.ts`, `scripts/transcribe.ts`
- Create: `test/fixtures/audio/deadline-01.wav`, `-02.wav`, `-03.wav` (copied from `spikes/remotion-spike/public/vo/deadline-d{1,2,3}.wav`, ±800 KB total)
- Test: `test/integration/transcribe.test.ts` (only runs when `RUN_INTEGRATION=1`)

**Interfaces:**
- Produces:
  - `WHISPER_DIR = \`${HOME}/Library/Caches/jokoding-whisper\``, `WHISPER_VERSION = "1.7.4"`, `WHISPER_MODEL = "large-v3-turbo"`
  - `ensureWhisper(): Promise<void>`. Calls `installWhisperCpp({ to: WHISPER_DIR, version })` and `downloadWhisperModel({ model, folder: WHISPER_DIR })`.
  - `toWav16k(input: string, output: string): Promise<void>`. Runs ffmpeg `-ar 16000 -ac 1 -c:a pcm_s16le`.
  - `loudnorm(input: string, output: string): Promise<void>`. Runs ffmpeg `loudnorm=I=-16:TP=-1.5:LRA=11`, output mp3 192k.
  - `probeDurationMs(file: string): Promise<number>`. Uses ffprobe.
  - `transcribeAudio(file: string): Promise<HeardWord[]>`. Steps: `toWav16k` into a temp dir, `transcribe({ inputPath, whisperPath: WHISPER_DIR, whisperCppVersion: WHISPER_VERSION, model: WHISPER_MODEL, tokenLevelTimestamps: true, language: "id", splitOnWord: true })`, `toCaptions`, then map to `HeardWord`. Empty words are dropped.
  - CLI `npx tsx scripts/transcribe.ts --install-only` (installs only) and `npx tsx scripts/transcribe.ts <file>` (prints JSON).

- [ ] **Step 1: Write the integration test.** `transcribeAudio("test/fixtures/audio/deadline-01.wav")` returns ≥ 3 words, `startMs` increases monotonically, and the normalized text contains `"deadline"`.
- [ ] **Step 2: Run `npx tsx scripts/transcribe.ts --install-only`.** Expected: whisper.cpp is built and the model (±1.6 GB) is downloaded. If the Claude Code sandbox blocks writes to `~/Library/Caches`, ask the owner to run `! npx tsx scripts/transcribe.ts --install-only`.
- [ ] **Step 3: Implement** `ffmpeg.ts`, `whisper.ts`, and `transcribe.ts`.
- [ ] **Step 4: Run `RUN_INTEGRATION=1 npx vitest run test/integration/transcribe.test.ts`.** Expected: PASS.
  - **Fallback if the whisper.cpp build fails on this machine:** implement `transcribeAudio` with the same signature using `@remotion/whisper-webgpu` (`large-v3-turbo`, language `"indonesian"`), which was proven in the spike (`spikes/remotion-spike/scripts/transcribe.mjs`). Record the switch in an ADR.
- [ ] **Step 5: Commit** `feat(scripts): local whisper transcription`.

### Task 9: `prepare` (core of `lanjut`)

**Files:**
- Create: `scripts/lib/vo-files.ts`, `scripts/lib/music.ts`, `scripts/lib/hash.ts`, `scripts/lib/registry.ts`, `scripts/sync-assets.ts`, `scripts/prepare.ts`, `public/library/music/meta.json` (`[]`), `public/library/sfx/meta.json` (`[]`)
- Test: `test/scripts/{vo-files,music,registry,prepare}.test.ts`

**Interfaces:**
- Consumes: `buildTimeline`, `AlignError` (Task 5), `transcribeAudio`, `loudnorm`, `probeDurationMs` (Task 8), `getSeri`.
- Produces:
  - `class VoFormatError extends Error { expected: string[] }`
  - `detectVoFormat(files: string[], lineIds: string[]): { mode: "single"; file: string } | { mode: "perLine"; files: Record<string, string> }`
    - Accepts `.mp3`, `.wav`, `.m4a`. Ignores hidden files.
    - `vo.*` → single.
    - `NN.*` for every lineId → perLine.
    - Mixed, incomplete, or empty → `VoFormatError` with a list of the expected names.
  - `type MusicMeta = { file: string; mood: string; bpm: number; durationMs: number; prompt: string; source: string; license: string }`
  - `pickMusic(entries: MusicMeta[], mood: string, bpm: number): MusicMeta | null`. Same mood, closest BPM. `null` if there is no matching mood.
  - `fileHash(path: string): Promise<string>`. sha256 hex.
  - `renderRegistry(slugs: string[]): string`. Source for `src/videos.generated.ts`: per slug, a static `import` of `../videos/<slug>/timeline.json` and `* as scenes from "../videos/<slug>/Scenes"`, plus `export const VIDEOS: RegisteredVideo[]`. Slugs are sorted.
  - `type RegisteredVideo = { slug: string; timeline: Timeline; Scenes: React.FC; background: "light" | "dark" }` (`background` defaults to `"light"` when not exported).
  - `runPrepare(slug: string, root: string, deps?: { transcribe?: typeof transcribeAudio }): Promise<PrepareReport>`
  - `type PrepareReport = { slug; durationMs; seriRange: [number, number]; warnings: string[]; diffs: Diff[]; music: string | null }`
  - CLI `npx tsx scripts/prepare.ts <slug>`. Prints the report. On `AlignError` or `VoFormatError`, prints the diff or the expected names and exits 1.
  - CLI `npx tsx scripts/sync-assets.ts`. Copies `brand/jokoding/assets/{logo,joks}` to `public/brand/jokoding/`.

**`runPrepare` flow (in order):**
1. Validate `script.json`.
2. `detectVoFormat`.
3. For each audio file: if `transcript.json[file].hash === fileHash(file)`, reuse it. Otherwise transcribe and store `{hash, words}`.
4. `buildTimeline`, with `durMs` from `probeDurationMs` in perLine mode.
5. `loudnorm` each audio file to `public/videos/<slug>/vo/<name>.mp3` and set `vo.src` relative to `public/`.
6. Music: if `videos/<slug>/music.*` exists, copy it to `public/videos/<slug>/music.mp3`. Otherwise use `pickMusic` from `public/library/music/meta.json`, or `null` with the warning `"Tanpa musik: library kosong untuk mood <mood>. Prompt: <prompt>"`.
   - `loop = musicDurationMs < timeline.durationMs`.
7. Write `timeline.json`.
8. If `videos/<slug>/Scenes.tsx` does not exist yet, create a skeleton (`export const background = "light"; export const Scenes = () => null;`).
9. Regenerate `src/videos.generated.ts` from every folder that has `timeline.json`.
10. Warn when the duration is outside `seri.durationRange`.

- [ ] **Step 1: Write failing tests.**
  - `detectVoFormat(["vo.m4a",".DS_Store"],["01","02"])` → single.
  - `(["01.mp3","02.wav"],["01","02"])` → perLine.
  - `(["vo.mp3","01.mp3"],…)` → `VoFormatError`.
  - `(["01.mp3"],["01","02"])` → `VoFormatError` with `expected` containing `"vo/02.mp3"` (Review Focus #3).
  - `pickMusic` chooses the closest BPM within the same mood, and returns `null` for an unknown mood.
  - `renderRegistry(["b","a"])` puts `a` before `b`, and the output contains `import * as scenes_0 from "../videos/a/Scenes"`.
  - `runPrepare` on a temp dir (fixture `deadline.json` plus three silent `.wav` files generated by ffmpeg in `beforeAll`), with a stub `transcribe` that returns the script words:
    - writes a `timeline.json` that passes `TimelineSchema`;
    - leaves `seriRange` at `[15,30]`;
    - calls the stub 3 times on the first run and **0 times** on the second run;
    - calls it 1 time after one file is overwritten with different content (Review Focus #4).
- [ ] **Step 2: Run `npx vitest run test/scripts`.** Expected: FAIL.
- [ ] **Step 3: Implement** everything listed above.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(scripts): prepare pipeline with transcript cache and registry`.

### Task 10: Brand components and layout

**Files:**
- Create: `src/fondasi/brand/BrandProvider.tsx`, `src/fondasi/brand/fonts.ts`, `src/fondasi/brand/Logo.tsx`, `src/fondasi/brand/SeriChip.tsx`, `src/fondasi/brand/CtaEnd.tsx`, `src/fondasi/layout/safeArea.ts`, `src/fondasi/layout/QaOverlay.tsx`
- Test: `test/fondasi/safeArea.test.ts`

**Interfaces:**
- Produces:
  - `BrandProvider({ brand, children })`, `useBrand(): BrandKit`
  - `poppins: string`. Font family from `loadFont("normal", { weights: ["400","500","600","700","800"], subsets: ["latin"] })`.
  - `Logo({ variant: "color" | "light" })`. A static `<Img>` from `staticFile(brand.logo[variant])` at the brand logo position.
  - `SeriChip({ text })`. Pill at left 60, top 262. Poppins 700, 30 px, uppercase, Thunder background, Kuning text.
  - `CtaEnd({ startFrame })`. A green card in the style of the spike `CtaCard` (Thunder border 8, offset shadow `0 12px 0`), with text from `brand.cta.title`/`sub`, plus `brand.cta.closing` underneath at 56 px / 800. Spring entrance. Placed in the center column above y 1350.
  - `SAFE = { width: 1080, height: 1920 }`
  - `isInForbiddenZone(rect: {x,y,w,h}, brand: BrandKit): boolean`
  - `safeBox(brand: BrandKit): { x: 120, y: 300, w: 840, h: 1050 }`. Spec §6.7 composition box.
  - `useSafeArea()` returns `safeBox` for the active brand.
  - `QaOverlay()`: forbidden zones in `rgba(255,0,0,0.28)`, a cyan box outline for the caption area (x 120–960, y 1180–1480) and the logo area, and the time and frame number in the top-left corner.

- [ ] **Step 1: Write failing tests.** `isInForbiddenZone`:
  - `{x:100,y:100,w:200,h:100}` → true (top zone);
  - `{x:200,y:600,w:400,h:400}` → false;
  - `{x:900,y:1000,w:120,h:100}` → true (rail);
  - `{x:200,y:1600,w:100,h:50}` → true (bottom).
- [ ] **Step 2: Run the test.** Expected: FAIL.
- [ ] **Step 3: Implement** all the components above.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(fondasi): brand overlay, cta, safe area and qa overlay`.

### Task 11: Audio and caption components

**Files:**
- Create: `src/fondasi/audio/VoTrack.tsx`, `src/fondasi/audio/MusicBed.tsx`, `src/fondasi/audio/Sfx.tsx`, `src/fondasi/caption/Subtitle.tsx`, `src/fondasi/timeline/TimelineProvider.tsx`

**Interfaces:**
- Consumes: `musicVolumeAt` (Task 6), `chunkWords` (Task 6), `useBrand` and `poppins` (Task 10), timing functions (Task 6).
- Produces:
  - `TimelineProvider({ timeline, children })`
  - `useTimeline(): Timeline`
  - `useLine(id: string): TimelineLine`
  - `useAtWord(lineId: string, which: string | number): number`. Returns a frame.
  - `useTalk(lineId: string): number`. Uses `talkAmount` at the current ms. Returns 0 when the line's speaker is not `"joks"`.
  - `VoTrack()`:
    - single mode: one `<Audio src={staticFile(vo.src)} trimBefore={voOffsetMs frames}>` starting at frame 0;
    - perLine mode: `<Sequence from>` + `<Audio>` per file.
  - `MusicBed()`: each copy's volume is `musicVolumeAt(ms, lines) × fadeOut(ms) × edge(ms)`.
    - `fadeOut`: linear 1→0 over the last 1.2 s of the video.
    - When `music.loop`, render copies at `<Sequence from={k·(music.durationMs − 1000)}>` until the video is covered. `edge` gives each copy a 1 s fade in/out at its boundaries, which produces the 1 s crossfade.
    - When not looping, render a single `<Audio>`.
  - `Sfx({ name, at, volume = 0.35 })`. `<Sequence from={at}>` + `<Audio src={staticFile(\`library/sfx/${name}.mp3\`)}>`.
  - `Subtitle()`: renders the active chunk of the active line, following the caption rules in Global Constraints. Fades between chunks in 80 ms.
  - Every audio component returns `null` when the shell prop is `qa === true` (passed through `TimelineProvider` as `qa`).

- [ ] **Step 1: Implement** the components (no new unit tests; the logic is already tested in Task 6).
- [ ] **Step 2: Run `npm run lint`.** Expected: exit 0.
- [ ] **Step 3: Commit** `feat(fondasi): vo track, music bed with ducking, sfx and subtitle`.

### Task 12: VideoShell, registry, QaSheet, fixture video

**Files:**
- Create: `src/fondasi/VideoShell.tsx`, `src/fondasi/qa/QaSheet.tsx`
- Modify: `src/Root.tsx`
- Create: `videos/0000-contoh/script.json` (copy of `test/fixtures/scripts/deadline.json` with slug `0000-contoh`), `videos/0000-contoh/Scenes.tsx`
- Generated: `src/videos.generated.ts`

**Interfaces:**
- Consumes: Tasks 9–11.
- Produces:
  - `VideoShell({ video: RegisteredVideo, qa?: boolean })`. Layer order from bottom to top:
    1. `Scenes`
    2. `Subtitle`
    3. `SeriChip` (if `seri.chip`)
    4. `Logo` (variant from `background`)
    5. `CtaEnd` (if `timeline.cta`, starting at `durationMs − tailMs`)
    6. `QaOverlay` (if `qa`)

    Audio components (`VoTrack`, `MusicBed`) render only when `!qa`.
  - `QaSheet({ video, page })`. Canvas 1620×1920. A 3×2 grid of tiles, each tile is `VideoShell qa` at scale 0.5 inside `<Freeze frame>`. Each tile has a label `t=<s>s · baris <id>`. Frames come from `qaPages(qaFrames(timeline))[page]`.
  - `Root.tsx`, per `VIDEOS` entry:
    - `<Composition id={\`v-${slug}\`}>` with `durationInFrames = Math.ceil(durationMs/1000*60)`;
    - `<Still id={\`v-${slug}-qa\`} defaultProps={{page: 0}}>`.

    Plus the `Library` and `Galeri` folders (filled in Tasks 14–17).

- [ ] **Step 1: Prepare the fixture.** Copy `test/fixtures/audio/deadline-0{1,2,3}.wav` to `videos/0000-contoh/vo/01.wav`… `03.wav`. Run `npx tsx scripts/sync-assets.ts && npx tsx scripts/prepare.ts 0000-contoh`. Expected: the report prints, and `timeline.json` plus `src/videos.generated.ts` exist.
- [ ] **Step 2: Write a simple `Scenes.tsx`** (a Mint Cream background with a large headline per line via `useLine`). It only proves the shell works.
- [ ] **Step 3: Implement** `VideoShell`, `QaSheet`, and `Root.tsx`.
- [ ] **Step 4: Run `npx remotion still v-0000-contoh-qa out/0000-contoh/qa/sheet-0.png --props='{"page":0}'`.** Open the PNG and check:
  - the caption is lowercase, yellow on a pill, with Glow keywords;
  - the logo is at the top right;
  - the red zones are visible;
  - the tile labels are correct.
- [ ] **Step 5: Run `npx remotion render v-0000-contoh out/0000-contoh.mp4`.** Expected:
  - the MP4 duration equals `timeline.durationMs` within 1 frame (per-line fixture: 6623 + 2708 + 2500 = 11 831 ms);
  - the VO is audible;
  - the CTA appears in the last 2.5 s.

  Check the duration with `ffprobe`.
- [ ] **Step 6: Commit** `feat(fondasi): video shell, registry, qa sheet and fixture video`. Commit `src/videos.generated.ts`, and `videos/0000-contoh/` without `vo/`.

### Task 13: Motion helpers

**Files:**
- Create: `src/fondasi/motion/springs.ts`, `Pop.tsx`, `SceneExit.tsx`, `Camera.tsx`, `transitions.tsx`
- Test: `test/fondasi/camera.test.ts`

**Interfaces:**
- Produces:
  - `SPRINGS = { snappy: { damping: 16, stiffness: 180 }, soft: { damping: 20, stiffness: 90 }, bouncy: { damping: 10, stiffness: 140, mass: 0.9 } }`
  - `Pop({ at, preset = "bouncy", from = 0.6, children })`. Scale + opacity entrance at frame `at`.
  - `SceneExit({ at, kind: "fade" | "slide-up" | "scale-down", children })`
  - `type CamKey = { frame: number; scale: number; x: number; y: number }`
  - `camAt(keys: CamKey[], frame: number): { scale; x; y }`. Interpolates with `Easing.bezier(0.16, 1, 0.3, 1)` and clamps outside the range.
  - `Camera({ keys, origin = "540px 1000px", children })`
  - `LineTransition({ lineId, kind: "cut" | "whip" | "scale", children })`. Wraps the content of one Baris VO. Whip = 10-frame x blur/translate at the start of the line.

- [ ] **Step 1: Write failing tests** for `camAt`:
  - before the first key, returns the first key;
  - after the last key, returns the last key;
  - at the midpoint between keys with scale 1→2, the value is > 1.5 (ease-out).
- [ ] **Step 2: Run the test.** Expected: FAIL.
- [ ] **Step 3: Implement** all the helpers.
- [ ] **Step 4: Run tests.** Expected: PASS. Use `Pop` and `Camera` in `videos/0000-contoh/Scenes.tsx`, re-render the QA sheet, and check visually.
- [ ] **Step 5: Commit** `feat(fondasi): motion helpers`.

### Task 14: Joks rig

**Files:**
- Create: `src/library/style.ts`, `src/library/joks/poses.ts`, `src/library/joks/Joks.tsx`, `src/library/joks/JoksCompare.tsx`
- Test: `test/library/poses.test.ts`

**Interfaces:**
- Consumes: `JoksExpression` (Task 6), `useBrand`.
- Produces:
  - `STYLE = { outlineProp: 10, outlineJoks: 14, hardShadow: "0 12px 0" }`
  - `type Pose = { tilt: number; leftHand: { x: number; y: number; r: number }; rightHand: { x: number; y: number; r: number; thumb?: boolean } }`
  - `POSES: Record<JoksExpression, Pose>`
  - `lerpPose(a: Pose, b: Pose, t: number): Pose`
  - `Joks({ expression, pose?, talk = 0, blink = 0, width = 520, showExtras = true, seed = 0 })`
  - `JoksCompare`. A Still (1860×1440) showing the official PNG from `public/brand/jokoding/joks/` next to the rig, for all 9 expressions.

- [ ] **Step 1: Write failing tests.** `lerpPose(POSES.halo, POSES.nunjuk, 0)` deep-equals `POSES.halo`, `1` equals `nunjuk`, and `0.5` gives the midpoint tilt. `POSES.halo.tilt === 5`, `POSES.nunjuk.tilt === 6`.
- [ ] **Step 2: Run the test.** Expected: FAIL.
- [ ] **Step 3: Rewrite the rig** from `spikes/remotion-spike/src/joks/Joks.tsx`:
  - geometry is the same (`HEAD_PATH`, visor, eyes, `BODY_PATH`, hands, glow);
  - colors come from `useBrand().palette`;
  - the final spike poses (halo tilt 5, nunjuk tilt 6, jempol right hand (860,600) thumb, marah hands y≈880) are kept.
- [ ] **Step 4: Run tests.** Expected: PASS. Render `npx remotion still JoksCompare out/library/joks-compare.png` and check that all 9 expressions are side by side with matching proportions and colors.
- [ ] **Step 5: Commit** `feat(library): joks vector rig and compare sheet`.

### Task 15: Person and Crowd

**Files:**
- Create: `src/library/characters/Person.tsx`, `src/library/characters/Crowd.tsx`, `src/library/characters/variants.ts`
- Test: `test/library/crowd.test.ts`

**Interfaces:**
- Produces:
  - `type PersonLook = { hair: "pendek" | "panjang" | "hijab"; skin: 0 | 1 | 2 | 3; outfit: string; accessory?: "kacamata" | "headset" }`
  - `Person({ look, mood: PersonMood, pose: "duduk" | "berdiri" | "nunjuk" | "angkat-tangan", talk = 0, blink = 0, width = 440 })`. The style follows the spike `Person` (`spikes/remotion-spike/src/joks/kit.tsx`), extended with the variants.
  - `SKIN = ["#F6D2B4", "#E4B58F", "#C68B5E", "#8D5A3B"]`
  - `crowdLayout(count: number, seed: number, area: { w: number; h: number }): { x: number; y: number; scale: number; look: PersonLook }[]`. Deterministic for the same seed.
  - `Crowd({ count, seed, area, mood })`

- [ ] **Step 1: Write failing tests.** `crowdLayout(12, 7, …)` deep-equals a second call with the same arguments. A different seed gives a different result. Every item lies inside `area`.
- [ ] **Step 2: Run the test.** Expected: FAIL.
- [ ] **Step 3: Implement** `Person`, `Crowd`, and `variants`.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(library): person variants and crowd`.

### Task 16: Props, stages, and LibraryGallery

**Files:**
- Create: `src/library/props/{Desk,Laptop,DeskLamp,PaperStack,WallClock,Calendar,NightWindow,Phone,ChatBubble,CodeWindow,Server,AiBadge,GradCap,Coffee,Chart,CheckCross}.tsx`, `src/library/stages/{MejaBelajar,LatarBrand,PanggungIso}.tsx`, `src/library/LibraryGallery.tsx`

**Interfaces:**
- Produces: each prop accepts `{ width: number }` plus the specific props below. All of them follow `STYLE` and the brand palette.
  - `Laptop({ side: "front" | "back", glow?: number })`
  - `WallClock({ minutes: number, size })`
  - `Calendar({ label: string, circled?: number })`
  - `NightWindow({ t: number, night?: boolean })`
  - `ChatBubble({ text: string, from: "left" | "right" })`
  - `CodeWindow({ lines: number, typed?: number /* 0..1 */ })`
  - `Chart({ values: number[], progress?: number })`
  - `CheckCross({ ok: boolean })`
  - Stages: `MejaBelajar({ time: "malam" | "siang", children })`, `LatarBrand({ t, children })`, `PanggungIso({ children })`. Each renders a full 1080×1920 background (floor and wall).
  - `LibraryGallery`. Still 2160×3840 with a grid of all props, three Person variants, Crowd, and the three stages in mini form.

- [ ] **Step 1: Port** Desk, Laptop (back), DeskLamp, PaperStack, WallClock, Calendar, and NightWindow from `spikes/remotion-spike/src/joks/kit.tsx`, using brand colors. Create the remaining props new.
- [ ] **Step 2: Implement** the three stages. MejaBelajar fixes the spike's floor/desk line: one Thunder line at the floor boundary, without overlapping the desk.
- [ ] **Step 3: Render `npx remotion still LibraryGallery out/library/gallery.png`.** Check:
  - consistent outline and style;
  - no gradients except screen glow;
  - Merah does not appear except on the error/silang icon.
- [ ] **Step 4: Run `npm run lint`.** Expected: exit 0.
- [ ] **Step 5: Commit** `feat(library): props, stages and gallery`.

### Task 17: Archetypes and ArchetypeGallery

**Files:**
- Create: `src/archetypes/{Hook,Masalah,Perbandingan,Angka,Langkah,JoksSolusi,Diagram}.tsx`, `src/archetypes/ArchetypeGallery.tsx`, `src/archetypes/sampleTimeline.ts`

**Interfaces:**
- Consumes: Library (Tasks 14–16), motion (Task 13), `useLine` / `useAtWord` (Task 11), `defaultExpression` (Task 6).
- Produces: each archetype takes `lineId` plus slots, and positions itself with `useSafeArea()`.
  - `Hook({ lineId, headline: string, character?: ReactNode })`. Headline 120 px / 800, camera push.
  - `Masalah({ lineId, stage: ReactNode, character: ReactNode, problem: ReactNode })`
  - `Perbandingan({ lineId, left: { label, visual }, right: { label, visual }, layout?: "lr" | "tb" })`
  - `Angka({ lineId, value: number, suffix?: string, label: string, countAt?: string /* keyword */ })`
  - `Langkah({ lineId, items: { title: string; at: string /* word */ }[] })`
  - `JoksSolusi({ lineId, prop?: ReactNode, expression?: JoksExpression })`. Default expression comes from `defaultExpression(line.tag).joks`. Joks talks via `useTalk`.
  - `Diagram({ lineId, nodes: { id; label; at: string }[]; edges: [string, string][] })`
  - `sampleTimeline`: a static 8-line `Timeline` for the gallery.
  - `ArchetypeGallery`. Still 3240×3840, 7 tiles at scale 1/3, each wrapped in `TimelineProvider(sampleTimeline)` + `<Freeze>` at the line's midpoint frame.

- [ ] **Step 1: Implement** the 7 archetypes (CtaEnd already exists from Task 10).
- [ ] **Step 2: Render `npx remotion still ArchetypeGallery out/library/archetypes.png`.** Check:
  - no element of any archetype falls into the forbidden zones (use `QaOverlay` inside each tile);
  - headlines are legible.
- [ ] **Step 3: Rewrite `videos/0000-contoh/Scenes.tsx`** to use Masalah, then JoksSolusi, then a CTA from the shell. Render the QA sheet and fix any issues found.
- [ ] **Step 4: Run `npm run lint`.** Expected: exit 0.
- [ ] **Step 5: Commit** `feat(archetypes): seven scene archetypes and gallery`.

### Task 18: `MOTION.md` and the `/jokoding-video` skill

**Files:**
- Create: `MOTION.md`, `.claude/skills/jokoding-video/SKILL.md`

**Interfaces:**
- Consumes: every CLI and composition from the earlier tasks.
- Produces: the `/jokoding-video` command with modes `<ide>`, `<naskah>`, `lanjut <slug>`, `revisi <slug> <catatan>`.

- [ ] **Step 1: Write `MOTION.md`** containing every rule in spec §6.7, plus:
  - Recommended audio tags (the §6.4 table) and a note that the tags are English, lowercase, and in square brackets. Pauses use `...` or a new line, never `<break>`.
  - Number and symbol rules for `spoken` vs `caption` (`checkCaption`).
  - The archetype catalog with props signatures (Task 17) and when to use each one.
  - "Scenes.tsx contract": export `Scenes` and `background`. No Audio, caption, or logo. Use `useSafeArea`, `useAtWord`, and `<Sfx>`.
  - A "Contoh scene yang lolos" section that is initially empty and is filled from the acceptance videos.
- [ ] **Step 2: Write `SKILL.md`** (follow the writing-for-agents skill). The flow for each mode follows spec §3.1–3.4, with exact commands:
  - **Naskah mode:**
    1. `npx tsx scripts/new-video.ts "<judul>"`
    2. Research (ide only), then write `research.md`.
    3. Write `script.json`.
    4. `npx tsx scripts/naskah.ts <slug>`.
    5. Stop and hand off to the owner.
  - **Lanjut mode:**
    1. `npx tsx scripts/sync-assets.ts`
    2. `npx tsx scripts/prepare.ts <slug>`. On exit 1, show the diff or the expected names and stop.
    3. Read `MOTION.md` and `timeline.json`.
    4. Write `Scenes.tsx`.
    5. `npx remotion still v-<slug>-qa out/<slug>/qa/sheet-<n>.png --props='{"page":<n>}'` for every page.
    6. Inspect against the §8.1 checklist, and fix (max 3 rounds). If it still fails after 3 rounds, render anyway and list the remaining issues with their still paths in the report (§7).
    7. `npx remotion render v-<slug> out/<slug>.mp4`.
    8. Final report (§3.3 point 9). Include which archetypes were used.
  - **Revisi mode:** follows §3.4.
  - **Owner's script:** the words must not change. Suggested edits go in the report.
- [ ] **Step 3: Dry-run** `/jokoding-video` in naskah mode with the idea "deadline tugas akhir besok" all the way to `naskah.md`. Check that the format matches Task 7 and the slug is correct. Delete the dry-run folder afterwards.
- [ ] **Step 4: Commit** `docs: MOTION.md rules and jokoding-video skill`.

### Task 19: Acceptance video 1, "Deadline" (`joki-cepat`, 15–30 s)

**Files:**
- Create: `videos/<date>-deadline-*/` (script.json, naskah.md, timeline.json, Scenes.tsx)
- Modify: `MOTION.md` (Contoh scene yang lolos section)

- [ ] **Step 1: Run `/jokoding-video`** in naskah mode with the Deadline idea, then hand `naskah.md` to the owner.
- [ ] **Step 2: Wait** until the owner puts the ElevenLabs audio in `vo/`.
- [ ] **Step 3: Run `/jokoding-video lanjut <slug>`** to the end. The QA sheet must be clean.
- [ ] **Step 4: The owner watches `out/<slug>.mp4`.** Revise until the owner says it is ready to upload.
- [ ] **Step 5: Add the best scenes to `MOTION.md`** and commit `feat(videos): acceptance video deadline`.

### Task 20: Acceptance video 2, AI storytelling (`kalau-ai`, 30–60 s)

**Files:**
- Create: `videos/<date>-<slug>/` with `research.md`
- Modify: `MOTION.md`, `docs/brainstorm/2026-11-01-voynan-style-pipeline.md` (record the results)

- [ ] **Step 1: Run `/jokoding-video`** with the owner's choice of trending-AI idea (for example Hermes Agent). The research facts must have sources in `research.md`.
- [ ] **Steps 2–4:** same as Task 19. In addition, verify that the transcript diff for technical terms ("Hermes Agent", "API") is correct: the caption uses the naskah text.
- [ ] **Step 5: Record the results** (render time, issues, lessons) in the brainstorm log. Commit `feat(videos): acceptance video kalau-ai`.
