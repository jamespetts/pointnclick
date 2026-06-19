# PointClickEngine API Reference for AI Game Authors

Engine API: 1
Authoring language: browser JavaScript in a `.js` game script.

This is the complete public authoring contract for game scripts. The authoring AI will not receive the game engine itself. Use only the APIs, data shapes, templates, and validation rules documented here. If a requested design cannot be expressed with this contract, say that the engine needs an extension and specify what it is.

Examples use indented plain text blocks labelled `EXAMPLE_START` / `EXAMPLE_END`; no fenced code blocks are used so this file can be embedded in prompts safely.

## 1. Genre, Mental Model, and Authoring Priorities

PointClickEngine creates early-1990s point-and-click adventure games in the style of SCUMM-era adventures: a 320x200 logical screen, painted room scene, lower verb/inventory interface, clickable hotspots, walking actors, inventory puzzles, dialogue trees, simple sprite animations, overlays/maps, cutscenes, save/load, refusals, and multiple endings.

Author in this priority order:

1. Declarative data.
2. Templates.
3. Effective properties and getter scripts.
4. Dialogue trees and cutscene step data.
5. Custom JavaScript scripts only for distinctive logic that cannot be represented above.

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


General quality and depth contract:
- A valid package must not merely run; it must show production-intent design depth appropriate to the requested asset tier, genre, tone, and GDD. Structural validation is necessary but not sufficient.
- Content parsimony means avoiding redundant systems, filler, duplicated state, and unnecessary branches. It does not mean reducing important rooms, characters, objects, puzzles, clues, descriptions, refusals, dialogue, endings, or visual/audio assets to the smallest technically valid representation.
- For each authored element, first identify its content role: critical path gate, puzzle source, clue carrier, red herring, worldbuilding element, comic/tonal beat, characterisation beat, reward/payoff, tutorial, transition, ambience, or purely incidental detail. The depth of implementation must match that role.
- Critical path, puzzle-relevant, recurring, gatekeeping, companion, antagonist, or theme-bearing elements require state-aware authored depth unless the GDD explicitly says they should be terse, silent, abstract, or minimalist. Depth may be expressed through dialogue trees, effective-property text, refusals, environmental descriptions, cutscenes, audio/visual design, or puzzle affordances; choose the canonical engine mechanism for the content role.
- Incidental elements may be concise, but they should still be specific to the game world and tone. Avoid generic first-draft text, interchangeable jokes, unexplained gates, single-line substitutes for major interactions, and content that satisfies only id/reference/path validation.
- Important clues should normally be represented in more than one channel, such as object description, dialogue, refusal, post-failure hint, environmental signposting, or state change. Repetition should clarify without spoiling and should escalate only after player action or failure.
- Major conversations should normally be dialogue trees rather than one-line talk scripts. A one-line talkTo script is appropriate only for incidental targets with no puzzle, clue, plot, theme, character, gatekeeping, trade, recruitment, or recurring function.
- Before handoff, perform a depth review: identify the major content roles, state what each contributes, and revise any element whose implementation is merely functional when its role requires authored depth.

## 3. Glossary of Engine Concepts

Declarative data means object, room, item, dialogue, cutscene, and template definitions written as data fields in the game definition. Declarative data is preferred because it is validator-checkable and uses the engine's canonical systems.

An entity is anything the engine can query for properties or interactions: rooms, room hotspots/objects, inventory items, characters, and overlay targets.

A room object or hotspot is an entry in `room.hotspots`. It is both a clickable target and, when it has geometry, a possible movement/rendering participant. Its `id` is globally scoped because saved object state is keyed by object id across the whole game.

An inventory item is an entry in `game.items`. It can be carried in inventory and can also act as an interaction target. A room object may link to an inventory item with `itemId` so world and carried forms can share text, refusals, and behaviour.

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

Visual asset quality contract:
- For a playable first pass, runtime art is expected to be production-intent prototype art, not merely validation art. Each gameplay-relevant room, character, object, inventory icon, overlay, and UI element must be designed from its narrative function, material, scale, interaction role, and visual style. It must be recognisable at the size and context in which the engine displays it.
- Visual parsimony means using the smallest number of well-designed assets that communicate the game clearly. It does not mean substituting undifferentiated marks, arbitrary tokens, or mechanically varied shapes for authored visual design.
- Placeholder assets are allowed only when the workflow or user explicitly requests placeholders, or when binary image generation is genuinely unavailable. They must be labelled as placeholders in the asset manifest and implementation notes, and the package must state that it is not a production-quality visual first pass.
- Every important visual asset must have a short visual acceptance note in the asset manifest covering intended reading, distinguishing features, scale/readability context, transparency/background needs, and consistency with the style reference sheet.

Audio:

- Music resolves under `music/`; sound and voice resolve under `sounds/`.
- Music and sound source-list fields must be arrays of relative filenames; the current engine uses the first element. Use `[]` for silence.
- Public `api.PlaySound()` and cutscene sound steps should be given an array, normally with one filename. Do not pass a bare string to `api.PlaySound()`; the current engine's low-level sound player indexes the first array element. Template `rule.sound` may be a string because template effect handling wraps it into an array before playing.
- Voice fields/options are a single relative filename string, not an array.
- Use browser-supported audio file types such as `.ogg`, `.mp3`, or `.wav`. The engine does not validate audio extensions.
- Music loops until replaced or stopped; sound effects and voice are one-shot.

Audio authoring deliverables:
- The GDD is expected to give general music and sound-effect direction, not a complete cue-by-cue specification. Do not require the human to fill in per-cue music or sound-effect blocks.
- Music is normally expected for an early-1990s point-and-click adventure, even if the style is MIDI-like and the runtime file is MP3 or OGG. Use `[]` only where silence is intentional, such as a deliberately quiet room, title pause, or ending beat.
- Sound effects are optional and may default to silence. Silent sound effects should be represented by omitting the effect or using `[]`/`null` in public APIs. Do not create placeholder sound files for effects the human has not chosen to include.
- From the GDD's general audio overview, room moods, cutscenes, endings, and pacing, the authoring AI must derive a music cue manifest. Each cue entry must include id, filename, rooms/screens/endings using it, purpose/mood, style/instrumentation, tempo/energy, looping notes, and an AI music-generator prompt of 1000 characters or fewer.
- Multiple rooms may share one music cue. Prefer reuse for rooms with the same mood or hub area rather than generating unnecessary tracks.
- From the GDD's general sound-effect direction and the implemented gameplay, the authoring AI must create an optional sound-effect manifest. Each entry must include id, filename, required/optional status, trigger/use, description, an AI sound-generator prompt of 1000 characters or fewer, and implementation notes if needed.
- Required sound effects are only those needed for gameplay comprehension, timing, feedback, or a specified dramatic beat. Optional effects may be listed for human selection without being referenced by the game script.
- If a listed optional effect is not referenced by the game script, mark it as optional in the asset manifest and do not require it for validation or runtime testing.
- Keep audio prompts original and concise. Describe mood, instrumentation, timing, texture, loop behaviour, and era flavour; do not request imitation of a living artist or copying a specific copyrighted track.


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

