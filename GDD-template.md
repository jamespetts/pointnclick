# PointClickEngine Game Design Document Template

Purpose: a human-editable brief that an AI can turn into a 1990s-style point-and-click adventure for PointClickEngine.

How to complete it:
- Minimum useful brief: title, setting, premise/objective, overall style, humour/serious style, player character.
- Leave optional fields blank or write `default` to let the AI decide using the defaults shown.
- Write `none` where something must not appear.
- Copy repeating blocks for any number of rooms, characters, puzzles, items, endings, or cutscenes.
- Prefer short concrete phrases. Add examples only where they matter.

Default design assumptions if not overridden:
- Engine style: early-1990s verb/inventory point-and-click adventure.
- Room count: 6-10 rooms.
- Structure: hub-and-spoke with gentle gating.
- Difficulty: medium.
- Moon logic: low; strange solutions must be signposted.
- Failure: no player death, no unwinnable dead ends.
- Endings: one good ending.
- AI invention: allowed for connective plot, minor characters, rooms, puzzles, dialogue, jokes, and cutscenes if consistent with this GDD.

## 1. Core Brief

Title:
Game id: default; AI derives a safe id from title
One-sentence premise:
Setting:
Genre/subgenre: comic adventure
Overall style: 1990s point-and-click adventure
Humour style: default; write `serious` if serious
Humour/dialogue examples:
- 
- 
Intended audience/tone boundaries: general audience; avoid graphic content
Reference games/genres/works for flavour only, not copying:
- 

## 2. Creative Control

Plot definition level: key beats
Options: exact / key beats / premise only / AI decides
AI may invent: medium
Options: low / medium / high
Must preserve exactly:
- 
AI must not include:
- 
Clarification preference: ask only if reasonably necessary

## 3. Themes, Motifs, and World Logic

Underlying themes to weave in subtly:
- 
Recurring motifs/symbols/images/phrases:
- 
World rules or running absurdities:
- 
Serious emotional notes, if any:
- 

## 4. Plot Shape

Opening situation:
Main objective:
Act/key beat outline:
- Beginning:
- Middle:
- Late game:
- Climax:
Required jokes, incidents, reveals, or set-pieces:
- 
Optional incidents the AI may add: yes

## 5. World and Room Plan

Room count or range: default
World structure: default
Options: linear / hub / hub-and-spoke / map travel / AI decides
Rooms the human specifically wants:
- 
Rooms the AI may invent: yes

COPY THIS ROOM BLOCK AS NEEDED
Room name:
Purpose in story/puzzles:
Visual description:
Mood/lighting/weather:
Important hotspots/objects:
Characters present:
Exits/transitions:
Puzzles or events here:
Asset notes:
END ROOM BLOCK

## 6. Characters

COPY THIS CHARACTER BLOCK AS NEEDED
Character name:
Character id: default; AI derives safe id
Type: player / NPC / antagonist / helper / background
Brief visual description:
Clothing:
Distinctive visual characteristics/silhouette:
Game-world role:
Motivation:
Knowledge/secrets:
Relationship to player:
Player interaction: talk / trade / blocks passage / gives clue / comic foil / other
Humour style for this character:
Diction, idiom, accent, or speech rhythm:
Dialogue examples:
- 
- 
Gameplay function: dialogue tree / gatekeeper / exchange / distractible / clue / other
END CHARACTER BLOCK

Player character special notes:
Starting goal:
Starting inventory: none
Things the player character would never do:

## 7. Puzzle Design

Overall puzzle difficulty: medium
Moon logic allowance: low
Options: none / low / moderate / high
Hinting/signposting style: in-character hints and examinable clues
Inventory puzzle density: medium
Dialogue puzzle density: medium
Map/travel gating: default
Death or unwinnable states allowed: no
AI may add extra puzzles: yes

Specific puzzles the human wants:

COPY THIS PUZZLE BLOCK AS NEEDED
Puzzle name:
Required: yes / optional
Goal/obstacle:
Location(s):
Solution, if known:
Required items/state/dialogue:
Clues/signposts:
Wrong-action/refusal tone:
Preferred template: default; AI chooses from engine templates
END PUZZLE BLOCK

## 8. Inventory and Important Objects

COPY THIS ITEM/OBJECT BLOCK AS NEEDED
Name:
World form: room object / inventory item / both / background hotspot
Visual description:
Where found:
Uses:
Can combine with:
Should persist/change state:
Asset notes:
END ITEM/OBJECT BLOCK

## 9. Dialogue and Conversation Content

Dialogue volume: medium
Options: sparse / medium / dialogue-heavy
Dialogue choice style: concise player choices, distinctive NPC responses
Required conversation topics:
- 
Information that should be discoverable through dialogue:
- 
Recurring catchphrases or verbal motifs:
- 
Conversation topics to avoid:
- 

## 10. Cutscenes and Events

AI may add extra cutscenes: yes
Default extra cutscene use: intro, major reveal, puzzle completion, ending only

COPY THIS CUTSCENE/EVENT BLOCK AS NEEDED
Name:
Required: yes / optional
Trigger:
Purpose:
Characters involved:
Events shown:
Player control afterwards:
END CUTSCENE/EVENT BLOCK

## 11. Endings

Ending structure: single
Options: single / multiple
If multiple, what changes the ending:

COPY THIS ENDING BLOCK AS NEEDED
Ending id/name:
Required conditions:
Tone:
What happens:
Final image/animation notes:
END ENDING BLOCK

## 12. Art Direction and Asset Production

Art style:
Default: 1990s painted pixel-art backgrounds, readable silhouettes, slightly exaggerated character sprites
Palette/colour mood:
Perspective/camera style: side-on room scene, 320x136 play area
Character sprite style:
Object/icon style:
UI style:
Title screen notes:
Ending screen notes:

Required actual game assets:
- AI should create all needed room backgrounds, character sprites, object sprites/icons, overlays/maps, UI images, music, and sounds, or provide exact placeholder specifications.

Style reference sheet requirement:
- Create one additional graphical file named `style_reference_sheet.png`.
- It is not a runtime game asset; it is for future asset-generation sessions.
- It must show one or two sample backgrounds, two or three characters, and two or three objects in the final game style.
- It should preserve pixel-art edges and include enough variety to reproduce palette, line style, lighting, proportions, and object rendering.
- Future sessions creating graphical assets should receive this sheet alongside the GDD and asset manifest.

Audio/music style:
Default: light MIDI-like room music, short one-shot effects, silence where unspecified
Specific music/sound requirements:
- 

## 13. Technical and Engine Preferences

Use map item: default; AI decides if world size benefits
Save/load assumptions: standard engine save/load only
Custom scripts allowed: only when templates/dialogue/cutscenes cannot express the behaviour
Requested engine extensions, if any:
- 
Accessibility/readability notes:
- 

## 14. Handoff Expectations

AI should deliver:
- Implementation notes and assumptions.
- games.json entry or file.
- gameId/gameId.js.
- Asset manifest.
- Actual or placeholder assets, including style_reference_sheet.png.
- Puzzle dependency graph or walkthrough.
- Validator command and report.
- Runtime test plan.

Human tester priorities:
- Test every room transition.
- Test all dialogue branches.
- Test all inventory combinations used by puzzles.
- Test all endings.
- Test save/load before and after major state changes.
