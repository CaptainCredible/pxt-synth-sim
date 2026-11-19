# Start here

## Start the editor

1. In VS Code: **Terminal → New Terminal**, then paste:
   ```bash
   cd ~/code/pxt-workspace/pxt-microbit-notam
   node ../pxt/built/pxt.js serve --no-browser --localRepo preglow/pxt-synth-sim=$HOME/code/pxt-workspace/pxt-synth-sim
   ```
2. Wait for `To launch the editor, open this URL:` and open the link it prints
   (`http://localhost:3232/#local_token=...`). Leave the terminal open: closing it stops the server.
3. Click the simulator once, so the browser allows sound.

**Stop the server:** Ctrl+C in that terminal (or `pkill -f "pxt.js serve"` from any terminal).
**"Port 3232 busy":** a server is already running. Just open the link, or stop it and start again.

## After changing code

| You changed | Do this |
|---|---|
| `pxt-synth-sim/` (the extension) | reload the editor page |
| `pxt/` (MakeCode core) | `cd ~/code/pxt-workspace/pxt && npx gulp webapp`, then reload |
| `pxt/theme/*.less` (core styles) | `cd ~/code/pxt-workspace/pxt && npm run build`, then reload |
| `pxt-microbit-notam/sim/` (simulator) | `cd ~/code/pxt-workspace/pxt-microbit-notam && node ../pxt/built/pxt.js buildsimjs` (ignore the error at the end), then reload |
| `pxt-synth-sim/tools/presets.txt` (sound presets) | `cd ~/code/pxt-workspace/pxt-synth-sim && python3 tools/presets_to_ts.py`, then reload |

## More

- `claude-readme.md`: how the workspace fits together, gotchas.
- `CORE-CHANGES.md`: everything changed in MakeCode core and the micro:bit target.
- `tools/browser-tests/`: scripts that test the editor in a headless Chrome (see the README there).
- Keep this folder out of iCloud-synced folders (~/Documents, ~/Desktop): offloaded files make builds hang.
