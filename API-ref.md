# PointClickEngine API Reference for AI Game Authors

Engine API: 1
Authoring language: browser JavaScript in a `.js` game script.

This is the complete public authoring contract for game scripts. The authoring AI will not receive the game engine itself. Use only the APIs, data shapes, templates, and validation rules documented here. If a requested design cannot be expressed with this contract, say that the engine needs an extension and specify what it is.

Examples use indented plain text blocks labelled `EXAMPLE_START` / `EXAMPLE_END`; no fenced code blocks are used so this file can be embedded in prompts safely.

This document is deliberately limited to the public game-authoring API and data contract. Human-guided authoring workflow and repository-agent operating rules belong outside this API reference.

## 1. Genre, Mental Model, and Authoring Priorities

PointClickEngine creates early-1990s point-and-click adventure games in the style of SCUMM-era adventures: a 320x200 logical screen, painted room scene, lower verb/inventory interface, clickable hotspots, walking actors, inventory puzzles, dialogue trees, simple sprite animations, overlays/maps, cutscenes, save/load, refusals, and multiple endings.

Author in this priority order:

1. Declarative data.
2. Templates.
3. Effective properties and getter scripts.
4. Dialogue trees and cutscene step data.
5. Custom JavaScript scripts only for distinctive logic that cannot be represented above.

This priority order is mandatory. A locally working custom script is not acceptable when the same behaviour can be expressed by declarative data, a template, an effective property/getter, a dialogue action, a cutscene step, or refusal data.

Do not implement custom rendering, movement loops, inventory UI, dialogue UI, save/load systems, or timer-driven cutscene systems.


## 2. Core Authoring Principles for This Engine

This engine has one canonical path for each major gameplay system. An authoring AI should design content so it flows through these paths rather than inventing parallel systems.

- One canonical state path: store mutable puzzle state only through public flags, variables, scoped variables, room/character/object state, object variables, or template-owned runtime variables. Do not create unsaved ad-hoc JavaScript state for anything that must survive save/load or reset.
- One canonical interaction dispatcher: player clicks, verbs, inventory use, refusals, template actions, and custom interaction scripts should all flow through `interactions` and the public `api` object.
- One canonical room-transition model: use `transitionZones` for room changes. A door template controls open/closed/locked/blocking state; it does not itself change rooms unless custom script logic explicitly calls `api.ChangeRoom()`.
- One canonical dialogue model: use `dialogueTrees` for branching conversation. Use scripts only for dialogue logic that cannot be expressed with dialogue conditions/actions.
- One canonical cutscene model: use `api.StartCutscene()` or `api.QueueCutscene()` with documented step objects. Do not use browser timers for story sequencing.
- One canonical inventory model: define inventory items in `items`, give/take them with public inventory APIs or templates, and let the engine render/hit-test inventory.
- One canonical save/load model: if a value matters after save/load, it must be stored in public engine state. The engine owns serialization.
- Prefer validator-checkable structures over clever custom scripts. If a puzzle can be expressed as a template, dialogue action, cutscene step, or effective property, use that rather than script code.

Decision process for authoring an interaction:

- If the object is a standard adventure-game object such as a door, key, pickup, container, switch, readable, device, barrier, furniture, map, exchange, combination, tool target, costume, clue, multi-item target, gatekeeper, or distractible NPC/object, start with a template.
- If the object's behaviour depends on current state, first try an effective property or template runtime variable.
- If the behaviour is a conversation branch, use a dialogue tree condition/action.
- If the behaviour is a sequence of presentation/movement/state changes, use a cutscene.
- Use a custom script only for distinctive game-specific logic that cannot be expressed by the above.


Declarative architecture rule:
- A game script is architecturally valid only if standard behaviours use the canonical engine mechanism: declarative data, then templates, then effective properties/getters, then dialogue/cutscene data, and finally custom scripts only when the behaviour cannot be represented above.
- State-dependent text, visibility, blocking, sprites, available interactions, transitive-use behaviour, and refusal text should be authored as effective properties/getters wherever the API supports them.
- A custom interaction script is appropriate only when the command has side effects or control flow that cannot be represented by templates, effective properties, dialogue actions, cutscene data, or refusals.
- If an entity overrides an interaction contributed by its template, the override should be intentional and should not merely duplicate the template's standard behaviour.

## 3. Glossary of Engine Concepts

Declarative data means object, room, item, dialogue, cutscene, and template definitions written as data fields in the game definition. Declarative data is preferred because it is validator-checkable and uses the engine's canonical systems.

An entity is anything the engine can query for properties or interactions: rooms, room hotspots/objects, inventory items, characters, and overlay targets.

A room object or hotspot is an entry in `room.hotspots`. It is both a clickable target and, when it has geometry, a possible movement/rendering participant. Its `id` is globally scoped because saved object state is keyed by object id across the whole game.

An inventory item is an entry in `game.items`. It can be carried in inventory and can also act as an interaction target. A room object may link to an inventory item with `itemId` so world and carried forms can share text, refusals, and behaviour. By default, general Look At/readable text for a world object linked by `itemId` is resolved from the world object first and then from the linked inventory item; authors override the shared text by giving the world object its own `defaultText`, `description`, relevant getter, `readText`, `lookOverlay`, or `closeupOverlay`.

An overlay target is a clickable target inside an overlay or map. Overlay targets use ordinary interaction ideas, but they exist only while the overlay is active.

An interaction is a mapping from a verb id, such as `lookAt` or `use`, to either a named script or a template action. Interactions describe what happens when a player performs a verb on a target.

A refusal is fallback text for a verb that cannot be performed. Refusals prevent the authoring AI from writing unnecessary scripts that only say "you cannot do that".

A template action is an engine-provided behaviour referenced with `template:templateName.actionName` in an interaction field. Do not call private template internals directly.

An action result is the plain object returned by movement, cutscenes, animation callbacks, and `api.MakeActionResult()`. It records status, reason, actor/target ids, room id, and whether a cutscene should continue.

A callback result override is an effective property (`callbackStatus`, `callbackResult`, or `callbackResults`) that lets data/templates standardise how callbacks report success, blocking, cancellation, transition, or ending.

A lifecycle guard is the engine's protection against stale callbacks. Deferred callbacks from old movement, room, dialogue, cutscene, load, new-game, ending, or animation operations are ignored after they are superseded.

A scoped variable is saved state attached to a room, character, or item. Use it for persistent state that belongs to one of those scopes.

An object variable is saved state attached to a room object/hotspot id. Use it for persistent state local to a world object, especially template runtime variables.

Object state is saved state that can directly override effective properties of a room object. Use it deliberately when you want fields such as `hidden`, `sprite`, `open`, or similar authored/effective values to be overridden at runtime.

A const getter computes an effective property without changing state. A mutable getter can change saved state, but should be used only when computing the property genuinely must update saved state.

A template-owned runtime variable is an object/item variable used by a template, such as `open`, `locked`, `taken`, `emptied`, `used`, `fixed`, `opened`, `worn`, `distracted`, or `delivered_itemId`. Do not duplicate these with separate flags unless a separate story-level flag is genuinely needed.

Validator-checkable means the validator can inspect the structure: referenced ids, script names, asset paths, templates, hooks, dialogue nodes, and many geometry fields. Prefer these structures so errors are caught before runtime.

## 4. Screen, Coordinates, Verbs, and UI
Screen:

- Canvas logical size: `320x200`.
- Scene area: `x 0..319`, `y 0..135`.
- Lower command/inventory UI: `x 0..319`, `y 136..199`.
- Coordinates in all author data and scripts are logical pixels.
- Room backgrounds should normally be `320x136` PNG.
- Title/end backgrounds should normally be `320x200` PNG.

Default verb ids and labels:

- `walkTo` / `Walk to`.
- `lookAt` / `Look at`.
- `take` / `Take`.
- `give` / `Give`.
- `talkTo` / `Talk to`.
- `open` / `Open`.
- `close` / `Close`.
- `use` / `Use`.

Pointer shortcuts:

- Right-click or option/alt-click in the scene performs `walkTo`.
- Middle-click performs `lookAt` for scene, overlay, and inventory targets.

Presentation:

- `api.Say()` shows spoken dialogue above the speaking actor where possible.
- `api.Narrate()`, descriptions, dialogue choices, and non-speaker text use the lower UI panel.
- Dialogue/cutscenes block command UI while active.
- Inventory is engine-owned, scrollable, and centrally hit-tested.
- Text is rendered by the engine bitmap font. Supported glyphs are letters A-Z and a-z, digits, space, and common punctuation: `.`, `,`, `:`, `;`, `!`, `?`, `-`, `+`, `%`, `/`, `(`, `)`, `>`, `<`, `*`, `_`, `'`, and double quote. Unsupported glyphs render as `?`. Prefer plain ASCII text unless the engine is extended.
- Actor `x`/`y` coordinates are foot/baseline points; actor sprites draw centred on `x` and above `y`. Hotspot/object `x`/`y` coordinates are top-left drawing coordinates.


## 5. Files, Manifest, Assets, and Registration

Folder layout:

