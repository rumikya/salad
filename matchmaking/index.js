import { getPairings } from './salad100.js';
// this is the only file that the front-end should import from

/**
 * Get the current round's player list for the Salad 100 tournament.
 * @returns {Array<Types.Player>}
 */
export function getSalad100Round() {
    return getPairings();
}

/** Reroll the current round's pairings without changing the player list.
 * @returns {Array<Types.Match>}
 */
export function rerollSalad100Round() {
    return getPairings(true);
}
