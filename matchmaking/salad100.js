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
   * @type {Set<string>}
   */
  let usedPlayers = new Set();
  const elo_threshold = calculateEloThreshold(
    average_elo,
    std_dev_elo,
    models.playerCache.length
  ); // Adjust this multiplier to make matchmaking stricter or more lenient
  let remainingTeams = teamsCache[0];
  const rerollLimit = 100; // Limit to prevent infinite loops
  let rerollCount = 0;
  let rerollDepth = 0;
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
      if (matches.length > rerollDepth) {
        for (let i = 0; i < rerollDepth; i++) {

          /** @type {Types.Match} */
          // @ts-ignore
          const lastMatch = matches.pop();
          remainingTeams = teamsCache[matches.length];
          lastMatch.teamA.players.forEach((p) => usedPlayers.delete(p.name));
          lastMatch.teamB.players.forEach((p) => usedPlayers.delete(p.name));
        }
        rerollDepth++;
        console.info(
          "Added teams back! " + remainingTeams.length + " " + usedPlayers.size
        );
      } else {
        remainingTeams = teamsCache[0];
        usedPlayers.clear();
        matches.length = 0;
        rerollDepth = 0;
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
 * @param {number} average_elo
 * @param {number} std_dev_elo
 * @param {number} elo_threshold
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
    const similarity = matchSimilarityScore(teamA.players, teamB.players);
    const score = similarity + eloDifference;
    
    if (score < bestMatchScore) {
      bestMatchScore = score;
      bestMatchIndex = i;
    }
    if(score === 0) break; // Perfect match found
  }
  if (bestMatchIndex === -1) return undefined;
  return { teamA, teamB: availableTeams[bestMatchIndex] };
}

/**
 * @param {Array<Types.Player>} teamA
 * @param {Array<Types.Player>} teamB
 * @returns {number}
 */
function matchSimilarityScore(teamA, teamB) {
  const similarityPenalty = 15;
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

/**
 * @param {number} averageElo
 * @param {number} stdDevElo
 * @param {number} playerCount
 * @returns {number}
 */
function calculateEloThreshold(averageElo, stdDevElo, playerCount) {
  const baseThreshold = stdDevElo * 0.5; // Adjust multiplier as needed
  const adjustmentFactor = Math.max(1 + (15 - playerCount) / 20, 0.10);
  console.log(
    `Elo Threshold: ${baseThreshold} * ${adjustmentFactor} = ${
      baseThreshold * adjustmentFactor
    }`
  );
  return baseThreshold * adjustmentFactor;
}
