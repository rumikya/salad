import * as Types from './types.js';
/**
 * @enum {string}
 */
const Ranks = [ "rookie" , "iron" , "bronze" , "silver" , "gold" , "platinum" , "diamond" , "challenger" , "omega" , "pro_league"]
/**
 * @enum {string}
 */
const Roles = [ "Guardian", "Forward", "Flex"]

/** @type {Array<Types.Player>} */
const playerCache = localStorage.getItem('playerCache') ? JSON.parse(localStorage.getItem('playerCache')) : [];


export {Roles,Ranks,playerCache};