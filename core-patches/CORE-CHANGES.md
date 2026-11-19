# Changes to MakeCode outside the pxt-synth-sim extension

This lists every change made to **MakeCode core (`microsoft/pxt`)** and to the **micro:bit target
(`pxt-microbit`, NOTAM fork)** to support the pxt-synth-sim extension. Changes to the extension itself are
not listed. Use it to discuss upstreaming with Microsoft (core) and the Micro:bit Educational Foundation
(target / makecode.microbit.org).

Status: everything is **local and uncommitted**. It all compiles. The piano roll field and the song thumbnail
have been seen in the editor; the other changes have not been confirmed working in a browser yet. No automated tests have
been added.

## Summary

| # | Change | Repo | Kind | Lines (+/−) | Upstream outlook |
|---|---|---|---|---|---|
| 1 | Song thumbnail crashes on targets without a palette | pxt | bug fix | ~+45 / −10 | Good candidate as-is |
| 2 | Piano roll: wider block preview, configurable note colours | pxt | small UI tweak | +29 / −1 | Optional, goes with 3 |
| 3 | Piano roll: target-simulator instruments and preview audio | pxt + target | new feature | ~+185 / −5 (core), +18 (target) | Needs design discussion |
| 4 | `synthgraph` and `synthpreview` field editors (live synth graphs, sound preview buttons) | pxt + target | new field editors | +457 (core), +67 (target) | Better moved into the target |
| 5 | `inlineRowBreaks` block attribute (rows, and +/− buttons on their own row) | pxt | new block attribute | +34 / −2 | Good candidate, small and opt-in |
| 6 | `expandableArgumentSeparators` block attribute (lines between + sections) | pxt | new block attribute | +104 | Possible; small, opt-in, depends on 5 |
| 7 | Blocks can post messages to the simulator (`postSimulatorMessage`) | pxt | small API | +16 | Good candidate, small |
| 8 | Piano roll: `showMidiNumbers` option (MIDI numbers on notes and keys) | pxt | small UI option | +28 / −4 | Good candidate, small and opt-in |
| 9 | Piano roll: `showSequenceTools` option (clear, transpose, nudge with wrap) | pxt | new UI option | ~+150 / −1 | Good candidate, opt-in |
| 10 | Piano roll: `singleTrack` option (one track per song) | pxt | new UI option | ~+50 / −6 | Good candidate, opt-in |
| 11 | `presetvalues` field editor (enum presets that fill in a block's inputs) | pxt | new field editor | +142 | Good candidate, generic |

Totals: pxt core 22 files, **+1257 / −33** lines (6 new files); target 1 file, **+85** lines.

**Base versions**
- pxt core: `microsoft/pxt` commit `a0ef8615bc001ec50cd8a4cf09e7552c2115c9ba` (v13.3.2, 2026-11-17).
- target: NOTAM fork of `microsoft/pxt-microbit`, commit `58f9e26b7925d590ffbaede2f83dba0e0dffb23a`. The
  fork's own simulator synth (`sim/state/orchestra.ts`, `microsynth.ts`, worklet) predates this work and is
  not listed here.

**Patch:** `pxt-core-pianoroll-sim.patch` in this folder holds the full core diff. Apply it with
`git apply` on the base commit above.

---

## 1. Song thumbnail crashes on targets without a palette

**Files:** `pxtblocks/fields/field_utils.ts` (`songToDataURI`)

**Problem:** `songToDataURI` calls `pxt.appTarget.runtime.palette.slice()`. micro:bit defines no palette, so
this throws. Any song or piano roll field on micro:bit therefore shows an empty grey preview. Also, the throw
happens before `FieldMusicEditor.redrawPreview` reaches `forceRerender()`, so the block keeps its old width
when the song gets longer and the field overflows the block.

**Change:**
- Fall back to a fixed 16-colour palette when the target has none. This alone fixes the bug.
- Draw the preview as a small piano roll: x is time (note length shown), y covers the pitch range actually used
  (at least one octave), with faint beat lines. Before, it drew one cell per 8th note with `note % 12` as the row.

**Upstream notes:** the palette fallback is a pure bug fix and safe to take on its own. The new layout also
changes how song thumbnails look in Arcade, so it may need its own discussion or a target option.

## 2. Piano roll: wider block preview

**Files:** `pxtblocks/fields/field_piano_roll.ts` (`previewWidth`, `previewTrackColors` overrides, `previewColors` option),
`pxtblocks/fields/field_musiceditor.ts` (+6/−1: `previewTrackColors` hook), `pxtblocks/fields/field_utils.ts`
(`songToDataURI` takes an optional `trackColors` list)

The music editor's preview is 32 px per measure, so a 16-step bar gets 2 px per step. The piano roll field now
uses 64 px per measure, capped at 256 px.

The thumbnail used Arcade's palette colour for the first track ("dog" = yellow), while the piano roll draws
notes in `#03adfc` blue. `FieldMusicEditor` gets a `previewTrackColors()` hook (default: palette as before), and
the piano roll returns the colours from a new field option, or by default its own note colour for the first
track and distinct colours for the rest:
```ts
//% song.fieldOptions.previewColors="#0b8a0d,#33c236,#065a08,#7fdc81"   // by track; pxt-synth-sim uses greens
```

## 3. Piano roll: target-simulator instruments and preview audio

**Files (core):**
- `pxtblocks/fields/field_piano_roll.ts`: parse the new field option `simInstruments`.
- `webapp/src/components/pianoRoll/simOutput.ts` (new, 143 lines): instrument list, encoding, and messages to
  the simulator.
- `webapp/src/components/pianoRoll/PianoRoll.tsx`: replace the instrument list; send previews to the simulator.
- `webapp/src/components/pianoRoll/PianoOctave.tsx`: piano key previews go to the simulator.
- `webapp/src/components/musicEditor/playback.ts`: during Play/Loop, mute the built-in sequencer and send its
  notes to the simulator instead.

**Files (target):** `sim/state/orchestra.ts`: handle the custom message and play the note on the simulator
synth (+18 lines).

**Why:** the piano roll always previews with the editor's built-in `pxsim.music` synth and offers its own
instruments (Dog, Duck, Cat, drums). An extension with its own synth (here: 3 synth presets in the micro:bit
simulator) can't make the editor offer or play those sounds.

**API added:**
- Field option, set by the extension:
  ```ts
  //% song.fieldEditor=pianoroll
  //% song.fieldOptions.simInstruments="Sound 1,Sound 2,Sound 3"
  ```
  This replaces the editor's instruments with these names. No drum kit is offered.
- Song encoding: simulator instrument `i` is saved as instrument `waveform = 200 + i`, so the running program
  can read which sound each track uses.
- Editor → simulator message, sent with `simulator.proxy()`:
  ```ts
  { type: "custom", content: { type: "pianoroll-note", instrument, note /* MIDI */, velocity /* 0-127 */, duration /* ms */ } }
  ```
  The target handles it through `pxsim.handleCustomMessage`. Custom messages are delivered even when no
  program is running.

**Upstream notes and open questions:**
- Encoding the instrument as an out-of-range waveform is a workaround. A proper version would add an explicit
  "external instrument id" to the song format (`pxtlib/music.ts`), which affects every target.
- The instrument list might belong in target config (`pxtarget.json`) rather than in each block's field options.
- `simOutput.ts` uses module-level state (whether sim output is on) and imports `../../simulator`, which also
  pulls the simulator module into the asset editor bundle.
- Browser autoplay rules: the simulator iframe's audio context must already be unlocked (the user has clicked
  the simulator once), or the previews are silent.