EXAMPLE_START
index.html
validator.py
games.json
games.js                         optional direct-file fallback
gameId/gameId.js
gameId/rooms/*.png
gameId/characters/*.png
gameId/objects/*.png
gameId/ui/*.png
gameId/music/*
gameId/sounds/*
EXAMPLE_END

`games.json`:

EXAMPLE_START
{
  "games": [
    { "id":"gameId", "title":"Game Title", "script":"gameId/gameId.js", "assetPath":"gameId/", "engineApi":1 }
  ]
}
EXAMPLE_END

`games.js` fallback:

EXAMPLE_START
PointClickEngine.RegisterManifest({
  games:[
    { id:'gameId', title:'Game Title', script:'gameId/gameId.js', assetPath:'gameId/', engineApi:1 }
  ]
});
EXAMPLE_END

Manifest game entry fields:

- `id:string`: must match the registered game id.
- `title:string`: selector title.
- `script:string`: path to game script relative to `index.html`.
- `assetPath:string`: asset base folder, normally `gameId/`.
- `engineApi:number`: must be `1`.

Registry file merge workflow:
- `games.json` and `games.js` are site registry files, not ordinary per-game source files. If current registry files already exist and have not been supplied in the same request, the authoring AI must not invent replacement `games.json` or `games.js` files and must not present new registry files as safe drop-in replacements.
- When existing registry files are not supplied, output a registry entry snippet for `games.json` and, where the direct-file fallback is used, a `games.js` entry snippet. Then explicitly ask the human to upload the current `games.json` and `games.js` in the next turn so the AI can merge the new entry while preserving existing games.
- If the human requests a standalone test package, the AI may also output uniquely named standalone harness files such as `games_standalone_gameId_v1.json` and `games_standalone_gameId_v1.js`. These must be labelled standalone-only and must not be named `games.json` or `games.js` unless the existing registry files were supplied and merged.
- When the current registry files are supplied, merge by preserving all existing entries, adding exactly one entry for the new game id, avoiding duplicate ids, preserving comments/formatting where practical, and writing uniquely named merged outputs for human review rather than overwriting originals.

Asset path validation:

- Images must end in `.png`.
- Use relative paths inside the game asset folder.
- Do not use absolute paths, `..`, backslashes, `data:` URLs, remote URLs, or protocol-relative URLs.
- Prefer bare filenames. Explicit canonical paths are allowed only if they match the correct role folder.

Role folders:

- `roomBackground`, `titleBackground`, `endBackground`: `rooms/`.
- `character`: `characters/`.
- `itemIcon`, `itemWorld`, `hotspot`, `overlay`, `map`: `objects/`.
- `ui`: `ui/`.
- `music`: `music/`.
- `sound`, `voice`: `sounds/`.

Field roles:

- `background`: room background.
- `titleBackground`: title background.
- `endBackground`: ending background.
- `sprite`, `closedSprite`, `openSprite`, `emptySprite`, `fullSprite`, `onSprite`, `offSprite`: hotspot/object image.
- `icon`: inventory icon.
- `worldSprite`: world/object fallback for an inventory item.
- `image`, `animationImage`, `closeupImage`: overlay unless documented for map/end animation.
- `map.image`, `mapImage`: map image.

Asset size and image authoring constraints:

- All image assets must be PNG files. Use transparency for character, object, inventory icon, and overlay elements that should not cover their rectangular bounds.
- Room backgrounds and ordinary overlay/map images are drawn in the scene area and should be 320x136.
- Title and ending backgrounds are drawn on the full canvas and should be 320x200. The title/menu renderer then covers `y=136..199` with the menu/UI panel colour, so keep essential title art in `y=0..135` unless it is meant to be hidden by menus.
- UI verb/inventory background is drawn at y=136 and should be 320x64.
- Character and object animations are spritesheets. Each frame is `frameW` x `frameH` pixels, arranged left to right.
- Character spritesheets use `frameW`/`frameH` cells. Directional sprites use rows in this order: down, left, right, up; animation `rowOffset` adds rows before the facing row is applied. Character `x`/`y` is the foot point, so leave transparent space above/around the figure as needed.
- Object/hotspot spritesheets use row 0 only for ordinary object animation; object `x`/`y` is the top-left of the drawn frame. Ending animations may use `animation.row`.
- Inventory icons are drawn in 21x21 inventory cells and are scaled down, not up, to `ui.inventoryIconMaxW`/`ui.inventoryIconMaxH`, default 16x16. Author icons at or below 16x16 unless intentionally relying on downscaling.
- Ending animation images are PNG spritesheets in `objects/` because the engine resolves `ending.animation.image` with the hotspot/object image role.
- Dynamic image constraint: the engine preloads only images referenced in documented image fields of the game definition. If a script, getter, template effect, or `SetObjectState` can ever switch to an image path, that path must also be referenced in a preloaded field such as `sprite`, `closedSprite`, `openSprite`, `emptySprite`, `fullSprite`, `onSprite`, `offSprite`, `worldSprite`, `icon`, overlay `image`, map `image`, or ending animation `image`. Otherwise the image may not render at runtime.

Audio:

- Music resolves under `music/`; sound and voice resolve under `sounds/`.
- Music and sound source-list fields must be arrays of relative filenames; the current engine uses the first element. Use `[]` for silence.
- Public `api.PlaySound()` and cutscene sound steps should be given an array, normally with one filename. Do not pass a bare string to `api.PlaySound()`; the current engine's low-level sound player indexes the first array element. Template `rule.sound` may be a string because template effect handling wraps it into an array before playing.
- Voice fields/options are a single relative filename string, not an array.
- Use browser-supported audio file types such as `.ogg`, `.mp3`, or `.wav`. The engine does not validate audio extensions.
- Music loops until replaced or stopped; sound effects and voice are one-shot.

## 6. Public Browser Facade: Exact Method Contracts

Use these only before runtime/for diagnostics. Runtime gameplay scripts use the `api` object documented later.

### `PointClickEngine.RegisterGame(gameDefinition:object) -> internal return; do not rely on it`

Registers a game definition by `gameDefinition.id`.

Validation and behaviour:

- Throws if `gameDefinition` is missing.
- Throws if `gameDefinition.id` is missing.
- Does not perform full game validation immediately; validation occurs when the game is loaded.

### `PointClickEngine.RegisterManifest(manifestDefinition:object) -> internal return; do not rely on it`

Stores the direct-file fallback manifest. Expected shape: `{games:[{id,title,script,assetPath,engineApi:1}]}`.

### `PointClickEngine.GetEngineApiVersion() -> number`

Returns `1`.

### `PointClickEngine.GetSaveDataVersion() -> number`

Returns the current save-data schema version.

### `PointClickEngine.GetPublicCapabilities() -> object`

Returns a plain object containing arrays named `registration`, `metadata`, `scriptApi`, `getterApi`, and `templates`. Use for diagnostics/tooling only; do not treat it as game state.

### `PointClickEngine.GetDiagnostics() -> string`

Returns a diagnostic report containing engine/save versions, game id, current mode, current room, selected verb/item, boot error if present, and recent debug messages.

### `PointClickEngine.CopyDiagnosticsToClipboard() -> string`

Returns the same diagnostic report and attempts to copy it to the clipboard if the browser permits it.


## 7. Game Script and Top-Level Game Definition

A game script must register one game:

EXAMPLE_START
'use strict';

PointClickEngine.RegisterGame({
  id:'gameId',
  title:'Game Title',
  author:'Author Name',
  engineApi:1,
  startRoomId:'startRoom',
  player:{id:'player',spriteId:'player',x:80,y:112,facing:'down',speed:48},
  sprites:{},
  characters:{},
  items:{},
  rooms:{},
  dialogueTrees:{},
  scripts:{},
  hooks:{},
  defaultRefusals:{},
  endings:{},
  ui:{},
  rendering:{imageSmoothing:false}
});
EXAMPLE_END

Top-level fields read by the engine:

- `id:string`: required.
- `title:string`.
- `author:string`.
- `engineApi:number`: expected `1`.
- `startRoomId:string`: required and must key `rooms`.
- `player:object`: initial player actor.
- `sprites:object`: sprite definitions keyed by sprite id.
- `characters:object`: reusable character definitions keyed by id.
- `items:object`: inventory item definitions keyed by id.
- `rooms:object`: room definitions keyed by id; required.
- `dialogueTrees:object`: dialogue trees keyed by id.
- `scripts:object`: script functions keyed by script name.
- `hooks:object`: game-level lifecycle hook map.
- `defaultRefusals:object`: fallback refusal text by verb id.
- `endings:object`: endings keyed by id.
- `ui:object`: UI styling.
- `rendering:{imageSmoothing:false}object`: rendering configuration.
- `imageSmoothing:boolean`: alias for `rendering.imageSmoothing`.
- `characterScale` or `perspectiveScale`: optional game-level actor perspective scaling fallback; see geometry section.
- `titleBackground:string`: PNG in `rooms/`.
- `endBackground:string`: PNG in `rooms/`.
- `titleMusic:array`, `menuMusic:array`, `endMusic:array`: music source lists; use arrays, normally with one filename.

Do not author runtime-added fields such as `assetPath` or `initialRooms` in the game script. `assetPath` belongs in the manifest.


## 8. Rooms, Geometry, Transitions, and Triggers
  
Rooms are stored in `game.rooms` as an object keyed by room id. The key is the canonical id. If a room object contains `id`, it should match the key.

Room syntax with explicit/bespoke geometry:
EXAMPLE_START
rooms:{
  startRoom:{
    name:'Start Room',
    background:'start_room.png',
    music:['start_theme.ogg'],
    walkableArea:{x:0,y:80,w:320,h:56},
    walkBoxes:[{id:'floor',x:0,y:80,w:320,h:56,links:['doorNode']}],
    blockers:[{id:'crateBlocker',rect:{x:120,y:92,w:32,h:20},onBump:'bumpCrate'}],
    walkGraph:{nodes:[{id:'a',x:40,y:112},{id:'b',x:220,y:112}],edges:[['a','b']]},
    characterScale:{farY:86,nearY:134,farScale:0.72,nearScale:1.15},
    hotspots:[],
    characters:[],
    transitionZones:[],
    triggerZones:[],
    beforeEnter:'beforeStartEnter',
    afterEnter:'afterStartEnter',
    beforeExit:'beforeStartExit',
    afterExit:'afterStartExit'
  }
}
EXAMPLE_END

Room syntax using a walkability template plus additive detail:
EXAMPLE_START
rooms:{
  serviceCorridor:{
    name:'Service Corridor',
    template:'corridor',
    background:'service_corridor.png',
    floorBand:{x:0,y:116,w:320,h:18},
    exits:[{id:'leftExit',side:'left',targetRoomId:'leftCorridor',targetX:300,targetY:124,targetFacing:'left'}],
    blockers:[{id:'fallenPanel',rect:{x:150,y:116,w:18,h:18}}],
    hotspots:[]
  }
}
EXAMPLE_END

### 8.1 Mandatory authoring rule: use room walkability templates first

Walkability templates are the preferred starting point for ordinary room movement. They are defaults, not a replacement for bespoke geometry: authored blockers, transitionZones, triggerZones, door portals, object footprints, walkBoxes, and walkGraph may still add detail. Use `replaceTemplateWalkBoxes:true`, `replaceGeneratedWalkBoxes:true`, or `manualWalkability:true` only when generated walk boxes must be replaced.

Use `corridor`, `room`, `path`, `bridge`, `junction`, or `stair` for ordinary rooms. Only hand-author all `walkBoxes`/`walkGraph` when a template plus blockers/exits cannot express the background image. If runtime testing shows that the deployed engine is not applying room-template geometry, keep the template metadata for forward compatibility but also author explicit `walkableArea`, `walkBoxes`, `walkGraph`, and `transitionZones`.

Room fields:
- `id:string`: optional, should match room key.
- `name:string`, `displayName:string`.
- `template`, `templateId`, `kind`, `templates`: may include `corridor`, `room`, `path`, `bridge`, `junction`, or `stair`.
- `background:string`: PNG in `rooms/`; warned if missing.
- `music:array`: room music source list; use an array, normally with one filename.
- `start:{x:number,y:number,facing:string}`: content-defined default start point for authoring/scripts; the engine does not automatically apply it on room entry.
- `playerStart:{x:number,y:number,facing:string}`: content pattern for scripts; room entry uses current player coordinates unless `api.ChangeRoom()` or a transition zone passes target coordinates. Initial new-game position comes from `game.player.x/y/facing`.
- `walkability` or `layout`: optional room-template configuration object.
- `floor`, `floorBand`, `walkFloor`, `walkableArea`: common main floor rectangle fields used by room templates. `walkableArea` is also the legacy fallback walk rectangle and validation area.
- `exits` or `portals`: room-template exit list. Each exit may define `id`, `side`/`edge`, `rect`, `targetRoomId`/`roomId`, `targetX`, `targetY`, `targetFacing`/`facing`, `script`, `enabledFlag`, `disabledFlag`, `enabledObjectId`, `enabledProperty`, `beforeTransition`, `afterTransition`.
- `pathPoints` or `path` plus `pathWidth` or `width`: centre-line geometry for `path`, `bridge`, and `stair` templates.
- `central` and `branches`: junction-template central floor and branch rectangles.
- `walkableArea:{x:number,y:number,w:number,h:number}`: fallback walk rectangle and validation area. If no `walkBoxes`/`walkAreas` are supplied and no active template supplies walk boxes, the engine creates one walk box from `walkableArea`; if `walkableArea` is also absent, the fallback is `{x:0,y:80,w:320,h:56}`.
- `walkBoxes:array`: preferred explicit walkable shapes. Entries may be bare rectangles, `{rect:{x,y,w,h}}`, or `{shape:shape}`. Entries may have `id` and may use `links` or `connects` arrays to build graph edges when explicit `walkGraph.edges` are absent. If `walkBoxes` is present, omitted `links`/`connects` mean no authored inter-node edges from that box; supply explicit `walkGraph.edges` or `links`/`connects` for routed navigation around blockers.
- `walkAreas:array`: supported alias for `walkBoxes` for walkability and derived graph-node positions. Prefer `walkBoxes` for new content. In this engine version, link/connect edge derivation reads `room.walkBoxes`, not `walkAreas`; if using `walkAreas` and routed edges matter, supply explicit `walkGraph.edges`.
- `blockers:array`: room-level movement blockers; each may have `id`, `shape` or `rect`, `onCollide`, `onBump`. With room templates, use blockers for partial obstructions, holes, machinery footprints, fallen panels, furniture footprints, or local corrections. `onCollide` is preferred when both collision script names are present.
- `walkGraph.nodes:array`: `{id:string,x:number,y:number}`. If omitted or empty, the engine derives one node at the centre of each walk box.
- `walkGraph.edges:array`: `[fromId,toId]` or `{from:string,to:string}`. Edges are treated as bidirectional path links. If omitted and `room.walkBoxes` is present, only walk box `links`/`connects` create authored inter-node edges. If omitted and `room.walkBoxes` is absent, all graph nodes are connected to all other graph nodes.
- `hotspots:array`: room objects; see next section.
- `characters:array`: room-local characters; see actors section.
- `transitionZones:array`: authored exits/room transitions. These are added to template-generated transition zones and door portal transition zones unless replacement flags suppress generated zones.
- `triggerZones:array`: movement triggers. These are added to template-generated trigger zones unless replacement flags suppress generated zones.
- `characterScale:object`: perspective scaling; aliases include `perspectiveScale`, `backY/frontY`, `backScale/frontScale`.
- `replaceTemplateWalkBoxes`, `replaceGeneratedWalkBoxes`, `manualWalkability`: suppress generated/template walk boxes.
- `replaceTemplateTransitionZones`, `replaceGeneratedTransitionZones`, `manualTransitions`: suppress room-template transition zones.
- `replaceDoorPortalTransitionZones`: suppress transition zones generated from door portals.
- `replaceTemplateBlockers`, `replaceGeneratedBlockers`, `manualBlockers`: suppress template blockers.
- `replaceTemplateTriggerZones`, `replaceGeneratedTriggerZones`, `manualTriggerZones`: suppress template trigger zones.
- Room hook fields: `beforeEnter`, `afterEnter`, `beforeExit`, `afterExit`.
- Effective property support: `properties`, `propertyGetters`, `getters`, `nonConstPropertyGetters`, `mutablePropertyGetters`.

Room walkability templates:
- `corridor`: one simple floor band for corridors, hallways, platforms, and service passages. Use `floorBand` and `exits`.
- `room`: one main floor rectangle for offices, store rooms, cabins, cells, chambers, and ordinary single-floor rooms. Use `floor`/`floorBand` and `exits`.
- `path`: irregular traversable route described by `pathPoints`/`path` and `pathWidth`/`width`.
- `bridge`: narrow path variant for bridges, catwalks, gantries, beams, and narrow platforms.
- `junction`: hub with `central` and `branches` for corridor intersections, lobbies, crossroads, and multi-mouth rooms.
- `stair`: sloped/stepped route described by `pathPoints`/`path` and `pathWidth`/`width`.

Geometry shapes accepted where shape is used:
- `{x:number,y:number,w:number,h:number}`.
- `{rect:{x:number,y:number,w:number,h:number}}`.
- `{circle:{x:number,y:number,radius:number}}`.

Geometry and pathfinding semantics:
- The only public geometry controls are declarative room/object/character/transition/trigger fields, effective properties/getters that compute those fields, and public movement APIs such as `api.ChangeRoom()` and `api.MoveCharacter()`. There is no public script API for querying paths, graph nodes, collision tests, or reachable points.
- Player movement pipeline: requested x/y is first clamped to the current room's reachable walkable geometry, then a path is built through walk graph nodes, then each frame advances toward the next path point, checks blockers/collisions, checks trigger zones, and checks transition zones.
- Walkable geometry: a point is walkable if it is inside any generated or authored `walkBoxes`/`walkAreas` shape. If no `walkBoxes`/`walkAreas` exist and no active template supplies walk boxes, `walkableArea` supplies a single rectangular walk box. If neither exists, the fallback rectangle is `{x:0,y:80,w:320,h:56}`.
- Template geometry is default geometry. Authored `walkBoxes`/`walkAreas` replace only when replacement flags are set; authored blockers, triggerZones, and transitionZones are additive.
- Destination clamping: when a requested point is outside all walk boxes, the engine chooses the nearest point in the rectangular bounds of the nearest walk box. For circle shapes, hit-testing is circular, but clamping and some path/blocker tests use the circle's bounding rectangle; do not rely on true circular navigation for precise path constraints.
- Graph nodes: explicit or template `walkGraph.nodes` are used when present. Otherwise, one node is derived at the centre of each walk box. If a node id is absent, its array index string is used.
- Graph edges: explicit or template `walkGraph.edges` are used when present. Otherwise, if `room.walkBoxes` is present, each walk box's `links` or `connects` array creates edges from that box id to listed ids; boxes without `links`/`connects` create no inter-node edges. If `room.walkBoxes` is absent, the engine connects every graph node to every other graph node.
- Edge blocking: graph edges, and temporary start-to-node and node-to-target links, are ignored if the straight line segment intersects any current blocker rectangle. Rect blockers are exact rectangles; circle blockers are reduced to their bounding rectangle for segment-blocking.
- Fallback path: if no graph route can be found, the engine falls back to a direct path to the clamped target. Author walk boxes/graphs/blockers so this fallback is harmless, or provide enough graph connectivity that routes are found.
- Player collision: if the player steps into a blocker, the walk is blocked, the blocker `onCollide`/`onBump` script is run, and the walk callback/action result reports status `blocked` with reason `collision` and `blockerId`.
- Room blockers: `room.blockers` and template-generated blockers are active while their room is active. Object blockers are generated from room hotspots whose effective `blocksMovement` is true.
- Object collision shape fallback: for blocking hotspots, `collisionShape`/`footprint` is used if present; otherwise `rect` is used; otherwise `x`/`y`/`frameW`/`frameH` form a rectangle. Hidden objects do not block unless effective `blocksWhenHidden` is true.
- Walk-to interaction positioning: when a non-`walkTo` interaction target has effective `walkTo:{x,y}`, the player walks there before running the interaction. If absent, the interaction runs immediately after the click command is accepted. The validator warns if authored `walkTo` is outside `walkableArea`, but runtime uses the reachable-point system.
- Walk command targeting: if the command verb is `walkTo` and the clicked scene point is currently walkable and not blocked, the engine walks to the clicked point even if the click also hit a floor/stain/scuff hotspot with an authored `walkTo`. This preserves free walking over large floor hotspots. If the clicked point is not walkable or is blocked, the engine falls back to the target's effective `walkTo` when present, so wall objects, closed doors and background fixtures can still supply approach points. A `walkTo` command with no implemented target interaction then completes silently rather than showing a refusal.
- Walk-through behaviour: if the command verb is `walkTo` and the target's effective `walkThrough` is true, the engine walks to effective `walkThroughTo`, falling back to `target.walkThroughPoint`, then to the clicked command point. Use this for open doors/passages where clicking the object should walk through rather than merely walk to it. Walk-through takes precedence over clicked-point walking.
- Transitions: transition zones are checked against the player's foot point after movement updates. Transition zones may be authored directly, generated by room walkability templates, or generated from door portals. In this engine version transition zones use `rect` only; `shape` is not checked for transition hit-testing. A transition zone may either run a script or call the normal room-change path.
- Door portals should be used for ordinary door travel instead of separately hand-authoring transitionZones when the deployed engine reliably generates door-portal transition zones. If runtime testing shows portal generation is not active, add an explicit transitionZone as a fallback.
- Trigger zones: trigger zones may be room-level, hotspot-level, or template-generated. They use `rect` or `shape`, test an actor's x/y foot point, and keep saved active membership so `onEnter` fires once on entry, `onExit` fires once on exit, and `onStay` fires while inside.
- NPC movement: `api.MoveCharacter()` and cutscene `moveCharacter` steps move room characters directly toward x/y; they do not build a `walkGraph` path and do not use player destination clamping. Author NPC move targets inside sensible walkable space yourself.
- Followers: room characters with `followPlayer:true` are placed and updated from the player's recent trail rather than via `walkGraph` pathfinding. `followDistance` controls trail distance; if absent, followers use 18 plus 10 times their index among followers. `followTarget` is runtime state, not an authored destination.
- Actor avoidance: visible player and non-hidden room characters participate unless `avoidanceDisabled` is true. Non-player characters are pushed unless `avoidanceLocked` is true. Radius uses `avoidanceRadius`, then `personalSpace`, then `hitW`/`rectW`, then sprite `frameW`, then a default. Avoidance is local separation only, not path planning.
- Perspective scale: actor `scale` is multiplied by an interpolated scale from `characterScale`/`perspectiveScale` unless `fixedScale` is true, `scaleWithPerspective` is false, or `perspectiveScale` is false. Actor-level `characterScale`/`perspectiveScale` overrides room-level `characterScale`/`perspectiveScale`, which overrides game-level `characterScale`/`perspectiveScale`. `farY`/`backY` and `nearY`/`frontY` default to the primary walk area top/bottom; `farScale`/`backScale` and `nearScale`/`frontScale` default to 1.
- Rendering depth: draw order sorts by `zIndex` first and then drawable y. For hotspots, drawable y is `baseline` when numeric; otherwise if `walkBehind` is true, it is the bottom of `collisionShape` or `rect`; otherwise it is `y` or rect bottom. Use `baseline`/`zIndex`/`walkBehind` for foreground objects the player can pass behind.
- Reserved/no-op geometry properties in this engine version: `blocksActors`, `occluderShape`, and `walkBehinds` are accepted/validated as effective properties but are not used by the current movement or renderer. Do not rely on them for gameplay or rendering effects unless the engine is extended.
- This engine does not support polygon navmeshes, weighted/one-way graph edges, public path queries, true circular segment navigation, graph-routed NPC movement, or per-pixel collision. Express such requirements as engine-extension needs.

Transition zone syntax:
EXAMPLE_START
transitionZones:[
  {id:'toHall',rect:{x:300,y:88,w:20,h:44},targetRoomId:'hall',targetX:20,targetY:112,targetFacing:'right'},
  {id:'doorExit',rect:{x:150,y:70,w:30,h:60},targetRoomId:'study',targetX:160,targetY:120,enabledObjectId:'studyDoor',enabledProperty:'open'},
  {id:'flagExit',rect:{x:0,y:90,w:10,h:40},targetRoomId:'garden',targetX:300,targetY:112,enabledFlag:'gateUnlocked'}
]
EXAMPLE_END

Transition zone fields:
- `id:string` optional.
- `rect:{x:number,y:number,w:number,h:number}`: required geometry for runtime transition checks. In this engine version, transition zones are rect-only; a `shape` field is not used for transition hit-testing.
- `targetRoomId:string`: destination room for normal room changes.
- `targetX:number`, `targetY:number`, `targetFacing:string`: player destination in the target room. If omitted, the player keeps the current coordinate/facing values that are not supplied.
- `script:string`: if supplied, runs instead of normal room change. It receives hook-style context through the script runner: `{transition,fromRoomId,toRoomId,player}`. It may call `api.ChangeRoom()` or `api.ShowEnding()`, and may return an action result.
- `enabledFlag:string`: zone enabled only when this global flag is true.
- `disabledFlag:string`: zone disabled when this global flag is true.
- `enabledObjectId:string`, `enabledProperty:string`: zone enabled only when the object's effective property is truthy. For authored zones, `enabledProperty` defaults to `open` when an `enabledObjectId` is supplied. For generated door portal zones, `enabledProperty` defaults to `walkThrough` unless the portal explicitly overrides it.
- Transition hooks: `beforeTransition`, `afterTransition`.

A transition zone must have a valid `targetRoomId` or a `script`. If both `script` and `targetRoomId` are supplied, `script` takes precedence.

Trigger zone fields:
- `id:string` optional. Runtime trigger membership key is actor id + current room id + zone id. Hotspot trigger zones are automatically id-prefixed with object id when no explicit unique id is supplied.
- `rect` or `shape`: trigger geometry tested against actor x/y foot point.
- `enabledFlag:string`: trigger is active only while this global flag is true.
- `disabledFlag:string`: trigger is inactive while this global flag is true.
- `actorId:string`: if supplied, only this actor id can fire the trigger. Use `player` for the player.
- `once:boolean`: after the first `onEnter`/`script` fire, the engine sets an internal disabled flag `__used_<zoneId>` and the trigger will not fire again in that play state.
- `onEnter:string` or `script:string`: runs when actor enters.
- `onExit:string`: runs when actor exits.
- `onStay:string`: runs on movement/update ticks while actor remains inside.
Trigger scripts receive `(api, context)` with context `{actor,zone,room,roomId,object}`. `object` is the source hotspot for hotspot trigger zones, otherwise null.

## 9. Room Hotspots/Objects and Object Animation

Hotspots live in `room.hotspots`. Their ids are globally scoped saved object ids and must be unique across all rooms.

Hotspot syntax:

EXAMPLE_START
hotspots:[
  {
    id:'brassKeyOnTable',
    name:'brass key',
    template:'pickup',
    itemId:'brassKey',
    x:145,
    y:98,
    frameW:12,
    frameH:8,
    sprite:'brass_key_world.png',
    rect:{x:143,y:96,w:16,h:10},
    walkTo:{x:150,y:116},
    defaultText:'A small brass key lies on the table.',
    takeText:'Taken.'
  }
]
EXAMPLE_END

Hotspot/object fields read by the engine:

- Identity/template: `id`, `name`, `displayName`, `template`, `templateId`, `kind`, `templates`, `itemId`.
- Text/behaviour: `defaultText`, `description`, `interactions`, `refusals`, `properties`, getter maps, `callbackStatus`, `callbackResult`, `callbackResults`.
- Rendering: `x`, `y`, `frameW`, `frameH`, `sprite`, `closedSprite`, `openSprite`, `emptySprite`, `fullSprite`, `onSprite`, `offSprite`, `animation`, `animations`, `animationCompleteScripts`.
- Visibility/hit/command behaviour: `hidden`, `renderHidden`, `hitDisabled`, `disableHit`, `interactionDisabled`, `rect`, `hitRect`, `priority`, `hitPriority`, `zIndex`, `baseline`, `hideOnTake` for pickup-template objects, and `transitiveUse` for Use-command selection behaviour.
- Movement/geometry: `walkTo`, `walkThrough`, `walkThroughTo`, `walkThroughPoint`, `blocksMovement`, `blocksWhenHidden`, `collisionShape`, `walkBehind`, `baseline`, `zIndex`, `triggerZones`, `onCollide`, `onBump`, `onStay`. Reserved/no-op in this engine version: `blocksActors`, `occluderShape`, `walkBoxes`, `blockers`, `walkBehinds`.

Object geometry semantics:

- `hitRect` overrides `rect` for pointer hit-testing. If `hitRect` is absent, `rect` is used; otherwise `x`/`y`/`frameW`/`frameH` may be used by rendering/collision fallbacks where applicable.
- `priority` or `hitPriority` controls click target precedence among overlapping scene targets; `hitPriority` is preferred when numeric, otherwise `priority`, otherwise 0. Later room targets win ties.
- `hidden` removes an object from hit-testing and rendering. `renderHidden` also hides rendering. `hitDisabled`, `disableHit`, or `interactionDisabled` disables hit-testing/interaction without necessarily hiding rendering. `disableHit` is a supported legacy alias; prefer `hitDisabled` for new content.
- `blocksMovement:true` turns a hotspot into an object blocker. If `collisionShape` is absent, `rect` is used; if `rect` is absent, `x`/`y`/`frameW`/`frameH` are used. Hidden blockers are ignored unless `blocksWhenHidden:true`.
- `walkBehind:true` affects drawable sorting by using `collisionShape`/`rect` bottom as the object's drawable y when `baseline` is absent. It does not by itself create collision; use `blocksMovement`/`collisionShape` for blocking.
- `baseline:number` overrides the object's drawable y for sorting. `zIndex:number` sorts before y and is useful for forcing foreground/background ordering.
- `onCollide`/`onBump` on a blocking hotspot run when the player collides with it. Context is `{actor,blocker,object,room,roomId}`.
- Hotspot `triggerZones` are added to the room trigger list while the hotspot's room is active. They may use the same trigger fields as room trigger zones.

Object animation spec:

EXAMPLE_START
animations:{
  idle:{frame:0,frames:1,fps:1,loop:false},
  open:{frames:4,fps:8,loop:false}
},
animationCompleteScripts:{open:'afterOpenAnimation'}
EXAMPLE_END

Object animation fields:

- `frames:number`: horizontal frame count; minimum 1.
- `fps:number`: frames per second; default 1.
- `loop:boolean`.
- `frame:number`: static frame when no runtime animation is active.
- Object animation spritesheets use row 0 only. If `frameW` and `frameH` are present, frame n is cropped from `x=n*frameW,y=0`. If `frameW`/`frameH` are omitted, the whole image is drawn and animation frames cannot be cropped.

Object animation runtime options for `api.SetObjectAnimation`: `reverse`, `holdFinal`, `onComplete`. Replacing an active object animation calls the previous `onComplete` with status `superseded`; `ClearObjectAnimation` calls it with status `cancelled`. The current renderer holds the last frame of a completed non-looping object animation until another animation is set or cleared; `holdFinal:false` is accepted but has no visible effect in this engine version.


## 10. Inventory Items, Maps, Overlays, Sprites, and Actors

Item syntax:

EXAMPLE_START
items:{
  brassKey:{
    name:'brass key',
    icon:'brass_key_icon.png',
    template:'key',
    unlocks:['studyDoor'],
    defaultText:'A small brass key.'
  }
}
EXAMPLE_END

Item fields read by the engine:

- `id:string`: optional, should match item key.
- `name`, `displayName`, `description`, `defaultText`.
- `icon:string`: PNG in `objects/`.
- `worldSprite:string`: PNG in `objects/`.
- `lookOverlay`, `closeupOverlay`: overlay specs shown by `lookAt`/`readable` interactions.
- `closeupImage:string`: PNG in `objects/`; preloaded overlay/map fallback.
- `image:string`: legacy map fallback only; for new content prefer `lookOverlay`, `closeupOverlay`, `closeupImage`, `map.image`, or `mapImage`. Do not rely on bare `item.image` unless the same PNG is also referenced by a preloaded field.
- `template`, `templateId`, `kind`, `templates`.
- `interactions`, `refusals`, `properties`, getter maps.
- `map` for map template.
- `unlocks`, `unlockDoors`, `opens`, `targets`, `doorIds`, `objectIds`.
- `combine`, `combinations`, `exchanges`, `toolUses`.
- Costume fields: `costumeSpriteId`, `playerSpriteId`, `baseClothes`, `replacesItem`, `returnItem`.

Overlay spec fields:

- `image:string`: PNG in `objects/`, normally 320x136. A string `overlaySpec` is equivalent to `{image:'filename.png'}`.
- `background`, `endBackground:string`: accepted by the preload path for ending/overlay-like specs, but ordinary overlays render `image`; use `image` for normal closeups and maps.
- `itemId:string` optional.
- `hotspots:array` optional; overlay targets use `id`, `name`, `rect`, `hitPriority`, `interactions`, `refusals`, `defaultText`, `properties`, and getter maps. Overlay hit-testing is rectangular and uses `rect` plus `hitPriority` only; `hidden`, `hitDisabled`, `disableHit`, `interactionDisabled`, and `priority` are not checked by the overlay hit-tester in this engine version. Overlay targets are clicked only while the overlay is open; their ids do not place persistent room objects, but if they use object variables they still share the object-variable namespace for that id.

Map item syntax:

EXAMPLE_START
items:{
  townMap:{
    name:'town map',
    icon:'map_icon.png',
    template:'map',
    map:{
      image:'town_map.png',
      places:[
        {id:'square',name:'Town Square',rect:{x:10,y:20,w:40,h:20},targetRoomId:'square',targetX:80,targetY:112,targetFacing:'down',alwaysVisible:true}
      ]
    }
  }
}
EXAMPLE_END

Map places may be supplied as `item.map.places`, `item.map.hotspots`, an effective item property `places`, or an effective item property `mapPlaces`. Map place fields: `id`, `name`, `rect`, `roomId`, `targetRoomId`, `targetX`, `targetY`, `targetFacing`, `description`, `defaultText`, `alwaysVisible`, `visibleFlag`, `hiddenFlag`, `blockedFlag`, `blockedScript`, `blockedText`, `script`. `targetRoomId` is preferred for the travel destination; `roomId` is also accepted as a destination alias when `targetRoomId` is omitted, and both fields are used for visited-room visibility checks. `visibleFlag`, `hiddenFlag`, and `blockedFlag` are global flags. A place is shown only if `visibleFlag` is absent or true, `hiddenFlag` is absent or false, and either `alwaysVisible` is true, no `roomId`/`targetRoomId` is present, or the destination room has been visited. Entering a room sets room scoped variable `visited=1` for that room. `blockedScript` is a getter-style script called with `(query,self,context)` and should return truthy when travel is blocked.
Functional map and overlay legibility rule: map, closeup, terminal, diagram, sign, puzzle-panel, and UI-like overlay images must communicate their gameplay information visually. A map used for travel should show recognisable places, routes, labels, icons, or other visible affordances corresponding to its hotspots/places. Invisible hotspots may refine interaction, but the graphic must not be effectively blank or navigable only by blind hotspot discovery unless that is an intentional, signposted puzzle.

Sprite syntax:

EXAMPLE_START
sprites:{
  player:{
    image:'player.png',
    frameW:24,
    frameH:32,
    directional:true,
    animations:{
      idle:{frames:1,fps:1,loop:true},
      walk:{frames:4,fps:8,loop:true},
      talk:{frames:2,fps:6,loop:true}
    }
  }
}
EXAMPLE_END

Sprite fields: `image`, `frameW`, `frameH`, `directional`, `rows`, `animations`, `idleFrames`, `idleFps`, `walkFrames`, `walkFps`. `frameW` and `frameH` are required for actor spritesheets. Directional row order is down, left, right, up. An animation entry may define `frames`, `fps`, `frame`, `rowOffset`, and `directional:false`. For directional sprites, `rowOffset` is added before the facing row is applied. Actor sprite animations with `frames>1` always loop in the current renderer; a `loop` field is harmless metadata but is not read for actor animations. Use object animation or cutscene sequencing for non-looping presentation. `talk` is used automatically by `api.Say()` if present.

Actor/player/room character fields: `id`, `name`, `displayName`, `spriteId`, `x`, `y`, `facing`, `visible`, `hidden`, `controllable`, `speed`, `scale`, `scaleWithPerspective`, `perspectiveScale`, `characterScale`, `fixedScale`, `followPlayer`, `followDistance`, `avoidanceRadius`, `personalSpace`, `avoidanceDisabled`, `avoidanceLocked`, `dialogueColor`, `walkTo`, `rect`, `hitW`, `hitH`, `rectW`, `rectH`, `interactions`, `refusals`, effective property maps. Top-level `game.characters` supplies reusable character metadata such as names/dialogue colours and scoped-variable existence; NPCs that should appear, move, or be clicked must also be placed in `room.characters`. If a room character lacks `rect`, the engine derives it from `x`/`y` using `hitW`/`hitH` or `rectW`/`rectH`, default 16x16, with `x` centred and `y` as the foot point. `api.MoveCharacter()` moves NPCs directly to `x`/`y` and does not use `walkGraph` pathfinding. `followTarget`, `lastMoveX`, `lastMoveY`, `moveTarget` and animation timing fields are runtime state; do not author them except in saved-state restoration generated by the engine.

## 11. Interactions, Refusals, Effective Properties, and Getter API

This section is the main architectural contract for game authors. The authoring AI must prefer declarative data, templates, and effective properties over custom scripts whenever behaviour is a state-dependent answer to an engine question. This is a contract rule, not a style preference.

Core rule:
- If the question is "what is this target's current text, sprite, visibility, blocking, walk point, available interactions, transitive-use behaviour, or refusal text?", use an effective property, a template runtime variable, or a property getter.
- If the action changes inventory, changes rooms, starts dialogue, runs a cutscene, applies a puzzle effect, or performs distinctive story logic, use a template action, dialogue action, cutscene step, or custom script as appropriate.
- Do not write a custom Look At script merely to choose between description strings. Use effective defaultText or description.
- Do not write a custom script merely to choose current hidden, sprite, blocksMovement, walkTo, interactions, transitiveUse, or refusals. Use effective properties.
- Do not duplicate template-owned runtime variables with separate flags unless the separate flag has a distinct story-level meaning.
- A script that only narrates state-dependent descriptive text, only changes availability, only duplicates template state, or only says no is an architectural error unless a documented API limitation prevents a declarative implementation.

### 11.1 Interaction values and template action names

An interaction is a map from an interaction key to either a game script name or a public template action name.

EXAMPLE_START
interactions:{
    open:'openSpecialPanel',
    lookAt:'lookAtPainting',
    'use:brassKey':'unlockPanel',
    give:'template:exchange.give'
}
EXAMPLE_END

Interaction keys:
- Ordinary verb keys are walkTo, lookAt, take, give, talkTo, open, close, and use.
- Transitive inventory-on-target keys use verbId:itemId, for example use:spanner or give:coin.
- For inventory-on-target use/give, the engine first checks the target verbId:inventoryItemId key, then the target's linked item, then the reverse key verbId:targetId on the selected inventory item, then that selected item's linked item.
- For Use X with Y where X is a transitive-use subject and Y is an intransitive-use target, the engine then runs X's plain use interaction as X's transitive fallback. It does not fall through to Y's plain use interaction.
- For other inventory-on-target commands, the engine may then use the plain verb key on the target or linked item as the target fallback.
- Use specific transitive keys for one-off pairings. Use combine or toolTarget for reusable patterns.

Interaction values:
- A game script name is a string naming a function in game.scripts. Interaction scripts receive (api, command, target, self).
- A template action is a string exactly of the form template:templateName.actionName.
- Template action names are exact public action names. Do not infer them from verb ids.
- Template action names are valid only in interactions. They are not valid in hooks, getters, script fields, dialogue script fields, cutscene script steps, optional template script fields, or api.RunScript.

Critical readable-template example:
- The readable template contributes lookAt and use interactions, but its only public action is read.
- Correct explicit action: template:readable.read.
- Incorrect invented actions: template:readable.lookAt and template:readable.use.
- Best ordinary pattern: attach template:'readable' and omit lookAt/use so the template contributes them.

Correct state-dependent readable pattern:
EXAMPLE_START
items:{
    workRota:{
        name:'work rota',
        icon:'work_rota_icon.png',
        template:'readable',
        transitiveUse:true,
        propertyGetters:{defaultText:'workRotaDefaultText'},
        interactions:{
            'use:mop':'useMopOnWorkRota',
            'use:bucketWater':'useBucketOnWorkRota'
        }
    }
},
scripts:{
    workRotaDefaultText:function (query,self,context) {
        if (query.GetFlag('workRotaAlteredForDayOff')) {
            return 'The rota now marks today as authorised leave.';
        }
        return 'The rota lists cleaning duties for far too many consecutive days.';
    }
}
EXAMPLE_END

Incorrect readable pattern:
EXAMPLE_START
items:{
    workRota:{
        template:'readable',
        interactions:{
            lookAt:'template:readable.lookAt',
            use:'template:readable.use'
        }
    }
}
EXAMPLE_END

### 11.2 Refusals

A refusal is data-driven text used when a command has no implemented interaction. Use refusals instead of custom scripts that only say no.

Refusal lookup order:
- Ordinary single-target commands use target refusals[verbId], linked item refusals[verbId], game.defaultRefusals[verbId], then the engine default for the verb.
- Inventory-on-target commands first allow target-specific refusals[verbId:inventoryItemId] and linked target refusals[verbId:inventoryItemId].
- For Use X with Y where X is a transitive-use subject and Y is an intransitive-use target, if no interaction is implemented, the fallback then comes from X: selected item refusals[use:targetId], linked selected item refusals[use:targetId], selected item refusals[use], linked selected item refusals[use], game/default keyed refusals, and finally the generic use refusal.
- For other inventory-on-target commands, the fallback continues through the target's verb refusal, linked target verb refusal, game/default keyed refusals, and game/default verb refusals.  
EXAMPLE_START
refusals:{
    take:'I cannot take the whole cabinet.',
    open:'It is already more open than management would like.',
    'use:mop':'Mopping the label would only make the instructions wetter.'
}
EXAMPLE_END

Use a script instead of a refusal only when the failed command must change saved state, start dialogue, run a cutscene, or branch in a way that cannot be represented by an effective refusal getter.

### 11.3 Use and Give semantics

Give:
- give is always two-target: select an inventory item, then click a target.
- exchange/barter is Give-only. Use template:'exchange' for standard Give-based trades.

Use:
- use may be intransitive, such as Use switch, Use note, Use bucket.
- use may be transitive, such as Use key with door or Use mop with stain.
- A target or item with effective transitiveUse:false runs its own plain use interaction immediately.
- A target or item with effective transitiveUse:true is selectable as the first subject for Use X with Y.
- If transitiveUse is omitted, the engine infers safer behaviour. A plain custom use interaction is treated as intransitive unless it is a known transitive template interaction.
- When Use X with Y is formed and X is a transitive-use subject while Y is an intransitive-use target, the command belongs to X. After specific target and reverse-pair interactions are checked, the engine runs X's transitive fallback, and if nothing is implemented the refusal fallback is also X's fallback. Y's plain intransitive use must not run merely because Y was clicked as the second target.
- Use X with X is normalized to intransitive Use X; do not author use:self keys expecting ordinary UI input to reach them.

### 11.4 Effective property model

An effective property is the value the engine actually uses after considering saved state, authored data, getters, and template defaults.

Effective property resolution order:
- Runtime object state override, where object state applies.
- entity.properties[propertyName].
- entity[propertyName].
- Getter script declared in propertyGetters or getters; the raw value above is passed as fallback.
- Template default.
- Caller default.

For interactions, refusals, and callbackResults, template maps merge with entity maps. Entity maps override template maps for the same key.

Direct fields are best for static values:
EXAMPLE_START
stainedFloor:{
    defaultText:'A stubborn brown stain has spread across the floor.',
    blocksMovement:false
}
EXAMPLE_END

Getter scripts are best for state-dependent values:
EXAMPLE_START
cabinet:{
    template:'container',
    propertyGetters:{defaultText:'cabinetDefaultText', hidden:'cabinetHidden'}
},
scripts:{
    cabinetDefaultText:function (query,self,context) {
        return self.GetBool('open',false) ? 'The cabinet is open.' : 'The cabinet is closed.';
    },
    cabinetHidden:function (query,self,context) {
        return query.GetFlag('cabinetDestroyed');
    }
}
EXAMPLE_END

Object variables are best for object-local persistent state. Item variables are best for item-local persistent state. Object state is best only when you deliberately want to override effective properties directly.

If a script, getter, template effect, or SetObjectState can select a new image path, that image must also be referenced by a documented preloadable image field elsewhere in the game definition.

### 11.5 Getter declarations and signatures

Getter declarations:
EXAMPLE_START
propertyGetters:{defaultText:'cabinetText'}
getters:{hidden:'cabinetHidden'}
nonConstPropertyGetters:{defaultText:'statefulText'}
mutablePropertyGetters:{hidden:'statefulHidden'}
EXAMPLE_END

Preferred fields:
- propertyGetters and getters are const getter maps. They must not mutate state.
- nonConstPropertyGetters and mutablePropertyGetters are mutable getter maps. Use only when property computation must update saved state.

Getter signature:
EXAMPLE_START
cabinetText:function (query,self,context) {
    return self.GetBool('open',false) ? 'It is open.' : 'It is closed.';
}
EXAMPLE_END

Getter query methods:
- HasItem(itemId) -> boolean.
- GetFlag(name) -> boolean.
- GetVariable(name) -> any.
- GetRoomVariable(roomId,name,defaultValue) -> string|number|defaultValue.
- GetCharacterVariable(characterId,name,defaultValue) -> string|number|defaultValue.
- GetItemVariable(itemId,name,defaultValue) -> string|number|defaultValue.
- GetObjectVariable(objectId,name,defaultValue) -> string|number|defaultValue.
- GetProperty(entity,propertyName,context,defaultValue) -> any.

Const self has Id, Type, RoomId, Entity, Context, Get, GetBool, GetNumber, GetString, GetBaseProperty, and GetProperty. Mutable self additionally has Set, SetBool, SetNumber, SetString, and Add.

Const getters must not mutate state, narrate, start dialogue, show overlays, move actors, change rooms, play sound, save/load, start cutscenes, call browser timers, or touch private engine objects.

### 11.6 Properties commonly worth making effective

Dynamic text:
- defaultText, description, readText, and template text fields where effective lookup is documented.

Dynamic visibility and availability:
- hidden, hitDisabled, disableHit, interactionDisabled, renderHidden.

Dynamic graphics:
- sprite, closedSprite, openSprite, emptySprite, fullSprite, onSprite, offSprite, worldSprite, icon.

Dynamic movement/rendering:
- blocksMovement, blocksWhenHidden, collisionShape, walkTo, walkThrough, walkThroughTo, walkThroughPoint, walkBehind, baseline, zIndex, triggerZones.

Dynamic command behaviour:
- interactions, refusals, transitiveUse, callbackStatus, callbackResult, callbackResults.

Template-specific state and gating:
- open, locked, on, powered, allowsPassage, travelBlocked, unlockBlocked, requirements.

Validated effective property types:
- Booleans: visible, hidden, hitDisabled, walkThrough, renderHidden, blocksWhenHidden, interactionDisabled, blocksMovement, blocksActors, walkBehind. blocksActors is reserved/no-op in this engine version.
- Points: walkTo and walkThroughTo are null/undefined or {x:number,y:number}.
- Rectangles: hitRect and rect are {x:number,y:number,w:number,h:number}.
- Arrays: walkBoxes, blockers, walkBehinds, triggerZones. On hotspots, walkBoxes/blockers/walkBehinds are reserved/no-op in this engine version; room walkBoxes/blockers and hotspot triggerZones are used.
- Objects: collisionShape, occluderShape. occluderShape is reserved/no-op in this engine version.
- Numbers: baseline, zIndex.
- Callback values: callbackStatus:string, callbackResult:string|object, callbackResults:object.

### 11.7 Canonical effective-property examples

State-dependent readable text:
EXAMPLE_START
items:{
    permit:{name:'permit',icon:'permit_icon.png',template:'readable',propertyGetters:{defaultText:'permitText'}}
},
scripts:{
    permitText:function (query,self,context) {
        return query.GetFlag('permitStamped') ? 'The permit bears an official stamp.' : 'The permit is unstamped.';
    }
}
EXAMPLE_END

State-dependent blocker:
EXAMPLE_START
hotspots:[
    {id:'robotBarrier',name:'robot',template:'barrier',hidden:true,renderHidden:true,blocksWhenHidden:true,collisionShape:{x:260,y:100,w:30,h:24},propertyGetters:{blocksMovement:'robotBlocksPassage'},onCollide:'bumpRobot'}
],
scripts:{
    robotBlocksPassage:function (query,self,context) {
        return !query.GetFlag('robotPermissionGranted');
    }
}
EXAMPLE_END

State-dependent interactions:
EXAMPLE_START
hotspots:[
    {id:'sealedHatch',name:'sealed hatch',propertyGetters:{interactions:'sealedHatchInteractions'},defaultText:'A heavy sealed hatch blocks the wall.'}
],
scripts:{
    sealedHatchInteractions:function (query,self,context) {
        return query.GetFlag('hatchUnlocked') ? {lookAt:'lookAtSealedHatch',open:'openSealedHatch'} : {lookAt:'lookAtSealedHatch','use:keyCard':'useKeyCardOnHatch'};
    }
}
EXAMPLE_END

State-dependent sprite:
EXAMPLE_START
hotspots:[
    {id:'warningLamp',name:'warning lamp',sprite:'lamp_off.png',onSprite:'lamp_on.png',offSprite:'lamp_off.png',propertyGetters:{sprite:'warningLampSprite'}}
],
scripts:{
    warningLampSprite:function (query,self,context) {
        return query.GetFlag('alarmActive') ? 'lamp_on.png' : 'lamp_off.png';
    }
}
EXAMPLE_END

Dynamic refusal text:
EXAMPLE_START
hotspots:[
    {id:'elevator',name:'elevator',propertyGetters:{refusals:'elevatorRefusals'},template:'device'}
],
scripts:{
    elevatorRefusals:function (query,self,context) {
        return query.GetFlag('powerOn') ? {use:'The elevator hums, but the doors remain locked.'} : {use:'The elevator is dark. It needs power first.'};
    }
}
EXAMPLE_END

### 11.8 Custom script decision checklist

Before writing a custom interaction script, ask:
- Can a template already express this? If yes, use the template.
- Is the script only choosing text? If yes, use defaultText, description, readText, or a text getter.
- Is the script only hiding/showing something? If yes, use hidden/hitDisabled/renderHidden getters.
- Is the script only changing blocking? If yes, use blocksMovement/blocksWhenHidden/collisionShape getters.
- Is the script only changing available commands? If yes, use an interactions getter.
- Is the script only saying no? If yes, use refusals or a refusals getter.
- Is the script performing a state change, inventory change, dialogue/cutscene start, room change, or distinctive puzzle effect? If yes, a script may be appropriate.

## 12. Templates

A template is a declarative behaviour package. It can contribute default interactions, effective properties, refusals, callback results, actions, and saved runtime-variable conventions. Templates are the main mechanism for avoiding custom scripts for standard point-and-click adventure objects.

Template authoring rules:
- Start with a room walkability template for every ordinary room. Use bespoke walkBoxes/walkGraph only when a room template plus blockers/exits cannot express the layout.
- Start with a template for every standard object pattern.
- Omit interactions that the template already contributes unless you intentionally override them.
- Use template runtime variables for the template's own state.
- Use effective properties/getters to customise template behaviour dynamically.
- Use custom scripts only for game-specific behaviour the template cannot express.
- If overriding a template-contributed interaction, document why the override is necessary.

Template attachment fields:
- template:'readable'.
- templateId:'readable'.
- kind:'readable'.
- templates:['readable','toolTarget'].
- String lists in template/templateId/kind may be space-separated or comma-separated.

Known templates:
- door, key, map, pickup, container, switch, readable, device, furniture, barrier, corridor, room, path, bridge, junction, stair, combine, openableBox, exchange, multiRequirement, gatekeeper, costume, toolTarget, clueUnlocker, distractible.

Template action naming is exact:
- The template may contribute a verb such as lookAt, but the public action name may be different.
- readable contributes lookAt and use, but both actions are template:readable.read.
- switch contributes use, but the action is template:switch.toggle.
- multiRequirement contributes give and use, but both actions are template:multiRequirement.add.
- Never invent template action names. Use only the exact public actions documented below.

Shared rule fields used by several templates:
- requiresFlag:string.
- requiresItem:string.
- allowProperty:string.
- sourceAllowProperty:string.
- targetAllowProperty:string.
- refusalText:string.
- blockedText:string.
- removeSource or consumeSource:boolean.
- removeTarget or consumeTarget:boolean.
- removeItem:string.
- addItem:string.
- resultItem:string.
- setFlag:string with flagValue:false to set false.
- clearFlag:string.
- setSource or sourceVars:object.
- setTarget or targetVars:object.
- setVariables:object.
- setObjectState:object.
- setSourceState:object.
- animation:string and animationOptions:object.
- sound:string or array.
- script or onComplete:string.
- text/playerText/npcText/speaker fields as documented per template.

### 12.1 door template
  
Purpose:
- Standard openable/closable door-like world object.
- Manages open/closed/locked state, sprite selection, blocking, walk-through, state text, and optional portal geometry.
- Door portals are the preferred way to author door travel. Do not hand-author a separate doorway transition zone when the door template portal can express it.

Attach to:
- Room hotspots.

Public actions:
- template:door.lookAt
- template:door.open
- template:door.close
- template:door.useKey
- template:door.walkTo

Contributed interactions:
EXAMPLE_START
lookAt:'template:door.lookAt'
open:'template:door.open'
close:'template:door.close'
use:'template:door.useKey'
walkTo:'template:door.walkTo'
EXAMPLE_END

Saved runtime variables:
- object variable open: 1/0; initial fallback authored open.
- object variable locked: 1/0; initial fallback authored locked.

Author fields:
- open
- locked
- sprite
- closedSprite
- openSprite
- rect
- hitRect
- collisionShape
- footprint
- baseline
- walkTo
- walkThroughTo
- walkThroughPoint
- portal
- doorPortal
- transitionAnimation
- openAnimation
- unlockAnimation
- lockAnimation
- onOpen
- onClose
- onUnlock
- onLock

Text fields:
- openText
- lockedText
- unlockedText
- closedText
- alreadyOpenText
- lockedOpenText
- openActionText
- alreadyClosedText
- closeActionText
- wrongKeyText
- unlockText
- lockText
- closedWalkText

Door portal fields:
- portal.id:string optional transition-zone id.
- portal.rect or portal.transitionRect:{x,y,w,h}: generated transition-zone rectangle in the source room.
- portal.approach or portal.walkTo or portal.standPoint:{x,y}: actor standing point; used as template walkTo when no explicit walkTo is authored.
- portal.through or portal.walkThroughTo or portal.walkThroughPoint or portal.exitPoint:{x,y}: point to walk through when open; used as template walkThroughTo and as a fallback for generated portal rect.
- portal.targetRoomId or portal.roomId or portal.target.roomId:string.
- portal.targetX/targetY/targetFacing, portal.target:{x,y,facing}, or portal.entry:{x,y,facing}: destination in the target room.
- portal.script:string optional scripted transition instead of automatic room change.
- portal.enabledFlag, portal.disabledFlag, portal.enabledObjectId, portal.enabledProperty, portal.beforeTransition, portal.afterTransition.
- portal.enabled:false suppresses generation for that portal.

Effective properties and effects:
- defaultText is openText when open, lockedText when locked, otherwise unlockedText/closedText/fallback.
- sprite is openSprite when open and closedSprite when closed, falling back to sprite.
- walkThrough is true when open.
- walkTo defaults from portal.approach/walkTo/standPoint when no explicit walkTo is authored.
- walkThroughTo defaults from portal.through/walkThroughTo/walkThroughPoint/exitPoint when no explicit walkThroughTo is authored.
- blocksMovement is true when not open.
- collisionShape falls back to rect.
- baseline falls back to rect bottom or y.
- A door portal generates a transition zone enabled by the door's effective walkThrough property unless portal.enabledProperty overrides it.

Action semantics:
- lookAt narrates linked/effective look text, then door state fallback.
- open refuses if already open or locked; otherwise sets open true, starts optional transition/open animation, narrates openActionText, and runs onOpen.
- close refuses if already closed; otherwise sets open false, starts optional reverse animation, narrates closeActionText, and runs onClose.
- useKey requires a selected inventory item with template key and target list including this door id or *. It toggles locked and runs lock/unlock text, animation and optional scripts.
- walkTo narrates closedWalkText only when closed; when open it returns silently so walkThrough and the generated portal transition zone can proceed.

Preferred door travel pattern:
EXAMPLE_START
{id:'storeDoor',name:'store-room door',template:'door',open:false,locked:false,rect:{x:220,y:82,w:42,h:48},portal:{approach:{x:238,y:116},through:{x:252,y:116},targetRoomId:'storeRoom',targetX:244,targetY:126,targetFacing:'left'}}
EXAMPLE_END

### 12.2 key template

Purpose:
- Marks an inventory item as a key and supplies target lists for locks.

Attach to:
- Inventory items.

Public actions:
- None.

Contributed interactions:
- None.

Saved runtime variables:
- None.

Author fields:
- unlocks
- unlockDoors
- opens
- targets
- doorIds
- objectIds

Text fields:
- defaultText or description for inspection.

Effective properties and effects:
- No interactions or effective property defaults are contributed by key itself.

Action semantics:
- Target lists may be a string or array.
- * targets all compatible locks.
- door.useKey requires the item to have template key and include the door id or *.
- container.useKey checks the selected item target list; author keys with template key for clarity even where the engine does not require it.

### 12.3 map template

Purpose:
- Shows a map/travel overlay and exposes map places as overlay targets.

Attach to:
- Inventory items.

Public actions:
- template:map.show
- template:map.lookPlace
- template:map.travelPlace

Contributed interactions:
EXAMPLE_START
lookAt:'template:map.show'
EXAMPLE_END

Saved runtime variables:
- Room scoped variable visited=1 is used for place visibility after room visits.

Author fields:
- map
- map.image
- map.places
- map.hotspots
- mapImage
- places effective property
- mapPlaces effective property
- travelBlocked
- travelBlockedText

Text fields:
- place description
- place defaultText
- blockedText
- travelBlockedText

Effective properties and effects:
- Map item lookAt opens map overlay.
- Visible map places become overlay targets with lookAt template:map.lookPlace and walkTo template:map.travelPlace.

Action semantics:
- Places may define id,name,rect,roomId,targetRoomId,targetX,targetY,targetFacing,description,defaultText,alwaysVisible,visibleFlag,hiddenFlag,blockedFlag,blockedScript,blockedText,script.
- A place is visible only if visibleFlag is absent/true, hiddenFlag is absent/false, and either alwaysVisible is true, no destination room is present, or the destination room has visited=1.
- blockedFlag, blockedScript, or effective travelBlocked can block travel.
- If place.script exists it runs instead of automatic room travel.
- Otherwise targetRoomId, falling back to roomId, is used with target coordinates/facing.

### 12.4 pickup template

Purpose:
- World object that can be taken into inventory.

Attach to:
- Room hotspots.

Public actions:
- template:pickup.lookAt
- template:pickup.take

Contributed interactions:
EXAMPLE_START
lookAt:'template:pickup.lookAt'
take:'template:pickup.take'
EXAMPLE_END

Saved runtime variables:
- object variable taken: 1/0.

Author fields:
- itemId
- hideOnTake
- hiddenFlag
- takenFlag
- takeText
- onTake
- defaultText
- description

Text fields:
- takeText
- defaultText
- description

Effective properties and effects:
- hidden becomes true after taken unless hideOnTake:false or another explicit/effective hidden value overrides it.
- blocksMovement defaults false.
- walkTo defaults to approach/approachPoint, then to the bottom-centre of rect plus a small offset.
- zIndex defaults to 10.
- callbackResults are supplied for pickup movement callbacks.

Action semantics:
- lookAt uses linked/effective look text.
- take adds itemId, or the hotspot id if itemId is omitted, to inventory.
- take sets hiddenFlag or takenFlag if present, sets taken=1, narrates takeText, and runs onTake.

AI authoring note:
- Pickups are non-blocking by default. Do not add blockers/collisionShape to pickups unless a pickup is intentionally a physical obstacle before it is taken. Use approach/approachPoint only to control where the actor stands before taking the pickup.

### 12.5 container template

Purpose:
- Openable/closable/lockable container that may give contents once.

Attach to:
- Room hotspots.

Public actions:
- template:container.lookAt
- template:container.open
- template:container.close
- template:container.useKey

Contributed interactions:
EXAMPLE_START
lookAt:'template:container.lookAt'
open:'template:container.open'
close:'template:container.close'
use:'template:container.useKey'
EXAMPLE_END

Saved runtime variables:
- object variable open: 1/0; initial fallback authored open.
- object variable locked: 1/0; initial fallback authored locked.
- object variable emptied: 1/0.

Author fields:
- open
- locked
- contents
- contains
- sprite
- closedSprite
- openSprite
- emptySprite
- transitionAnimation
- openAnimation
- unlockAnimation
- lockAnimation
- onOpen
- onClose
- onUnlock
- onLock
- onEmpty

Text fields:
- emptyText
- openText
- lockedText
- closedText
- alreadyOpenText
- lockedOpenText
- takeContentsText
- openActionText
- alreadyClosedText
- closeActionText
- wrongKeyText
- unlockText
- lockText

Effective properties and effects:
- defaultText varies by open/locked/emptied.
- sprite selects emptySprite when open and emptied, otherwise openSprite when open, otherwise closedSprite or sprite.

Action semantics:
- open refuses if already open or locked; otherwise sets open=1, starts optional animation, adds contents once, sets emptied=1 if contents were present, narrates takeContentsText or openActionText, runs onOpen and onEmpty when applicable.
- close refuses if already closed; otherwise sets open=0, starts optional reverse animation, narrates closeActionText, and runs onClose.
- useKey toggles locked if the selected inventory item target list includes this container id or *.

### 12.6 switch template

Purpose:
- On/off toggle, lever, valve, button, switch, or power control.

Attach to:
- Room hotspots or inventory items where appropriate.

Public actions:
- template:switch.lookAt
- template:switch.toggle
- template:switch.turnOn
- template:switch.turnOff

Contributed interactions:
EXAMPLE_START
lookAt:'template:switch.lookAt'
use:'template:switch.toggle'
open:'template:switch.turnOn'
close:'template:switch.turnOff'
EXAMPLE_END

Saved runtime variables:
- object/item variable on: 1/0; initial fallback authored on.

Author fields:
- on
- sprite
- onSprite
- offSprite
- onToggle
- onOn
- onOff

Text fields:
- onText
- offText
- actionOnText
- actionOffText
- alreadyOnText
- alreadyOffText

Effective properties and effects:
- defaultText is onText when on and offText when off.
- sprite is onSprite when on and offSprite when off, falling back to sprite.

Action semantics:
- lookAt narrates linked/effective look text or on/off fallback.
- use/toggle flips on, stores the result, narrates actionOnText/actionOffText, runs onToggle, then onOn/onOff.
- open/turnOn refuses if already on; otherwise turns on.
- close/turnOff refuses if already off; otherwise turns off.

### 12.7 readable template

Purpose:
- Sign, note, book, document, label, poster, terminal readout, form, close-up, or other readable object.

Attach to:
- Inventory items, room hotspots, or overlay targets.

Public actions:
- template:readable.read

Contributed interactions:
EXAMPLE_START
lookAt:'template:readable.read'
use:'template:readable.read'
EXAMPLE_END

Saved runtime variables:
- None.

Author fields:
- readText
- defaultText
- description
- lookOverlay
- closeupOverlay
- onRead

Text fields:
- readText
- defaultText
- description

Effective properties and effects:
- No saved state by default.
- Often paired with effective defaultText/readText/description getters.

Action semantics:
- read checks lookOverlay then closeupOverlay; if one exists it shows the overlay and returns.
- If no overlay exists, read narrates effective readText, falling back to effective defaultText/description, then fallback text.
- onRead runs only on the text-reading path, not when an overlay is shown.
- For itemId-linked world readables, overlay/text properties resolve from explicit world target first, then linked inventory item, then fallback.
- Do not write template:readable.lookAt or template:readable.use; those actions do not exist.
- readable's plain use contribution is an intransitive read action. It must not be used as the fallback action for Use X with readable where X is the selected transitive-use subject.

### 12.8 device template

Purpose:
- Machine, terminal, console, appliance, reader, dispenser, or powered object.

Attach to:
- Room hotspots or inventory items where appropriate.

Public actions:
- template:device.lookAt
- template:device.use

Contributed interactions:
EXAMPLE_START
lookAt:'template:device.lookAt'
use:'template:device.use'
EXAMPLE_END

Saved runtime variables:
- object/item variable used: 1/0.
- object/item variable fixed: 1/0.

Author fields:
- powered
- powerFlag
- requiredItem
- consumeRequiredItem
- setsFlag
- fixedOnUse
- singleUse
- onUse

Text fields:
- defaultText
- alreadyUsedText
- noPowerText
- wrongItemText
- successText

Effective properties and effects:
- May set used, fixed, flags, and consume a required item.

Action semantics:
- use refuses with alreadyUsedText if singleUse and already used.
- use checks powerFlag if present, otherwise authored powered defaulting true.
- use checks requiredItem if supplied.
- use may remove requiredItem, set fixed, set used, set setsFlag, narrate successText, and run onUse.

### 12.9 furniture template

Purpose:
- Visible physical scene object that may block movement, support walk-behind depth sorting, or act as non-blocking background scenery. Use one furniture template with subtype/placement rather than separate furniture types.

Attach to:
- Room hotspots.

Public actions:
- template:furniture.lookAt

Contributed interactions:
EXAMPLE_START
lookAt:'template:furniture.lookAt'
EXAMPLE_END

Saved runtime variables:
- None by default.

Author fields:
- sprite
- rect
- collisionShape
- footprint
- subtype, furnitureSubtype, or placement
- baseline
- walkBehind
- allowWalkBehindWithoutSprite
- zIndex
- defaultText
- onCollide
- onBump

Text fields:
- defaultText
- description
- refusals for take/open/close

Effective properties and effects:
- blocksMovement defaults true except for background/decorative/nonblocking placements.
- Recommended subtype/placement values include floorObstacle, foreground, backgroundShelf, cabinetAgainstWall, againstWall, background, backgroundProp, wall, wallFixture, ceiling, decorative, decoration, and nonblocking.
- walkBehind defaults true when a sprite exists unless overridden.
- collisionShape uses explicit collisionShape or footprint first. Non-blocking subtypes return no collision shape. backgroundShelf/cabinetAgainstWall/againstWall use a shallow bottom footprint if no footprint is supplied. Other blocking furniture falls back to rect then x/y/frameW/frameH.
- baseline falls back to collision bottom or y.
- callbackResults are supplied for blocked movement.

Action semantics:
- lookAt narrates linked/effective look text.
- Use furniture for visible blocking/foreground objects; use barrier for invisible or simple blockers.

### 12.10 barrier template

Purpose:
- Simple blocking geometry, invisible blocker, force field, rubble line, guard zone, or passability gate.

Attach to:
- Room hotspots.

Public actions:
- template:barrier.lookAt

Contributed interactions:
EXAMPLE_START
lookAt:'template:barrier.lookAt'
EXAMPLE_END

Saved runtime variables:
- None by default.

Author fields:
- rect
- collisionShape
- hidden
- renderHidden
- blocksWhenHidden
- blocksMovement getter
- defaultText
- onCollide
- onBump

Text fields:
- defaultText
- description
- refusals for take/open/close

Effective properties and effects:
- blocksMovement defaults true.
- collisionShape falls back to rect.
- callbackResults are supplied for blocked movement.

Action semantics:
- lookAt narrates linked/effective look text.
- For dynamic gates, use propertyGetters:{blocksMovement:"..."}.
- For invisible blockers, set hidden:true, renderHidden:true, and blocksWhenHidden:true.

### 12.11 combine template

Purpose:
- Symmetric two-subject combination.

Attach to:
- Inventory items, room hotspots, or objects that participate in symmetric Use X with Y combinations.

Public actions:
- template:combine.use

Contributed interactions:
EXAMPLE_START
use:'template:combine.use'
EXAMPLE_END

Saved runtime variables:
- None by default; rule effects may set state.

Author fields:
- combine
- combinations
- intransitiveUseText
- selfUseText
- combineRefusalText

Text fields:
- rule text
- rule playerText
- rule refusalText
- combineRefusalText

Effective properties and effects:
- Applies shared rule requirement/effect fields.

Action semantics:
- Without a selected source, narrates intransitiveUseText.
- For two different ids, checks rules on the lexically first id first, then on the second id.
- Rule key is other id or *.
- Passing rules apply effects and narrate text/playerText.

### 12.12 openableBox template

Purpose:
- Simple one-shot openable object that does not need full container open/close/lock behaviour.

Attach to:
- Inventory items or room hotspots.

Public actions:
- template:openableBox.open

Contributed interactions:
EXAMPLE_START
open:'template:openableBox.open'
use:'template:openableBox.open'
EXAMPLE_END

Saved runtime variables:
- object/item variable opened: 1/0.

Author fields:
- alreadyOpenText
- openEffect
- revealsItem
- openSpeakerId
- openText

Text fields:
- alreadyOpenText
- openText

Effective properties and effects:
- transitiveUse defaults false.
- First open sets opened=1, applies openEffect, and may add revealsItem.

Action semantics:
- If opened, narrates alreadyOpenText.
- If not opened, sets opened, applies effects, adds revealsItem if no openEffect.addItem is present, and narrates openText.

### 12.13 exchange template

Purpose:
- Give-only trade, barter, handover, bribe, proof presentation, document check, or NPC exchange.

Attach to:
- NPCs, room hotspots, or inventory targets that receive Give interactions.

Public actions:
- template:exchange.give

Contributed interactions:
EXAMPLE_START
give:'template:exchange.give'
EXAMPLE_END

Saved runtime variables:
- None by default; rule effects may set state.

Author fields:
- exchanges
- exchangeNeedItemText
- exchangeRefusalText

Text fields:
- playerRefusalText
- playerText
- npcText
- text
- exchangeNeedItemText
- exchangeRefusalText

Effective properties and effects:
- Applies shared rule requirement/effect fields and may run afterDialogueScript.

Action semantics:
- If no source item is selected, narrates exchangeNeedItemText.
- Finds rule by source id or *.
- On failure, may show playerRefusalText and NPC/target refusal.
- On success, applies effects, says optional playerText then npcText/text, then runs afterDialogueScript.
- Exchange is Give-only.

### 12.14 multiRequirement template

Purpose:
- Target that needs multiple items delivered/installed before completion.

Attach to:
- Room hotspots, NPCs, or objects that receive several required items.

Public actions:
- template:multiRequirement.add

Contributed interactions:
EXAMPLE_START
give:'template:multiRequirement.add'
use:'template:multiRequirement.add'
EXAMPLE_END

Saved runtime variables:
- delivered_itemId for each requirement item id.

Author fields:
- requirements
- requirementNeedItemText
- requirementWrongItemText
- completion
- completionText
- completionSpeakerId

Text fields:
- requirement text
- alreadyText
- requirementNeedItemText
- requirementWrongItemText
- completionText

Effective properties and effects:
- Each requirement and completion may use shared rule requirement/effect fields.

Action semantics:
- If no source item is selected, narrates requirementNeedItemText.
- If source is not listed, narrates requirementWrongItemText.
- If requirement already delivered, narrates alreadyText.
- Otherwise sets delivered_itemId=1, removes source unless consume:false, and narrates text.
- When all requirements are delivered, applies completion and narrates completionText.

### 12.15 gatekeeper template

Purpose:
- NPC/object that permits or blocks progress, often with optional dialogue.

Attach to:
- NPC characters or room hotspots.

Public actions:
- template:gatekeeper.talkTo
- template:gatekeeper.check

Contributed interactions:
EXAMPLE_START
talkTo:'template:gatekeeper.talkTo'
use:'template:gatekeeper.check'
give:'template:gatekeeper.check'
EXAMPLE_END

Saved runtime variables:
- None by default.

Author fields:
- dialogueTree
- allowsPassage
- allowText
- blockText

Text fields:
- allowText
- blockText

Effective properties and effects:
- No movement or transition effect by itself.

Action semantics:
- talkTo starts dialogueTree if present; otherwise it performs check.
- check narrates allowText when effective allowsPassage is true, otherwise blockText.
- Gatekeeper does not enable transitions or remove blockers; use flags/effective properties/transitionZones for passage.

### 12.16 costume template

Purpose:
- Wearable item that changes the player sprite and optionally swaps inventory items.

Attach to:
- Inventory items.

Public actions:
- template:costume.use

Contributed interactions:
EXAMPLE_START
use:'template:costume.use'
EXAMPLE_END

Saved runtime variables:
- item variable worn: 1.

Author fields:
- costumeSpriteId
- playerSpriteId
- baseClothes
- replacesItem
- returnItem
- wearText
- costumeNoSpriteText

Text fields:
- wearText
- costumeNoSpriteText

Effective properties and effects:
- transitiveUse defaults false.
- Changes player sprite, sets worn, removes replacesItem, and adds returnItem.

Action semantics:
- If costumeSpriteId/playerSpriteId is missing and baseClothes:true, restores authored game.player.spriteId.
- If no sprite can be determined, narrates costumeNoSpriteText.
- Override use only for special location/witness/story rules, and document the override.

### 12.17 toolTarget template

Purpose:
- Target-specific Use tool on target behaviour.

Attach to:
- Room hotspots, NPCs, or items that receive tool uses.

Public actions:
- template:toolTarget.use

Contributed interactions:
EXAMPLE_START
use:'template:toolTarget.use'
EXAMPLE_END

Saved runtime variables:
- None by default; rule effects may set state.

Author fields:
- toolUses
- toolNeedItemText
- toolRefusalText

Text fields:
- rule text
- toolNeedItemText
- toolRefusalText
- rule refusalText

Effective properties and effects:
- Applies shared rule requirement/effect fields.

Action semantics:
- If no source item is selected, narrates toolNeedItemText.
- Finds rule by source/tool id or *.
- On failure, narrates rule refusal or toolRefusalText.
- On success, applies effects and narrates rule text.

### 12.18 clueUnlocker template

Purpose:
- Clue object/readable that unlocks map places or clue-gated information.

Attach to:
- Inventory items, room hotspots, or overlay targets.

Public actions:
- template:clueUnlocker.unlock

Contributed interactions:
EXAMPLE_START
lookAt:'template:clueUnlocker.unlock'
use:'template:clueUnlocker.unlock'
EXAMPLE_END

Saved runtime variables:
- item variable place_placeId_unlocked=1 on mapItemId or on the clue target id.

Author fields:
- unlockBlocked
- unlockBlockedText
- unlocksPlaces
- mapItemId
- unlockText

Text fields:
- unlockBlockedText
- unlockText

Effective properties and effects:
- Sets place unlock item variables.

Action semantics:
- If unlockBlocked is true, narrates unlockBlockedText.
- Otherwise sets item variable place_placeId_unlocked=1 for each unlocksPlaces id and narrates unlockText.
- Map visibleFlag checks global flags, not these item variables; use a places/mapPlaces getter or mirror into flags if needed.

### 12.19 distractible template

Purpose:
- NPC/object that can be distracted by an item or default action.

Attach to:
- NPC characters or room hotspots.

Public actions:
- template:distractible.distract

Contributed interactions:
EXAMPLE_START
use:'template:distractible.distract'
give:'template:distractible.distract'
EXAMPLE_END

Saved runtime variables:
- object/character variable distracted: 1 after success.

Author fields:
- distractions
- distractionRefusalText

Text fields:
- rule text
- rule refusalText
- distractionRefusalText

Effective properties and effects:
- Sets distracted=1 and applies shared rule effects on success.

Action semantics:
- Source is selected inventory item/subject if present.
- Rule key is source id, default when no source exists, or * fallback.
- On failure, narrates rule refusal or distractionRefusalText.
- On success, sets distracted, applies effects, and says/narrates rule.text using rule.speakerId or target id.

### 12.20 room walkability templates
  
Room walkability templates attach to rooms, not hotspots, and contribute no interactions.

- corridor: side-on corridors, hallways, platforms, and service passages. Author floorBand and exits; add blockers for partial obstructions.
- room: ordinary rooms with one main floor rectangle. Author floor or floorBand and exits.
- path: irregular traversable route. Author pathPoints/path and pathWidth/width.
- bridge: narrow path variant for bridges, catwalks, gantries, beams, and narrow platforms.
- junction: hub rooms with central and branches.
- stair: stairs, ramps, and sloped routes using pathPoints/path and pathWidth/width.

Use generated template geometry as the default, then add blockers, transitionZones, triggerZones, door portals, and object footprints for exceptions. Replace generated walk boxes only when unavoidable.

### 12.21 Template quick reference: exact contributed interactions

Use this list when validating generated scripts. These are exact public action names.

- door contributes lookAt -> template:door.lookAt, open -> template:door.open, close -> template:door.close, use -> template:door.useKey, walkTo -> template:door.walkTo.
- key contributes no interactions and has no public actions.
- map contributes lookAt -> template:map.show.
- pickup contributes lookAt -> template:pickup.lookAt, take -> template:pickup.take.
- container contributes lookAt -> template:container.lookAt, open -> template:container.open, close -> template:container.close, use -> template:container.useKey.
- switch contributes lookAt -> template:switch.lookAt, use -> template:switch.toggle, open -> template:switch.turnOn, close -> template:switch.turnOff.
- readable contributes lookAt -> template:readable.read, use -> template:readable.read.
- device contributes lookAt -> template:device.lookAt, use -> template:device.use.
- furniture contributes lookAt -> template:furniture.lookAt.
- barrier contributes lookAt -> template:barrier.lookAt.
- corridor, room, path, bridge, junction, and stair are room walkability templates and contribute no interactions.
- combine contributes use -> template:combine.use.
- openableBox contributes open -> template:openableBox.open, use -> template:openableBox.open.
- exchange contributes give -> template:exchange.give.
- multiRequirement contributes give -> template:multiRequirement.add, use -> template:multiRequirement.add.
- gatekeeper contributes talkTo -> template:gatekeeper.talkTo, use -> template:gatekeeper.check, give -> template:gatekeeper.check.
- costume contributes use -> template:costume.use.
- toolTarget contributes use -> template:toolTarget.use.
- clueUnlocker contributes lookAt -> template:clueUnlocker.unlock, use -> template:clueUnlocker.unlock.
- distractible contributes use -> template:distractible.distract, give -> template:distractible.distract.

### 12.22 Template selection checklist

Use this checklist before writing custom scripts:
- Door, hatch, gate, lockable passage: door plus key if locked, and a door portal for travel.
- Loose item in the world: pickup.
- Box, drawer, safe, cupboard with contents and/or lock: container.
- Simple one-shot openable inventory object: openableBox.
- Lever, valve, button, switch, on/off control: switch.
- Note, sign, poster, book, label, document, terminal readout: readable.
- Powered/useable machine: device.
- Visible physical scene object: furniture with subtype/placement and explicit footprint where blocking matters.
- Invisible/simple blocker: barrier.
- Symmetric Use X with Y: combine.
- Use specific tool on target: toolTarget.
- Give item for trade or handover: exchange.
- Deliver several items to one target: multiRequirement.
- NPC/object that permits or blocks passage: gatekeeper plus effective allowsPassage/blocker state.
- Disguise/clothing item: costume, unless special location/witness rules require a custom script.
- Clue that unlocks map information: clueUnlocker plus map visibility logic.
- Distractible NPC/object: distractible.

### 12.23 Template override rules and validator warning

A template's contributed interactions are defaults. If the entity defines the same interaction key, the entity's value wins.

Good override examples:
- A costume item overrides use because wearing it is forbidden in a particular room.
- A door overrides open because it has a special cutscene and animation sequence that the door template cannot express.
- A readable overrides use because using it consumes the document or starts special dialogue.

Bad override examples:
- A readable item defines lookAt:'lookAtNote' only to narrate state-dependent note text. Use propertyGetters:{defaultText:'noteText'} instead.
- A switch defines use:'useSwitch' only to toggle a flag and text when the switch template could do it.
- A door defines lookAt:'lookAtDoor' only to say open/closed text that the door template already supplies.

If the validator warns TEMPLATE_INTERACTION_OVERRIDDEN, either remove the explicit interaction and rely on the template, or keep it and document why the override is intentional.

## 13. Runtime Script API: Exact Method Contracts

Use `api` for all mutation and presentation. Unless stated otherwise, methods return `undefined`. Script function signatures depend on caller:

- `api.RunScript`, hooks, input-prompt scripts, and dialogue condition/action/choice scripts receive `(api, context)`.
- Interaction scripts receive `(api, command, target, self)`.
- Property getters receive `(query, self, context)`.
- Template optional scripts and map-place scripts receive `(api, self, context)`.
- Cutscene script steps receive `(api, step, previousResult)`.
- Object animation completion scripts receive `(api, result)`.

Do not assume a script called from one system receives the context shape used by another system.

### Dialogue and input

#### `api.Say(speakerId:string|null, text:string, options?:object) -> undefined`

Formats `text` and shows spoken dialogue. Useful options: `duration:number`, `voice:string`, `choices:array`, `onComplete:function(result)`.

#### `api.Narrate(text:string, options?:object) -> undefined`

Formats `text` and shows lower-panel narration. Useful options are the same as `Say`.

#### `api.StartDialogue(treeId:string, nodeId?:string, context?:object) -> undefined`

Starts dialogue tree at `nodeId`, or tree `start`, or node id `start`. Missing tree/node warns and does nothing.

#### `api.ShowDialogue(treeId:string, nodeId?:string, context?:object) -> undefined`

Alias for `StartDialogue`.

#### `api.AskText(prompt:string, target:string|object, options?:object) -> undefined`

Shows a text input prompt. `prompt` is formatted. Target storage forms: string global variable name; `{scope:'variable',name}`; `{type:'variable',name}`; `{scope:'room',id,name}`; `{scope:'character',id,name}`; `{scope:'item',id,name}`. Options: `maxLength:number` default 32; `allowBlank:boolean`; `script:string` run after accept with context `{value,target,result}`; `onComplete:function(value,result)`. Blank text is ignored unless `allowBlank:true`.

#### `api.AskNumber(prompt:string, target:string|object, options?:object) -> undefined`

Same as `AskText`, but accepted value must be finite number. Numeric input accepts digits, dot, and minus during typing; invalid final value is rejected.

### Inventory, flags, variables, and states

#### `api.AddItem(itemId:string) -> undefined`

Adds item once. If inventory changes, runs `onInventoryChanged` with `{action:'add',itemId,inventory}`.

#### `api.RemoveItem(itemId:string) -> undefined`

Removes item if present. Clears selected inventory item if removed. If inventory changes, runs `onInventoryChanged` with `{action:'remove',itemId,inventory}`.

#### `api.HasItem(itemId:string) -> boolean`

Returns true if item is in inventory.

#### `api.SetFlag(name:string, value:any) -> undefined`

Stores `!!value`.

#### `api.GetFlag(name:string) -> boolean`

Returns boolean flag value.

#### `api.SetVariable(name:string, value:any) -> undefined`

Stores global variable. Prefer string/number for save clarity.

#### `api.GetVariable(name:string) -> any`

Returns global variable or `undefined`.

#### `api.SetRoomState(roomId:string, values:object) -> undefined`

Falsy room id does nothing. Creates state bucket and copies enumerable fields.

#### `api.GetRoomState(roomId:string) -> object`

Falsy room id returns `{}`. Otherwise creates and returns state bucket.

#### `api.SetCharacterState(characterId:string, values:object) -> undefined`

Falsy character id does nothing. Creates state bucket and copies enumerable fields.

#### `api.GetCharacterState(characterId:string) -> object`

Falsy character id returns `{}`. Otherwise creates and returns state bucket.

#### `api.RunScript(scriptName:string, context?:object) -> any`

Runs named script as `(api, context||{})`. Missing/throwing scripts log and return `null`.


### Scoped variables

Scope aliases:

- Room: `room`, `rooms`.
- Character: `character`, `characters`, `actor`, `actors`, `npc`, `npcs`.
- Item: `item`, `items`, `inventory`, `inventoryitem`.

Values must be strings or finite numbers. Invalid scope/id/name/value warns and returns false/null/default.

#### Generic scoped variable methods

- `api.SetScopedVariable(scopeType:string, objectId:string, name:string, value:string|finite number) -> boolean`.
- `api.GetScopedVariable(scopeType:string, objectId:string, name:string, defaultValue:any) -> string|number|defaultValue`.
- `api.HasScopedVariable(scopeType:string, objectId:string, name:string) -> boolean`.
- `api.ClearScopedVariable(scopeType:string, objectId:string, name:string) -> boolean`.
- `api.AddScopedVariable(scopeType:string, objectId:string, name:string, amount:number) -> number|null`.
- `api.SubtractScopedVariable(scopeType:string, objectId:string, name:string, amount:number) -> number|null`.
- `api.MultiplyScopedVariable(scopeType:string, objectId:string, name:string, amount:number) -> number|null`.
- `api.DivideScopedVariable(scopeType:string, objectId:string, name:string, amount:number) -> number|null`.
- `api.CompareScopedVariable(scopeType:string, objectId:string, name:string, operator:string, value:any) -> boolean`.

#### Room variable helpers

- `api.SetRoomVariable(roomId:string, name:string, value:string|finite number) -> boolean`.
- `api.GetRoomVariable(roomId:string, name:string, defaultValue:any) -> string|number|defaultValue`.
- `api.AddRoomVariable(roomId:string, name:string, amount:number) -> number|null`.
- `api.SubtractRoomVariable(roomId:string, name:string, amount:number) -> number|null`.
- `api.MultiplyRoomVariable(roomId:string, name:string, amount:number) -> number|null`.
- `api.DivideRoomVariable(roomId:string, name:string, amount:number) -> number|null`.
- `api.CompareRoomVariable(roomId:string, name:string, operator:string, value:any) -> boolean`.

#### Character variable helpers

- `api.SetCharacterVariable(characterId:string, name:string, value:string|finite number) -> boolean`.
- `api.GetCharacterVariable(characterId:string, name:string, defaultValue:any) -> string|number|defaultValue`.
- `api.AddCharacterVariable(characterId:string, name:string, amount:number) -> number|null`.
- `api.SubtractCharacterVariable(characterId:string, name:string, amount:number) -> number|null`.
- `api.MultiplyCharacterVariable(characterId:string, name:string, amount:number) -> number|null`.
- `api.DivideCharacterVariable(characterId:string, name:string, amount:number) -> number|null`.
- `api.CompareCharacterVariable(characterId:string, name:string, operator:string, value:any) -> boolean`.

#### Item variable helpers

- `api.SetItemVariable(itemId:string, name:string, value:string|finite number) -> boolean`.
- `api.GetItemVariable(itemId:string, name:string, defaultValue:any) -> string|number|defaultValue`.
- `api.AddItemVariable(itemId:string, name:string, amount:number) -> number|null`.
- `api.SubtractItemVariable(itemId:string, name:string, amount:number) -> number|null`.
- `api.MultiplyItemVariable(itemId:string, name:string, amount:number) -> number|null`.
- `api.DivideItemVariable(itemId:string, name:string, amount:number) -> number|null`.
- `api.CompareItemVariable(itemId:string, name:string, operator:string, value:any) -> boolean`.

Arithmetic validation: `amount` must be finite number; current value must be finite number or absent; absent current value starts at 0; division by zero returns `null` and warns.

Comparison operators: `==`, `equals`, `===`, `strictEquals`, `!=`, `notEquals`, `!==`, `strictNotEquals`, `contains` for strings, `>`, `>=`, `<`, `<=` for numbers.


### Room, actor, object, presentation, and flow methods

#### `api.ChangeRoom(roomId:string, x?:number, y?:number, facing?:string) -> undefined`

Enters room through the central room system. Missing room shows a missing-room line. Runs room exit/enter hooks.

#### `api.MoveCharacter(characterId:string, x:number, y:number, options?:object) -> undefined`

Moves a non-player room character in the current room directly toward `x`/`y`. It does not use the player's `walkGraph` pathfinder, destination clamping, blockers, or transition zones; author the target inside the room's sensible walkable space. Options: `speed:number`, `hideOnComplete:boolean`, `onComplete:function(result)`. Replacing an active character move calls the previous `onComplete` with status `superseded`. Missing characters call `onComplete` with status `cancelled`.

#### `api.SetAnimation(actorId:string, animationName:string, options?:object) -> undefined`

Sets actor custom animation for `player` or room character. Options are accepted by wrapper but ignored by current actor animation implementation.

#### `api.ClearAnimation(actorId:string) -> undefined`

Clears actor custom animation.

#### `api.SetObjectAnimation(objectId:string, animationName:string, options?:object) -> undefined`

Starts object animation. Options: `reverse:boolean`, `holdFinal:boolean`, `onComplete:function(result)`. Replacing active animation calls previous current callback with `superseded`.

#### `api.ClearObjectAnimation(objectId:string) -> undefined`

Clears object animation; current callback receives `cancelled`.

#### `api.SetObjectState(objectId:string, values:object) -> undefined`

Merges enumerable fields into saved object state; can override effective properties.

#### `api.GetObjectState(objectId:string) -> object`

Returns saved object state, creating it if needed.

#### `api.SetObjectVariable(objectId:string, name:string, value:string|finite number) -> undefined`

Underlying setter validates and returns boolean internally, but public wrapper does not return it. Do not rely on return.

#### `api.GetObjectVariable(objectId:string, name:string, defaultValue:any) -> string|number|defaultValue`

Returns object variable or default.

#### `api.AddObjectVariable(objectId:string, name:string, amount:number) -> number|null`

Adds finite numeric amount to numeric object variable. Invalid amount/current value returns `null` and warns.

#### `api.ShowOverlay(overlaySpec:string|object) -> undefined`

String becomes `{image:string}`. Object may contain `image`, `itemId`, and `hotspots`.

#### `api.CloseOverlay() -> undefined`

Closes active overlay.

#### `api.PlaySound(sources:array) -> undefined`

Pass an array of relative filenames, normally with one filename. The engine uses `sources[0]` and resolves under `sounds/`. Use `[]` or `null` for silence/no-op. Do not pass a bare string to this public method.

#### `api.StartCutscene(steps:object|array, options?:object) -> undefined`

Starts a cutscene; if one is active and `options.replace` is not true, queues instead. Runs `beforeCutscene`; false cancels.

#### `api.QueueCutscene(steps:object|array, options?:object) -> undefined`

Queues cutscene.

#### `api.MakeActionResult(status:string, values?:object) -> object`

Valid statuses: `completed`, `blocked`, `cancelled`, `superseded`, `transitioned`, `ended`; invalid becomes `completed`. Returned result has `status`, `action`, `reason`, `reached`, `actorId`, `targetId`, `blockerId`, `roomId`, `continueCutscene`, plus extra fields from `values`.

#### `api.EndGame(title:string, text:string, options?:object) -> undefined`

Shows one-off ending. If first argument is an ending id and second argument is not string, the engine treats it compatibly as an ending lookup.

#### `api.ShowEnding(endingId:string, options?:object) -> undefined`

Shows named ending from `game.endings`.

#### `api.Save(slot?:string) -> undefined`

Saves slot; default `'1'`. The built-in menus expose slots 1..5. Saving is blocked unless a game is in ordinary play/menu-from-play state and no dialogue, cutscene, input prompt, or other modal sequence is active. Saves use browser `localStorage` and may fail if browser storage is unavailable or full.

#### `api.Load(slot?:string) -> undefined`

Loads slot; default `'1'`. Loads only compatible saves for the same game id and engine API/save-data version. Loading bumps lifecycle guards and cancels stale deferred callbacks.


## 14. Lifecycle Hooks

Hook values are script name strings or arrays. Hook scripts receive `(api, context)`. Context is deep-cloned and frozen; do not mutate it.

Boolean hooks are all `before...` hooks:

- Return exactly `false` to cancel.
- Any other return value allows.
- Missing, non-string, or throwing boolean hook fails safe and cancels.

Void hooks are all non-`before` hooks:

- Must not return a value.
- Returned values are warned and ignored.
- Void hook lists run every listed script.

Game hooks: `beforeRoomEnter`, `afterRoomEnter`, `beforeRoomExit`, `afterRoomExit`, `beforeTransition`, `afterTransition`, `beforeCommand`, `afterCommand`, `onInventoryChanged`, `beforeCutscene`, `afterCutscene`, `onMenuEnter`, `onMenuExit`.

Room hooks: `beforeEnter`, `afterEnter`, `beforeExit`, `afterExit`.

Transition hooks: `beforeTransition`, `afterTransition`.

Unsupported legacy hooks: `onEnter`, `onExit`, `onBeforeEnter`, `onAfterEnter`, `onBeforeExit`, `onAfterExit`, `onBeforeTransition`, `onAfterTransition`.

Lifecycle guard rule: deferred callbacks from movement, dialogue, cutscenes, character movement, object animation, room changes, loads, new games, and endings are invalidated when superseded. Use engine cutscenes/callbacks, not raw browser timers, for story sequencing.


## 15. Dialogue Trees

Dialogue tree syntax:

EXAMPLE_START
dialogueTrees:{
  guardTalk:{
    speakerId:'guard',
    start:'start',
    nodes:{
      start:{
        text:'Good day, {{var:playerName}}.',
        choices:[
          {id:'askGate',text:'Can I pass?',playerText:'Can I pass?',response:'Not yet.',next:'start',repeat:true},
          {id:'bye',text:'Goodbye.',response:'Farewell.',end:true}
        ]
      }
    }
  }
}
EXAMPLE_END

Tree fields: `speakerId`, `start`, `nodes`, `emptyText`. Node fields: `speakerId`, `text`, `choices`, `emptyText`. `emptyText` supplies a single closing choice when a node has no visible choices.

Dialogue depth guidance:
- Dialogue trees are both a technical structure and a content-delivery mechanism. For any NPC or entity whose role is substantial in the GDD or current human room brief, the tree should reflect that role through state-aware choices, character voice, clueing, refusal/hint integration, world or theme content, and post-event reactions where relevant.
- Do not replace a substantial conversation with a custom talkTo script that only says one line. Use a script only to start the dialogue tree or for distinctive logic that dialogue conditions/actions cannot express.

Choice fields: `id`, `text`, `playerText`, `skipPlayerLine`, `speakerId`, `response`, `next`, `end`, `repeat`, `stay`, `hideAfterUse`, `condition`, `conditions`, `showIf`, `preAction`, `preActions`, `action`, `actions`, `script`, `postResponseAction`, `postResponseActions`.

Selection order:

1. Mark choice id used.
2. Run preActions.
3. Player speaks unless skipped.
4. Show response.
5. Run actions.
6. Run script.
7. Run postResponseActions.
8. If not ended, show next node or redisplay current/start node.

Choice with `id` is hidden after use unless `repeat:true`, `stay:true`, or `hideAfterUse:false`. Choice without `id` is not memory-hidden.

Condition forms:

- `'flagName'`.
- `{flag:'flagName'}`.
- `{notFlag:'flagName'}`.
- `{hasItem:'itemId'}`.
- `{missingItem:'itemId'}`.
- `{script:'scriptName'}` with truthy return.
- `{var:'varName',op:'==',value:any}`.
- `{roomVar:['roomId','name'],op:'>=',value:number}`.
- `{characterVar:['characterId','name'],op:'==',value:any}`.
- `{itemVar:['itemId','name'],op:'contains',value:'text'}`.

Comparison operators: `==`, `equals`, `===`, `strictEquals`, `!=`, `notEquals`, `!==`, `strictNotEquals`, `contains`, `>`, `>=`, `<`, `<=`.

Action forms:

- `{setFlag:'flagName',value:any}`; default value true.
- `{clearFlag:'flagName'}`.
- `{setVar:'varName',value:any}`.
- `{addVar:'varName',value:number}`.
- `{addItem:'itemId'}`.
- `{removeItem:'itemId'}`.
- `{roomVar:['roomId','name'],value:string|finite number}`.
- `{characterVar:['characterId','name'],value:string|finite number}`.
- `{itemVar:['itemId','name'],value:string|finite number}`.
- `{script:'scriptName'}`.

Unknown dialogue condition warns and returns true. Unknown action warns and does nothing.

Text placeholders: `{{var:name}}`, `{{flag:name}}`, `{{room:roomId.name}}`, `{{character:characterId.name}}`, `{{item:itemId.name}}`, `{{playerName}}`. Bare `{{name}}` is also accepted as shorthand for global variable `name`.


## 16. Cutscenes

Use `api.StartCutscene(steps, options)` or `api.QueueCutscene(steps, options)`. `steps` may be a single step or array.

Options:

- `replace:true`: supersedes active cutscene.
- Without `replace:true`, starting while active queues.

Continuation:

- Default continuation requires result status `completed` or `transitioned` and `continueCutscene !== false`.
- Step `continueOn:string|array` overrides continuation statuses.

Result statuses: `completed`, `blocked`, `cancelled`, `superseded`, `transitioned`, `ended`.

Result fields: `status`, `action`, `reason`, `reached`, `actorId`, `targetId`, `blockerId`, `roomId`, `continueCutscene`, plus extras.

Supported step types:

- `{type:'sequence',steps:[...]}`.
- `{type:'parallel',steps:[...]}`.
- `{type:'if',condition:condition,then:[...],else:[...]}`; accepts `conditions`; true branch may use `steps`.
- `{type:'wait',duration:number}` or `{type:'wait',seconds:number}`; units are seconds; zero/negative completes immediately.
- `{type:'say',speakerId:'actorId',text:'...',duration?:number,voice?:string}`; accepts `actorId`.
- `{type:'narrate',text:'...',duration?:number,voice?:string}`.
- `{type:'walk',x:number,y:number,targetId?:string}`.
- `{type:'moveCharacter',actorId:'npcId',x:number,y:number,speed?:number,hideOnComplete?:boolean}`; accepts `characterId`.
- `{type:'animateObject',objectId:'objectId',animation:'name',wait?:boolean,reverse?:boolean,holdFinal?:boolean}`; accepts `animationName`; default `wait:true`; default `holdFinal:true`.
- `{type:'script',script:'scriptName',...}`; script receives `(api, step, previousResult)` and should return `api.MakeActionResult(...)` when status matters.
- `{type:'setFlag',name:'flagName',value:any}` or `{type:'setFlag',flag:'flagName',value:any}`.
- `{type:'setVariable',name:'varName',value:any}` or `{type:'setVariable',variable:'varName',value:any}`.
- `{type:'setObjectState',objectId:'id',values:{...}}`.
- `{type:'setObjectVariable',objectId:'id',name:'varName',value:string|finite number}`.
- `{type:'setCharacter',actorId:'id',x?,y?,facing?,hidden?,visible?,controllable?,animation?,customAnimation?,scale?}`; accepts `characterId`.
- `{type:'setAnimation',actorId:'id',animation:'name',options?:object}`; accepts `animationName`.
- `{type:'clearAnimation',actorId:'id'}`.
- `{type:'clearObjectAnimation',objectId:'id'}`.
- `{type:'sound',sources?:array,sound?:array,sfx?:array}`; use an array, normally with one filename.

Cutscene condition forms: array means all pass; `{flag:'flagName',value?:boolean}` means flag equals `value !== false`; `{notFlag:'flagName'}`; `{hasItem:'itemId'}`; `{missingItem:'itemId'}`. Other condition forms return true; use a script step for complex conditions.

There is no built-in cutscene `changeRoom` step. Use a script step calling `api.ChangeRoom()`. Unknown cutscene step types are skipped and treated as completed, so validation should catch typos before runtime.


## 17. Endings, UI, Save/Load, and Validation

Ending syntax:

EXAMPLE_START
endings:{
  good:{
    title:'Home',
    text:'You made it.',
    background:'good_end.png',
    music:['good_end.ogg'],
    sound:['cheer.ogg'],
    animation:{image:'flag.png',x:140,y:60,frameW:32,frameH:32,frames:4,fps:6,loop:true,row:0}
  }
}
EXAMPLE_END

Ending fields: `title`, `text`, `background`, `endBackground`, `music`, `endMusic`, `sound`, `sfx`, `animation`. `music`/`endMusic`/`sound`/`sfx` must be source-list arrays. If ending music is omitted, engine falls back to `game.endMusic`; use `music:[]` for silence. `animation` may be `{image,x,y,frameW,frameH,frames,fps,loop,row}`; supported shorthand fields are `animationImage`, `animationX`, `animationY`, `animationFrameW`, `animationFrameH`, `animationFrames`, `animationFps`, and `animationLoop`. Ending background images resolve under `rooms/` and should be 320x200; ending animation images resolve under `objects/` and are drawn at `x`/`y`, default centred near `y=24`, using horizontal frames and optional `row`.

UI fields: `verbInventoryBackground`, `verbColor`, `verbSelectedColor`, `verbSelectedBackColor`, `verbSelectedUnderlineColor`, `verbShadowColor`, `commandTextColor`, `choiceTextColor`, `narrationTextColor`, `hoverTextColor`, `inventorySelectedBackColor`, `textColor`, `textShadowColor`, `dialogueTextColor`, `playerDialogueColor`, `panelColor`, `panelTopLineColor`, `inventoryIconMaxW`, `inventoryIconMaxH`. Rendering: `rendering.imageSmoothing` or top-level `imageSmoothing`.

The engine owns save/load. Do not serialize custom state yourself. Use public flags/variables/scoped variables/object state APIs.

State storage guidance:

- Use flags for simple global yes/no story state.
- Use global variables for simple global values such as names, codes, counters, or story choices.
- Use room variables for state that belongs to a room.
- Use character variables for state that belongs to a character/NPC.
- Use item variables for state that belongs to an inventory item or map item.
- Use object variables for state that belongs to a room object/hotspot and for template runtime variables.
- Use object state only when you intentionally want to override effective properties directly.
- Use room/character state for broader saved state objects where scoped variables are not a natural fit.

Validation notes:
- Run the validator when available. For the canonical layout, use:

EXAMPLE_START
python validator.py gameId/gameId.js --engine index.html --check-assets --report validation_report.txt
EXAMPLE_END

- If the script is not in the same folder as its assets, pass the asset folder explicitly:

EXAMPLE_START
python validator.py scripts/gameId.js --engine index.html --asset-root gameId/ --check-assets --report validation_report.txt
EXAMPLE_END

- Fix every [[PCEVAL][ERROR] before runtime testing. Treat [[PCEVAL][WARN] as an issue unless deliberately harmless and documented.
- JS_SYNTAX_ERROR means the game script cannot boot. TEMPLATE_ACTION_INVALID includes invented or unknown template actions, such as template:readable.lookAt.
- Human runtime testing is still required for room transitions, dialogue branches, inventory actions, cutscenes, save/load, and endings.
