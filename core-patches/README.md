# Core and target patches

The blocks on this branch (sequencer, sound setup, presets) depend on changes to MakeCode itself, not just to
this extension. Those changes live in two repos we don't own, so they are kept here as patch files.
**Without them the new blocks will not work** (in makecode.microbit.org or makecode.notam.org as they are today).

| Patch | Applies to | Base commit |
|---|---|---|
| `pxt-core-pianoroll-sim.patch` | MakeCode core, https://github.com/microsoft/pxt | `a0ef861` |
| `pxt-microbit-notam-sim.patch` | NOTAM micro:bit target, https://git.notam.no/thomj/pxt-microbit (only `sim/state/orchestra.ts`) | `58f9e26b` |

Other files:

- `CORE-CHANGES.md`: what each change does, why, and notes for proposing it upstream (Microsoft / Micro:bit
  Educational Foundation).
- `START-HERE.md`, `claude-readme.md`: how to run the editor locally and the gotchas. Paths in them refer to the
  local workspace `~/code/pxt-workspace`, which holds all three repos side by side.

## These are snapshots

A patch file is a list of differences, not a copy of the code. The files here are copied from the workspace each
time this repo is committed, so they match the extension code in the same commit. If they look out of date, the
current originals are in the root of the local workspace.

## Rebuilding the workspace from scratch

```bash
mkdir -p ~/code/pxt-workspace && cd ~/code/pxt-workspace
git clone https://github.com/microsoft/pxt && (cd pxt && git checkout a0ef861 && git apply ../pxt-synth-sim/core-patches/pxt-core-pianoroll-sim.patch)
git clone https://git.notam.no/thomj/pxt-microbit pxt-microbit-notam && (cd pxt-microbit-notam && git checkout 58f9e26b && git apply ../pxt-synth-sim/core-patches/pxt-microbit-notam-sim.patch)
git clone -b sequencer-and-presets https://github.com/CaptainCredible/pxt-synth-sim
```

(Clone pxt-synth-sim first, or adjust the patch paths.) Then build and link as described in `claude-readme.md`.
