import { playerCache, eloToRank } from "../../models.js";
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
        name: index >= teamNames.length ? teamNames.at(-1) + " " + (index) : teamNames[index],
        players: team.players
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
        console.log(teams)
        matches = matchmaking.generateSwissMatches(convertTeams(teams.selectedTeams));
        console.log(matches)
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

    console.log(matches)
    console.log(playerTeams)
    team_list.innerHTML = '';

    playerTeams.forEach((team) => {
        // remove all children from team_list
        createTeam(team);
    });
});


/**
 * 
 * @param {import("../../types.js").Team} team 
 */
function createTeam(team) {
    const teamTemplate = document.getElementById("team_template");
    /**
     * @type {DocumentFragment}
     */

    const teamCopy = document.importNode(teamTemplate.content, true);
    const teamEntry = teamCopy.firstElementChild;

    let index = getTeamIndex(team);
    teamEntry.querySelector('.team_number').innerHTML = `${index}`
    if(index >= teamNames.length) {
        index = teamNames.length - 1;
    }
    const averageElo = team.players.reduce((acc, player) => acc + player.rank, 0) / 3;

    teamEntry.querySelector('.team_background').src = `assets/images/teams/team${index+1}.png`;
    teamEntry.querySelector('.team_name_name').innerHTML = `${team.name}`
    teamEntry.querySelector('.average_rank').innerHTML = `${Math.floor(averageElo)}`
    teamEntry.querySelector('.average_rank_icon').src = 'assets/images/ranks/' + eloToRank(averageElo) + '.png'


    teamEntry.querySelectorAll('.player_entry').forEach((entry, index) => {
        entry.querySelector('.player_name').innerHTML = team.players[index].name
        entry.querySelector('.player_rank').src = 'assets/images/ranks/' + eloToRank(team.players[index].rank) + '.png' 

    })

    team_list.appendChild(teamEntry);
}

