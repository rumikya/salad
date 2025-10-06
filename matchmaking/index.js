import { getPairings } from './salad100.js';
import { generateTeams, generateMatches } from './swiss.js';
import * as Types from "../types.js"
import * as models from "../models.js";
// this is the only file that the front-end should import from

/**
 * Get the current round's player list for the Salad 100 tournament.
 * @returns {Array<Types.Match>}
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

export function generateSwissTeams() {
    return generateTeams(models.playerCache);
}
export function generateSwissMatches(teams) {
    return generateMatches(teams);
}