- The target part only matters for targets whose simulator has its own synth (today only the NOTAM fork).

## 4. `synthgraph` and `synthpreview` field editors

**Files:** `pxtblocks/fields/field_synth_graph.ts` (new, 454 lines), `pxtblocks/fields/fieldEditorRegistry.ts` (+3)

A field for enum parameters. Instead of a dropdown it draws a small live graph and switches to the next value
when clicked. It reads sibling number inputs on the same block (named in `fieldOptions.inputs`) and redraws when
they change. Four graph types: oscillator wave (with pulse width), ADSR envelope (envelope or gate mode),
filter response (low/high/band-pass, cutoff, resonance), and LFO shape over 1 second.

```ts
//% gateEnv.fieldEditor="synthgraph"
//% gateEnv.fieldOptions.graph="envelope"
//% gateEnv.fieldOptions.inputs="attack,decay,sustain,release"
//% gateEnv.fieldOptions.defaults="5,200,50,600"
```

Labels are white with an outline in the graph's background colour (`paint-order: stroke`), so they stay
readable where they cross the graph lines. Text colours are set as inline styles: the renderer's
`.blocklyEditableField>g>text { fill: #575E75 }` rule otherwise overrides SVG `fill` attributes. Everything drawn ignores the pointer except the background rectangle, which is the click target. In the first
version the background ignored it too, so the graphs couldn't be clicked.

