import { playerCache, eloToRank, databaseRoleToSortIndex } from "../../models.js";
import * as matchmaking from "../../matchmaking/index.js";
import { getWinningPlayers, resetWinHistory, setWinner } from "../../caches.js";


/**
 * @callback getScoreCallback
 * @returns {{match: import("../../types.js").Match, teamAScore: number, teamBScore: number}}
 */
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
/**
 * @type {getScoreCallback[]}
 */
const matchList = [];

let modalCloseCallback = function(){};

function convertTeams(players) {
    const teams = players.map((team, index) => ({
        name: index >= teamNames.length ? teamNames.at(-1) + " " + (index) : teamNames[index],
        players: team.players
    }));
    return teams;
}

function convertTeams100(teams) {
    const convertedTeams = convertTeams(teams);
    teams.forEach((v, k) => {
        v.name = convertedTeams[k].name;
    })
}

function getTeams100(teams) {
    convertTeams100(teams)
    return {
        selectedTeams: teams,
        get removedPlayers() {
            const players = teams.flatMap(x => x.players)
            console.log(players.length)
            const skipped = playerCache.filter(x => x.isActive && !players.some(player => player.name === x.name)); 
            return skipped
        }
    }
}

function getTeamIndex(team) {
    const index = teamNames.indexOf(team.name);
    if (index == -1) {
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
    "salad100": () => {
        const matches = matchmaking.getSalad100Round()
        teams = getTeams100(matches.flatMap((m) => [m.teamA, m.teamB]))
        return matches;
    }
}

const nextMatches = {
    "swiss": () => {
        return matches.pop()
    },
    "salad100": firstFuncToCall['salad100']
}

const regenTeams = {
    "swiss": () => {
        teams = matchmaking.generateSwissTeams();
        console.log(teams)
        matches = matchmaking.generateSwissMatches(convertTeams(teams.selectedTeams));
        return matches.pop();
    },
    "salad100": () => {
        const matches = matchmaking.rerollSalad100Round();
        teams = getTeams100(matches.flatMap((m) => [m.teamA, m.teamB]))
        return matches;
    }
}

const players = playerCache;

const playerList = players.filter(p => p.isActive);
player_count_value.textContent = playerList.length;
goalie_count_value.textContent = playerList.filter(x => x.role === "Guardian").length
flex_count_value.textContent = playerList.filter(x => x.role === "Flex").length
forward_count_value.textContent = playerList.filter(x => x.role === "Forward").length
average_elo.textContent = playerList.map(p => {
    return p.rank
}).reduce((acc, value) => acc + value, 0) / playerList.length
/**
 * @type {Array<import("../../types.js").Team>}
 */
let playerTeams = [];
document.addEventListener('DOMContentLoaded', () => {
    const backgroundChoices = Array.from({ length: 7 }, (_, i) => `bg${i + 1}.png`);
    background.src = `assets/images/backgrounds/${backgroundChoices[Math.floor(Math.random() * backgroundChoices.length)]}`;

    /**
     * @type {'swiss' | 'salad100'}
     */
    const gameMode = sessionStorage.getItem('gameMode') || "swiss";
    const matches = firstFuncToCall[gameMode]();

    init(matches)

    function init(matches) {
        playerTeams = matches.flatMap(m => [m.teamA, m.teamB]).sort((a, b) => {
            return getTeamIndex(a) - getTeamIndex(b);
        });

        team_list.innerHTML = '';
        match_list.innerHTML = '';
        playerTeams.forEach((team) => {
            if (team.name === "BYE round") return;
            createTeam(team);
        });
        if (matches.length == 0) {
            next_button.disabled = true;
        }
        if (teams.removedPlayers && teams.removedPlayers.length != 0) {
            createSkippedPlayersEntry(teams.removedPlayers);
        }
        matches.forEach(match => createMatch(match));
    }
    result_modal.addEventListener('click', function(event) {
        const rect = result_modal.getBoundingClientRect();
        const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            closeResultModal();
        }
    });

    next_button.addEventListener('click', () => {
        for (const matchFunc of matchList) {
            const { match, teamAScore, teamBScore } = matchFunc();
            setWinner(match, teamAScore > teamBScore ? match.teamA : match.teamB);
        }
        matchList.length = 0;
        team_list.innerHTML = '';
        match_list.innerHTML = '';
        const nextRoundMatches = nextMatches[gameMode]();
        if (!nextRoundMatches || nextRoundMatches.length == 0) {
            next_button.disabled = true;

            result_button.click();
            modalCloseCallback = () => {
                window.location.href = "index.html";
            }
            return;
        }


        playerTeams = nextRoundMatches.flatMap(m => [m.teamA, m.teamB]).sort((a, b) => {
            return getTeamIndex(a) - getTeamIndex(b);
        });

        playerTeams.forEach((team) => {
            if (team.name === "BYE round") return;
            createTeam(team);
        });
        nextRoundMatches.forEach(match => createMatch(match));

        if (teams.removedPlayers && teams.removedPlayers.length != 0) {
            createSkippedPlayersEntry(teams.removedPlayers);
        }
    });
    result_button.addEventListener('click', () => {
        result_modal.showModal();
        const resultsContainer = document.getElementById("results_container");
        resultsContainer.innerHTML = '';
        const winningPlayers = getWinningPlayers();
        winningPlayers.forEach(winningPlayer => createWinEntry(winningPlayer.player, winningPlayer.wins));
    });
    close_result_modal.addEventListener('click', closeResultModal);
    clear_results_button.addEventListener('click', () => {
        results_container.innerHTML = '';
        resetWinHistory();
    });
    edit_button.addEventListener('click', () => {
        window.location.href = "index.html";
    })


    reroll_button.addEventListener("click", () => {
        ;
        init(regenTeams[gameMode]());
    })
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
    teamEntry.querySelector('.team_number').innerHTML = `${index + 1}`
    if (index >= teamNames.length) {
        index = teamNames.length - 1;
    }
    const averageElo = team.players.reduce((acc, player) => acc + player.rank, 0) / 3;

    teamEntry.querySelector('.team_background').src = `assets/images/teams/team${index + 1}.png`;
    teamEntry.querySelector('.team_name_name').innerHTML = `${team.name}`
    teamEntry.querySelector('.average_rank').innerHTML = `${Math.floor(averageElo)}`
    teamEntry.querySelector('.average_rank_icon').src = 'assets/images/ranks/' + eloToRank(averageElo) + '.png'



    const playersSorted = team.players.toSorted((a, b) => {
        return databaseRoleToSortIndex(b.role) - databaseRoleToSortIndex(a.role);
    })

    teamEntry.querySelectorAll('.player_entry').forEach((entry, index) => {
        entry.querySelector('.player_name').innerHTML = playersSorted[index].name
        entry.querySelector('.player_rank').src = 'assets/images/ranks/' + eloToRank(playersSorted[index].rank) + '.png'
        entry.querySelector('.player_name').textContent += " " + playersSorted[index].role.toUpperCase();
    })

    team_list.appendChild(teamEntry);
}

/**
 * 
 * @param {import("../../types.js").Match} match 
 */
function createMatch(match) {
    const matchTemplate = document.getElementById("match_template");
    /**
     * @type {DocumentFragment}
     */
    const matchCopy = document.importNode(matchTemplate.content, true);
    const matchEntry = matchCopy.firstElementChild;
    const indexTeam1 = getTeamIndex(match.teamA);
    const indexTeam2 = getTeamIndex(match.teamB);

    const team1ImageIndex = indexTeam1 >= teamNames.length ? teamNames.length - 1 : indexTeam1;
    const team2ImageIndex = indexTeam2 >= teamNames.length ? teamNames.length - 1 : indexTeam2;

    matchEntry.querySelector(".team_1_icon").src = `assets/images/teams/team${team1ImageIndex + 1}.png`;
    matchEntry.querySelector(".team_1_name").innerHTML = match.teamA.name;
    matchEntry.querySelector(".team_2_icon").src = `assets/images/teams/team${team2ImageIndex + 1}.png`;
    matchEntry.querySelector(".team_2_name").innerHTML = match.teamB.name;
    if (match.teamA.name === "BYE round") {
        matchEntry.querySelector(".team_1_icon").src = `assets/images/teams/skipped_player.png`;
    }
    if (match.teamB.name === "BYE round") {
        matchEntry.querySelector(".team_2_icon").src = `assets/images/teams/skipped_player.png`;
    }
    const teamAScoreInput = matchEntry.querySelector(".team_1_score");
    const teamBScoreInput = matchEntry.querySelector(".team_2_score");
    if (match.teamA.name === "BYE round") {
        teamAScoreInput.value = "0";
        teamAScoreInput.disabled = true;
        teamBScoreInput.value = "3";
        teamBScoreInput.disabled = true;
    }
    if (match.teamB.name === "BYE round") {
        teamBScoreInput.value = "0";
        teamBScoreInput.disabled = true;
        teamAScoreInput.value = "3";
        teamAScoreInput.disabled = true;
    }
    document.getElementById("match_list").appendChild(matchEntry);
    matchList.push(() => {
         return { 
            match, 
            get teamAScore() { return parseInt(teamAScoreInput.value) || 0 }, 
            get teamBScore() { return parseInt(teamBScoreInput.value) || 0 } 
        } 
    });
}
/**
 * 
 * @param {import("../../types.js").Player} player 
 * @param {number} wins 
 */
function createWinEntry(player, wins) {
    const winTemplate = document.getElementById("winner_template");
    const winCopy = document.importNode(winTemplate.content, true);
    const winEntry = winCopy.firstElementChild;
    winEntry.querySelector(".winner_player_name").innerHTML = player.name;
    winEntry.querySelector(".win_count").innerHTML = wins.toString();
    results_container.appendChild(winEntry);
}
function createSkippedPlayersEntry(players) {
    const skippedTemplate = document.getElementById("skipped_players_template");
    const skippedCopy = document.importNode(skippedTemplate.content, true);
    const skippedList = skippedCopy.getElementById("skipped_player_list");
    players.forEach(player => {
        const playerEntry = document.createElement("p");
        playerEntry.classList.add("player_name");
        playerEntry.innerHTML = player.name;
        skippedList.appendChild(playerEntry);
    });
    team_list.appendChild(skippedCopy);
}

function closeResultModal() {
    modalCloseCallback();

    result_modal.close();
}
