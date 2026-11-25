# Start here

Everything below is available as a VS Code task: **Cmd+Shift+P → "Tasks: Run Task"**, then pick one.
(Defined in `.vscode/tasks.json`. This only works with the `pxt-workspace` folder open in VS Code.)

## Start the editor

1. Run the task **Server: Start (or restart)**. It stops any old server first.
2. Wait for `To launch the editor, open this URL:` and Cmd+click the link it prints
   (`http://localhost:3232/#local_token=...`). Leave that terminal open: closing it stops the server.
3. Click the simulator once, so the browser allows sound.

**Stop the server:** task **Server: Stop** (or Ctrl+C in its terminal).

Without tasks, the same start command in a terminal:
```bash
cd ~/code/pxt-workspace/pxt-microbit-notam
node ../pxt/built/pxt.js serve --no-browser --localRepo preglow/pxt-synth-sim=$HOME/code/pxt-workspace/pxt-synth-sim
```

## After changing code

| You changed | Task to run | Then |
|---|---|---|
| `pxt-synth-sim/` (the extension) | none | reload the editor page |
| `pxt/` (MakeCode core: blocks, piano roll) | **Build: Core (webapp)** | reload |
| `pxt/theme/*.less` or `pxt/pxtlib/` | **Build: Core (full, for styles and pxtlib)** | reload |
| `pxt-microbit-notam/sim/` (simulator) | none while the server runs: it rebuilds on save (a few seconds). If it isn't running: **Build: Simulator** | reload |
| `pxt-microbit-notam/sim/state/worklet/` (audio worklet) | **Build: Simulator audio worklet** | reload |
| `pxt-synth-sim/tools/presets.txt` (sound presets) | **Build: Sound presets** | reload |

**Check: Type-check extension** quickly checks the extension's TypeScript without a full build.

## More

- `claude-readme.md`: how the workspace fits together, gotchas.
- `CORE-CHANGES.md`: everything changed in MakeCode core and the micro:bit target.
- `tools/browser-tests/`: scripts that test the editor in a headless Chrome (see the README there).
- Keep this folder out of iCloud-synced folders (~/Documents, ~/Desktop): offloaded files make builds hang.
