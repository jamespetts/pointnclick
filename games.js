/* Direct-file fallback manifest. Keep this in sync with games.json. */
/* Game scripts normally live in <gameid>/<gameid>.js; assets remain under <gameid>/. */
'use strict';

PointClickEngine.RegisterManifest({
    comment: 'Script manifest fallback for direct file opening.',
    games: [
        { id: 'testgame', title: 'Test Game: The Locked Door', script: 'testgame/testgame.js', assetPath: 'testgame/', engineApi: 1 }
    ]
});
