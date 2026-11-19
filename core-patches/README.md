# Core and target patches

The blocks in this branch (sequencer, sound setup, presets) depend on local changes to MakeCode
that are not in the hosted editor yet. They are kept here as a backup.

- `pxt-core-pianoroll-sim.patch`: apply to microsoft/pxt at commit a0ef861 (`git apply`).
- `pxt-microbit-notam-sim.patch`: apply to the NOTAM pxt-microbit fork (`sim/state/orchestra.ts`).
- `CORE-CHANGES.md`: what each change does and why, for upstreaming.
- `START-HERE.md`, `claude-readme.md`: how to run the local workspace.
