import * as Types from '../types.js';
/**
 * 
 * @param {Types.Team} team 
 * @returns {number}
 */
export function getTeamElo(team) {
    return team.reduce((acc, player) => acc + player.rank, 0) / team.length;
}

/**
 * @param {Array<Types.Player} players 
 * @returns {Array<Types.Team>}
 */
export function getAllUniqueTeams(players) {
    /**
     * @type {Array<Types.Team>}
     */
    const teams = [];
    for (let i = 0; i < players.length - 2; i++) {
        for (let j = i + 1; j < players.length - 1; j++) {
            for (let k = j + 1; k < players.length; k++) {
                teams.push([players[i], players[j], players[k]]);
            }
        }
    }
    // Filter teams: max 1 goalie, at least 1 flex or goalie
    const filteredTeams = teams.filter(team => {
        const goalieCount = team.filter(player => player.role === 'goalie').length;
        const hasFlexOrGoalie = team.some(player => player.role === 'flex' || player.role === 'goalie');
        return goalieCount <= 1 && hasFlexOrGoalie;
    });
    return filteredTeams;
}