Room syntax:

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

Room fields:

- `id:string`: optional, should match room key.
- `name:string`, `displayName:string`.
- `background:string`: PNG in `rooms/`; warned if missing.
- `music:array`: room music source list; use an array, normally with one filename.
- `start:{x:number,y:number,facing:string}`: content-defined default start point for authoring/scripts; the engine does not automatically apply it on room entry.
- `playerStart:{x:number,y:number,facing:string}`: content pattern for scripts; room entry uses the current player coordinates unless `api.ChangeRoom()` or a transition zone passes target coordinates. Initial new-game position comes from `game.player.x/y/facing`.
- `walkableArea:{x:number,y:number,w:number,h:number}`: fallback walk rectangle and validation area. If no `walkBoxes`/`walkAreas` are supplied, the engine creates one walk box from `walkableArea`; if `walkableArea` is also absent, the fallback is `{x:0,y:80,w:320,h:56}`.
- `walkBoxes:array`: preferred walkable shapes. Entries may be bare rectangles, `{rect:{x,y,w,h}}`, or `{shape:shape}`. Entries may have `id` and may use `links` or `connects` arrays to build graph edges when explicit `walkGraph.edges` are absent. If `walkBoxes` is present, omitted `links`/`connects` mean no authored inter-node edges from that box; supply explicit `walkGraph.edges` or `links`/`connects` for routed navigation around blockers.
- `walkAreas:array`: supported alias for `walkBoxes` for walkability and derived graph-node positions. Prefer `walkBoxes` for new content. In this engine version, link/connect edge derivation reads `room.walkBoxes`, not `walkAreas`; if using `walkAreas` and routed edges matter, supply explicit `walkGraph.edges`.
- `blockers:array`: room-level movement blockers; each may have `id`, `shape` or `rect`, `onCollide`, `onBump`. `onCollide` is preferred when both collision script names are present.
- `walkGraph.nodes:array`: `{id:string,x:number,y:number}`. If omitted or empty, the engine derives one node at the centre of each walk box.
- `walkGraph.edges:array`: `[fromId,toId]` or `{from:string,to:string}`. Edges are treated as bidirectional path links. If omitted and `room.walkBoxes` is present, only walk box `links`/`connects` create authored inter-node edges. If omitted and `room.walkBoxes` is absent, all graph nodes are connected to all other graph nodes.
- `hotspots:array`: room objects; see next section.
- `characters:array`: room-local characters; see actors section.
- `transitionZones:array`: exits/room transitions.
- `triggerZones:array`: movement triggers.
- `characterScale:object`: perspective scaling; aliases include `perspectiveScale`, `backY/frontY`, `backScale/frontScale`.
- Room hook fields: `beforeEnter`, `afterEnter`, `beforeExit`, `afterExit`.
- Effective property support: `properties`, `propertyGetters`, `getters`, `nonConstPropertyGetters`, `mutablePropertyGetters`.

Geometry shapes accepted where shape is used:

- `{x:number,y:number,w:number,h:number}`.
- `{rect:{x:number,y:number,w:number,h:number}}`.
- `{circle:{x:number,y:number,radius:number}}`.

Geometry and pathfinding semantics:

- The only public geometry controls are declarative room/object/character/transition/trigger fields, effective properties/getters that compute those fields, and public movement APIs such as `api.ChangeRoom()` and `api.MoveCharacter()`. There is no public script API for querying paths, graph nodes, collision tests, or reachable points.
- Player movement pipeline: requested x/y is first clamped to the current room's reachable walkable geometry, then a path is built through walk graph nodes, then each frame advances toward the next path point, checks blockers/collisions, checks trigger zones, and checks transition zones.
- Walkable geometry: a point is walkable if it is inside any `walkBoxes`/`walkAreas` shape. If no `walkBoxes`/`walkAreas` exist, `walkableArea` supplies a single rectangular walk box. If neither exists, the fallback rectangle is `{x:0,y:80,w:320,h:56}`.
- Destination clamping: when a requested point is outside all walk boxes, the engine chooses the nearest point in the rectangular bounds of the nearest walk box. For circle shapes, hit-testing is circular, but clamping and some path/blocker tests use the circle's bounding rectangle; do not rely on true circular navigation for precise path constraints.
- Graph nodes: explicit `walkGraph.nodes` are used when present. Otherwise, one node is derived at the centre of each walk box. If a node id is absent, its array index string is used.
- Graph edges: explicit `walkGraph.edges` are used when present. Otherwise, if `room.walkBoxes` is present, each walk box's `links` or `connects` array creates edges from that box id to listed ids; boxes without `links`/`connects` create no inter-node edges. If `room.walkBoxes` is absent, the engine connects every graph node to every other graph node.
- Edge blocking: graph edges, and temporary start-to-node and node-to-target links, are ignored if the straight line segment intersects any current blocker rectangle. Rect blockers are exact rectangles; circle blockers are reduced to their bounding rectangle for segment-blocking.
- Fallback path: if no graph route can be found, the engine falls back to a direct path to the clamped target. Author walk boxes/graphs/blockers so this fallback is harmless, or provide enough graph connectivity that routes are found.
- Player collision: if the player steps into a blocker, the walk is blocked, the blocker `onCollide`/`onBump` script is run, and the walk callback/action result reports status `blocked` with reason `collision` and `blockerId`.
- Room blockers: `room.blockers` are always blockers while their room is active. Object blockers are generated from room hotspots whose effective `blocksMovement` is true.
- Object collision shape fallback: for blocking hotspots, `collisionShape` is used if present; otherwise `rect` is used; otherwise `x`/`y`/`frameW`/`frameH` form a rectangle. Hidden objects do not block unless effective `blocksWhenHidden` is true.
- Walk-to interaction positioning: when an interaction target has effective `walkTo:{x,y}`, the player walks there before running the interaction. If absent, the interaction runs immediately after the click command is accepted. The validator warns if authored `walkTo` is outside `walkableArea`, but runtime uses the reachable-point system.
- Walk-through behaviour: if the command verb is `walkTo` and the target's effective `walkThrough` is true, the engine walks to effective `walkThroughTo`, falling back to `target.walkThroughPoint`, then to the clicked command point. Use this for open doors/passages where clicking the object should walk through rather than merely walk to it.
- Transitions: transition zones are checked against the player's foot point after movement updates. In this engine version transition zones use `rect` only; `shape` is not checked for transitions. A transition zone may either run a script or call the normal room-change path.
- Trigger zones: trigger zones may be room-level or hotspot-level. They use `rect` or `shape`, test an actor's x/y foot point, and keep saved active membership so `onEnter` fires once on entry, `onExit` fires once on exit, and `onStay` fires while inside.
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
- `enabledObjectId:string`, `enabledProperty:string`: zone enabled only when the object's effective property is truthy; `enabledProperty` defaults to `open`.
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

