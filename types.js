/**
 * @typedef {Object} Team
 * @property {string} name
 * @property {Player[]} players
 */

/**
 * @typedef {Object} Match
 * @property {Team} teamA
 * @property {Team} teamB
 */

/**
 * @typedef {import('./models.js').Roles} Roles
 */

/**
 * @typedef {Object} Player
 * @property {string}  name
 * @property {number}  rank
 * @property {Roles}   role
 * @property {boolean} isActive
*/

/**
 * @typedef {Object} PlayerHistory
 * @property {Player} player
 * @property {number} wins
 */


/**
 * @typedef {Object} MatchHistoryEntry
 * @property {Match} match
 * @property {Team} winningTeam
 */


/**
 * @typedef {MatchHistoryEntry[]} WinHistory
 */
export { };