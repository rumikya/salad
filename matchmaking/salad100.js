import * as Types from "../types.js";
import { matchHistory } from "../caches.js";
import { getTeamElo, getAllUniqueTeams, keepValidTeams } from "./utils.js";
import * as models from "../models.js";
/**
 * this should be set once per page load
 * @type {Array<Array<Types.Team>>}
 */
let teamsCache = [];

/**
 * return this round's pairings
 * @returns {Array<Types.Match>}
 */
export function getPairings(recall = false) {
  const matches = [];
  if (!recall) teamsCache = [getAllUniqueTeams(models.playerCache)];
  const average_elo =
    models.playerCache
      .filter((p) => p.isActive)
      .map((p) => p.rank)
      .reduce((acc, value) => acc + value, 0) /
    models.playerCache.filter((p) => p.isActive).length;
  const std_dev_elo = Math.sqrt(
    models.playerCache
      .filter((p) => p.isActive)
      .map((p) => p.rank)
      .reduce((acc, value) => acc + Math.pow(value - average_elo, 2), 0) /
      models.playerCache.filter((p) => p.isActive).length
  );
  /**
   * @type {Set<Types.Player>}
   */
  let usedPlayers = new Set();
  const elo_threshold = std_dev_elo * 0.25; // Adjust this multiplier to make matchmaking stricter or more lenient
  let remainingTeams = teamsCache[0];
  console.log(remainingTeams.length);
  console.log(
    `Average Elo: ${average_elo}, Std Dev: ${std_dev_elo}, Elo Threshold: ${elo_threshold}`
  );
  const rerollLimit = 100; // Limit to prevent infinite loops
  let rerollCount = 0;
  while (remainingTeams.length >= 2) {
    const match = getPairing(
      [...remainingTeams],
      average_elo,
      std_dev_elo,
      elo_threshold
    );

    if (!match) {
      console.info("Rerolling!");
      if (rerollCount >= rerollLimit) {
        console.warn("Reroll limit reached, stopping matchmaking.");
        break;
      }
      if (matches.length > 0) {
        const lastMatch = matches.pop();
        remainingTeams = teamsCache[matches.length];
        lastMatch.teamA.players.forEach((p) => usedPlayers.delete(p.name));
        lastMatch.teamB.players.forEach((p) => usedPlayers.delete(p.name));
        console.info(
          "Added teams back! " + remainingTeams.length + " " + usedPlayers.size
        );
      } else {
        rerollCount++;
        console.info(`Reroll count ${rerollCount}`);
      }
      continue;
    }

    match.teamA.players.forEach((p) => usedPlayers.add(p.name));
    match.teamB.players.forEach((p) => usedPlayers.add(p.name));
    remainingTeams = remainingTeams.filter((team) => {
      return team.players.every((p) => !usedPlayers.has(p.name));
    });

    console.log(remainingTeams.length);
    remainingTeams = keepValidTeams(remainingTeams);
    matches.push(match);
    teamsCache[matches.length] = remainingTeams;
  }
  return matches;
}

/**
 *
 * @param {Array<Types.Team>} availableTeams
 * @returns {Types.Match | undefined}
 */
export function getPairing(
  availableTeams,
  average_elo,
  std_dev_elo,
  elo_threshold
) {
  const randomIndex = Math.floor(Math.random() * availableTeams.length);
  const teamA = availableTeams[randomIndex];
  let bestMatchIndex = -1;
  let bestMatchScore = Infinity;
  availableTeams = keepValidTeams(
    availableTeams.filter(
      (t) =>
        !t.players.some((p) => teamA.players.some((p2) => p2.name === p.name))
    )
  );
  if (availableTeams.length === 0) return undefined;
  for (let i = 0; i < availableTeams.length; i++) {
    const teamB = availableTeams[i];
    const eloDifference = Math.abs(getTeamElo(teamA) - getTeamElo(teamB));
    if (eloDifference > elo_threshold) {
      continue; // Skip this teamB as the Elo difference is too high
    }
    const score =
      matchSimilarityScore(teamA.players, teamB.players) + eloDifference;
    if (score < bestMatchScore) {
      bestMatchScore = score;
      bestMatchIndex = i;
    }
  }
  if (bestMatchIndex === -1) return undefined;
  return { teamA, teamB: availableTeams[bestMatchIndex] };
}

// /**
//  *
//  * @param {Array<Types.Team>} availableTeams
//  * @returns {Types.Match}
//  */
// export function getPairing(availableTeams) {
//     const randomIndex = Math.floor(Math.random() * availableTeams.length);
//     const teamA = availableTeams.splice(randomIndex, 1)[0];
//     let bestMatchIndex = -1;
//     let bestMatchScore = Infinity;
//     for (let i = 0; i < availableTeams.length; i++) {
//         const teamB = availableTeams[i];
//         // Ensure teamA and teamB are not the same team
//         if (teamA.players.some((p, idx) => teamB.players.some(p2 => p2.name === p.name))) {
//             continue;
//         }
//         const score = matchSimilarityScore(teamA.players, teamB.players) + Math.abs(getTeamElo(teamA) - getTeamElo(teamB));
//         if (score < bestMatchScore) {
//             bestMatchScore = score;
//             bestMatchIndex = i;
//         }
//     }

//     return { teamA, teamB: bestMatchIndex !== -1 ? availableTeams[bestMatchIndex] : null };
// }

function matchSimilarityScore(teamA, teamB) {
  const similarityPenalty = 0;
  let score = 0;
  matchHistory.forEach((match) => {
    const teamAIds = teamA.map((player) => player.name);
    const teamBIds = teamB.map((player) => player.name);
    const matchTeamAIds = match.teamA.players.map((player) => player.name);
    const matchTeamBIds = match.teamB.players.map((player) => player.name);
    const teamAMatchCount = teamAIds.filter((id) =>
      matchTeamAIds.includes(id)
    ).length;
    const teamBMatchCount = teamBIds.filter((id) =>
      matchTeamBIds.includes(id)
    ).length;
    if (teamAMatchCount > 0 && teamBMatchCount > 0) {
      score += (teamAMatchCount + teamBMatchCount) * similarityPenalty;
    }
  });
  return score;
}