This section explains how authoring data becomes runtime behaviour. For an authoring AI, the key rule is: do not write scripts merely to vary text, visibility, blocking, sprites, availability, or refusals by state. Use effective properties, template runtime variables, and getters.

An effective property is the value the engine actually sees when it asks a question such as "is this object hidden?", "what sprite should this object use?", "what interactions does this target have?", or "what text should Look At display?" The value may come from static data, saved runtime state, a getter script, or a template default.

When to use each mechanism:

- Use a direct field, such as `hidden:false` or `defaultText:'A locked door.'`, when the value is static.
- Use `properties:{...}` when you want to group base authored properties separately from other entity fields.
- Use an object variable, item variable, room variable, or template runtime variable when the value changes because of play.
- Use `api.SetObjectState(objectId,{propertyName:value})` when you intentionally want runtime state to override an object's effective property directly.
- Use a const getter when the property should be computed from existing state without changing state.
- Use a mutable getter only when computing the property must also update saved state.

Example effective-property pattern: a door can use the `door` template, while `open` and `locked` are template-owned runtime variables. The same object can expose dynamic `defaultText`, `blocksMovement`, and `sprite` through template defaults and effective-property resolution without custom scripts.

Interaction syntax:

EXAMPLE_START
interactions:{
  lookAt:'lookAtPainting',
  open:'template:container.open',
  use:'template:toolTarget.use',
  give:'template:exchange.give'
}
EXAMPLE_END

Interaction value types:

- Script name string naming a function in `game.scripts`. Interaction scripts are called as `function (api, command, target, self)`. `command` has `verbId`, `targetId`, `inventoryItemId`, `roomId`, `x`, `y`, and may have `_lastActionResult`. `target` is the clicked entity. `self` is the saved-state facade for `target`.
- Template action string `template:templateName.actionName`.

Template actions are valid only in interaction fields. Do not call private template internals.

Interaction key lookup:

- For ordinary verbs, use the verb id, such as `lookAt` or `open`.
- For inventory-on-target `use`/`give`, the engine first checks `verbId:inventoryItemId` on the target, then on the target's linked item, then checks the reverse key `verbId:targetId` on the selected inventory item, then on that selected item's linked item, then falls back to `verbId` on the target or linked item. Use these specific keys for one-off transitive interactions; use `combine` or `toolTarget` for reusable patterns.

Refusal lookup order:

1. Target `refusals[verbId:inventoryItemId]` when applicable.
2. Target `refusals[verbId]`.
3. Linked inventory item `refusals[verbId:inventoryItemId]` when applicable.
4. Linked inventory item `refusals[verbId]`.
5. `game.defaultRefusals[verbId:inventoryItemId]` when applicable.
6. `game.defaultRefusals[verbId]`.
7. Engine default keyed refusal, then engine default verb refusal.

Use/Give:

- `give` is always a two-target verb: select inventory item, then click target.
- `use` supports both intransitive operation and two-target Use X with Y. A target or inventory item with effective `transitiveUse:false` runs its own plain `use` interaction immediately. A target or inventory item with effective `transitiveUse:true` is selectable as the first subject for Use X with Y.
- If `transitiveUse` is omitted, the engine infers the safer behaviour. A target or inventory item with a plain `use` interaction is treated as intransitive unless that interaction is a known transitive template (`combine`, `toolTarget`, `multiRequirement`, door key use, or container key use). This prevents ordinary terminals, switches, kiosks, levers, readers, devices, and custom one-click use objects from requiring accidental Use X with X authoring.
- `Use X with X` is never exposed as a distinct gameplay action. If the selected Use subject and clicked target are the same entity, or the clicked world target is the world instance of that item, the engine clears the selected subject and runs intransitive `Use X` instead. Specific `use:X` self-use keys should not be authored; they will not be reached through ordinary UI input.
- `exchange`/barter is Give-only.
- True symmetric Use X with Y uses `combine`.
- Target-specific tools use `toolTarget`.
- If a custom plain `use` interaction really is intended to select the object as the first subject for Use X with Y, set `transitiveUse:true` explicitly and test both subject-first and target-first orders.

Effective property resolution:

1. Runtime object state override, where applicable.
2. `entity.properties[propertyName]`.
3. `entity[propertyName]`.
4. Getter script. The raw value above is passed as the getter fallback; a getter may override a direct field/property/state value by returning a non-`undefined` value.
5. Template default.
6. Caller default.

For `interactions`, `refusals`, and `callbackResults`, template maps merge with entity maps.

Getter declarations:

EXAMPLE_START
propertyGetters:{defaultText:'cabinetText'}
getters:{hidden:'cabinetHidden'}
nonConstPropertyGetters:{defaultText:'statefulText'}
mutablePropertyGetters:{hidden:'statefulHidden'}
EXAMPLE_END

Getter signature:

EXAMPLE_START
cabinetText:function (query,self,context) {
  return self.GetBool('open',false) ? 'It is open.' : 'It is closed.';
}
EXAMPLE_END

Getter `query` methods:

- `HasItem(itemId) -> boolean`.
- `GetFlag(name) -> boolean`.
- `GetVariable(name) -> any`.
- `GetRoomVariable(roomId,name,defaultValue) -> string|number|defaultValue`.
- `GetCharacterVariable(characterId,name,defaultValue) -> string|number|defaultValue`.
- `GetItemVariable(itemId,name,defaultValue) -> string|number|defaultValue`.
- `GetObjectVariable(objectId,name,defaultValue) -> string|number|defaultValue`.
- `GetProperty(entity,propertyName,context,defaultValue) -> any`.

