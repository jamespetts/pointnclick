/*
    Test Game: The Locked Door

    This file is narrative/content logic only. It must not create a second
    renderer, inventory, player, movement system, interaction system, dialogue
    system, or main loop. Use only PointClickEngine.API for state changes.
*/
'use strict';

PointClickEngine.RegisterGame({
    id: 'testgame', title: 'Test Game: The Locked Door', author: 'James E. Petts', titleBackground: 'rooms/intro_testgame_recursive_90s_v1.png', titleMusic: ['music/intro.mp3'], endBackground: 'rooms/end_screen_v1.png', endMusic: ['music/outtro.mp3'], engineApi: 1, startRoomId: 'testRoom', rendering: { imageSmoothing: false },
    ui: { verbInventoryBackground: 'ui/ui_verb_inventory_mundane_v2.png', panelColor: '#101018', panelTopLineColor: '#9b8b61', verbColor: '#eadfb8', verbSelectedColor: '#fff2a0', verbShadowColor: '#150d06', verbSelectedBackColor: 'rgba(72,56,22,0.72)', verbSelectedUnderlineColor: 'rgba(210,168,75,0.70)', dynamicLineHeight: 9, textColor: '#f3ead0', textShadowColor: '#000000', narrationTextColor: '#f3ead0', dialogueTextColor: '#f3ead0', playerDialogueColor: '#f4f0cf', choiceTextColor: '#f3ead0', commandTextColor: '#b6ff9a', hoverTextColor: '#ffe377', inventorySelectedBackColor: '#5e5022' },
    player: { id: 'player', roomId: 'testRoom', x: 70, y: 118, facing: 'down', animation: 'idleDown', visible: true, controllable: true, speed: 48, walkTarget: null, walkPath: [], walkCallback: null, spriteId: 'player', scale: 1 },
    sprites: { player: { image: 'characters/player_animations_bespoke_blink_idle_v2_20260617.png', frameW: 16, frameH: 32, frames: 4, rows: 12, directional: true, animations: { idle: { rowOffset: 0, frames: 4, fps: 2 }, walk: { rowOffset: 4, frames: 4, fps: 12 }, talk: { rowOffset: 8, frames: 4, fps: 6 } } }, caretaker: { image: 'characters/npc_animations_cartoon90s_v2.png', frameW: 16, frameH: 32, frames: 2, rows: 8, directional: true, walkFps: 4, idleFps: 1, animations: { idle: { rowOffset: 0, frames: 1, fps: 1 }, walk: { rowOffset: 0, frames: 2, fps: 4 }, talk: { rowOffset: 4, frames: 2, fps: 6 } } }, woofer: { image: 'characters/woofer_animations_bespoke_idle_v2_20260617.png', frameW: 24, frameH: 16, frames: 2, rows: 12, directional: true, walkFps: 5, idleFps: 2, animations: { idle: { rowOffset: 0, frames: 2, fps: 2 }, walk: { rowOffset: 4, frames: 2, fps: 5 }, tailWag: { rowOffset: 8, frames: 2, fps: 8 } } } },
    characters: { player: { name: '', dialogueColor: '#f4f0cf' }, caretaker: { name: 'Caretaker', dialogueColor: '#b8e8ff' }, woofer: { name: 'Woofer', dialogueColor: '#ffd58a' } },
    items: {
        coin: { id: 'coin', name: 'coin', icon: 'objects/coin_inventory_cartoon90s_v2.png', worldSprite: 'objects/coin_table_cartoon90s_v2.png', defaultText: 'A small brass coin. It has seen a lot of pockets.', interactions: { 'use:key': 'useCoinWithKey' }, refusals: { open: 'It is a coin, not a tin.', close: 'It is already as closed as a coin can be.' } },
        key: { id: 'key', name: 'key', icon: 'objects/key.png', defaultText: 'A small brass key. It looks suitable for the door.', interactions: { open: 'openKey', close: 'closeKey', 'use:coin': 'useCoinWithKey' } }
    },
    defaultRefusals: { take: 'That is not something you can carry.', open: 'That does not open.', close: 'That does not close.', give: 'That is not a promising recipient.', talkTo: 'There is no reply.', use: 'That does not seem to work.' },
    rooms: {
        testRoom: {
            id: 'testRoom', name: 'Starting Room', background: 'rooms/testroom_start_room_object_door_v1.png', walkableArea: { x: 8, y: 86, w: 304, h: 48 }, characterScale: { farY: 86, nearY: 134, farScale: 0.84, nearScale: 1.12 }, music: ['music/main_room.mp3'],
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
                { id: 'door', name: 'door', rect: { x: 250, y: 31, w: 45, h: 56 }, x: 248, y: 30, sprite: 'objects/door_opening_animation_v1.png', frameW: 48, frameH: 58, animation: 'closed', animations: { closed: { frame: 0, frames: 1 }, open: { frames: 4, fps: 5, loop: false } }, animationCompleteScripts: { open: 'doorOpenAnimationComplete' }, walkTo: { x: 270, y: 114 }, walkThrough: true, walkThroughTo: { x: 270, y: 86 }, defaultText: 'It is a sturdy wooden door.', interactions: { lookAt: 'lookDoor', walkTo: 'walkThroughDoor', open: 'openDoor', close: 'closeDoor', 'use:key': 'unlockDoor' } }
            ],
            characters: [
                { id: 'caretaker', name: 'caretaker', spriteId: 'caretaker', x: 190, y: 116, facing: 'down', scaleWithPerspective: false, rect: { x: 182, y: 84, w: 16, h: 32 }, hitW: 16, hitH: 32, walkTo: { x: 174, y: 116 }, defaultText: 'The caretaker waits patiently.', refusals: { open: "I'm not qualified to perform surgery" }, interactions: { lookAt: 'lookCaretaker', talkTo: 'talkCaretaker', 'give:coin': 'giveCoinToCaretaker' } },
                { id: 'woofer', name: 'Woofer', spriteId: 'woofer', x: 52, y: 118, facing: 'right', rect: { x: 40, y: 103, w: 24, h: 15 }, hitW: 24, hitH: 15, followPlayer: true, followOffsetX: -20, followOffsetY: 0, followStopDistance: 12, speed: 42, walkTo: { x: 64, y: 116 }, defaultText: 'Woofer is a small light grey dog who looks like a mop without a handle.', interactions: { lookAt: 'lookWoofer', talkTo: 'talkWoofer' } }
            ]
        },
        storeRoom: {
            id: 'storeRoom', name: 'Store Room', background: 'rooms/testroom_left_v1.png', walkableArea: { x: 8, y: 86, w: 304, h: 48 }, characterScale: { farY: 86, nearY: 134, farScale: 0.84, nearScale: 1.12 }, music: ['music/main_room.mp3'],
            walkGraph: {
                nodes: [
                    { id: 'leftFloor', x: 28, y: 112 },
                    { id: 'tableApproach', x: 72, y: 116 },
                    { id: 'coinApproach', x: 76, y: 112 },
                    { id: 'centreFloor', x: 154, y: 116 },
                    { id: 'rightFloor', x: 266, y: 116 },
                    { id: 'rightExit', x: 300, y: 112 }
                ],
                edges: [
                    ['leftFloor', 'tableApproach'],
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
                { id: 'coinHotspot', name: 'coin', itemId: 'coin', hitPriority: 10, rect: { x: 73, y: 77, w: 8, h: 5 }, x: 74, y: 78, walkTo: { x: 76, y: 112 }, hiddenFlag: 'coinTaken', defaultText: 'It is a small brass coin, assuming your mouse has the necessary qualifications.', interactions: { lookAt: 'lookCoin', take: 'takeCoin' } },
                { id: 'table', name: 'table', rect: { x: 40, y: 74, w: 70, h: 46 }, walkTo: { x: 72, y: 116 }, defaultText: 'A plain wooden table. It has survived worse engines than this one.', refusals: { take: "It's far too heavy" }, interactions: { lookAt: 'lookTable' } }
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
                            repeat: true
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
        lookCoin: function (api) { api.Narrate('It is a small brass coin. Adventure game law says you should probably take it, now that you have won the preliminary contest of noticing it.'); },
        takeCoin: function (api) { api.SetFlag('coinTaken', true); api.AddItem('coin'); api.Narrate('Taken.'); },
        lookDoor: function (api) { if (api.GetFlag('doorOpen')) { api.Narrate('The door is open. Beyond it lies the end of the test, which is unusually literal.'); } else if (api.GetFlag('doorOpening')) { api.Narrate('The door is opening with the measured confidence of a four-frame sprite.'); } else if (api.GetFlag('doorUnlocked')) { api.Narrate('The door is unlocked. It now awaits the rare and specialised operation known as opening.'); } else { api.Narrate('The door is locked. A small keyhole glints in the dim light.'); } },
        openDoor: function (api) { if (api.GetFlag('doorOpen')) { api.Narrate('The door is already open. The corridor is available for walking through.'); } else if (api.GetFlag('doorOpening')) { api.Narrate('The door is already opening. No need to supervise it.'); } else if (api.GetFlag('doorUnlocked')) { api.SetFlag('doorOpening', true); api.SetObjectAnimation('door', 'open', { holdFinal: true }); api.Narrate('The door creaks open.'); } else { api.Narrate('It will not open. The lock is making a persuasive argument.'); } },
        closeDoor: function (api) { if (api.GetFlag('doorOpening')) { api.Narrate('The door is in the middle of opening. Interrupting it now would only confuse the hinges.'); } else if (api.GetFlag('doorOpen')) { api.SetFlag('doorOpen', false); api.SetObjectAnimation('door', 'closed'); api.Narrate('The door closes with a modest wooden thunk.'); } else { api.Narrate('The door is already closed.'); } },
        doorOpenAnimationComplete: function (api) { api.SetFlag('doorOpening', false); api.SetFlag('doorOpen', true); api.SetObjectState('door', { hitDisabled: false }); },
        completeTestGame: function (api) { api.EndGame('Test Complete', 'You have completed the test game, negotiated its tiny economy, opened the locked door, and walked through it. Somewhere, a test harness nods approvingly.'); },
        endThroughDoor: function (api) { api.RunHook('completeTestGame'); },
        walkThroughDoor: function (api) { if (api.GetFlag('doorOpen')) { api.RunHook('completeTestGame'); } else { api.Narrate('The door is closed. Walking through it would be poor form, and probably sore.'); } },
        unlockDoor: function (api) { if (api.GetFlag('doorUnlocked')) { api.Narrate('The door is already unlocked. The key declines to repeat itself.'); } else if (api.HasItem('key')) { api.SetFlag('doorUnlocked', true); api.Narrate('The key turns with a satisfying click. The door is now unlocked.'); } else { api.Narrate('You do not have the right key.'); } },
        lookTable: function (api) { if (api.GetFlag('coinTaken')) { api.Narrate('A plain wooden table. The suspiciously convenient coin has gone, leaving only table and regret.'); } else { api.Narrate('A plain wooden table. Somewhere on it, allegedly, is a coin. This is what historians call interface design.'); } },
        lookCaretaker: function (api) { api.Narrate('The caretaker looks like the sort of person who exchanges coins for keys.'); },
        lookWoofer: function (api) { api.Narrate('Woofer is a small light grey dog who looks like a mop without a handle. He trots after you faithfully.'); },
        talkWoofer: function (api) { api.SetAnimation('woofer', 'tailWag'); api.Say('player', "There's a good boy", { onComplete: function () { api.PlaySound(['sounds/woof.mp3']); api.Say('woofer', 'Woof!', { onComplete: function () { api.ClearAnimation('woofer'); } }); } }); },
        openKey: function (api) { api.Narrate('The key has no moving parts to open.'); },
        closeKey: function (api) { api.Narrate('The key has no moving parts to close.'); },
        useCoinWithKey: function (api) { api.Narrate('The coin and the key decline to become a more complicated currency system.'); },
        talkCaretaker: function (api) { api.StartDialogue('caretakerTalk'); },
        caretakerLeavesAfterTrade: function (api) { api.MoveCharacter('caretaker', 332, 116, { speed: 42, hideOnComplete: true }); },
        giveCoinToCaretaker: function (api) { if (api.HasItem('coin')) { api.RemoveItem('coin'); api.AddItem('key'); api.Say('caretaker', 'A fair trade. Here is the key.', { onComplete: function () { api.MoveCharacter('caretaker', 332, 116, { speed: 42, hideOnComplete: true }); } }); } else { api.Say('caretaker', 'You appear to be short of coin.'); } }
    }
});
