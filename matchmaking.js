import * as models from 'models.js';
import * as Types from './types.js';

/**
 * @type {Array<Array<Types.Game>>}
 */
const gamesCache = localStorage.getItem('gamesCache')? JSON.parse(localStorage.getItem('gamesCache')) : [];
gamesCache.forEach(games => {
    games.forEach(game => {
        teamA.players
    })
});

/**
 * @type {Array<Types.Game>|null}
 */
let currentGames = localStorage.getItem('currentGames')? JSON.parse(localStorage.getItem('currentGames')) : null;

export function reroll() {
    currentGames = gamesCache[Math.floor(Math.random() * gamesCache.length)];
}

/**
 * 
 * @param {Array<Types.Player>} players 
 */
export function setPlayers(players) {
    const games = [];
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            games.push(new models.Game(players[i], players[j]));
        }
    }
    gamesCache.push(games);
    if (!currentGames) {
        reroll();
    }
}

/**
 * 
 * @param {Array<Types.Player} players 
 */
function getAllMatches(players) {
    
}