Const `self`: `Id`, `Type`, `RoomId`, `Entity`, `Context`, `Get`, `GetBool`, `GetNumber`, `GetString`, `GetBaseProperty`, `GetProperty`. Mutable `self` additionally has `Set`, `SetBool`, `SetNumber`, `SetString`, `Add`.

Const getters must not mutate state, call `api`, move actors, change rooms, narrate, play sound, or use timers. Mutable getters are only for property derivation that genuinely must update saved state.

Validated effective property types:

- Booleans: `visible`, `hidden`, `hitDisabled`, `walkThrough`, `renderHidden`, `blocksWhenHidden`, `interactionDisabled`, `blocksMovement`, `blocksActors`, `walkBehind`. `blocksActors` is reserved/no-op in this engine version.
- Points: `walkTo`, `walkThroughTo` are null/undefined or `{x:number,y:number}`.
- Rectangles: `hitRect`, `rect` are `{x:number,y:number,w:number,h:number}`.
- Arrays: `walkBoxes`, `blockers`, `walkBehinds`, `triggerZones`. On hotspots, `walkBoxes`/`blockers`/`walkBehinds` are reserved/no-op in this engine version; room `walkBoxes`/`blockers` and hotspot `triggerZones` are used.
- Objects: `collisionShape`, `occluderShape`. `occluderShape` is reserved/no-op in this engine version.
- Numbers: `baseline`, `zIndex`.
- Callback values: `callbackStatus:string`, `callbackResult:string|object`, `callbackResults:object`.

Common properties worth making dynamic with effective properties or getters:

- `hidden`, `hitDisabled`, `interactionDisabled`, `renderHidden` for whether a target appears or can be clicked.
- `defaultText` and `description` for state-dependent Look At text.
- `sprite`, `closedSprite`, `openSprite`, `onSprite`, `offSprite`, `emptySprite` for state-dependent graphics.
- `blocksMovement`, `blocksWhenHidden`, `walkTo`, `walkThrough`, `walkThroughTo`, `walkThroughPoint`, `collisionShape`, `triggerZones`, `walkBehind`, `baseline`, `zIndex` for state-dependent navigation/rendering.
- `interactions` and `refusals` when available verbs or failure text depend on state.
- Template-specific properties such as `open`, `locked`, `on`, `powered`, `allowsPassage`, `travelBlocked`, `unlockBlocked`, and `requirements`.

Avoid these mistakes:

- Do not write a custom Look At script just to vary description text; use a getter for `defaultText`.
- Do not use both a flag and a template runtime variable for the same state unless both are needed for different story purposes.
- Do not use `SetObjectState` casually; it overrides effective properties. Use object variables for ordinary puzzle state and reserve object state for deliberate property overrides.
- Do not mutate state in const getters. If mutation is unavoidable, declare the getter in `nonConstPropertyGetters` or `mutablePropertyGetters` and keep the mutation minimal and saved-state-safe.


## 12. Templates

A template is a declarative behaviour package. It can add default interactions, refusals, effective properties, and runtime state conventions to an entity. Templates are the engine's main way to author common point-and-click adventure behaviours without custom scripts.

For an authoring AI, templates should be the first choice for recurring puzzle patterns:

- Use `door` plus `key` for lockable passages; put the actual room change in a `transitionZone`.
- Use `pickup` for world objects that become inventory items.
- Use `container` for boxes, drawers, safes, and cabinets.
- Use `switch` for toggles, valves, levers, and buttons.
- Use `readable` for signs, notes, labels, books, and closeups.
- Use `device` for machines requiring power or a specific item.
- Use `combine` for symmetric Use X with Y inventory/object combinations.
- Use `toolTarget` for target-specific use of a tool on an object.
- Use `exchange` for Give-only barter/trading.
- Use `multiRequirement` for a target that needs several items delivered.
- Use `gatekeeper` for NPCs/objects that allow or block passage.
- Use `costume`, `clueUnlocker`, or `distractible` for their specific puzzle patterns.

How templates work:

- Attach a template with `template`, `templateId`, `kind`, or `templates`.
- The template contributes interactions such as `open:'template:door.open'` or `take:'template:pickup.take'`.
- The template may contribute effective property defaults such as blocking movement, default text, or sprite selection.
- The entity may override or extend template-provided maps by defining its own `interactions`, `refusals`, or effective properties.
- Template runtime variables are saved state. Use the documented runtime variable names instead of inventing duplicate state for the same concept.

Multiple templates can be combined only when their behaviours are compatible. For example, furniture-like geometry may combine with a container, but avoid combining templates that provide conflicting meanings for the same verb unless the entity explicitly overrides the interaction.

Attach templates using `template`, `templateId`, `kind`, or `templates`. String template lists may be space/comma separated.

Known templates: `door`, `key`, `map`, `pickup`, `container`, `switch`, `readable`, `device`, `furniture`, `barrier`, `combine`, `openableBox`, `exchange`, `multiRequirement`, `gatekeeper`, `costume`, `toolTarget`, `clueUnlocker`, `distractible`.

Shared puzzle rule fields: `requiresFlag`, `requiresItem`, `allowProperty`, `sourceAllowProperty`, `targetAllowProperty`, `refusalText`, `blockedText`, `removeSource`, `consumeSource`, `removeTarget`, `consumeTarget`, `removeItem`, `addItem`, `resultItem`, `setFlag`, `flagValue`, `clearFlag`, `setSource`, `sourceVars`, `setTarget`, `targetVars`, `setVariables`, `setObjectState`, `setSourceState`, `animation`, `animationOptions`, `sound`, `script`, `onComplete`, text/speaker fields documented per template.

### `door`

Adds `lookAt`, `open`, `close`, `use`, `walkTo`. Runtime object variables: `open`, `locked`. Initial values come from authored `open`/`locked` if the runtime variables are absent. Effective defaults: `defaultText` varies by open/locked state; `sprite` selects `openSprite` or `closedSprite`, falling back to `sprite`; `walkThrough` is true when open; `blocksMovement` is true when not open; `collisionShape` falls back to `rect`; `baseline` falls back to rect bottom or `y`. Doors control open/closed/blocking; room transitions are still transition zones.
Fields: `locked`, `open`, `sprite`, `closedSprite`, `openSprite`, `rect`, `collisionShape`, `baseline`, `walkThroughTo`, `transitionAnimation`, `openAnimation`, `unlockAnimation`, `lockAnimation`, `onOpen`, `onClose`, `onUnlock`, `onLock`.
Text fields: `openText`, `lockedText`, `unlockedText`, `closedText`, `alreadyOpenText`, `lockedOpenText`, `openActionText`, `alreadyClosedText`, `closeActionText`, `wrongKeyText`, `unlockText`, `lockText`, `closedWalkText`.

