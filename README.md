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

Copy GDD-template.md and fill in as much or as little as needed. At minimum, provide:
- title;
- setting;
- one-sentence premise or objective;
- overall style and humour/serious tone;
- player character.

Use `default` where the AI should decide and `none` where something must not appear. Copy the repeating blocks for rooms, characters, puzzles, objects, cutscenes, and endings as needed.

### 2. Choose the authoring mode

PointClickEngine supports two practical AI authoring modes:

1. **Coding-harness authoring**, for tools such as Codex that can read and edit the repository, run commands, run validator.py, and iterate on failures.
2. **Manual staged chat authoring**, for chat environments where the human must ask for one authoring stage at a time.

Do not assume that a chat model will reliably manage the whole multi-stage process by itself. In manual staged chat authoring, use the prompts below. In coding-harness authoring, use AGENTS.md and the repository validation commands.

### 3. Give the AI the authoring pack

For ordinary game-script authoring, give the AI:
- API-ref.md;
- the completed GDD;
- validator.py, or the validator report format/instructions.

Do **not** give the AI index.html unless you are asking it to modify the engine itself or to run validation that needs the engine file. Game authors should use only the public API described in API-ref.md.

### 4. Manual staged chat authoring

Use this section when working in a chat interface where the AI cannot reliably maintain its own multi-step authoring state. Ask for one stage at a time. Do not ask for the whole game in one prompt.

At every stage, provide the latest relevant files or outputs from previous stages. If the AI starts generating later-stage files too early, stop and repeat the current stage prompt.

#### Stage 1 prompt - intake and assumptions

```text
You are authoring a PointClickEngine game. Use API-ref.md and the completed GDD.

For this reply only, perform Stage 1: intake and assumptions.

Do not generate game code, assets, registry files, or package archives.

Output:
1. GDD summary.
2. Missing or ambiguous information.
3. Assumptions that let you proceed without changing the GDD's intent.
4. Any engine-extension needs.
5. A concise list of files you will need in later stages.

End by saying whether I should ask for Stage 2 or answer clarification questions.
```

#### Stage 2 prompt - pre-implementation plan

```text
Proceed to Stage 2: pre-implementation plan.

Do not generate game code, assets, registry files, or package archives.

Using the Stage 1 assumptions and the GDD, output:
1. Normalised design plan.
2. Content-role and required-depth plan.
3. Room graph.
4. Puzzle dependency graph.
5. Dialogue plan.
6. Transition continuity matrix.
7. Walkthrough command coverage matrix.
8. Clue gradient audit.
9. Functional visual legibility plan.
10. State model.
11. Registry strategy.
12. Initial asset and audio requirements.

End by asking me to approve the plan or request revisions.
```

#### Stage 3 prompt - revise the plan, if needed

```text
Revise the Stage 2 plan using these notes:

[insert notes]

Do not generate game code, assets, registry files, or package archives.

Output only the revised sections and a short list of consequences for later stages.
```

If the Stage 2 plan is acceptable, skip this revision prompt and proceed to Stage 4.

#### Stage 4 prompt - asset, visual, and audio planning

```text
The Stage 2 plan is approved. Proceed to Stage 4: asset, visual, and audio planning.

Do not generate the game script yet.

Output:
1. Visual style brief.
2. style_reference_sheet specification or generated style reference if available.
3. Asset manifest with visual acceptance notes.
4. Music cue manifest.
5. Sound-effect manifest.
6. Notes on any assets that cannot be generated in this environment.
7. Exact instructions for replacing temporary silence or placeholder assets later.

End by asking me to approve the asset/audio plan or request revisions.
```

#### Stage 5 prompt - implementation

```text
The Stage 2 plan and Stage 4 asset/audio plan are approved.

Proceed to Stage 5: implementation generation.

Generate the game script and any files/assets that this environment can actually produce.

Rules:
- Use unique filenames for generated files.
- Do not generate replacement games.json or games.js unless I supplied the current files.
- If binary image/audio generation is unavailable, create specifications or clearly labelled prototype assets only.
- Use templates and declarative data before custom scripts.
- Keep all mutable game state in public engine state or template runtime variables.

Output downloadable files plus implementation notes.
```

#### Stage 6 prompt - validation and fixes

```text
Proceed to Stage 6: self-validation and quality/depth review.

Use the exact files generated in Stage 5.

Run or simulate the required validation as far as this environment allows:
1. API-contract validation.
2. Structural validator, if validator.py and index.html are available.
3. Walkthrough command coverage check.
4. Transition continuity check.
5. Dialogue escape check.
6. Linked item look/read check.
7. Clue gradient check.
8. Functional visual legibility check.
9. Quality/depth review.
10. Runtime test plan.

If any issue is found, fix it before handoff and regenerate files with unique filenames.
```

#### Stage 7 prompt - handoff

```text
Proceed to Stage 7: handoff.

Provide:
1. Links to final generated files.
2. Implementation notes.
3. Asset/audio manifest.
4. Walkthrough.
5. Walkthrough command coverage matrix.
6. Transition continuity matrix.
7. Clue gradient audit.
8. Functional visual legibility audit.
9. Quality/depth validation report.
10. Structural validation report.
11. Runtime test plan.
12. Registry snippets or merged registry files if I supplied the current registry.

Do not claim that any validator or runtime test passed unless it was actually run.
```

### 5. Coding-harness authoring

Use this mode with a repository-aware coding agent that can edit files and run commands. Place AGENTS.md at the repository root and ask the coding agent to follow it.

A suitable coding-harness task is:

```text
Create a new PointClickEngine game from the completed GDD using API-ref.md.

Follow AGENTS.md exactly.

First create the authoring stage files in docs/authoring:
- 01_intake.md
- 02_plan.md
- 03_asset_audio_plan.md

Then generate the implementation under the new game folder only after those files exist.

Run validator.py with the generated game and write the validation report.

Fix all validator errors and any serious semantic issues listed in AGENTS.md before final handoff.

Do not modify games.json or games.js unless those files are supplied and the task explicitly asks for a merge.
```

A coding harness can reduce the manual burden because it can create intermediate files, run validator.py, and iterate on failures. It still needs clear repository instructions, reliable validation commands, and review of the final game.

### 6. Validate and test

Run validator.py, fix all errors, then test in the browser. Human testing should cover:
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
