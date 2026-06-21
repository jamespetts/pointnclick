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


python3 -m http.server 8000


Then open:


http://localhost:8000/


The optional `games.js` file exists as a direct-file fallback manifest for simple local tests, but a local web server is the recommended way to test.

## Deploying a game on a web server

A web deployment is static: no server-side code is needed.

1. Include `index.html` at the web root or chosen project root.
2. Include `games.json` listing the available games.
3. Put each game script and its assets in its own folder.
4. Upload all referenced image/audio assets.
5. Open `index.html` through HTTP/HTTPS and test every listed game.

A typical `games.json` entry looks like this:


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


Before deployment, run the validator from the project root:


python3 validator.py gameId/gameId.js --engine index.html --check-assets --report validation_report.txt


For the normal layout `gameId/gameId.js`, the validator infers `gameId/` as the asset root. If the game script is somewhere else, pass the asset folder explicitly:

python3 validator.py scripts/gameId.js --engine index.html --asset-root gameId/ --check-assets --report validation_report.txt


Fix all validator errors before deployment. Treat warnings as issues unless they are deliberately harmless and documented.

## Getting started with AI-assisted games

The known good human-guided process is **one room at a time**. Do not ask a chat AI to generate the entire game from its own reworked GDD in a single implementation step. That process has proved ineffective because the AI tends to replace the human's design control with an over-broad internal redesign.

Instead, the human should keep control of the overall game structure and provide the function of the current room and its main elements. The AI should then fill in implementation details from the GDD and API-ref.md, using the engine's canonical systems.

### 1. Write or maintain the GDD

Use GDD-template.md as the human design source. At minimum, maintain:
- title;
- setting;
- one-sentence premise or objective;
- overall style and humour/serious tone;
- player character;
- current room list or intended room sequence;
- known puzzles, objects, characters, and endings.

The GDD does not need to contain every hotspot or refusal. In the one-room workflow, the human supplies the current room's role and main elements, and the AI may fill in minor details that are consistent with the GDD.

### 2. Give the AI the authoring pack

For ordinary game-script authoring, give the AI:
- API-ref.md;
- the current game script or relevant script section;
- the completed or current GDD;
- validator.py or a recent validation report when validation is part of the task.

Do **not** give the AI index.html unless you are asking it to modify the engine itself or to run validation that needs the engine file. Game authors should use only the public API described in API-ref.md.

### 3. Work one room at a time

For each room, the human should provide a concise room brief:
- room id and display name;
- room function in the game, such as gate, puzzle room, clue room, transition, hub, payoff, or ambience;
- how the player reaches and leaves the room;
- main visible elements, NPCs, doors, objects, signs, machines, or red herrings;
- required puzzle functions or state changes in this room;
- clues or information this room should communicate;
- items that can be obtained, used, altered, or checked here;
- relevant existing flags, variables, object variables, item variables, dialogue state, or inventory state;
- whether the request is for a plan, a code change, a review, or a bug fix.

The AI should implement only the requested room or change unless the human explicitly asks for wider integration work.

### 4. Room prompt template

A useful room-by-room prompt is:

```text
Use API-ref.md as the engine contract and use the attached/current game script as the source of truth.

We are working only on room: [roomId].
Do not rewrite unrelated rooms or global systems unless required for this room's integration.

Room function:
[describe the role of the room]

Main elements:
[list important objects, NPCs, exits, signs, machines, red herrings, clues]

Required player-visible behaviour:
[list required commands, puzzle steps, state changes, transitions, dialogue, refusals]

Existing state/inventory context:
[list relevant flags, variables, object/item variables, items, dialogue state]

Please fill in reasonable minor details from the GDD.
Use declarative data, templates, effective properties/getters, dialogue trees, cutscene data, and refusals before custom scripts.
If a custom script is necessary, explain why the canonical declarative mechanisms are insufficient.
Return only the requested plan, code section, replacement file, or review.
```

### 5. What the AI should provide for a room

For a new room or substantial room revision, ask the AI for:
- a short room implementation plan;
- room hotspots, characters, transition zones, trigger zones, dialogue, and inventory links as needed;
- a state model for this room's persistent state;
- a template/effective-property decision note for important objects;
- a custom-script justification for any custom scripts;
- walkthrough command coverage for required actions in the room;
- transition continuity notes for exits and entrances;
- clueing and wrong-attempt feedback notes for non-trivial puzzles;
- functional visual legibility notes for signs, maps, terminals, diagrams, closeups, puzzle panels, overlays, and UI-like images;
- validation notes or validator output where available.

For a small fix, ask for the minimal change only, but still require the AI to preserve templates, effective properties, state ownership, and existing behaviour.

### 6. Declarative implementation expectations

In the one-room workflow, insist on these rules:
Use effective properties/getters wherever the API supports them for state-dependent text, visibility, blocking, sprites, available interactions, and refusal text.

- standard adventure objects should use templates where possible;
- state-dependent text, visibility, blocking, sprites, available interactions, and refusal text should use effective properties/getters wherever the API supports them;
- mutable state must use public engine state APIs or template runtime variables;
- template-owned runtime variables must not be duplicated with separate flags unless the separate flag has an independent story-level purpose;
- custom scripts are acceptable only for distinctive side effects, inventory changes, dialogue/cutscene starts, room changes, or puzzle logic that cannot be expressed declaratively;
- every custom script should have a brief justification.

### 7. Integrate rooms gradually

After each room is implemented:
- validate syntax and run validator.py when available;
- playtest the room's required command paths;
- test transitions into and out of the room;
- test relevant save/load state;
- check that clues, refusals, and wrong attempts make sense without reading the implementation;
- then move to the next room.

Avoid asking the AI to regenerate the whole game from a reinterpreted GDD. If a later room requires a shared state or earlier clue, make a targeted change to the earlier room instead.

### 8. Coding-harness authoring

For repository-aware automatic coding agents, use AGENTS.md. AGENTS.md should carry repository workflow rules, authoring-stage document requirements, validation commands, and handoff requirements. README.md documents the human-guided one-room process.

### 9. Validate and test

Run validator.py, fix all errors, then test in the browser. Human testing should cover:
- every room transition affected by the current change;
- all dialogue branches affected by the current change;
- all inventory actions and combinations used by the current room's puzzles;
- all cutscenes and endings affected by the current change;
- save/load before and after important state changes;
- red-herring fairness and clue-web coverage where relevant;
- functional visual legibility for maps, signs, terminals, diagrams, closeups, puzzle panels, overlays, and UI-like images.

## Folder structure

Canonical layout:

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