### `key`

Fields: `unlocks`, `unlockDoors`, `opens`, `targets`, `doorIds`, `objectIds`; string or array; `'*'` targets all compatible locks. For the `door` template, the inventory item must have the `key` template and its target list must include the door id or `'*'`. The `container` template checks the same target list but does not require the item itself to use the `key` template.

### `map`

Adds `lookAt`. Fields: `map`, `map.image`, `map.places`, `travelBlocked`, `travelBlockedText`. Map places are rendered as overlay targets and use `walkTo` for travel and `lookAt` for descriptions. Places without `alwaysVisible` normally appear only after their target room has been visited.

### `pickup`

Adds `lookAt`, `take`. Fields: `itemId`, `hideOnTake`, `hiddenFlag`, `takenFlag`, `takeText`, `onTake`. Runtime variable: `taken`. The `take` action adds the linked item to inventory, sets object variable `taken=1`, and sets `hiddenFlag` if present, otherwise `takenFlag` if present. By default, pickup-template objects hide themselves after they have been taken because the template contributes an effective `hidden` value from the `taken` runtime variable. Use `hideOnTake:false`, an explicit `hidden:false` field, or a `hidden` getter only for exceptional pickup-like objects that should remain visible after being taken. `hiddenFlag` and `takenFlag` remain available for story flags, map logic, compatibility, or custom visibility patterns, but ordinary pickup objects do not need either field merely to disappear after `Take`.

### `container`

Adds `lookAt`, `open`, `close`, `use`. Runtime object variables: `open`, `locked`, `emptied`. Initial `open`/`locked` values come from authored fields if runtime variables are absent. Effective defaults: `defaultText` varies by open/locked/emptied state; `sprite` selects `emptySprite`, `openSprite`, `closedSprite`, or `sprite`.
Fields: `locked`, `open`, `contents` or `contains` (string or array of item ids), `sprite`, `closedSprite`, `openSprite`, `emptySprite`, `transitionAnimation`, `openAnimation`, `unlockAnimation`, `lockAnimation`, `onOpen`, `onClose`, `onUnlock`, `onLock`, `onEmpty`. Opening an unlocked unopened container sets `open=1`, adds all contents to inventory once, then sets `emptied=1` if contents were present.
Text fields: `emptyText`, `openText`, `lockedText`, `closedText`, `alreadyOpenText`, `lockedOpenText`, `takeContentsText`, `openActionText`, `alreadyClosedText`, `closeActionText`, `wrongKeyText`, `unlockText`, `lockText`.

### `switch`

Adds `lookAt`, `use`, `open`, `close`. Runtime object variable: `on`. Initial value comes from authored `on` if the runtime variable is absent. `use` toggles; `open` turns on; `close` turns off. Effective defaults: `defaultText` varies by on/off state; `sprite` selects `onSprite` or `offSprite`, falling back to `sprite`.
Fields: `on`, `sprite`, `onSprite`, `offSprite`, `onToggle`, `onOn`, `onOff`.
Text fields: `onText`, `offText`, `actionOnText`, `actionOffText`, `alreadyOnText`, `alreadyOffText`.

### `readable`

Adds `lookAt`, `use`. Fields: `readText`, `lookOverlay`, `closeupOverlay`, `onRead`, `defaultText`. If `lookOverlay` or `closeupOverlay` exists, reading shows the overlay and returns immediately; `onRead` is only run on the text-reading path. Without an overlay, the template narrates `readText`, falling back to effective `defaultText`.

### `device`

Adds `lookAt`, `use`. Runtime object variables: `used`, `fixed`. `use` refuses if `singleUse` is true and `used` is already true; then checks `powerFlag` if present, otherwise authored `powered` defaulting to true; then checks `requiredItem` when supplied; then may `consumeRequiredItem`, set `fixed`, set `used`, set `setsFlag`, narrate `successText`, and run `onUse`.
Fields: `powered`, `powerFlag`, `requiredItem`, `consumeRequiredItem`, `setsFlag`, `fixedOnUse`, `singleUse`, `onUse`.
Text fields: `defaultText`, `alreadyUsedText`, `noPowerText`, `wrongItemText`, `successText`.

### `furniture`

Adds `lookAt`. Defaults to `blocksMovement:true`, provides take/open/close refusals, and uses `callbackResults` for blocked movement. Fields: `rect`, `collisionShape`, `baseline`, `walkBehind`, `allowWalkBehindWithoutSprite`, `zIndex`, `defaultText`, `onCollide`, `onBump`, `sprite`. `walkBehind` defaults to true only when a sprite exists, unless `allowWalkBehindWithoutSprite:true` is set. `collisionShape` falls back to `rect`, then `x`/`y`/`frameW`/`frameH`. `baseline` falls back to collision bottom or `y`.

### `barrier`

Adds `lookAt`. Defaults to `blocksMovement:true`, provides take/open/close refusals, and uses `callbackResults` for blocked movement. Fields: `rect`, `collisionShape`, `defaultText`, `onCollide`, `onBump`. `collisionShape` falls back to `rect`. Use `barrier` for invisible or simple blocking geometry; use `furniture` for visible foreground/background objects with walk-behind behaviour.

### `combine`

Adds `use`. Symmetric. Fields: `combine`, `combinations`, `intransitiveUseText`, `combineRefusalText`. When no inventory item/source is selected it narrates `intransitiveUseText`. Ordinary UI input never dispatches Use X with X as a separate combination; the interaction system normalises that case to intransitive Use X before template lookup. For two different subjects, the engine checks rules on the lexically first id first, then the second, using the other id or `'*'`. Rules support the shared requirement/effect fields and text, playerText, speakerId.  
EXAMPLE_START
combine:{
otherItemId:{removeSource:true,removeTarget:true,resultItem:'combinedItem',text:'That should do it.'},
'*':{refusalText:'Those do not go together.'}
}
EXAMPLE_END

### `openableBox`

