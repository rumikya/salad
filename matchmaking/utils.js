import * as Types from "../types.js";
/**
 *
 * @param {Types.Team} team
 * @returns {number}
 */
export function getTeamElo(team) {
  return (
    team.players.reduce((acc, player) => acc + player.rank, 0) /
    team.players.length
  );
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
  const activePlayers = players.filter((p) => p.isActive);
  console.log(`Active players: ${activePlayers.length}`, activePlayers);

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

  console.log(`Generated ${teams.length} possible teams`);

  const goalieCount = activePlayers.filter((x) => x.role === "Guardian").length;
  const forwardCount = activePlayers.filter((x) => x.role === "Forward").length;
  const teamCount = Math.floor(activePlayers.length / 3);

  const tooManyGoalies = goalieCount > teamCount;
  const tooManyForwards = forwardCount > teamCount * 2;

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

  // Case where we have enough goalies and forwards
  // We want to limit to 1 goalie and 2 forwards per team. The rest are flex.
  return teams.filter(
    (team) =>
      team.players.filter((p) => p.role === "Guardian").length <= 1 &&
      team.players.filter((p) => p.role === "Forward").length <= 2
  );
}
