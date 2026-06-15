# Point And Click Adventure Engine - First Test Run v4

## How to run

Upload this whole folder to a basic static web server and open `index.html`.

For local testing, this package includes `games.js` as a direct-file fallback for browsers that block `fetch("games.json")` from `file://` URLs. If direct opening still fails, run any basic local web server in this folder, for example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Files

- `index.html` - the engine and bootloader.
- `games.json` - primary manifest listing available games on a web server.
- `games.js` - direct-file fallback manifest for local double-click testing.
- `testgame.js` - test adventure content and logic.
- `testgame/` - PNG assets for the test adventure.

## Test actions

- Walk around the fixed room.
- Hover over objects to see mouseover labels.
- Look at the coin, table, door, and caretaker.
- Take the coin.
- Talk to the caretaker.
- Select Give, then select the coin, then click the caretaker to receive a key.
- Use the key on the door to trigger the test end-game state.

## Audio scaffolding

The engine has scaffolding for room music, interaction sound effects, and optional voice files using `.mp3` or `.ogg` files. No audio files are included in this first package.
