import * as models from 'models.js';
import * as Types from './types.js';

/**
 * @type {Array<Types.Match>}
 */
export const matchHistory = sessionStorage.getItem('matchHistory') ? JSON.parse(sessionStorage.getItem('matchHistory')) : [];

/**
 * @type {Types.WinHistory}
 */
export const winHistory = sessionStorage.getItem('winHistory') ? JSON.parse(sessionStorage.getItem('winHistory')) : [];

/**
 * call this when "randomizer" button is clicked
 * @param {Array<Types.Player>} players
 * @param {"salad100" | "swiss"} mode 
 */
export function setPlayers(players, mode) {
    const playerCache = models.playerCache;
    if (mode === "salad100") {
        const mergedPlayers = players.map(player => {
            const cached = playerCache.find(p => p.id === player.id);
            // Set every cached player not in players as inactive
            playerCache.forEach(cachedPlayer => {
                if (!players.some(player => player.id === cachedPlayer.id)) {
                    cachedPlayer.inactive = true;
                }
            });
            return { ...players, ...(cached || {}) };
        });
        sessionStorage.setItem('playerCache', JSON.stringify(mergedPlayers));
        return;
    }
    sessionStorage.setItem('playerCache', JSON.stringify(players));

}

/**
 * 
 * @param {Types.Match} match 
 * @param {Types.Team} winningTeam 
 */
export function setWinner(match, winningTeam) {
    const winEntry = {
        match,
        winningTeam
    };
    winHistory.push(winEntry);
    sessionStorage.setItem('winHistory', JSON.stringify(winHistory));
}

/**
 * 
 * @returns {Types.Player[]}
 */
export function getWinningPlayers() {
    /**
     * @type {{player:Types.Player, wins: number}[]}
     */
    const players = [];
    /**
     * @param {Types.Player} player
     */
    function addWin(player) {
        let playerEntry = players.find(val => val.player.name == player.name);
        if (!playerEntry) {
            const idx = players.push({ player, wins: 0 })
            playerEntry = players[idx-1]
        }
        playerEntry.wins++;
    }

    winHistory.forEach((win) => {
        win.winner.players.forEach(addWin)
    })
    players.sort((a,b)=>a.wins-b.wins);
    let maxWin = players[0];
    return players.filter(player => player.wins == maxWin)
}