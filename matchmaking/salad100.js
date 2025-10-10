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
        remainingTeams = remainingTeams.filter(team => 
            team.players.some(p=> match.teamA.players.some(pa => pa.id === p.id)) === false && (match.teamB ? team.players.some(p=> match.teamB.some(pa => pa.id === p.id)) === false : true));
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
        if (teamA.players.some((p, idx) => teamB.players[idx] && p.id === teamB.players[idx].id)) {
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
        const teamAIds = teamA.map(player => player.id);
        const teamBIds = teamB.map(player => player.id);
        const matchTeamAIds = match.teamA.players.map(player => player.id);
        const matchTeamBIds = match.teamB.players.map(player => player.id);
        const teamAMatchCount = teamAIds.filter(id => matchTeamAIds.includes(id)).length;
        const teamBMatchCount = teamBIds.filter(id => matchTeamBIds.includes(id)).length;
        if (teamAMatchCount > 0 && teamBMatchCount > 0) {
            score += (teamAMatchCount + teamBMatchCount) * similarityPenalty;
        }
    });
    return score;
}

