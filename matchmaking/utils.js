import * as Types from '../types.js';
/**
 * 
 * @param {Types.Team} team 
 * @returns {number}
 */
export function getTeamElo(team) {
    return team.players.reduce((acc, player) => acc + player.rank, 0) / team.players.length;
}

/**
 * @param {Array<Types.Player>} players 
 * @returns {Array<Types.Team>}
 */
export function getAllUniqueTeams(players) {
    /**
     * @type {Array<Types.Team>}
     */

    console.log(players)
    const teams = [];
    for (let i = 0; i < players.length - 2; i++) {
        for (let j = i + 1; j < players.length - 1; j++) {
            for (let k = j + 1; k < players.length; k++) {
                teams.push({
                    players:[ {...players[i]}, {...players[j]}, {...players[k]} ],
                    name: ""
                })
            }
        }
    }

    console.log(teams)

    const goalieCount = players.filter(x => x.role === 'goalie' || x.role === "flex").length;
    const teamCount = Math.floor(players.length / 3);
    const notEnoughGoalie = goalieCount < teamCount;

    // Filter teams: max 1 goalie, at least 1 flex or goalie
    const filteredTeams = teams.filter(team => {
        const goalieCount = team.players.filter(player => player.role === 'goalie').length;
        const hasFlexOrGoalie = team.players.some(player => player.role === 'flex' || player.role === 'goalie');
        return goalieCount <= 1 || (notEnoughGoalie ? hasFlexOrGoalie : true);
    });
    return filteredTeams;
}