Adds `open`, `use` and sets `transitiveUse:false`. Runtime object/item variable: `opened`. Fields: `alreadyOpenText`, `openEffect`, `revealsItem`, `openSpeakerId`, `openText`. First open sets `opened=1`, applies `openEffect`, and if `openEffect` has no `addItem` and `revealsItem` is present, adds `revealsItem`. Later opens narrate `alreadyOpenText`.

### `exchange`

Adds `give` only. Fields: `exchanges`, `exchangeNeedItemText`, `exchangeRefusalText`. Source is the selected inventory item/subject. Rule key is source id or `'*'`. Rules support shared requirement/effect fields plus `playerRefusalText`, `playerSpeakerId`, `playerText`, `npcSpeakerId`, `npcText`, `text`, `afterDialogueScript`. Successful exchange applies effects, then says optional `playerText` followed by `npcText`/`text`, then runs `afterDialogueScript`. Exchange/barter is Give-only.

### `multiRequirement`

Adds `give`, `use`. Fields: `requirements`, `requirementNeedItemText`, `requirementWrongItemText`, `completion`, `completionText`, `completionSpeakerId`. Requirement entries are item id strings or objects with `itemId`, `consume`, `text`, `speakerId`, `alreadyText`, and shared requirement fields. Runtime variables: `delivered_itemId`.

### `gatekeeper`

Adds `talkTo`, `use`, `give`. Fields: `dialogueTree`, `allowsPassage`, `allowText`, `blockText`. `talkTo` starts `dialogueTree` when present; otherwise it performs the same check as `use`/`give`. The check narrates `allowText` when effective `allowsPassage` is true, otherwise `blockText`. Gatekeeper does not itself change rooms or enable transitions; use transition zones and effective properties/flags for passage.

### `costume`

Adds `use` and sets `transitiveUse:false`. Runtime item variable: `worn`. Fields: `costumeSpriteId`, `playerSpriteId`, `baseClothes`, `replacesItem`, `returnItem`, `wearText`, `costumeNoSpriteText`. `use` changes the player sprite to `costumeSpriteId`/`playerSpriteId`; if `baseClothes:true`, it restores the authored `game.player.spriteId`. It sets `worn=1`, removes `replacesItem` if supplied, adds `returnItem` if supplied and absent, then narrates `wearText`. The referenced sprite id must exist in `game.sprites`.

### `toolTarget`

Adds `use`. Fields: `toolUses`, `toolNeedItemText`, `toolRefusalText`. Source is the selected inventory item/subject. Rule key is source/tool id or `'*'`. Rules support shared requirement/effect fields plus `text` and `speakerId`. Without a source it narrates `toolNeedItemText`; with no passing rule it narrates the rule refusal or `toolRefusalText`.

### `clueUnlocker`

Adds `lookAt`, `use`. Fields: `unlockBlocked`, `unlockBlockedText`, `unlocksPlaces`, `mapItemId`, `unlockText`. If `unlockBlocked` is true, narrates `unlockBlockedText`. Otherwise, for each place id in `unlocksPlaces` it sets item variable `place_placeId_unlocked=1` on `mapItemId` or on the clue item/object id, then narrates `unlockText`. Pair this with a `places`/`mapPlaces` getter or other custom map visibility logic when the design needs clue-gated map places; `visibleFlag` itself checks a global flag, not the item variable set by `clueUnlocker`.

### `distractible`

Adds `use`, `give`. Runtime variable: `distracted`. Fields: `distractions`, `distractionRefusalText`. Source is the selected inventory item/subject, or absent for intransitive use. Rule key is source id or `default`, with `'*'` fallback through the shared rule lookup. On success it sets `distracted=1`, applies rule effects, then says `rule.text` using `rule.speakerId` or the target id. On failure it narrates the rule refusal or `distractionRefusalText`.


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
- Dialogue trees are both a technical structure and a content-delivery mechanism. For any NPC or entity whose role is substantial under the quality/depth contract, the tree should reflect that role through state-aware choices, character voice, clueing, refusal/hint integration, world or theme content, and post-event reactions where relevant.
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

Authoring checklist before validation:

- Does each standard puzzle use the appropriate template before any custom script? For ordinary world pickups, use `template:'pickup'` and rely on the default hide-after-take behaviour; add `hideOnTake:false` only when the world object should deliberately remain visible. For ordinary terminals, switches, kiosks, levers, readers, devices, and other one-click objects, provide a plain `use` interaction and rely on inferred intransitive use; set `transitiveUse:true` only when the object is deliberately meant to be the first subject in Use X with Y.
- Does every mutable value that matters after save/load use a public saved-state API?
- Are dynamic text, visibility, blocking, sprites, and available interactions represented as effective properties/getters rather than custom scripts where possible?
- Are all branching conversations dialogue trees?
- Are all staged sequences cutscenes rather than timers?
- Are room changes represented as transition zones unless a custom script genuinely needs to call `api.ChangeRoom()`?
- Are all `walkTo` points, transition target points, graph nodes, NPC move targets, blockers, and trigger/transition zones consistent with the room's walkable geometry and the documented player/NPC movement differences?
- Are all refusals data-driven unless they require distinctive game logic?

- Has the authoring AI classified major content roles and matched implementation depth to those roles, rather than treating runtime validity as the quality bar?
- Do major NPCs, gatekeepers, companions, antagonists, clue sources, and recurring characters use dialogue trees or equivalent state-aware canonical systems rather than one-line scripts?
- Do critical-path puzzles, gates, and clues have sufficient signposting, feedback, refusal/hint escalation, and post-state reactions for their role?
- Do important descriptions, refusals, dialogue, visual/audio assets, endings, and puzzle payoffs feel specific to this game world, tone, and character set rather than generic first-draft filler?

Validation workflow:

1. LLM structural-semantic validation: check all ids, scripts, templates, assets, hooks, dialogue forms, cutscene steps, save-state use, and template-vs-custom-script choices.
2. Quality/depth validation: review the package against the general quality and depth contract. Confirm that each major content role has adequate authored depth, state awareness, clueing, feedback, tone, and payoff; revise low-effort but technically valid content before running the validator.
3. Visual semantic validation: compare runtime images, asset manifest visual acceptance notes, and `style_reference_sheet.png`. Check that important visuals are specific, coherent, and readable in their engine context.
4. Run validator. For the canonical layout `gameId/gameId.js` with assets below `gameId/`, the validator infers `gameId/` as the asset root for existence checks:

EXAMPLE_START
python validator.py gameId/gameId.js --engine index.html --check-assets --report validation_report.txt
EXAMPLE_END

