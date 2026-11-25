# claude-readme: MakeCode micro:bit + pxt-synth-sim workspace

Goal: run the MakeCode editor locally and experiment with custom blocks for the
`pxt-synth-sim` extension (a micro:bit V2 software synth, C++ + TS), with working
simulator audio.

## Layout (all siblings in this folder, keep them together)

| Folder | What it is | Origin |
|---|---|---|
| `pxt/` | MakeCode core editor engine (v13.3.2, commit a0ef861). Built (`npm run build`). **Locally patched**, see "Core patch" below. | https://github.com/microsoft/pxt (shallow clone) |
| `pxt-microbit-notam/` | The micro:bit **target**, NOTAM fork with simulator synth audio. This is the one we serve. | https://git.notam.no/thomj/pxt-microbit (shared by Thom), `upstream` remote = microsoft/pxt-microbit |
| `pxt-synth-sim/` | The extension under development (`pxt.json`, `synth.ts`, `main.blocks`, `synth.cpp`, `MicroSynth.*`, `shims.d.ts`). | https://github.com/preglow/pxt-synth-sim |

Note: there is no `microsoft/pxt-makecode` repo. The editor = `pxt` (core) + a target repo.

## Why the NOTAM fork

Stock `pxt-microbit` (and makecode.microbit.org) has no simulator-side synth, so the
simulator crashes when the extension is added. The NOTAM fork adds 8 commits:
`sim/state/microsynth.ts`, `sim/state/orchestra.ts`, `sim/state/worklet/*` (audio worklet),
`sim/worklet-tsconfig.json`, hooks in `sim/dalboard.ts`, `sim/visuals/mute.ts`, and
disables micro:bit V1 / the old toolchain. It is what makecode.notam.org runs.
The simulator synth code must mirror what the C++ synth does; changes to block
behaviour usually need edits in both `pxt-synth-sim` (blocks/TS/C++) and
`pxt-microbit-notam/sim/state/` (simulator).

## Run it

```bash
cd ~/code/pxt-workspace/pxt-microbit-notam
node ../pxt/built/pxt.js serve --no-browser \
  --localRepo preglow/pxt-synth-sim=$HOME/code/pxt-workspace/pxt-synth-sim
```

