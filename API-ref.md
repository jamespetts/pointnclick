# PointClickEngine API Reference for AI Game Authors

Engine API: 1
Authoring language: browser JavaScript in a `.js` game script.

This is the complete public authoring contract for game scripts. The authoring AI will not receive `index.html`. Use only the APIs, data shapes, templates, and validation rules documented here. If a requested design cannot be expressed with this contract, say that the engine needs an extension; do not invent private APIs.

Examples use indented plain text blocks labelled `EXAMPLE_START` / `EXAMPLE_END`; no fenced code blocks are used so this file can be embedded in prompts safely.

## 0. Genre, Mental Model, and Authoring Priorities

PointClickEngine creates early-1990s point-and-click adventure games in the style of SCUMM-era adventures: a 320x200 logical screen, painted room scene, lower verb/inventory interface, clickable hotspots, walking actors, inventory puzzles, dialogue trees, simple sprite animations, overlays/maps, cutscenes, save/load, refusals, and multiple endings.

Author in this priority order:

1. Declarative data.
2. Templates.
3. Effective properties and getter scripts.
4. Dialogue trees and cutscene step data.
5. Custom JavaScript scripts only for distinctive logic that cannot be represented above.

Do not implement custom rendering, movement loops, inventory UI, dialogue UI, save/load systems, or timer-driven cutscene systems.


## 0A. Core Authoring Principles for This Engine

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

## 0B. Glossary of Engine Concepts

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

## 1. Screen, Coordinates, Verbs, and UI
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


## 2. Files, Manifest, Assets, and Registration

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

Audio:

- Music resolves under `music/`; sound and voice resolve under `sounds/`.
- Music and sound source-list fields must be arrays of relative filenames; the current engine uses the first element. Use `[]` for silence.
- Voice fields/options are a single relative filename string, not an array.
- Use browser-supported audio file types such as `.ogg`, `.mp3`, or `.wav`. The engine does not validate audio extensions.
- Music loops until replaced or stopped; sound effects and voice are one-shot.


## 3. Public Browser Facade: Exact Method Contracts

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


## 4. Game Script and Top-Level Game Definition

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
- `titleBackground:string`: PNG in `rooms/`.
- `endBackground:string`: PNG in `rooms/`.
- `titleMusic:array`, `menuMusic:array`, `endMusic:array`: music source lists; use arrays, normally with one filename.

Do not author runtime-added fields such as `assetPath` or `initialRooms` in the game script. `assetPath` belongs in the manifest.


## 5. Rooms, Geometry, Transitions, and Triggers

Rooms are stored in `game.rooms` as an object keyed by room id. The key is the canonical id. If a room object contains `id`, it should match the key.

Room syntax:

