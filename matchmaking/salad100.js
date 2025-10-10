import * as Types from '../types.js';
import { matchHistory } from '../caches.js';
import { getTeamElo, getAllUniqueTeams } from './utils.js';
import * as models from '../models.js';
/**
 * this should be set once per page load
 * @type {Array<Types.Team>}
 */
let teamsCache = [];


/**
 * return this round's pairings
 * @returns {Array<Types.Match>}
 */
export function getPairings(recall = false) {
    const matches = [];
    if (!recall)
        teamsCache = getAllUniqueTeams(models.playerCache);
    let remainingTeams = [...teamsCache];
    while (remainingTeams.length >= 2) {
        const match = getPairing(remainingTeams);
        
        if(!match.teamB) break;

        remainingTeams = remainingTeams.filter(remainingTeam => 
            !remainingTeam.players.some(remainingPlayer => 
                match.teamA.players.some(teamAPlayer => teamAPlayer.name === remainingPlayer.name) 
                || match.teamB.players.some(teamBPlayer => teamBPlayer.name === remainingPlayer.name)
            )
        );
        
        matches.push(match);
    }
    return matches;
}

/**
 * 
 * @param {Array<Types.Team>} availableTeams 
 * @returns {Types.Match}
 */
export function getPairing(availableTeams) {
    const randomIndex = Math.floor(Math.random() * availableTeams.length);
    const teamA = availableTeams.splice(randomIndex, 1)[0];
    let bestMatchIndex = -1;
    let bestMatchScore = Infinity;
    for (let i = 0; i < availableTeams.length; i++) {
        const teamB = availableTeams[i];
        // Ensure teamA and teamB are not the same team
        if (teamA.players.some((p, idx) => teamB.players.some(p2 => p2.name === p.name))) {
            continue;
        }
        const score = matchSimilarityScore(teamA.players, teamB.players) + Math.abs(getTeamElo(teamA) - getTeamElo(teamB));
        if (score < bestMatchScore) {
            bestMatchScore = score;
            bestMatchIndex = i;
        }
    }


    return { teamA, teamB: bestMatchIndex !== -1 ? availableTeams[bestMatchIndex] : null };
}



function matchSimilarityScore(teamA, teamB) {
    const similarityPenalty = 50;
    let score = 0;
    matchHistory.forEach(match => {
        const teamAIds = teamA.map(player => player.name);
        const teamBIds = teamB.map(player => player.name);
        const matchTeamAIds = match.teamA.players.map(player => player.name);
        const matchTeamBIds = match.teamB.players.map(player => player.name);
        const teamAMatchCount = teamAIds.filter(id => matchTeamAIds.includes(id)).length;
        const teamBMatchCount = teamBIds.filter(id => matchTeamBIds.includes(id)).length;
        if (teamAMatchCount > 0 && teamBMatchCount > 0) {
            score += (teamAMatchCount + teamBMatchCount) * similarityPenalty;
        }
    });
    return score;
}

