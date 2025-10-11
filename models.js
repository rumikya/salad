import * as Types from './types.js';
/**
 * @enum {string}
 */
const RanksString = [ "rookie" , "iron" , "bronze" , "silver" , "gold" , "platinum" , "diamond" , "challenger" , "omega" , "pro_league" ]
/**
 * @enum {"Guardian"| "Forward"|"Flex"} Roles
 */
const Roles = [ "Guardian", "Forward", "Flex"]

/** @type {Array<Types.Player>} */
const playerCache = sessionStorage.getItem('playerCache') ? JSON.parse(sessionStorage.getItem('playerCache')) : [];

/**
 * 
 * @param {number} elo 
 * @returns {typeof RanksString[number]} 
 */
function eloToRank(elo) {
    if (elo >= 3000) {
        return "pro_league"
    }
        
    else if ( 2900 <= elo && elo < 3000 ) {
        return "omega"
    }
    else if ( 2600 <= elo && elo < 2900 ) {
        return "challenger"
    }
    else if ( 2300 <= elo && elo < 2600 ) {
        return "diamond"
    }
    else if ( 2000 <= elo && elo < 2300 ) {
        return "platinum"
    }
    else if ( 1700 <= elo && elo < 2000 ) {
        return "gold"
    }
    else if ( 1400 <= elo && elo < 1700 ) {
        return "silver"
    }
    else if ( 1100 <= elo && elo < 1400 ) {
        return "bronze"
    }
    else if ( elo < 1100 ) {
        return "rookie"
    }

    return "couille dans le potage"
}

/**
 * 
 * @param {string} role
 * @returns {Roles} 
 */
function databaseRoleToRole(role) {
    switch(role.toLowerCase()) {
        case "gardien":
        case "guardian":
            return "Guardian";
        case "attaquant":
        case "forward":
            return "Forward";
        case "flex":
        case "remplaçant":
            return "Flex";
    }
}

export function databaseRoleToSortIndex(role) {
        switch(role.toLowerCase()) {
        case "gardien":
        case "guardian":
            return 3;
        case "attaquant":
        case "forward":
            return 1;
        case "flex":
        case "remplaçant":
            return 2;
    }
}

export {Roles,RanksString,playerCache, eloToRank, databaseRoleToRole};
