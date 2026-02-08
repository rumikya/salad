import { logger } from "../logger.js";
import * as Types from "../types.js";
/**
 *
 * @param {Types.Team} team
 * @returns {number}
 */
export function getTeamElo(team) {
  return team.players.reduce((acc, player) => acc + player.rank, 0);
}

/**
 * @param {Array<Types.Player>} players
 * @returns {Array<Types.Team>}
 */
export function getAllUniqueTeams(players) {
  // Filter to only active players
  const activePlayers = players.filter((p) => p.isActive);
  logger.log(`Active players: ${activePlayers.length}`, activePlayers);

  const teams = [];
  for (let i = 0; i < activePlayers.length - 2; i++) {
    for (let j = i + 1; j < activePlayers.length - 1; j++) {
      for (let k = j + 1; k < activePlayers.length; k++) {
        teams.push({
          players: [
            { ...activePlayers[i] },
            { ...activePlayers[j] },
            { ...activePlayers[k] },
          ],
          name: "",
        });
      }
    }
  }

  logger.log(`Generated ${teams.length} possible teams`);

  return keepValidTeams(teams, activePlayers);
}

/**
 * @param {Types.Team[]} teams
 * @param {Types.Player[] | undefined} players
 */
export function keepValidTeams(teams, players = undefined) {
  if (!players) players = extractPlayersFromTeams(teams);

  const goalieCount = players.filter((x) => x.role === "Guardian").length;
  const forwardCount = players.filter((x) => x.role === "Forward").length;
  const teamCount = Math.floor(players.length / 3);

  const tooManyGoalies = goalieCount > teamCount;
  const tooManyForwards = forwardCount > teamCount * 2;
  const rightTheAmountOfForwards = forwardCount === teamCount * 2;
  const rightTheAmountOfGoalies = goalieCount === teamCount;

  if (tooManyForwards) {
    // Teams have 2 or 3 forwards
    return teams.filter(
      (team) => team.players.filter((p) => p.role === "Forward").length >= 2
    );
  }

  if (tooManyGoalies) {
    // Teams have 1 or more goalies
    return teams.filter(
      (team) => team.players.filter((p) => p.role === "Guardian").length >= 1
    );
  }

  if (rightTheAmountOfForwards) {
    // Teams have exactly 2 forwards
    return teams.filter(
      (team) => team.players.filter((p) => p.role === "Forward").length === 2
    );
  }

  if (rightTheAmountOfGoalies) {
    // Teams have exactly 1 goalie
    return teams.filter(
      (team) => team.players.filter((p) => p.role === "Guardian").length === 1
    );
  }

  // Case where we have enough goalies and forwards
  // We want to limit to 1 goalie and 2 forwards per team. The rest are flex.
  return teams.filter(
    (team) =>
      team.players.filter((p) => p.role === "Guardian").length <= 1 &&
      team.players.filter((p) => p.role === "Forward").length <= 2
  );
}

/**
 * @param {Types.Team[]} teams
 */
export function extractPlayersFromTeams(teams) {
  /**
   * @type {Map<string,Types.Player>}
   */
  const playerSet = new Map();
  for (const team of teams) {
    for (const player of team.players) {
      playerSet.set(player.name, player);
    }
  }
  return [...playerSet.values()];
}
