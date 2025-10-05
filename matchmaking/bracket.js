import * as Types from '../types.js';
import { getTeamRank, getAllUniqueTeams } from './utils.js';

/**
 * 
 * @param {Array<Types.Player>} players 
 * @return {Array<Array<Types.Team>>}
 */
export function generateTeams(players) {
    const { finalPlayers, removedPlayers } = removeExtraPlayers(players);
    const possibleTeams = getAllUniqueTeams(finalPlayers);
    const avgRank = finalPlayers.reduce((acc, player) => acc + player.rank, 0) / finalPlayers.length;
    const teamsWithProximity = possibleTeams.map(team => ({
        team,
        proximity: Math.abs(getTeamRank(team) - avgRank)
    }));
    teamsWithProximity.sort((a, b) => a.proximity - b.proximity);
    return teamsWithProximity.map(item => item.team);
}

/**
 * TODO: see behavior with Dark Fa?
 * @param {Array<Types.Player>} players 
 * @return {{finalPlayers: Array<Types.Player>, removedPlayers: Array<Types.Player>}}
 */
export function removeExtraPlayers(players) {
    const finalPlayers = [...players];
    /** @type {Array<Types.Player>} */
    const removedPlayers = [];
    if (players.length % 6 !== 0) {
        const indicesToRemove = [];
        for (let i = 0; i < players.length % 6; i++) {
            let index;
            do {
                index = Math.floor(Math.random() * finalPlayers.length);
            } while (indicesToRemove.includes(index));
            indicesToRemove.push(index);
        }
        removedPlayers = indicesToRemove.map(index => finalPlayers[index]);
        finalPlayers = finalPlayers.filter((_, index) => !indicesToRemove.includes(index));
    }
    return { finalPlayers, removedPlayers };
}