## PointClickEngine Game Design Document

Use `default` to let the AI decide; use `none` to forbid something. Copy blocks as needed.

### 1. Core Brief

Title:
Game id: default
One-sentence premise:
Setting:
Genre/subgenre: comic adventure
Overall style: 1990s point-and-click adventure
Humour style: default
Options: default / comic / dry / absurd / gentle / serious
Humour/dialogue examples:
- 
- 
Intended audience/tone boundaries:
Reference games/genres/works for flavour only, not copying:
- 

### 2. Creative Control

Plot definition level: key beats
Options: exact / key beats / premise only / AI decides
AI may invent: medium
Options: low / medium / high
Must preserve exactly:
- 
AI must not include:
- 
Clarification preference: ask only if reasonably necessary

### 3. Themes, Motifs, and World Logic

Underlying themes to weave in subtly:
- 
Recurring motifs/symbols/images/phrases:
- 
World rules or running absurdities:
- 
Serious emotional notes, if any:
- 

### 4. Plot Shape

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

### 5. World and Room Plan

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

### 6. Characters

COPY THIS CHARACTER BLOCK AS NEEDED
Character name:
Character id: default
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

### 7. Puzzle Design

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
Preferred template: default
END PUZZLE BLOCK

### 8. Inventory and Important Objects

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

### 9. Dialogue and Conversation Content

Dialogue volume: medium
Options: sparse / medium / dialogue-heavy
Dialogue choice style: concise player choices, distinctive NPC responses
Required conversation topics:
- 
Information discoverable through dialogue:
- 
Recurring catchphrases or verbal motifs:
- 
Conversation topics to avoid:
- 

### 10. Cutscenes and Events

AI may add extra cutscenes: yes

COPY THIS CUTSCENE/EVENT BLOCK AS NEEDED
Name:
Required: yes / optional
Trigger:
Purpose:
Characters involved:
Events shown:
Player control afterwards:
END CUTSCENE/EVENT BLOCK

### 11. Endings

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

### 12. Art and Audio Direction

Art style:
Palette/colour mood:
Perspective/camera style:
Character sprite style:
Object/icon style:
UI style:
Title screen notes:
Ending screen notes:
Style reference sheet override: default
Options: default / not needed / specific notes below
Style reference sheet notes:
Audio/music style:
Music direction: default
Options: default / music-heavy / sparse music / no music
Music default: early-1990s MIDI-like room music, rendered as MP3 or OGG files for this engine
Music silence allowed: no by default; use yes only for deliberately silent rooms/screens
Music reuse preference: reuse one cue across multiple rooms where mood and pacing match
Music mood/style notes:
Specific music requirements, if any:

Sound effects direction: silent by default
Options: silent / sparse / medium / expressive
Sound effects default: optional and silent unless specified; early-1990s floppy-era style may use few or no effects
Required sound effects, if any:
Optional sound effect suggestions, if any:

### 13. Technical, Accessibility, and Extension Requests

Use map item: default
Options: yes / no / default
Requested engine extensions, if any:
- 
Accessibility/readability notes:
- 
