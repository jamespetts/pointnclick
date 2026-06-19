# PointClickEngine

PointClickEngine is a browser-based game engine for early-1990s-style point-and-click adventure games. It is designed so that an AI can author complete adventure games from three documents:

- `API-ref.md` - the public authoring contract for game scripts.
- `GDD-template.md` - the human-filled Game Design Document template.
- `validator.py` - the offline validator for generated game scripts and assets.

The AI authoring workflow deliberately does **not** require the AI to see `index.html`. The engine implementation stays generic; each game is ordinary browser JavaScript data plus assets.

## What the system does

PointClickEngine provides the common machinery of a classic verb/inventory adventure:

- a 320x200 logical game screen with a room scene and lower verb/inventory interface;
- clickable room hotspots, inventory items, actors, maps, overlays, dialogue trees, cutscenes, endings, save/load, and refusal text;
- built-in templates for common adventure behaviours such as doors, keys, pickups, containers, switches, readable objects, devices, exchanges, gatekeepers, costumes, tool targets, and multi-item requirements;
- a public runtime API for game scripts, while private engine internals remain hidden;
- a validator to catch common authoring mistakes before runtime.

The project is aimed at a workflow where a human describes the game in a concise GDD, an AI creates the game script and asset plan, and the validator plus human play-testing catch integration issues.

## How to play a game

### From a web server

1. Put the whole project folder on a static web server.
2. Open `index.html` in a modern browser.
3. Choose a game from the game selector if more than one game is listed.
4. Play using the visible verbs and inventory panel.

### Local testing

Some browsers block `fetch("games.json")` from `file://` URLs. For reliable local testing, run a simple local web server from the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

The optional `games.js` file exists as a direct-file fallback manifest for simple local tests, but a local web server is the recommended way to test.

## Deploying a game on a web server

A web deployment is static: no server-side code is needed.

1. Include `index.html` at the web root or chosen project root.
2. Include `games.json` listing the available games.
3. Put each game script and its assets in its own folder.
4. Upload all referenced image/audio assets.
5. Open `index.html` through HTTP/HTTPS and test every listed game.

A typical `games.json` entry looks like this:

```json
{
  "games": [
    {
      "id": "gameId",
      "title": "Game Title",
      "script": "gameId/gameId.js",
      "assetPath": "gameId/",
      "engineApi": 1
    }
  ]
}
```

Before deployment, run the validator from the project root:

```bash
python3 validator.py gameId/gameId.js --engine index.html --check-assets --report validation_report.txt
```

For the normal layout `gameId/gameId.js`, the validator infers `gameId/` as the asset root. If the game script is somewhere else, pass the asset folder explicitly:

```bash
python3 validator.py scripts/gameId.js --engine index.html --asset-root gameId/ --check-assets --report validation_report.txt
```

Fix all validator errors before deployment. Treat warnings as issues unless they are deliberately harmless and documented.

## Getting started with AI-authored games

### 1. Write the GDD

Copy `GDD-template.md` and fill in as much or as little as needed. At minimum, provide:

- title;
- setting;
- one-sentence premise or objective;
- overall style and humour/serious tone;
- player character.

Use `default` where the AI should decide and `none` where something must not appear. Copy the repeating blocks for rooms, characters, puzzles, objects, cutscenes, and endings as needed.

### 2. Give the AI the authoring pack

For game-script authoring, give the AI:

- `API-ref.md`;
- the completed GDD;
- `validator.py` or the validator report format/instructions.

Do **not** give the AI `index.html` unless you are asking it to modify the engine itself. Game authors should use only the public API described in `API-ref.md`.

### 3. Ask the AI for the standard deliverables

The AI should produce:

- implementation notes and assumptions;
- a `games.json` entry or complete manifest;
- `gameId/gameId.js`;
- an asset manifest;
- actual assets or exact placeholder specifications;
- `style_reference_sheet.png` for consistent future asset generation, unless disabled by the GDD;
- a puzzle dependency graph or walkthrough;
- the validator command and report;
- a runtime test plan.

### 4. Validate and test

Run `validator.py`, fix all errors, then test in the browser. Human testing should cover:

- every room transition;
- all dialogue branches;
- all inventory actions and combinations used by puzzles;
- all cutscenes and endings;
- save/load before and after important state changes.

## Folder structure

Canonical layout:

```text
index.html
README.md
API-ref.md
GDD-template.md
validator.py
games.json
games.js                         optional local fallback manifest
gameId/gameId.js
gameId/rooms/*.png
gameId/characters/*.png
gameId/objects/*.png
gameId/ui/*.png
gameId/music/*
gameId/sounds/*
```

### Important files

- `index.html` - the generic browser engine and bootloader.
- `API-ref.md` - the public game-authoring API and data contract. Give this to the AI authoring a game.
- `GDD-template.md` - the template a human fills in to describe a game.
- `validator.py` - dependency-free validator for generated game scripts.
- `games.json` - primary web-server manifest listing available games.
- `games.js` - optional direct-file fallback manifest for local testing.
- `gameId/gameId.js` - one registered game definition.
- `gameId/rooms/` - room, title, and ending backgrounds.
- `gameId/characters/` - character spritesheets.
- `gameId/objects/` - object sprites, inventory icons, overlays, maps, and ending animations.
- `gameId/ui/` - optional UI images.
- `gameId/music/` - room/menu/ending music.
- `gameId/sounds/` - sound effects and voice files.

## Asset basics

- Image assets must be PNG files.
- Prefer bare filenames in game definitions; the engine resolves them into role folders.
- Do not use absolute paths, `..`, backslashes, remote URLs, `data:` URLs, or protocol-relative URLs.
- Room backgrounds are normally 320x136 PNG.
- Title and ending backgrounds are normally 320x200 PNG.
- Character and animated object images are spritesheets.
- Inventory icons are drawn in small inventory cells; 16x16 or smaller is usually best.
- Audio can use browser-supported formats such as `.ogg`, `.mp3`, or `.wav`.

## What humans should know

- A game script should call `PointClickEngine.RegisterGame({...})` exactly once.
- The manifest `id` should match the registered game id.
- `assetPath` belongs in `games.json`, not in the game script.
- Mutable puzzle state should use the public engine state APIs or template runtime variables, not ad-hoc JavaScript globals.
- Standard adventure behaviours should use templates before custom scripts.
- If a design cannot be expressed using `API-ref.md`, treat it as an engine-extension request.

## Local test adventure

If this package includes a test game, use it as a quick smoke test of the engine. Typical test actions are:

- walk around the room;
- hover over objects to see labels;
- look at hotspots and characters;
- take an inventory item;
- talk to an NPC;
- use or give an item to solve a simple puzzle;
- trigger an ending.

The exact content depends on the test game included in the package.

## Audio

The engine supports room music, menu/ending music, sound effects, and optional voice files. Games may omit audio; silence is valid where no audio is specified.
