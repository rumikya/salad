import * as Types from '../types.js';
import { getTeamRank, getAllUniqueTeams } from './utils.js';
import { getTeamElo } from './utils.js';

/**
 * 
 * @param {Array<Types.Player>} players 
 * @returns {{selectedTeams: Array<Array<Types.Player>>, removedPlayers: Array<Types.Player>}} removedPlayers are players removed to make the total a multiple of 6
 */
export function generateTeams(players) {
    let { finalPlayers, removedPlayers } = removeExtraPlayers(players);
    const possibleTeams = getAllUniqueTeams(finalPlayers);
    const avgRank = finalPlayers.reduce((acc, player) => acc + player.rank, 0) / finalPlayers.length;
    const teamsWithProximity = possibleTeams.map(team => ({
        team,
        proximity: Math.abs(getTeamRank(team) - avgRank)
    }));
    teamsWithProximity.sort((a, b) => a.proximity - b.proximity);
    const selectedTeams = [];
    const usedPlayerIds = new Set();
    while (finalPlayers.length >= 3) {
        const nextTeam = teamsWithProximity.find(t => !t.team.some(p => usedPlayerIds.has(p.id)));
        if (!nextTeam) break;
        selectedTeams.push(nextTeam.team);
        nextTeam.team.forEach(p => usedPlayerIds.add(p.id));
        finalPlayers = finalPlayers.filter(p => !usedPlayerIds.has(p.id));
    }
    return {selectedTeams, removedPlayers};
}

/**
 * @param {Array<Types.Player>} players 
 * @return {{finalPlayers: Array<Types.Player>, removedPlayers: Array<Types.Player>}}
 */
export function removeExtraPlayers(players) {
    const finalPlayers = [...players];
    /** @type {Array<Types.Player>} */
    const removedPlayers = [];
    if (players.length % 6 !== 0) {
        const indicesToRemove = [];
        for (let i = 0; i < players.length % 3; i++) {
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

/**
 * 
 * @param {Array<Types.Team>} teams 
 * @returns {Array<Array<Types.Match>>} rounds of matches
 */
export function generateMatches(teams, rounds = 4) {
    const allRounds = [];
    /**
     * @type {Array<{team:Types.Team, matchesAgainst: Array<Types.Team|null>}>}
     */
    const teamEntries = teams.map(team => ({team, matchesAgainst: []}));
    for (let round = 0; round < rounds; round++) {
        const matches = [];
        const availableTeams = [...teamEntries];
        while (availableTeams.length >= 2) {
            const match = getMatch(availableTeams);
            if (!match) break;
            matches.push(match);
            availableTeams.splice(availableTeams.indexOf(match.teamAEntry), 1);
            availableTeams.splice(availableTeams.indexOf(match.teamBEntry), 1);
        }
        allRounds.push(matches.map(m => ({teamA: m.teamAEntry.team, teamB: m.teamBEntry.team})));
    }
    return allRounds;
}

function getMatch(availableTeams) {
    /**
     * @type {{teamAEntry: {team:Types.Team, matchesAgainst: Array<Types.Team|null>}, teamBEntry: {team:Types.Team, matchesAgainst: Array<Types.Team|null>}} | null}
     */
    let bestPair = null;
    let bestScore = -Infinity;
    for (let i = 0; i < availableTeams.length - 1; i++) {
        for (let j = i + 1; j < availableTeams.length; j++) {
            const teamAEntry = availableTeams[i];
            const teamBEntry = availableTeams[j];
            if (teamAEntry.matchesAgainst.includes(teamBEntry.team) || teamBEntry.matchesAgainst.includes(teamAEntry.team)) {
                continue;
            }
            const eloA = getTeamElo(teamAEntry.team);
            const eloB = getTeamElo(teamBEntry.team);
            const score = -(Math.abs(eloA - eloB)); // Prefer matches with closer Elo
            if (score > bestScore) {
                bestScore = score;
                bestPair = {teamAEntry, teamBEntry};
            }
        }
    }
    if (bestPair) {
        bestPair.teamAEntry.matchesAgainst.push(bestPair.teamBEntry.team);
        bestPair.teamBEntry.matchesAgainst.push(bestPair.teamAEntry.team);
        return bestPair;
    }
    return null;
}