**Preview buttons** (`FieldSynthPreview`, registered as `synthpreview`, in the same file; used on the block's
preset parameter): a subclass of pxt's normal `FieldDropdown`, so the preset is an ordinary dropdown. After the
dropdown renders, the field adds two buttons to its right, ▶ low and ▶ high, and widens its own size to fit them. A button collects every number input and field value of the block
by name and sends them with `postSimulatorMessage` (see 7):
```ts
{ type: "custom", content: { type: "synth-preview", note /* MIDI, from fieldOptions.notes, default 48,60 */, values } }
```
The target simulator (`sim/state/orchestra.ts`, `previewSound`, +67 lines) applies the values to the preset and
plays the note. This works whether or not a program is running or the block is attached. The value scaling and
defaults are duplicated from the extension's `setUpSound`, so the two must be kept in sync (e.g. FM: block
0–100 maps to an FM amount of 0–1 in both).

**Upstream notes:** this is synth-specific, so it probably doesn't belong in core. pxt already lets a target ship
its own field editors (`appTheme.extendFieldEditors` plus a target `fieldeditors.js`, as in Arcade). Moving it
there would need no core change at all. That hasn't been tried yet with the current Blockly-as-module setup.

## 5. `inlineRowBreaks` block attribute

**Files:** `pxtblocks/loader.ts` (+26/−2), `pxtblocks/composableMutations.ts` (+6), `pxtlib/shared/commentattrs.ts` (+1),
`localtypings/pxtarget.d.ts` (+1)

**Problem:** a block can either put every value input on its own row (`inlineInputMode=external`) or flow all
of them on one line (`inline`), where `|` in the block string has no visible effect. There is no way to lay out
"oscillator 1 [wave] level (80) tune (0)" on one row and the next oscillator on the next row.

**Change:** a new opt-in attribute. With `inlineInputMode=inline inlineRowBreaks=true`, each `|` adds a Blockly
`EndRowInput` (Blockly ≥ 10). Inside the expandable `||` part, these row ends are named like optional labels, so
the existing expand/collapse logic only shows a row end once a later parameter is revealed. The expandable
block's "+"/"−" buttons also get a row of their own (an `EndRowInput` added just before them in
`composableMutations.ts`), instead of trailing the last parameter.

**Pitfall (fixed):** inputs of the expandable part are named with a running counter (`anonIndex`), and
`domToMutation` builds that part a second time when a project loads, skipping inputs whose names already exist.
The row ends and separators (6) also use the counter, so every pass must use it up in exactly the same way, also
for inputs it skips. The first version returned early on skipped inputs, which shifted later names, so field
inputs were added twice. The duplicate `gateEnv` field kept its default, and the preview buttons (4), which read
the last field of each name, sent "envelope" while the block (and the compiled code) said "gate". Found and
verified with a headless-Chrome test of the editor.

**Upstream notes:** small, generic and opt-in, so existing blocks are unaffected. A natural follow-up would be to
make it the default for `inline` mode, but that would change existing blocks that use `|`.

## 6. `expandableArgumentSeparators` block attribute

**Files:** `pxtblocks/fields/field_row_separator.ts` (new, 84 lines), `pxtblocks/loader.ts` (+18),
`pxtlib/shared/commentattrs.ts` (+1), `localtypings/pxtarget.d.ts` (+1)

**Problem:** a long expandable block (here 20 optional parameters in 4 "+" steps) reads as one undivided list
once expanded.

**Change:** with `inlineRowBreaks=true expandableArgumentSeparators=true`, the loader puts a row with a
horizontal line before each section of the expandable part. Sections start at the first optional parameter and
at each `expandableArgumentBreaks` index. The line row is named like an optional label, so it only appears once
its section is revealed. `FieldRowSeparator` is a 1 px wide, non-editable, non-serialized field that draws its line
outside its own bounds, 3 px thick, 16 px in from the block's left and right edges, in the block colour darkened
by 25% black. It
measures again after each render and on workspace changes, so the block's width is never affected.