EXAMPLE_START
rooms:{
  startRoom:{
    name:'Start Room',
    background:'start_room.png',
    music:['start_theme.ogg'],
    walkableArea:{x:0,y:80,w:320,h:56},
    walkBoxes:[{id:'floor',x:0,y:80,w:320,h:56}],
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
- `walkableArea:{x:number,y:number,w:number,h:number}`: broad validation and reachable-point area.
- `walkBoxes:array`: walkable shapes; entries may be bare rectangles or objects with `shape`/`rect`; entries may use `links` or `connects` to build graph edges when explicit edges absent.
- `blockers:array`: movement blockers; each may have `id`, `shape`, `rect`, `onCollide`, `onBump`.
- `walkGraph.nodes:array`: `{id:string,x:number,y:number}`.
- `walkGraph.edges:array`: `[fromId,toId]` or `{from:string,to:string}`.
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

Transition zone syntax:

EXAMPLE_START
transitionZones:[
  {id:'toHall',rect:{x:300,y:88,w:20,h:44},targetRoomId:'hall',targetX:20,targetY:112,targetFacing:'right'},
  {id:'doorExit',rect:{x:150,y:70,w:30,h:60},targetRoomId:'study',targetX:160,targetY:120,enabledObjectId:'studyDoor',enabledProperty:'open'}
]
EXAMPLE_END

Transition zone fields:

- `id:string` optional.
- `rect` or `shape`: geometry.
- `targetRoomId:string`: destination room.
- `targetX:number`, `targetY:number`, `targetFacing:string`: player destination.
- `script:string`: if supplied, runs instead of normal room change.
- `enabledObjectId:string`, `enabledProperty:string`: zone enabled only when the object's effective property is truthy.
- Transition hooks: `beforeTransition`, `afterTransition`.

A transition zone must have a valid `targetRoomId` or a `script`.

Trigger zone fields:

- `id:string` optional.
- `rect` or `shape`.
- `onEnter:string` or `script:string`.
- `onExit:string`.
- `onStay:string`.


## 6. Room Hotspots/Objects and Object Animation

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
- Visibility/hit: `hidden`, `renderHidden`, `hitDisabled`, `interactionDisabled`, `rect`, `hitRect`, `priority`, `hitPriority`, `zIndex`, `baseline`.
- Movement/geometry: `walkTo`, `walkThrough`, `walkThroughTo`, `blocksMovement`, `blocksActors`, `blocksWhenHidden`, `collisionShape`, `occluderShape`, `walkBehind`, `walkBoxes`, `blockers`, `triggerZones`, `onCollide`, `onBump`, `onStay`.

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


## 7. Inventory Items, Maps, Overlays, Sprites, and Actors

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

- `image:string`: PNG in `objects/`, normally 320x136.
- `itemId:string` optional.
- `hotspots:array` optional; overlay targets use `id`, `name`, `rect`, `interactions`, `refusals`, and other ordinary target fields. Overlay targets are clicked only while the overlay is open; their ids do not place persistent room objects, but if they use object variables they still share the object-variable namespace for that id.

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

Map place fields: `id`, `name`, `rect`, `targetRoomId`, `targetX`, `targetY`, `targetFacing`, `description`, `defaultText`, `alwaysVisible`, `visibleFlag`, `hiddenFlag`, `blockedFlag`, `blockedScript`, `blockedText`, `script`. A place is shown only if `visibleFlag` is absent or true, `hiddenFlag` is absent or false, and either `alwaysVisible` is true, no `roomId`/`targetRoomId` is present, or the destination room has been visited. `blockedScript` is a getter-style script called with `(query,self,context)` and should return truthy when travel is blocked.

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

Sprite fields: `image`, `frameW`, `frameH`, `directional`, `rows`, `animations`, `idleFrames`, `idleFps`, `walkFrames`, `walkFps`. `frameW` and `frameH` are required for actor spritesheets. Directional row order is down, left, right, up. An animation entry may define `frames`, `fps`, `frame`, `rowOffset`, and `directional:false`. For directional sprites, `rowOffset` is added before the facing row is applied. `talk` is used automatically by `api.Say()` if present.

Actor/player/room character fields: `id`, `name`, `displayName`, `spriteId`, `x`, `y`, `facing`, `visible`, `hidden`, `controllable`, `speed`, `scale`, `scaleWithPerspective`, `perspectiveScale`, `fixedScale`, `followPlayer`, `dialogueColor`, `walkTo`, `rect`, `hitW`, `hitH`, `rectW`, `rectH`, `interactions`, `refusals`, effective property maps. Top-level `game.characters` supplies reusable character metadata such as names/dialogue colours and scoped-variable existence; NPCs that should appear, move, or be clicked must also be placed in `room.characters`. If a room character lacks `rect`, the engine derives it from `x`/`y` using `hitW`/`hitH` or `rectW`/`rectH`, default 16x16, with `x` centred and `y` as the foot point.


## 8. Interactions, Refusals, Effective Properties, and Getter API

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
- For inventory-on-target `use`/`give`, the engine first checks `verbId:inventoryItemId` on the target or linked item, then checks the reverse key `verbId:targetId` on the selected inventory item, then falls back to `verbId`. Use these specific keys for one-off transitive interactions; use `combine` or `toolTarget` for reusable patterns.

Refusal lookup order:

1. Target `refusals[verbId]`.
2. Linked inventory item refusal if a room object has `itemId` and the target has no refusal.
3. `game.defaultRefusals[verbId]`.
4. Engine default refusal.

Use/Give:

- `use` and `give` are two-target verbs: select inventory item, then click target.
- Set effective property `transitiveUse:false` on a target/item when `Use` should run its own intransitive `use` interaction immediately instead of selecting it as the first object for `Use X with Y`. The `costume` and `openableBox` templates do this.
- `exchange`/barter is Give-only.
- True symmetric `Use X with Y` uses `combine`.
- Target-specific tools use `toolTarget`.

Effective property resolution:

1. Runtime object state override, where applicable.
2. `entity.properties[propertyName]`.
3. `entity[propertyName]`.
4. Getter script.
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

- Booleans: `visible`, `hidden`, `hitDisabled`, `walkThrough`, `renderHidden`, `blocksWhenHidden`, `interactionDisabled`, `blocksMovement`, `blocksActors`, `walkBehind`.
- Points: `walkTo`, `walkThroughTo` are null/undefined or `{x:number,y:number}`.
- Rectangles: `hitRect`, `rect` are `{x:number,y:number,w:number,h:number}`.
- Arrays: `walkBoxes`, `blockers`, `walkBehinds`, `triggerZones`.
- Objects: `collisionShape`, `occluderShape`.
- Numbers: `baseline`, `zIndex`.
- Callback values: `callbackStatus:string`, `callbackResult:string|object`, `callbackResults:object`.

Common properties worth making dynamic with effective properties or getters:

- `hidden`, `hitDisabled`, `interactionDisabled`, `renderHidden` for whether a target appears or can be clicked.
- `defaultText` and `description` for state-dependent Look At text.
- `sprite`, `closedSprite`, `openSprite`, `onSprite`, `offSprite`, `emptySprite` for state-dependent graphics.
- `blocksMovement`, `walkThrough`, `walkThroughTo`, `collisionShape`, `walkBehind`, `baseline`, `zIndex` for state-dependent navigation/rendering.
- `interactions` and `refusals` when available verbs or failure text depend on state.
- Template-specific properties such as `open`, `locked`, `on`, `powered`, `allowsPassage`, `travelBlocked`, `unlockBlocked`, and `requirements`.

Avoid these mistakes:

- Do not write a custom Look At script just to vary description text; use a getter for `defaultText`.
- Do not use both a flag and a template runtime variable for the same state unless both are needed for different story purposes.
- Do not use `SetObjectState` casually; it overrides effective properties. Use object variables for ordinary puzzle state and reserve object state for deliberate property overrides.
- Do not mutate state in const getters. If mutation is unavoidable, declare the getter in `nonConstPropertyGetters` or `mutablePropertyGetters` and keep the mutation minimal and saved-state-safe.


## 9. Templates

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

Adds `lookAt`, `open`, `close`, `use`, `walkTo`. Fields: `locked`, `open`, sprites, transition/unlock/lock animations, `walkThroughTo`, `onOpen`, `onClose`, `onUnlock`, `onLock`, all door text fields. Runtime variables: `open`, `locked`. Doors control open/closed/blocking; room transitions are still transition zones.

### `key`

Fields: `unlocks`, `unlockDoors`, `opens`, `targets`, `doorIds`, `objectIds`; string or array; `'*'` targets all compatible locks.

### `map`

Adds `lookAt`. Fields: `map`, `map.image`, `map.places`, `travelBlocked`, `travelBlockedText`. Map places are rendered as overlay targets and use `walkTo` for travel and `lookAt` for descriptions. Places without `alwaysVisible` normally appear only after their target room has been visited.

### `pickup`

Adds `lookAt`, `take`. Fields: `itemId`, `hiddenFlag`, `takenFlag`, `takeText`, `onTake`. Runtime variable: `taken`. The take action sets object variable `taken=1` and sets `hiddenFlag` if present, otherwise `takenFlag` if present. Only `hiddenFlag` is automatically checked by the generic visibility path; if a pickup should disappear after taking, set `hiddenFlag` to the flag that take will set, or provide a `hidden` getter that checks `taken`/`takenFlag`.

### `container`

Adds `lookAt`, `open`, `close`, `use`. Fields: `locked`, `open`, `contents`, `contains`, sprites, animations, `onOpen`, `onClose`, `onUnlock`, `onLock`, `onEmpty`, text fields. Runtime variables: `open`, `locked`, `emptied`.

### `switch`

Adds `lookAt`, `use`, `open`, `close`. Fields: `on`, sprites, `onToggle`, `onOn`, `onOff`, text fields. Runtime variable: `on`.

### `readable`

Adds `lookAt`, `use`. Fields: `readText`, `lookOverlay`, `closeupOverlay`, `onRead`, `defaultText`.

### `device`

Adds `lookAt`, `use`. Fields: `powered`, `powerFlag`, `requiredItem`, `consumeRequiredItem`, `setsFlag`, `fixedOnUse`, `singleUse`, `onUse`, text fields. Runtime variables: `used`, `fixed`.

### `furniture`

Adds `lookAt`. Fields: `rect`, `collisionShape`, `baseline`, `walkBehind`, `allowWalkBehindWithoutSprite`, `zIndex`, `defaultText`, `onCollide`, `sprite`. Defaults to blocking movement and refusing take/open/close.

### `barrier`

Adds `lookAt`. Fields: `rect`, `collisionShape`, `defaultText`. Defaults to blocking movement and refusing take/open/close.

### `combine`

Adds `use`. Symmetric. Fields: `combine`, `combinations`, `intransitiveUseText`, `selfUseText`, `combineRefusalText`.

EXAMPLE_START
combine:{
  otherItemId:{removeSource:true,removeTarget:true,resultItem:'combinedItem',text:'That should do it.'},
  '*':{refusalText:'Those do not go together.'}
}
EXAMPLE_END

### `openableBox`

Adds `open`, `use`. Fields: `alreadyOpenText`, `openEffect`, `revealsItem`, `openSpeakerId`, `openText`. Runtime variable: `opened`.

### `exchange`

Adds `give` only. Fields: `exchanges`, `exchangeNeedItemText`, `exchangeRefusalText`. Rule fields also include `playerRefusalText`, `playerSpeakerId`, `playerText`, `npcSpeakerId`, `npcText`, `text`, `afterDialogueScript`. Exchange/barter is Give-only.

### `multiRequirement`

Adds `give`, `use`. Fields: `requirements`, `requirementNeedItemText`, `requirementWrongItemText`, `completion`, `completionText`, `completionSpeakerId`. Requirement entries are item id strings or objects with `itemId`, `consume`, `text`, `speakerId`, `alreadyText`, and shared requirement fields. Runtime variables: `delivered_itemId`.

### `gatekeeper`

Adds `talkTo`, `use`, `give`. Fields: `dialogueTree`, `allowsPassage`, `allowText`, `blockText`.

### `costume`

Adds `use`. Fields: `costumeSpriteId`, `playerSpriteId`, `baseClothes`, `replacesItem`, `returnItem`, `wearText`, `costumeNoSpriteText`. Runtime item variable: `worn`.

### `toolTarget`

Adds `use`. Fields: `toolUses`, `toolNeedItemText`, `toolRefusalText`. Rule key is source/tool id or `'*'`.

### `clueUnlocker`

Adds `lookAt`, `use`. Fields: `unlockBlocked`, `unlockBlockedText`, `unlocksPlaces`, `mapItemId`, `unlockText`. Effect: sets item variable `place_placeId_unlocked=1`.

### `distractible`

Adds `use`, `give`. Fields: `distractions`, `distractionRefusalText`. Rule key is source id or `default`. Effect: sets self variable `distracted=1` and applies rule effects.


## 10. Runtime Script API: Exact Method Contracts

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

Moves non-player room character. Options: `speed:number`, `hideOnComplete:boolean`, `onComplete:function(result)`.

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

#### `api.PlaySound(sources:string|array) -> undefined`

Prefer array. The engine uses first source and resolves under `sounds/`.

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


## 11. Lifecycle Hooks

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


## 12. Dialogue Trees

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


## 13. Cutscenes

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


## 14. Endings, UI, Save/Load, and Validation

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

- Does each standard puzzle use the appropriate template before any custom script?
- Does every mutable value that matters after save/load use a public saved-state API?
- Are dynamic text, visibility, blocking, sprites, and available interactions represented as effective properties/getters rather than custom scripts where possible?
- Are all branching conversations dialogue trees?
- Are all staged sequences cutscenes rather than timers?
- Are room changes represented as transition zones unless a custom script genuinely needs to call `api.ChangeRoom()`?
- Are all refusals data-driven unless they require distinctive game logic?

Validation workflow:

1. LLM semantic validation: check all ids, scripts, templates, assets, hooks, dialogue forms, cutscene steps, save-state use, and template-vs-custom-script choices.
2. Run validator:

EXAMPLE_START
python validator.py gameId/gameId.js --engine index.html --check-assets --report validation_report.txt
EXAMPLE_END

If exactly one game script exists below the directory:

EXAMPLE_START
python validator.py --check-assets --report validation_report.txt
EXAMPLE_END

3. Human runtime test: start game, test every room transition, dialogue branch, inventory action, template puzzle, cutscene, save/load, ending, and custom script. For failures, retrieve `PointClickEngine.GetDiagnostics()` or `PointClickEngine.CopyDiagnosticsToClipboard()`.

Validator interpretation:

- `[PCEVAL][ERROR]`: must fix before testing.
- `[PCEVAL][WARN]`: normally fix unless deliberately harmless.
- `ASSET_PATH_INVALID`, `ASSET_IMAGE_EXTENSION`, `ASSET_FILE_MISSING`: asset path/file problem.
- `PRIVATE_ENGINE_ACCESS`: forbidden internal access.
- `TEMPLATE_UNKNOWN`, `TEMPLATE_ACTION_INVALID`: template issue.
- `SCRIPT_REF_MISSING`: missing script.
- `LEGACY_HOOK_USED`: unsupported hook name.

## 15. GDD Parsing Placeholder

Future section: parse the completed Game Design Document and map it to rooms, entities, templates, assets, dialogue trees, cutscenes, validation checks, and human test scripts.