If the game script is not in the same folder as its assets, pass the asset folder explicitly. The asset root is relative to `index.html`:

EXAMPLE_START
python validator.py scripts/gameId.js --engine index.html --asset-root gameId/ --check-assets --report validation_report.txt
EXAMPLE_END

If exactly one game script exists below the directory, the validator can discover it and infer that script's parent folder as the asset root:

EXAMPLE_START
python validator.py --check-assets --report validation_report.txt
EXAMPLE_END

4. Human runtime test: start game, test every room transition, dialogue branch, inventory action, template puzzle, cutscene, save/load, ending, and custom script. For failures, retrieve `PointClickEngine.GetDiagnostics()` or `PointClickEngine.CopyDiagnosticsToClipboard()`.

Validator interpretation:

- `[PCEVAL][ERROR]`: must fix before testing.
- `[PCEVAL][WARN]`: normally fix unless deliberately harmless.
- `ASSET_PATH_INVALID`, `ASSET_IMAGE_EXTENSION`, `ASSET_FILE_MISSING`: asset path/file problem.
- `PRIVATE_ENGINE_ACCESS`: forbidden internal access.
- `TEMPLATE_UNKNOWN`, `TEMPLATE_ACTION_INVALID`: template issue.
- `SCRIPT_REF_MISSING`: missing script.
- `LEGACY_HOOK_USED`: unsupported hook name.

## 18. Authoring AI Output Contract

When an AI is asked to create a game from this API reference and the completed Game Design Document, it must produce a predictable package. The GDD is the source of design truth; if a required value is absent, the AI should ask a clarification question before generating code, or state an explicit assumption in the implementation notes if the workflow requires a complete first draft.

Required deliverables:

1. Implementation notes: game id, title, intended `assetPath`, engine API version, assumptions, requested engine extensions, and the declared asset tier: production-quality first pass, readable prototype, or placeholder-only. Default to production-quality first pass unless the user or workflow says otherwise.
2. Style reference sheet first: before producing the full runtime asset set, create `style_reference_sheet.png` and the accompanying visual style brief. The sheet is the visual contract for all later runtime assets.
3. Manifest output: either a complete `games.json` file or a clearly labelled `games.json` entry with `id`, `title`, `script`, `assetPath`, and `engineApi`.
4. Game script: one `gameId/gameId.js` script that calls `PointClickEngine.RegisterGame({...})` exactly once and uses only the public authoring contract in this document.
5. Asset manifest: every image, music, sound, and voice asset needed by the game, with canonical path, role folder, expected dimensions, spritesheet frame size where applicable, asset tier, and visual acceptance notes for important runtime images.
6. Generated assets: assets should be placed under the canonical role folders below `gameId/`. If binary image generation is unavailable, provide exact filenames, sizes, transparency requirements, content descriptions, and visual acceptance notes instead; do not present such a package as visually production-ready.
7. Puzzle dependency graph or walkthrough: the shortest intended solution path, optional branches, failure/refusal paths, and all required inventory/state dependencies.
8. Quality/depth validation report: a concise review of the major content roles, how each is supported by authored depth, and any deliberately terse/minimal elements with justification. This report must be completed before structural validator handoff.
9. Validation report: the validator command used, including `--asset-root` if needed, and the resulting errors/warnings. Errors must be fixed before handoff. Warnings must be fixed or explicitly justified.
10. Runtime test plan: every room transition, dialogue branch, inventory action, template puzzle, cutscene, save/load case, ending, custom script, and visual readability check that a human tester should exercise.

Output rules for game scripts:

- Use declarative data and templates first. Use custom scripts only for distinctive logic that the documented systems cannot express.
- Do not rely on `index.html`, private engine objects, DOM APIs, browser timers, custom save/load systems, custom renderers, or custom inventory/dialogue/movement loops.
- Keep all mutable story state in public saved-state APIs or template-owned runtime variables.
- Ensure all dynamically selected images are also referenced by documented preloadable image fields.
- Prefer validator-checkable ids, templates, dialogue actions, cutscene steps, transitions, and asset paths over clever script code.
- If the GDD asks for behaviour outside this contract, list it under requested engine extensions instead of inventing an API.

## 19. Using the Game Design Document

The completed Game Design Document is the design source of truth. The authoring AI must convert it into a complete, original, validator-checkable PointClickEngine package while obeying this API reference.

### 20. Required AI process for a completed GDD

1. Parse the GDD into a normalized plan: core premise, setting, style, plot control level, rooms, characters, puzzles, items, dialogue needs, cutscenes, endings, themes, assets, and constraints.
2. Identify missing or ambiguous information. Ask clarification questions only when reasonably necessary to avoid a materially wrong game, a contradiction, or an impossible implementation. Do not ask questions merely because optional detail is blank; apply the template defaults and state assumptions.
3. Research the requested genre, subgenre, period, and any reference games or works in detail. Find real walkthroughs for games of that type, especially 1990s point-and-click adventures where relevant. Analyse puzzle flow, room gating, inventory dependencies, dialogue loops, hinting, pacing, tone, UI conventions, and ending structure.
4. Do not copy any puzzle, room layout, joke, character, dialogue, image, music, or prose exactly from the research. Use research to synthesize original patterns and genre flavour.
5. For each named character, build a voice brief from the GDD and, where helpful, research the character's role, profession, period, region, genre archetype, motives, and comparable public examples. Capture personality, diction, idiom, rhythm, humour style, and motives without copying protected dialogue or imitating a real person so closely that the output becomes non-original.
- Map the design to content roles and required depth: identify critical-path gates, puzzle/clue carriers, major characters, minor characters, ambience, rewards/payoffs, endings, and deliberately incidental elements. State which elements require substantial authored depth and which may remain concise.
6. Map the design to engine systems: rooms to `game.rooms`, room travel to `transitionZones`, standard object behaviour to templates, branching conversation to `dialogueTrees`, staged presentation to cutscenes, persistent state to public flags/variables/scoped variables/object variables, and endings to `game.endings`.
7. Establish the visual contract before generating the full asset set: derive a concise art direction from the GDD and research, create `style_reference_sheet.png`, then use it to guide all runtime room, character, object, inventory, overlay, and UI assets.
8. Prefer the smallest implementation that satisfies the GDD. Use declarative data and templates before custom scripts. If the GDD asks for behaviour outside this contract, list a requested engine extension instead of inventing a private API.
- Produce the required deliverables from the Authoring AI Output Contract, including implementation notes, manifest, game script, asset manifest, style reference sheet, walkthrough/dependency graph, quality/depth validation report, validator report, and runtime test plan.

