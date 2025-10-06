import { playerCache } from "../../models.js";
import * as matchmaking from "../../matchmaking/index.js";


const teamNames = [
    "FrostFire",
    "Ember Monarchs",
    "Maelstrom",
    "SSR",
    "Byte Breakers",
    "Clarion Corp",
    "Demon Drive",
    "AimiTank"
]

function convertTeams(players) {
    const teams = players.map((team, index) => ({
        name: index >= teamNames.length ? teamNames.at(-1) + " " + index : teamNames[index],
        players: team
    }));
    return teams;
}

function getTeamIndex(team) {
    const index = teamNames.indexOf(team.name);
    if(index == -1) {
        return parseInt(team.name.split(" ").at(-1));
    }
    return index;
}

/**
 * @type {{selectedTeams: Array<Array<import("../../types.js").Player>>, removedPlayers: Array<import("../../types.js").Player>}}
 */
let teams = [];
/**
 * @type {import("../../types.js").Match[][]}
 */
let matches = [];
const firstFuncToCall = {
    "swiss": () => {
        teams = matchmaking.generateSwissTeams();
        matches = matchmaking.generateSwissMatches(convertTeams(teams));
        return matches.pop();
    },
    "salad100": matchmaking.getSalad100Round
}

const nextMatches = {
    "swiss": () => {
        return matches.pop()
    },
    "salad100": matchmaking.getSalad100Round
}

const regenTeams = {
    "swiss": () => {
        teams = matchmaking.generateSwissTeams();
        matchmaking.generateSwissMatches(convertTeams(teams));
    },
    "salad100": matchmaking.rerollSalad100Round
}

const players = playerCache;
/**
 * @type {Array<import("../../types.js").Team>}
 */
let playerTeams = [];
document.addEventListener('DOMContentLoaded', () => {
    const backgroundChoices = Array.from({length: 7}, (_, i) => `bg${i + 1}.png`);
    background.src = `assets/images/backgrounds/${backgroundChoices[Math.floor(Math.random() * backgroundChoices.length)]}`;

    /**
     * @type {'swiss' | 'salad100'}
     */
    const gameMode = sessionStorage.getItem('gameMode') || "swiss";
    const matches = firstFuncToCall[gameMode]();
    playerTeams = matches.flatMap(m => [m.teamA, m.teamB]).sort((a, b) => {
        return getTeamIndex(a) - getTeamIndex(b);
    });

    playerTeams.forEach((team) => {
        // remove all children from team_list
        team_list.innerHTML = '';
        createTeam(team);
    });
});


/**
 * 
 * @param {import("../../types.js").Team} team 
 */
function createTeam(team) {
    /**
     * @type {DocumentFragment}
     */
    const teamCopy = document.importNode(team_template.content, true);
    const teamEntry = teamCopy.firstElementChild;

    let index = getTeamIndex(team);
    if(index >= teamNames.length) {
        index = teamNames.length - 1;
    }


    teamEntry.querySelector('.team_background').src = `assets/images/teams/team${index}.png`;

    team_list.appendChild(teamEntry);
}