**Upstream notes:** opt-in, so other blocks are unaffected. Measuring the block width in a `requestAnimationFrame`
after rendering is a workaround: Blockly has no input type for a separator. A cleaner version would be a
renderer-level separator input type in Blockly or in pxt's renderer.

## 7. Blocks can post messages to the simulator

**Files:** `pxtblocks/fields/field_utils.ts` (+13: `setSimulatorMessageHandler`, `postSimulatorMessage`),
`webapp/src/simulator.ts` (+3: register `driver.postMessage` at startup)

**Problem:** block fields (pxtblocks) have no way to reach the simulator iframe; only the webapp holds the
simulator driver.

**Change:** pxtblocks keeps a handler, and the webapp registers `driver.postMessage` with it in
`simulator.initAsync`. Fields call `postSimulatorMessage(msg)`, which returns false when no simulator is
available. The target handles messages of `type: "custom"` through `pxsim.handleCustomMessage`.

**Upstream notes:** small and generic. The piano roll code (3) could use it too, instead of importing the
webapp's simulator module directly.

## 8. Piano roll: `showMidiNumbers` option

**Files:** `pxtblocks/fields/field_piano_roll.ts` (+5), `webapp/src/components/pianoRoll/NoteEvent.tsx` (+5/−1),
`PianoOctave.tsx` (+8/−2), `PianoRoll.tsx` (+3), `context.tsx` (+2), `utils.ts` (+5)