### 21. Clarification rules

Ask the human before coding only if:
- the title, setting, premise/objective, or player character is absent and cannot be sensibly inferred;
- two GDD instructions conflict in a way that changes plot, tone, endings, or required puzzles;
- a required puzzle or ending cannot be implemented with the documented engine contract;
- the requested genre, tone, or character portrayal is too ambiguous to research or synthesize responsibly;
- the GDD explicitly asks the AI to ask before inventing missing content.

Do not ask if:
- an optional field is blank and has a default;
- the GDD gives a room count range rather than an exact count;
- the AI can make a clearly stated assumption without changing the user's intent;
- the ambiguity affects only minor object names, incidental jokes, background hotspots, refusal text, or connective dialogue.

When asking, group questions into the fewest possible numbered questions. If proceeding with assumptions, list them in the implementation notes.

### 22. Research-to-design rules

The AI's research should extract reusable design patterns, not content. Useful patterns include:
- verb/object and inventory interactions;
- dialogue trees that reveal clues, motives, jokes, trade conditions, or gates;
- door/key/signpost puzzle structures and puzzle dependency graphs;
- hub rooms with gated exits and revisitable hotspots;
- multi-use inventory items that become meaningful later;
- clear refusal lines that hint without solving;
- escalating absurdity in comic games or escalating atmosphere in serious games;
- endings that pay off player choices, theme, and puzzle state.

For serious games, keep jokes sparse or absent and use atmosphere, mystery, music, pacing, and environmental detail to carry tone. For comic games, use consistent character-driven humour rather than random gags.

### 23. GDD-to-engine mapping checklist

- Title and game id -> manifest entry and top-level `id`/`title`.
- Setting, style, motifs -> room descriptions, asset prompts, music/sound notes, text tone, and title/end screens.
- Plot shape -> room order, puzzle dependency graph, cutscenes, dialogue reveals, and endings.
- Room count/range -> number of `rooms`, room graph, transition zones, and map design if needed.
- Main characters -> `game.characters`, room placements, sprites, dialogue trees, dialogue colours, interaction/refusal text, and state variables.
- Specific puzzles -> templates first, then effective properties/getters, dialogue actions, cutscenes, and only then custom scripts.
- Required events/jokes/incidents -> dialogue lines, hotspots, cutscenes, triggers, or puzzle payoffs.
- Endings -> `game.endings`, ending conditions, ending backgrounds/music/animation.
- Art style -> actual assets and the additional `style_reference_sheet.png`.
- Themes/motifs -> recurring object descriptions, room details, dialogue subtext, puzzle metaphors, and ending language.

### 24. Art asset workflow from the GDD

The AI must create the visual style reference before the full runtime asset set unless the human explicitly disables image generation. Create one style reference sheet named `style_reference_sheet.png`. This file is not referenced by the game script; it is the visual contract for this package and a reusable brief for future asset-generation sessions.

The sheet must contain:
- one or two representative room backgrounds or background crops;
- two or three characters, including the player character where possible;
- two or three important objects or inventory items;
- examples of the intended final style, palette, lighting, proportions, shape language, material treatment, and line/pixel treatment.

Runtime asset generation must then follow the style reference sheet. For each important runtime image, the asset manifest must include a visual acceptance note describing what the asset must read as, the interaction or story purpose it serves, the features that distinguish it from similar assets, and the engine context in which it must remain readable. Do not rely on validation success alone as evidence of asset quality.

For a production-quality first pass, all gameplay-relevant assets must be intentionally designed and mutually coherent. They may be simple, but they must be specific to the game world and readable in use. Placeholder-quality assets are acceptable only when explicitly requested or when binary image generation is unavailable; in that case the asset manifest and implementation notes must label the visual tier clearly and provide replacement specifications.

Recommended asset order:
1. visual style brief and `style_reference_sheet.png`;
2. representative room and player-character assets;
3. key gameplay objects and inventory icons;
4. remaining rooms, characters, overlays, UI, title, and ending assets;
5. visual QA pass against the asset manifest and runtime test plan.

The asset manifest must say that future sessions creating graphical assets should be given the GDD, asset manifest, visual style brief, and `style_reference_sheet.png` so that new assets remain stylistically coherent.

#### 25. GDD defaults and invariant workflow rules

The GDD template intentionally contains only game-specific design choices. Apply these defaults unless the GDD overrides them:
- Engine style: early-1990s verb/inventory point-and-click adventure.
- Room count: 6-10 rooms.
- World structure: mixed linear and hub-and-spoke with gentle gating.
- Puzzle difficulty: medium.
- Moon logic: low; strange solutions must be signposted.
- Failure model: no player death and no unwinnable dead ends.
- Endings: one good ending.
- AI invention: allowed for connective plot, minor characters, rooms, puzzles, dialogue, jokes, and cutscenes if consistent with the GDD.
- Art default: 1990s painted pixel-art backgrounds, readable silhouettes, slightly exaggerated character sprites, side-on 320x136 room scenes.
- Audio default: light MIDI-like room music rendered as MP3 or OGG. Music should normally be present for rooms/screens unless the GDD requests sparse or silent music. Sound effects are optional and default to silence where unspecified; the authoring AI should derive any optional sound-effect suggestions rather than requiring the human to specify each effect.
- Where the AI authoring the game cannot produce music itself, inform the human of this and give the human style prompts in 1,000 characters or less for an AI music generator for each piece of music required, specifying the file name that the resulting music from each style prompt should have.
- Cutscene default: extra AI-added cutscenes should be limited to intro, major reveal, puzzle completion, and ending moments unless the GDD allows for more.
- Technical default: standard engine save/load only; custom scripts only when templates, dialogue trees, cutscenes, and effective properties cannot express the behaviour.
- Quality/depth default: production-quality first pass for content as well as assets. Major content roles require state-aware, game-specific authored depth; concise treatment is acceptable only for incidental elements or when the GDD intentionally asks for minimalism.
- Asset default: create all needed runtime assets as a production-quality first pass. If binary image generation is unavailable, provide exact replacement specifications and label the package as not visually production-ready.
- Style-reference default: create `style_reference_sheet.png` first, before the full runtime asset set, unless the GDD explicitly disables image generation or the human explicitly disables the style-reference workflow.

The AI must still produce all deliverables listed in the Authoring AI Output Contract and must still follow the validation workflow and runtime test expectations in this API reference.
