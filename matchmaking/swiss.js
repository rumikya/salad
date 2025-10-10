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
    let allCombinations = matchPermutations(teams);

    // Only use up to the maximum number of rounds or available combinations
    const maxRounds = Math.min(rounds, allCombinations.length);

    for (let i = 0; i < maxRounds; i++) {
        const existingRounds = roundsArr.map(round =>
            round.map(match => [match.teamA.name, match.teamB.name].sort().join('-')).sort().join('|')
        );
        let nextRound = allCombinations.find(round => {
            const roundKey = round.map(match => [match.teamA.name, match.teamB.name].sort().join('-')).sort().join('|');
            return !existingRounds.includes(roundKey);
        });
        if (nextRound) {
            roundsArr.push(nextRound);
            allCombinations = allCombinations.filter(r => r !== nextRound);
        } else if (i < allCombinations.length) {
            roundsArr.push(allCombinations[i]);
        } else if (allCombinations.length > 0) {
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
export function matchPermutations(teams) {
    if (teams.length % 2 !== 0) {
        teams.push({ name: "BYE round", players: [] });
    }
    const matchesPerRound = teams.length / 2;
    const rounds = [];
    const teamIds = teams.map((_, i) => i);

    for (let round = 0; round < teams.length - 1; round++) {
        const roundMatches = [];
        for (let i = 0; i < matchesPerRound; i++) {
            const teamA = teams[teamIds[i]];
            const teamB = teams[teamIds[teams.length - 1 - i]];
            roundMatches.push({ teamA, teamB });
        }
        rounds.push(roundMatches);
        // Rotate teams except the first one
        teamIds.splice(1, 0, teamIds.pop());
    }
    return rounds;
}