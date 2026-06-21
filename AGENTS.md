## AGENTS.md - PointClickEngine authoring instructions
  
These instructions are for repository-aware coding agents. They do not replace API-ref.md. Use API-ref.md as the complete public authoring contract for game scripts and README.md for human-facing workflow guidance.

### Scope
  
When asked to create or revise a PointClickEngine game from a completed GDD:
- Read API-ref.md, README.md, the completed GDD, and validator.py.
- Use only the public PointClickEngine authoring API for game scripts.
- Do not modify index.html unless the task explicitly asks for engine changes.
- Do not modify games.json or games.js unless those files are supplied and the task explicitly asks for a registry merge.
- Use unique filenames for generated revisions and reports.

### Required repository workflow for a new game
  
Do not generate the final game immediately. First create the authoring stage documents:
- docs/authoring/01_intake.md
- docs/authoring/02_plan.md
- docs/authoring/03_asset_audio_plan.md  
Only after those documents exist may you generate implementation files under the new game folder.  
After implementation, create:
- docs/authoring/04_validation.md
- docs/authoring/05_handoff.md  
If a stage document already exists, update it rather than ignoring it. Preserve useful human notes.

### Implementation rules
- One game script must call PointClickEngine.RegisterGame({...}) exactly once.
- Use declarative data and templates before custom scripts.
- Keep mutable game state in public engine state APIs or template runtime variables.
- Do not implement private renderers, movement systems, inventory systems, dialogue systems, save/load systems, or timer-driven cutscene systems.
- Do not use absolute paths, parent paths, backslashes, data URLs, or remote URLs for assets.
- Do not create replacement registry files unless the current registry files were supplied and the task explicitly asks for a merge.
- If binary image or audio generation is unavailable, provide exact asset specifications or clearly labelled prototype assets; do not call the package production-quality.

### Required checks before handoff
  
Run validator.py when available. For the canonical layout, use:

```bash
python3 validator.py gameId/gameId.js --engine index.html --check-assets --report docs/authoring/validator_report.txt
```

If the script or asset root is non-standard, pass the correct script path and --asset-root as documented in API-ref.md.  
Before final handoff, also check:
- every dialogue tree has a persistent exit path;
- every choice with end:true and an id is repeatable, non-hidden after use, or has another permanent exit path;
- every itemId-linked pickup/readable has a valid Look At/read path before and after pickup where applicable;
- every required walkthrough step maps to an implemented command path;
- every room transition has plausible source and destination continuity;
- every non-trivial puzzle has clueing and wrong-attempt feedback;
- every functional map, diagram, terminal, sign, closeup, or UI-like image has visible gameplay information;
- no generated file overwrites user-supplied work unless the task explicitly requests it.  
If a check fails, fix the issue and re-run the relevant validation before handoff.

### Final response requirements
  
The final response must summarise:
- files created or changed;
- validator command run and result;
- any warnings and why they are acceptable or what remains to be done;
- known limitations, especially placeholder/prototype assets or pending audio;
- registry status;
- recommended human runtime tests.  
Do not claim that validation, tests, or browser runtime testing passed unless they were actually run.


#### Architecture and design-depth requirements

Repository-aware agents must preserve the separation of concerns:
- API-ref.md is the public game-script API and data contract.
- README.md is the human-facing staged workflow guide.
- AGENTS.md is the automatic coding-agent workflow guide.

Before implementation, create or update the planning documents so they cover:
- content-role and required-depth plan;
- room density plan, including non-critical examinable content;
- red-herring and false-lead plan with fairness notes;
- clue web and clue gradient audit for every non-trivial puzzle;
- verb affordance plan for important objects and inventory items;
- state model, including the canonical owner of every persistent state value;
- template/effective-property decision log;
- custom-script justification list;
- transition continuity matrix;
- walkthrough command coverage matrix;
- functional visual legibility plan for maps, signs, terminals, diagrams, closeups, puzzle panels, overlays, and UI-like images;
- asset and audio plan, including visual acceptance notes, music cue manifest, and sound-effect manifest where relevant.

Architectural rules for implementation:
- For each behaviour, choose the highest-priority suitable mechanism: declarative data, templates, effective properties/getters, dialogue/cutscene data, then custom scripts only where necessary.
- Do not write custom scripts merely to vary text, visibility, blocking, sprites, available interactions, or refusal text; use effective properties/getters where the API supports them.
- Do not duplicate template-owned runtime variables with separate flags unless the separate flag has an independent story-level purpose.
- Every custom script must be justified in the planning or validation notes.
- Keep each implementation increment in a runnable, validator-checkable state.

#### Required authoring stage document contents

`docs/authoring/01_intake.md` must include:
- GDD summary;
- missing or ambiguous information;
- assumptions;
- engine-extension needs;
- files needed for later stages.

`docs/authoring/02_plan.md` must include:
- normalised design plan;
- content-role and required-depth plan;
- room graph;
- puzzle dependency graph;
- dialogue plan;
- architecture plan and canonical system mapping;
- state model;
- template/effective-property decision log;
- custom-script justification list;
- room density plan;
- red-herring and false-lead plan;
- clue web and clue gradient audit;
- verb affordance plan;
- transition continuity matrix;
- walkthrough command coverage matrix;
- functional visual legibility plan;
- registry strategy;
- initial asset and audio requirements.

`docs/authoring/03_asset_audio_plan.md` must include:
- visual style brief;
- style_reference_sheet specification or generated style reference if available;
- asset manifest with visual acceptance notes;
- music cue manifest with filenames, usage, purpose/mood, style/instrumentation, tempo/energy, looping notes, and generation prompts;
- sound-effect manifest where relevant;
- explicit notes on placeholder/prototype assets or pending audio;
- exact replacement instructions for temporary silence or placeholders.

`docs/authoring/04_validation.md` must include:
- validator command and output summary;
- JavaScript syntax check status if available;
- architectural validation: canonical path use, state ownership, effective-property use, template overrides, custom-script justifications, and scope control;
- walkthrough command coverage check;
- transition continuity check;
- dialogue escape check;
- linked item look/read check;
- clue web and clue gradient check;
- room density and red-herring fairness check;
- functional visual legibility check;
- quality/depth review;
- runtime test plan.

`docs/authoring/05_handoff.md` must include:
- files created or changed;
- implementation notes;
- asset/audio manifest summary;
- walkthrough;
- validation results;
- registry status;
- known limitations;
- recommended human runtime tests;
- next actions.
