/*
    Test Game: The Locked Door

    This file is narrative/content logic only. It must not create a second
    renderer, inventory, player, movement system, interaction system, dialogue
    system, or main loop. Use only PointClickEngine.API for state changes.
*/
'use strict';

PointClickEngine.RegisterGame({
    id: 'testgame', title: 'Test Game: The Locked Door', author: 'James E. Petts', titleBackground: 'intro_testgame_recursive_90s_v1.png', titleMusic: ['intro.mp3'], endBackground: 'end_screen_v1.png', endMusic: ['outtro.mp3'], engineApi: 1, startRoomId: 'testRoom', rendering: { imageSmoothing: false },
    ui: { verbInventoryBackground: 'ui_verb_inventory_mundane_v2.png', panelColor: '#101018', panelTopLineColor: '#9b8b61', verbColor: '#eadfb8', verbSelectedColor: '#fff2a0', verbShadowColor: '#150d06', verbSelectedBackColor: 'rgba(72,56,22,0.72)', verbSelectedUnderlineColor: 'rgba(210,168,75,0.70)', dynamicLineHeight: 9, textColor: '#f3ead0', textShadowColor: '#000000', narrationTextColor: '#f3ead0', dialogueTextColor: '#f3ead0', playerDialogueColor: '#f4f0cf', choiceTextColor: '#f3ead0', commandTextColor: '#b6ff9a', hoverTextColor: '#ffe377', inventorySelectedBackColor: '#5e5022' },
    hooks: { afterRoomEnter: 'startIntroCutscene' },
    player: { id: 'player', roomId: 'testRoom', x: 70, y: 118, facing: 'down', animation: 'idleDown', visible: true, controllable: true, speed: 48, walkTarget: null, walkPath: [], walkCallback: null, spriteId: 'player', scale: 1 },
    sprites: { player: { image: 'player_animations_bespoke_blink_idle_v2_20260617.png', frameW: 16, frameH: 32, frames: 4, rows: 12, directional: true, animations: { idle: { rowOffset: 0, frames: 4, fps: 2 }, walk: { rowOffset: 4, frames: 4, fps: 12 }, talk: { rowOffset: 8, frames: 4, fps: 6 } } }, caretaker: { image: 'npc_animations_cartoon90s_v2.png', frameW: 16, frameH: 32, frames: 2, rows: 8, directional: true, walkFps: 4, idleFps: 1, animations: { idle: { rowOffset: 0, frames: 1, fps: 1 }, walk: { rowOffset: 0, frames: 2, fps: 4 }, talk: { rowOffset: 4, frames: 2, fps: 6 } } }, woofer: { image: 'woofer_animations_bespoke_idle_v2_20260617.png', frameW: 24, frameH: 16, frames: 2, rows: 12, directional: true, walkFps: 5, idleFps: 2, animations: { idle: { rowOffset: 0, frames: 2, fps: 2 }, walk: { rowOffset: 4, frames: 2, fps: 5 }, tailWag: { rowOffset: 8, frames: 2, fps: 8 } } } },
    characters: { player: { name: '', dialogueColor: '#f4f0cf' }, caretaker: { name: 'Caretaker', dialogueColor: '#b8e8ff' }, woofer: { name: 'Woofer', dialogueColor: '#ffd58a' } },
    items: {
        coin: { id: 'coin', name: 'coin', icon: 'coin_inventory_cartoon90s_v2.png', worldSprite: 'coin_table_cartoon90s_v2.png', defaultText: 'A small brass coin. It has seen a lot of pockets.', interactions: { 'use:key': 'useCoinWithKey' }, refusals: { open: 'It is a coin, not a tin.', close: 'It is already as closed as a coin can be.' } },
        key: { id: 'key', name: 'key', template: 'key', unlocks: ['door'], icon: 'key.png', defaultText: 'A small brass key. It looks suitable for the door.', interactions: { open: 'openKey', close: 'closeKey', 'use:coin': 'useCoinWithKey' } },
        map: { id: 'map', name: 'map', template: 'map', icon: 'map_table_sprite_20260618_2140.png', worldSprite: 'map_table_sprite_20260618_2140.png', defaultText: 'A small sketch map of the test area.', map: { image: 'map_detail_overlay_20260618_2140.png', places: [ { id: 'mapStartRoom', name: 'starting room', rect: { x: 218, y: 46, w: 70, h: 44 }, targetRoomId: 'testRoom', targetX: 70, targetY: 118, targetFacing: 'down', description: 'The starting room, complete with one suspiciously important door.' }, { id: 'mapStoreRoom', name: 'store room', rect: { x: 38, y: 72, w: 76, h: 44 }, targetRoomId: 'storeRoom', targetX: 154, targetY: 116, targetFacing: 'down', description: 'The store room, where convenient objects traditionally gather.' } ] }, propertyGetters: { travelBlocked: 'mapTravelBlocked' } }
    },
    defaultRefusals: { take: 'That is not something you can carry.', open: 'That does not open.', close: 'That does not close.', give: 'That is not a promising recipient.', talkTo: 'There is no reply.', use: 'That does not seem to work.' },
    rooms: {
        testRoom: {
            id: 'testRoom', name: 'Starting Room', background: 'testroom_start_room_object_door_v1.png', walkableArea: { x: 8, y: 86, w: 304, h: 48 }, walkBoxes: [ { id: 'mainFloor', rect: { x: 8, y: 86, w: 304, h: 48 } } ], characterScale: { farY: 86, nearY: 134, farScale: 0.84, nearScale: 1.12 }, music: ['main_room.mp3'],
            walkGraph: {
                nodes: [
                    { id: 'leftExit', x: 18, y: 112 },
                    { id: 'leftFloor', x: 70, y: 118 },
                    { id: 'centreFloor', x: 144, y: 116 },
                    { id: 'caretakerApproach', x: 174, y: 116 },
                    { id: 'doorApproach', x: 270, y: 114 },
                    { id: 'rightFloor', x: 300, y: 112 }
                ],
                edges: [
                    ['leftExit', 'leftFloor'],
                    ['leftFloor', 'centreFloor'],
                    ['centreFloor', 'caretakerApproach'],
                    ['caretakerApproach', 'doorApproach'],
                    ['doorApproach', 'rightFloor']
                ]
            },
            transitionZones: [
                { id: 'toStoreRoom', rect: { x: 0, y: 86, w: 14, h: 48 }, targetRoomId: 'storeRoom', targetX: 300, targetY: 112, targetFacing: 'left' },
                { id: 'throughDoor', rect: { x: 258, y: 86, w: 28, h: 24 }, enabledFlag: 'doorOpen', script: 'endThroughDoor' }
            ],
            hotspots: [
                { id: 'door', name: 'door', template: 'door', locked: true, propertyGetters: { callbackResult: 'doorCallbackResult' }, rect: { x: 250, y: 31, w: 45, h: 56 }, x: 248, y: 30, closedSprite: 'door_opening_animation_v1.png', openSprite: 'door_opening_animation_v1.png', frameW: 48, frameH: 58, animation: 'closed', transitionAnimation: 'open', animations: { closed: { frame: 0, frames: 1 }, open: { frames: 4, fps: 5, loop: false } }, walkTo: { x: 270, y: 114 }, walkThroughTo: { x: 270, y: 86 }, lockedText: 'The door is locked. A small keyhole glints in the dim light.', unlockedText: 'The door is unlocked. It now awaits the rare and specialised operation known as opening.', openText: 'The door is open. Beyond it lies the end of the test, which is unusually literal.', lockedOpenText: 'It will not open. The lock is making a persuasive argument.', openActionText: 'The door creaks open.', closeActionText: 'The door closes with a modest wooden thunk.', alreadyOpenText: 'The door is already open. The corridor is available for walking through.', alreadyClosedText: 'The door is already closed.', unlockText: 'The key turns with a satisfying click. The door is now unlocked.', lockText: 'The key turns back with a small, unnecessary click. The door is locked again.', wrongKeyText: 'You do not have the right key.', closedWalkText: 'The door is closed. Walking through it would be poor form, and probably sore.', onOpen: 'doorTemplateOpened', onClose: 'doorTemplateClosed' },
                { id: 'introDust', name: 'dust', sprite: 'intro_dust_puff_20260618.png', rect: { x: 260, y: 82, w: 16, h: 16 }, x: 260, y: 82, frameW: 16, frameH: 16, animation: 'idle', hidden: true, renderHidden: false, hitDisabled: true, zIndex: 20, animations: { idle: { frame: 0, frames: 1 }, puff: { frames: 4, fps: 8, loop: false } }, animationCompleteScripts: { puff: 'introDustComplete' } },
                { id: 'chair', name: 'chair', template: 'furniture', sprite: 'chair_furniture_sprite_20260618_2230.png', rect: { x: 106, y: 82, w: 24, h: 30 }, x: 106, y: 82, frameW: 24, frameH: 30, walkTo: { x: 118, y: 118 }, collisionShape: { rect: { x: 109, y: 106, w: 18, h: 8 } }, baseline: 114, defaultText: 'A small wooden chair. It looks serviceable, if not urgently relevant.', refusals: { use: 'There is no time to sit down now.' } }
            ],
            characters: [
                { id: 'caretaker', name: 'caretaker', spriteId: 'caretaker', x: 270, y: 90, facing: 'down', hidden: true, scaleWithPerspective: false, rect: { x: 182, y: 84, w: 16, h: 32 }, hitW: 16, hitH: 32, walkTo: { x: 174, y: 116 }, defaultText: 'The caretaker waits patiently.', refusals: { open: "I'm not qualified to perform surgery" }, interactions: { lookAt: 'lookCaretaker', talkTo: 'talkCaretaker', 'give:coin': 'giveCoinToCaretaker' } },
                { id: 'woofer', name: 'Woofer', spriteId: 'woofer', x: 52, y: 118, facing: 'right', rect: { x: 40, y: 103, w: 24, h: 15 }, hitW: 24, hitH: 15, followPlayer: true, followOffsetX: -20, followOffsetY: 0, followStopDistance: 12, speed: 42, walkTo: { x: 64, y: 116 }, defaultText: 'Woofer is a small light grey dog who looks like a mop without a handle.', interactions: { lookAt: 'lookWoofer', talkTo: 'talkWoofer' } }
            ]
        },
        storeRoom: {
            id: 'storeRoom', name: 'Store Room', background: 'testroom_left_v1.png', walkableArea: { x: 8, y: 86, w: 304, h: 48 }, walkBoxes: [ { id: 'backFloor', rect: { x: 8, y: 86, w: 304, h: 20 }, links: ['frontFloor', 'rightFloor'] }, { id: 'frontFloor', rect: { x: 8, y: 121, w: 304, h: 13 }, links: ['backFloor', 'rightFloor'] }, { id: 'rightFloor', rect: { x: 126, y: 86, w: 186, h: 48 }, links: ['backFloor', 'frontFloor'] } ], characterScale: { farY: 86, nearY: 134, farScale: 0.84, nearScale: 1.12 }, music: ['main_room.mp3'],
            walkGraph: {
                nodes: [
                    { id: 'leftFloor', x: 28, y: 112 },
                    { id: 'frontLeft', x: 28, y: 124 },
                    { id: 'tableApproach', x: 72, y: 124 },
                    { id: 'coinApproach', x: 76, y: 124 },
                    { id: 'centreFloor', x: 154, y: 116 },
                    { id: 'rightFloor', x: 266, y: 116 },
                    { id: 'rightExit', x: 300, y: 112 }
                ],
                edges: [
                    ['leftFloor', 'frontLeft'],
                    ['frontLeft', 'tableApproach'],
                    ['tableApproach', 'coinApproach'],
                    ['tableApproach', 'centreFloor'],
                    ['coinApproach', 'centreFloor'],
                    ['centreFloor', 'rightFloor'],
                    ['rightFloor', 'rightExit']
                ]
            },
            transitionZones: [
                { id: 'toStartingRoom', rect: { x: 306, y: 86, w: 14, h: 48 }, targetRoomId: 'testRoom', targetX: 18, targetY: 112, targetFacing: 'right' }
            ],
            hotspots: [
                { id: 'coinHotspot', name: 'coin', template: 'pickup', itemId: 'coin', hitPriority: 10, rect: { x: 73, y: 77, w: 8, h: 5 }, x: 74, y: 78, walkTo: { x: 76, y: 124 }, hiddenFlag: 'coinTaken', defaultText: 'It is a small brass coin, assuming your mouse has the necessary qualifications.', takeText: 'Taken.', interactions: { lookAt: 'lookCoin' } },
                { id: 'mapHotspot', name: 'map', template: 'pickup', itemId: 'map', hitPriority: 9, rect: { x: 86, y: 78, w: 18, h: 10 }, x: 86, y: 78, walkTo: { x: 76, y: 124 }, hiddenFlag: 'mapTaken', defaultText: 'It is a small sketch map of this very demanding test area.', takeText: 'Taken.' },
                { id: 'table', name: 'table', template: 'furniture', propertyGetters: { callbackResult: 'tableCallbackResult' }, rect: { x: 40, y: 74, w: 70, h: 46 }, x: 40, y: 74, walkTo: { x: 72, y: 124 }, baseline: 106, defaultText: 'A plain wooden table. It has survived worse engines than this one.', onCollide: 'bumpTable', refusals: { take: "It's far too heavy" }, interactions: { lookAt: 'lookTable' } }
            ],
            characters: [
                { id: 'woofer', name: 'Woofer', spriteId: 'woofer', x: 280, y: 118, facing: 'left', rect: { x: 268, y: 103, w: 24, h: 15 }, hitW: 24, hitH: 15, followPlayer: true, followOffsetX: -20, followOffsetY: 0, followStopDistance: 12, speed: 42, walkTo: { x: 266, y: 116 }, defaultText: 'Woofer is a small light grey dog who looks like a mop without a handle.', interactions: { lookAt: 'lookWoofer', talkTo: 'talkWoofer' } }
            ]
        }
    },
    dialogueTrees: {
        caretakerTalk: {
            speakerId: 'caretaker',
            start: 'start',
            nodes: {
                start: {
                    text: 'Good day. What can I do for you?',
                    choices: [
                        {
                            id: 'whoAreYou',
                            text: 'Who are you?',
                            response: 'I am here to test dialogue choices, speech placement, and timed text.',
                            repeat: true
                        },
                        {
                            id: 'askKeyNoCoin',
                            text: 'Do you have a key?',
                            conditions: [ { missingItem: 'coin' }, { missingItem: 'key' } ],
                            response: 'I might trade it for a coin, if you happen to find one in a suspiciously convenient place.',
                            repeat: true
                        },
                        {
                            id: 'askKeyWithCoin',
                            text: 'Will you trade this coin for a key?',
                            conditions: [ { hasItem: 'coin' }, { missingItem: 'key' } ],
                            actions: [ { removeItem: 'coin' }, { addItem: 'key' }, { script: 'caretakerLeavesAfterTrade' } ],
                            response: 'A fair trade. Here is the key.',
                            end: true
                        },
                        {
                            id: 'askKeyAlreadyHaveKey',
                            text: 'Do you have another key?',
                            conditions: { hasItem: 'key' },
                            response: 'I already gave you the key. Try it on the door before it starts feeling underappreciated.',
                            repeat: true
                        },
                        {
                            id: 'sillyQuestion',
                            text: 'If a cupboard dreams of porridge, should I apologise to the spoon?',
                            response: 'Only on Thursdays. On Fridays the spoon is legally represented by a startled turnip.'
                        },
                        {
                            id: 'neverMind',
                            text: 'Never mind.',
                            response: 'Very well.',
                            end: true,
                            repeat: true
                        }
                    ]
                }
            }
        }
    },
    scripts: {  
        startIntroCutscene: function (api, context) {
            if (!context || context.toRoomId !== 'testRoom' || api.GetFlag('introCutsceneSeen')) { return; }
            api.SetFlag('introCutsceneSeen', true);
            api.StartCutscene([
                { type:'setFlag', name:'introCutsceneStarted', value:true },
                { type:'setObjectState', objectId:'door', values:{ locked:false, open:true, animation:'open' } },
                { type:'setObjectState', objectId:'introDust', values:{ hidden:false, animation:'idle' } },
                { type:'setCharacter', actorId:'caretaker', x:270, y:90, facing:'down', hidden:false },
                { type:'moveCharacter', actorId:'caretaker', x:190, y:116, speed:38 },
                { type:'script', script:'assertCaretakerArrival' },
                { type:'animateObject', objectId:'introDust', animation:'puff', holdFinal:false },
                { type:'script', script:'assertDustAnimationResult' },
                { type:'setFlag', name:'introDustPuffed', value:true },
                { type:'setObjectState', objectId:'introDust', values:{ hidden:true, animation:'idle' } },
                { type:'setAnimation', actorId:'woofer', animation:'tailWag' },
                { type:'sound', sources:['woof.mp3'] },
                { type:'wait', duration:0.45 },
                { type:'clearAnimation', actorId:'woofer' },
                { type:'say', speakerId:'caretaker', text:'Morning. Mind the door; it has opinions.', duration:1.8 },
                { type:'moveCharacter', actorId:'caretaker', x:270, y:114, speed:38 },
                { type:'script', script:'assertCaretakerAtDoor' },
                { type:'setCharacter', actorId:'caretaker', facing:'up' },
                { type:'say', speakerId:'caretaker', text:'One moment. I should make sure it latches.', duration:1.4 },
                { type:'parallel', steps:[
                    { steps:[ { type:'animateObject', objectId:'door', animation:'open', reverse:true, holdFinal:true } ] },
                    { steps:[ { type:'setAnimation', actorId:'caretaker', animation:'talk' }, { type:'wait', duration:0.18 }, { type:'sound', sources:['door_close.mp3'] }, { type:'wait', duration:0.32 }, { type:'clearAnimation', actorId:'caretaker' } ] }
                ] },
                { type:'clearAnimation', actorId:'caretaker' },
                { type:'setObjectState', objectId:'door', values:{ open:false, locked:true, animation:'closed' } },
                { type:'setFlag', name:'doorOpen', value:false },
                { type:'setObjectVariable', objectId:'door', name:'introClosedCount', value:1 },
                { type:'setObjectVariable', objectId:'door', name:'introLockChecked', value:1 },
                { type:'say', speakerId:'caretaker', text:'There. Locked again. We cannot have doors getting ideas.', duration:1.8 },
                { type:'moveCharacter', actorId:'caretaker', x:190, y:116, speed:38 },
                { type:'script', script:'assertCaretakerReturned' },
                { type:'if', condition:{ flag:'introDustPuffed' }, then:[ { type:'script', script:'assertIntroCutsceneState' } ], else:[ { type:'script', script:'introDustMissingFailure' } ] },
                { type:'say', speakerId:'player', text:'That was unnecessarily theatrical.', duration:1.6 },
                { type:'setFlag', name:'introCutsceneComplete', value:true }
            ], { id:'introCaretakerEntrance', replace:true });
        },
        introDustComplete: function (api) { api.SetFlag('introDustLegacyCallbackFired', true); },
        assertDustAnimationResult: function (api, step, previousResult) {
            if (!previousResult || previousResult.status !== 'completed' || previousResult.action !== 'objectAnimation' || previousResult.targetId !== 'introDust' || previousResult.animation !== 'puff') { return api.MakeActionResult('blocked', { action:'script', reason:'dustAnimationResultMissing', continueCutscene:false }); }
            api.SetFlag('introDustPuffed', true);
            return api.MakeActionResult('completed', { action:'script', reason:'dustAnimationResultVerified' });
        },
        assertCaretakerArrival: function (api, step, previousResult) {
            if (!previousResult || previousResult.status !== 'completed' || previousResult.action !== 'characterMove' || previousResult.actorId !== 'caretaker') { return api.MakeActionResult('blocked', { action:'script', reason:'caretakerMoveResultMissing', continueCutscene:false }); }
            return api.MakeActionResult('completed', { action:'script', reason:'caretakerMoveResultVerified' });
        },
        assertCaretakerAtDoor: function (api, step, previousResult) {
            if (!previousResult || previousResult.status !== 'completed' || previousResult.action !== 'characterMove' || previousResult.actorId !== 'caretaker' || Math.abs(previousResult.x - 270) > 1 || Math.abs(previousResult.y - 114) > 1) { return api.MakeActionResult('blocked', { action:'script', reason:'caretakerDidNotReachDoor', continueCutscene:false }); }
            return api.MakeActionResult('completed', { action:'script', reason:'caretakerAtDoorVerified' });
        },
        assertCaretakerReturned: function (api, step, previousResult) {
            if (!previousResult || previousResult.status !== 'completed' || previousResult.action !== 'characterMove' || previousResult.actorId !== 'caretaker' || Math.abs(previousResult.x - 190) > 1 || Math.abs(previousResult.y - 116) > 1) { return api.MakeActionResult('blocked', { action:'script', reason:'caretakerReturnMissing', continueCutscene:false }); }
            return api.MakeActionResult('completed', { action:'script', reason:'caretakerReturnVerified' });
        },
        assertIntroCutsceneState: function (api) {
            if (!api.GetFlag('introDustPuffed')) { return api.MakeActionResult('blocked', { action:'script', reason:'dustCallbackMissing', continueCutscene:false }); }
            if (api.GetObjectVariable('door','introLockChecked',0) !== 1) { return api.MakeActionResult('blocked', { action:'script', reason:'doorLockCheckMissing', continueCutscene:false }); }
            return api.MakeActionResult('completed', { action:'script', reason:'introStateVerified' });
        },
        introDustMissingFailure: function (api) { return api.MakeActionResult('blocked', { action:'script', reason:'introDustDidNotComplete', continueCutscene:false }); },
        lookCoin: function (api) { api.Narrate('It is a small brass coin. Adventure game law says you should probably take it, now that you have won the preliminary contest of noticing it.'); },
        doorTemplateOpened: function (api) { api.SetFlag('doorOpen', true); },  
        doorTemplateClosed: function (api) { api.SetFlag('doorOpen', false); },
        completeTestGame: function (api) { api.EndGame('Test Complete', 'You have completed the test game, negotiated its tiny economy, opened the locked door, and walked through it. Somewhere, a test harness nods approvingly.'); },
        endThroughDoor: function (api) { api.RunHook('completeTestGame'); },
        mapTravelBlocked: function () { return false; },    
        doorCallbackResult: function (query, self, context) { var result=context.result||{}; if (result.status==='completed' && context.command && context.command.verbId==='walkTo') { return { status:'completed', reason:self.GetBool('open',false) ? 'openDoorApproachReached' : 'closedDoorApproachReached', reached:true, continueCutscene:true }; } return result; },
        tableCallbackResult: function (query, self, context) { var result=context.result||{}; if (result.status==='blocked') { return { status:'blocked', reason:query.GetFlag('bumpedTable') ? 'tableStillBlocked' : 'tableFirstBlocked', message:query.GetFlag('bumpedTable') ? 'The table remains stoutly in the way.' : 'The table blocks your route.', continueCutscene:false }; } return result; },
        bumpTable: function (api) { if (!api.GetFlag('bumpedTable')) { api.SetFlag('bumpedTable', true); api.Narrate('The table declines to move. Furniture has become more object-oriented lately.'); } },  
        lookTable: function (api) { if (api.GetFlag('coinTaken') && api.GetFlag('mapTaken')) { api.Narrate('A plain wooden table. The suspiciously convenient objects have gone, leaving only table and regret.'); } else if (api.GetFlag('coinTaken')) { api.Narrate('A plain wooden table. The suspiciously convenient coin has gone, but the map is still doing cartography nearby.'); } else if (api.GetFlag('mapTaken')) { api.Narrate('A plain wooden table. The map has gone, but the coin remains committed to being obvious.'); } else { api.Narrate('A plain wooden table. Somewhere on it, allegedly, are a coin and a map. This is what historians call interface design.'); } },
        lookCaretaker: function (api) { api.Narrate('The caretaker looks like the sort of person who exchanges coins for keys.'); },
        lookWoofer: function (api) { api.Narrate('Woofer is a small light grey dog who looks like a mop without a handle. He trots after you faithfully.'); },
        talkWoofer: function (api) { api.SetAnimation('woofer', 'tailWag'); api.Say('player', "There's a good boy", { onComplete: function () { api.PlaySound(['woof.mp3']); api.Say('woofer', 'Woof!', { onComplete: function () { api.ClearAnimation('woofer'); } }); } }); },
        openKey: function (api) { api.Narrate('The key has no moving parts to open.'); },
        closeKey: function (api) { api.Narrate('The key has no moving parts to close.'); },
        useCoinWithKey: function (api) { api.Narrate('The coin and the key decline to become a more complicated currency system.'); },
        talkCaretaker: function (api) { api.StartDialogue('caretakerTalk'); },
        caretakerLeavesAfterTrade: function (api) { api.MoveCharacter('caretaker', 332, 116, { speed: 42, hideOnComplete: true }); },
        giveCoinToCaretaker: function (api) { if (api.HasItem('coin')) { api.RemoveItem('coin'); api.AddItem('key'); api.Say('caretaker', 'A fair trade. Here is the key.', { onComplete: function () { api.MoveCharacter('caretaker', 332, 116, { speed: 42, hideOnComplete: true }); } }); } else { api.Say('caretaker', 'You appear to be short of coin.'); } }
    }
});
