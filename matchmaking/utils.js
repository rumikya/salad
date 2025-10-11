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
    
    // Filter to only active players
    const activePlayers = players.filter(p => p.isActive);
    console.log(`Active players: ${activePlayers.length}`, activePlayers)
    
    const teams = [];
    for (let i = 0; i < activePlayers.length - 2; i++) {
        for (let j = i + 1; j < activePlayers.length - 1; j++) {
            for (let k = j + 1; k < activePlayers.length; k++) {
                teams.push({
                    players:[ {...activePlayers[i]}, {...activePlayers[j]}, {...activePlayers[k]} ],
                    name: ""
                })
            }
        }
    }
    
    console.log(`Generated ${teams.length} possible teams`)

    const goalieCount = activePlayers.filter(x => x.role === "Guardian").length
    const flexCount = goalieCount + activePlayers.filter(x => x.role === "Flex").length;
    const teamCount = Math.floor(activePlayers.length / 3);
    const notEnoughGoalie = (goalieCount + flexCount) < teamCount;


    // Filter teams: max 1 goalie, at least 1 flex or goalie
    const filteredTeams = goalieCount >= teamCount ? teams.filter(team => {
        const teamGoalieCount = team.players.filter(x => x.role === "Guardian").length;
        return (goalieCount == teamCount) ? teamGoalieCount === 1  : teamGoalieCount >= 1;
    }) : teams.filter(team => {
        const teamGoalieCount = team.players.filter(x => x.role === "Guardian").length;
        return teamGoalieCount <= 1 || (notEnoughGoalie && teamGoalieCount < 2);
    });
    return filteredTeams;
}