Then open the URL it prints (http://localhost:3232/#local_token=...). In the editor:
New Project -> Extensions -> import `https://github.com/preglow/pxt-synth-sim`
(the `--localRepo` mapping serves it from the local folder, so edits show after refresh).
Click the simulator once: browsers block audio until a user gesture.

## Gotchas learned (do not rediscover)

- **Keep this workspace out of iCloud-synced folders (~/Documents, ~/Desktop).** The disk is nearly full, so
  macOS "Optimize Mac Storage" offloaded ~21k files in `pxt/` (they show up with `find . -flags +dataless`).
  Reading one blocks until iCloud downloads it (~20 files/min), so builds, `git status`, and `grep -r` hang
  at 0% CPU with no output. That's why the workspace moved from ~/Documents/code to ~/code on 2026-11-18.
- `pxt serve` **does** rebuild the simulator when files in `sim/` or its direct subfolders (e.g. `sim/state/`) are
  saved (verified 2026-11-25: `built/sim.js` rewritten within seconds). Just reload the editor. Without a running
  server use `node ../pxt/built/pxt.js buildtarget` in the target (~20 s). Do **not** use `buildsimjs`: it is a
  share-link command that crashes immediately ("Building sim js for undefined") and never builds the simulator
  (an earlier note here wrongly recommended it). `sim/state/worklet/` is deeper and not watched: `npm run build:worklet`.
- VS Code tasks for all of this live in `.vscode/tasks.json` (workspace root); START-HERE.md lists them.
- After editing pxt core webapp/pxtblocks: `npx gulp webapp` in `pxt/` (faster than a full build), then reload.
- Quick TS type-check of the extension (the CLI `pxt build` hangs on the cloud C++ compile):
  `pxt/node_modules/.bin/tsc --noEmit --target es5 --noLib pxt/libs/pxt-common/pxt-core.d.ts pxt/libs/pxt-common/pxt-helpers.ts pxt-microbit-notam/libs/core/*.d.ts pxt-microbit-notam/libs/core/*.ts pxt-synth-sim/{enums.d.ts,shims.d.ts,synth.ts,helpers.ts,sequencer.ts}`
  (ignore errors under libs/core and about `hex`).

- **Do not use `npx pxt`.** The linked core exposes no `pxt` bin, so npx downloads an
  unrelated npm package `pxt@0.5.1`. Always `node ../pxt/built/pxt.js ...`, run from the target folder
  (the `../pxt` path is relative to `pxt-microbit-notam/`).
- **Do not pass `--local`/`-l`.** It forces local native builds which need Docker (not installed:
  `spawn docker ENOENT`). Without it, hex compiles go to MakeCode's cloud service. So editing blocks/TS
  works locally, but C++ changes (`synth.cpp`) are only compiled when you press Download, via the cloud.
  Thom changed some hostnames and removed the "defunct compile bridge"; if Download fails, ask Thom how builds are meant to work.
- `npm install` in the target needs `PUPPETEER_SKIP_DOWNLOAD=1` (browser download fails and isn't needed).
- After install: `npm link pxt-core` in the target (symlink `node_modules/pxt-core -> ../../pxt`, relative,
  so moving the workspace folder as a whole is safe), and `npm run build:worklet` (builds `built/synth-worklet.js`).
  Rerun `build:worklet` after editing `sim/state/worklet/*` (or `npm run watch:worklet`).
- ~30 TS errors in `sim/state/record-audio.ts` and `sim/visuals/microbit.ts` show in the serve log. They are
  upstream noise; output is emitted correctly. Ignore.
- `pxt` core is 13.3.2 but the fork pins `pxt-core` 13.2.17. If something odd appears, try the pinned
  version instead of the link.
- Node >= 24 required by pxt (we have 26). npm 11 blocks install scripts by default ("install-scripts" warnings).
- Port 3232 busy => `pkill -f "pxt.js serve"`.

## State at hand-off

- Everything builds and the editor serves and loads. **Not yet verified:** importing the extension and hearing
  simulator audio, or that hex download works through the cloud build.
- No commits were made in any repo. `pxt-microbit-notam` shows modified files (generated locales/shims from the build);
  these are build output, not intentional edits, except `sim/state/orchestra.ts` (piano roll note handler, see below).

## Step sequencer (pxt-synth-sim/sequencer.ts)

Blocks in SynthBlocks > Sequencer: `sequence [piano roll]` (round block, value is a `synthBlocks.Sequence`),
`play sequence <seq> until done / in background / in sync in background`, `start sequences`, `end sequences`,
`stop synced sequence`, `set sequence tempo`, `transpose`. The piano roll field stores a pxt song buffer
(format: `pxt/pxtlib/music.ts`), decoded at runtime into MIDI note numbers (song note n -> MIDI n + 23).

## Core patch (pxt-core-pianoroll-sim.patch)

Full, upstream-oriented list of core and target changes: **CORE-CHANGES.md** (keep it updated with every change).

`pxt-core-pianoroll-sim.patch` (applied to `pxt/`; re-apply with `git apply` after a fresh clone). Adds a piano roll
field option `simInstruments="Sound 1,Sound 2,Sound 3"`:
- replaces Dog/Duck/Cat/drums with those names; a track's choice is saved as instrument waveform `200 + index`,
  which `sequencer.ts` reads to pick the SynthPreset per track;
- note previews and Play/Loop are sent to the simulator iframe as
  `{type:"custom", content:{type:"pianoroll-note", instrument, note (MIDI), velocity, duration (ms)}}`
  (`pxt/webapp/src/components/pianoRoll/simOutput.ts`), handled at the bottom of
  `pxt-microbit-notam/sim/state/orchestra.ts` with `orchestra.note(...)`.
This only exists locally: makecode.notam.org would need the same core patch plus the sim change.

The same patch also contains:
- `pxtblocks/fields/field_synth_graph.ts`: the `synthgraph` field editor (registered in `fieldEditorRegistry.ts`).
  Used on enum parameters; click to cycle the value; draws a wave / envelope / filter / LFO graph from sibling
  number inputs named in `fieldOptions.inputs`. Used by `pxt-synth-sim/soundsetup.ts` ("set up sound" block).
- `pxtblocks/fields/field_utils.ts` `songToDataURI`: fallback palette (micro:bit has no `runtime.palette`, which made
  the song/piano-roll thumbnail throw, so it stayed empty and the block never resized) and a piano-roll style preview.
- `inlineRowBreaks` block attribute (`localtypings/pxtarget.d.ts`, `pxtlib/shared/commentattrs.ts`, `pxtblocks/loader.ts`):
  with `inlineInputMode=inline`, each `|` in the block string becomes a Blockly EndRowInput, so several
  parameters share a row and `|` starts the next one. Inside the expandable (`||`) part the row ends are named
  like optional labels, so they only appear once a later parameter is revealed. Changing `pxtlib` needs a full
  `npm run build` in `pxt/`, not just `gulp webapp`.

## Sound presets (pxt-synth-sim/soundpresets.ts)

The "preset" dropdown on the "set up" block comes from `pxt-synth-sim/tools/presets.txt` (same format as the shared
"Lyder til pxt-synth" list: a name line, then the `{ OscType::..., ..., false }` struct). To add sounds, paste them
into that file and run `python3 tools/presets_to_ts.py` in `pxt-synth-sim/`. It regenerates `soundpresets.ts` and
warns if a value falls outside the block's slider range. Choosing a preset in the editor copies its values into the
block (core field `presetvalues`, CORE-CHANGES.md #11), so presets cost no flash on the micro:bit.
