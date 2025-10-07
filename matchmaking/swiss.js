import * as Types from '../types.js';
import { getAllUniqueTeams } from './utils.js';
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
        proximity: Math.abs(getTeamElo(team) - avgRank)
    }));
    teamsWithProximity.sort((a, b) => a.proximity - b.proximity);
    const selectedTeams = [];
    const usedPlayerIds = new Set();
    while (finalPlayers.length >= 3) {
        const nextTeam = teamsWithProximity.find(t => !t.team.players.some(p => usedPlayerIds.has(p.name)));
        if (!nextTeam) break;
        selectedTeams.push(nextTeam.team);
        nextTeam.team.players.forEach(p => usedPlayerIds.add(p.name));
        finalPlayers = finalPlayers.filter(p => !usedPlayerIds.has(p.name));
    }
    return { selectedTeams, removedPlayers };
}

/**
 * @param {Array<Types.Player>} players 
 * @return {{finalPlayers: Array<Types.Player>, removedPlayers: Array<Types.Player>}}
 */
export function removeExtraPlayers(players) {

    let finalPlayers = [...players];
    /** @type {Array<Types.Player>} */
    let removedPlayers = [];
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
    const roundsArr = [];
    let allCombinations = matchCombinations(teams);
    for (let i = 0; i < rounds; i++) {
        if (i < allCombinations.length) {
            roundsArr.push(allCombinations[i]);
        }
        else {
            const idx = Math.floor(Math.random() * allCombinations.length);
            const randomRound = allCombinations[idx];
            roundsArr.push(randomRound);
            allCombinations.splice(idx, 1);
        }
    }
    return roundsArr;
}

/**
 * @param {Array<Types.Team>} teams
 * @returns {Array<Array<Types.Match>>} rounds of matches
 */
export function matchCombinations(teams) {
    const rounds = [];
    const totalTeams = teams.length;
    const totalRounds = totalTeams - 1; // Each team plays every other team once
    for (let round = 0; round < totalRounds; round++) {
        const matches = [];
        const usedTeams = new Set();
        for (let i = 0; i < totalTeams; i++) {
            const teamA = teams[i];
            if (usedTeams.has(teamA)) continue;
            let teamB = null;
            for (let j = 0; j < totalTeams; j++) {
                if (i === j) continue; // Skip same team
                const candidate = teams[j];
                if (
                    !usedTeams.has(candidate)
                    && !matches.some(
                        m => (m.teamA === teamA && m.teamB === candidate)
                        || (m.teamA === candidate && m.teamB === teamA)
                    )
                ) {
                    teamB = candidate;
                    break;
                }
            }
            if (teamB) {
                matches.push({ teamA, teamB });
                usedTeams.add(teamA);
                usedTeams.add(teamB);
            }
        }
        rounds.push(matches);
    }
    return rounds;
}