**Problem:** the piano roll labels notes only by name (C4). For music and coding lessons that work with MIDI
note numbers (as pxt-synth-sim's sequences do, so transposing is adding a number), learners need to see the number
that ends up in their program.

**Change:** a new field option:
```ts
//% song.fieldOptions.showMidiNumbers=true
```
Notes then read "C4 60", with the number in a smaller font so it still fits on a 1/16 note, and the keyboard's C
labels read "C4 · 60". Hovering a key or note shows "C4 (MIDI 60)". The value is carried in the piano roll theme
(`PianoRollTheme.showMidiNumbers`). The conversion is `getMidiNumber(note) = note + 24` in `utils.ts`; the piano
roll's note 0 is C1.

**Upstream notes:** opt-in, display only, no change to the song format. Small and generic.

## 9. Piano roll: `showSequenceTools` option

**Files:** `webapp/src/components/pianoRoll/sequenceTools.ts` (new; `clearSong`, `transposeSong`, `nudgeSong`),
`PianoRoll.tsx` (footer buttons), `pxtblocks/fields/field_piano_roll.ts` (option),
`theme/piano-roll/piano-roll.less` (+20: `.sequence-tools` buttons sized like the playback buttons; a less
change needs the full `npm run build`)

**Problem:** for a step sequencer, common whole-pattern edits (start over, shift the key, shift the groove)
take many clicks in the piano roll.

**Change:** with `//% song.fieldOptions.showSequenceTools=true`, the footer gets:
- **Clear** (trash icon): removes every note.
- **Transpose − / +**: moves notes by a semitone. Only the selected notes if there is a selection (reusing
  `transposeFloatingLayer`), otherwise every note on every melodic track. If notes would leave the track's
  visible octave range, the track switches to the smallest standard range (Treble/Bass/Full) that fits; if none
  fits, nothing changes.
- **Nudge ◀ / ▶**: moves every note one snap step (or one tick without snap controls) earlier or later, wrapping
  around the end of the song. A note that would then hang over the end is shortened to fit. Events are kept
  sorted by start, as playback (`pxsim.music.Sequencer`) and the note tracker expect.

All three go through the normal `updateSong`, so they can be undone.

**Upstream notes:** opt-in. The shortening on wrap loses length for long notes near the end; splitting the note
into two would avoid that, at the cost of an extra note trigger.

## 10. Piano roll: `singleTrack` option

**Files:** `webapp/src/components/pianoRoll/Header.tsx` (+11/−6: optional track selector),
`sequenceTools.ts` (`mergeTracks`), `PianoRoll.tsx`, `pxtblocks/fields/field_piano_roll.ts` (option)

**Problem:** in pxt-synth-sim one song is one sequence object, and several sequences play together in the
program. Several tracks inside one song duplicated that idea and made the editor more confusing.

**Change:** with `//% song.fieldOptions.singleTrack=true`, the header hides the track selector (and with it
"New Track…" and "Delete Track"). When the editor opens a song with more than one track, all melodic tracks
are merged into the first one, which keeps its instrument. The instrument dropdown stays, so the song still
records which sound it uses.

**Upstream notes:** opt-in, display and editing only; songs with one track are unchanged in format.

## 11. `presetvalues` field editor

**Files:** `pxtblocks/fields/field_preset_values.ts` (new, 140 lines), `pxtblocks/fields/fieldEditorRegistry.ts` (+2)

**Problem:** an extension wants a "preset" dropdown that fills in many inputs of a block (here: 15 ready-made
synth sounds for the "set up" block). Doing it at runtime would compile every preset's data into the program,
which costs flash on the device.

**Change:** a field for enum parameters, a subclass of pxt's normal `FieldDropdown`. Each enum member carries a
`blockValues` attribute, a space-separated list of `name=value`. When the user picks a member from the menu, the
field writes the values into the same block: names matching a field (e.g. an enum dropdown) set that field;
otherwise the number goes into the shadow number/slider block of the input with that name. All writes form one
event group, so it is one undo step. Values are only applied on a menu choice (`onItemSelected_`), never when a
project loads, so tweaks made after choosing a preset survive.

When the user afterwards changes one of the values the chosen preset set, the dropdown switches back to the first
member without `blockValues` ("custom"), so it never names a preset that is no longer on the block. The field
listens for `BLOCK_CHANGE` field events on its own block and on the shadow blocks in its inputs, and only reacts to
names listed in the preset's `blockValues`. Its own fill-in is skipped by remembering the event group it used.

```ts
enum SynthSoundPreset {
    //% block="custom"
    Custom = 0,
    //% block="FM pluck"
    //% blockValues="osc1Shape=oscShapes.triangle osc1Level=100 attack=0 decay=320.2 ..."
    FMPluck = 1,
}
//% soundPreset.fieldEditor="presetvalues"
export function setUpSound(preset: SynthPreset, soundPreset: SynthSoundPreset, ...)
```

The data comes from the enum symbol's attributes in `blocksInfo`. Unknown `//%` attributes are already kept as
strings by `parseCommentString`, so no attribute parsing change was needed. The compiled program only gets the enum
value of the dropdown (one small constant) plus the values that are on the block.

**Upstream notes:** generic (nothing synth-specific) and small. Not handled: inputs holding non-shadow blocks
(e.g. a variable) are skipped when filling in. An undo of a preset may also leave the dropdown on "custom" instead of
the previous preset, depending on how Blockly groups undo events.

---

## Keeping this file current

Every change to `pxt/` or `pxt-microbit-notam/` gets a section or table row here, with its files, line counts
and upstream notes. Refresh the numbers with:

```bash
cd ~/code/pxt-workspace/pxt && git add -N <new files> && git diff --stat && git diff > ../pxt-core-pianoroll-sim.patch
cd ~/code/pxt-workspace/pxt-microbit-notam && git diff --stat -- sim/
```

Note: `pxt-microbit-notam` also shows many modified files that are build output (locales, shims). Only the
`sim/` changes listed above are intentional.

| Date | Change |
|---|---|
| 2026-11-18 | 3: piano roll simulator instruments and preview audio |
| 2026-11-19 | 1, 2: thumbnail fix and wider preview; 4: `synthgraph` field; 5: `inlineRowBreaks` |
| 2026-11-19 | 4: click fix; 5: +/− buttons on their own row; 6: `expandableArgumentSeparators` |
| 2026-11-19 | 2: thumbnail in piano roll colours; 4: preview buttons (+ target `previewSound`); 7: `postSimulatorMessage` |
| 2026-11-19 | 2: `previewColors` field option |
| 2026-11-19 | 8: `showMidiNumbers` piano roll option |
| 2026-11-19 | 4: preview buttons moved into `synthpreview`, a normal dropdown plus buttons |
| 2026-11-19 | 9: `showSequenceTools`; 10: `singleTrack` |
| 2026-11-19 | 9: tool buttons sized to fit the footer |
| 2026-11-19 | 4: outlined graph labels |
| 2026-11-19 | 4: label colours as inline styles (renderer CSS overrode them) |
| 2026-11-19 | 6: separator lighter, 3 px, 16 px inset |
| 2026-11-19 | 11: `presetvalues` field; 4 (target): FM preview scaling 0–1 |
| 2026-11-19 | 11: switch back to "custom" when a preset value is edited |
| 2026-11-19 | 5/6: fix duplicated expandable inputs on load (row-end naming) |
