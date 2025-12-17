import { getWinningPlayers, resetWinHistory, setWinner } from "../../caches.js";
import {
  eloToRank,
  databaseRoleToSortIndex,
} from "../../models.js";

if (location.hostname !== "localhost") {
  document.querySelector(".player_count").style.display = "none";
}

const teamNames = [
  "FrostFire",
  "Ember Monarchs",
  "Maelstrom",
  "SSR",
  "Byte Breakers",
  "Clarion Corp",
  "Demon Drive",
  "AimiTank",
];

/**
 * @type {Array<'teamA' | 'teamB'>}
 */
const sides = ["teamA", "teamB"];

const history = JSON.parse(sessionStorage.getItem("scoreHistory")) || [];
const matchList = [];
let selectedIndex = 0;

if (history.length > 0) {
  init(history[selectedIndex]);
  const matchSelect = document.getElementById("match_id");
  history.forEach((matches, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = `Round ${index + 1}`;
    matchSelect.appendChild(option);
  });
  matchSelect.addEventListener("change", (event) => {
    selectedIndex = event.target.value;
    init(history[selectedIndex]);
  });
}

function init(matches) {
  matchList.length = 0;
  team_list.innerHTML = "";
  match_list.innerHTML = "";
  matches.forEach((match) =>
    createMatch(match.match, match.teamAScore, match.teamBScore)
  );
  matches.forEach((match, i) => {
    for (const key of sides) {
      if (match.match[key].name === "BYE round") continue;
      createTeam(match.match[key], i, key);
    }
  });
  if (matches.length == 0) {
    next_button.disabled = true;
  }
}

/**
 *
 * @param {import("../../types.js").Match} match
 */
function createMatch(match, teamAScore = "0", teamBScore = "0") {
  const matchTemplate = document.getElementById("match_template");
  /**
   * @type {DocumentFragment}
   */
  const matchCopy = document.importNode(matchTemplate.content, true);
  const matchEntry = matchCopy.firstElementChild;
  const indexTeam1 = getTeamIndex(match.teamA);
  const indexTeam2 = getTeamIndex(match.teamB);

  const team1ImageIndex =
    indexTeam1 >= teamNames.length ? teamNames.length - 1 : indexTeam1;
  const team2ImageIndex =
    indexTeam2 >= teamNames.length ? teamNames.length - 1 : indexTeam2;

  matchEntry.querySelector(".team_1_icon").src = `assets/images/teams/team${
    team1ImageIndex + 1
  }.png`;
  matchEntry.querySelector(".team_1_name").innerHTML = match.teamA.name;
  matchEntry.querySelector(".team_2_icon").src = `assets/images/teams/team${
    team2ImageIndex + 1
  }.png`;
  matchEntry.querySelector(".team_2_name").innerHTML = match.teamB.name;
  if (match.teamA.name === "BYE round") {
    matchEntry.querySelector(
      ".team_1_icon"
    ).src = `assets/images/teams/skipped_player.png`;
  }
  if (match.teamB.name === "BYE round") {
    matchEntry.querySelector(
      ".team_2_icon"
    ).src = `assets/images/teams/skipped_player.png`;
  }
  const teamAScoreInput = matchEntry.querySelector(".team_1_score");
  const teamBScoreInput = matchEntry.querySelector(".team_2_score");
  matchEntry.querySelector(".team_1_score").value = teamAScore;
  matchEntry.querySelector(".team_2_score").value = teamBScore;
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
  matchList.push({
    match,
    get teamAScore() {
      return parseInt(teamAScoreInput.value) || 0;
    },
    get teamBScore() {
      return parseInt(teamBScoreInput.value) || 0;
    },
  });
}

/**
 *
 * @param {import("../../types.js").Team} team
 * @param {number} matchIndex
 * @param {'teamA' | 'teamB'} teamSide
 */
function createTeam(team, matchIndex, teamSide) {
  const teamTemplate = document.getElementById("team_template");
  /**
   * @type {DocumentFragment}
   */

  const teamCopy = document.importNode(teamTemplate.content, true);
  const teamEntry = teamCopy.firstElementChild;

  let index = getTeamIndex(team);
  teamEntry.querySelector(".team_number").innerHTML = `${index + 1}`;
  if (index >= teamNames.length) {
    index = teamNames.length - 1;
  }
  const averageElo =
    team.players.reduce((acc, player) => acc + player.rank, 0) / 3;

  teamEntry.querySelector(".team_background").src = `assets/images/teams/team${
    index + 1
  }.png`;
  teamEntry.querySelector(".team_name_name").innerHTML = `${team.name}`;

  /**
   *
   * @param {number} averageElo
   */
  function renderTeamElo(averageElo) {
    teamEntry.querySelector(".average_rank").innerHTML = `${Math.floor(
      averageElo
    )}`;
    teamEntry.querySelector(".average_rank_icon").src =
      "assets/images/ranks/" + eloToRank(averageElo) + ".png";
  }

  renderTeamElo(averageElo);

  team.players = team.players.toSorted((a, b) => {
    return databaseRoleToSortIndex(b.role) - databaseRoleToSortIndex(a.role);
  });
  const playerList = teamEntry.querySelector(".player_list");

  function createPlayerEntry(player) {
    const playerTemplate = document.getElementById("player_entry_template");
    const playerCopy = playerTemplate.content.firstElementChild.cloneNode(true);
    playerCopy.querySelector(".player_name").innerHTML = player.name;
    playerCopy.querySelector(".player_rank").src =
      "assets/images/ranks/" + eloToRank(player.rank) + ".png";
    playerCopy.querySelector(".player_name").textContent +=
      " " + player.role.toUpperCase();
    playerCopy.setAttribute("data-id", player.name);
    return playerCopy;
  }
  team.players.forEach((player) => {
    const playerElement = createPlayerEntry(player);
    playerList.appendChild(playerElement);
  });

  team_list.appendChild(teamEntry);
}

function getTeamIndex(team) {
  const index = teamNames.indexOf(team.name);
  if (index == -1) {
    return parseInt(team.name.split(" ").at(-1));
  }
  return index;
}

next_button.addEventListener("click", () => {
  if (matchList.some((m) => m.teamAScore == 0 && m.teamBScore == 0)) {
    alert("Please enter scores for all matches before saving to history");
    return;
  }

  history[selectedIndex] = matchList.map(
    ({ match, teamAScore, teamBScore }) => ({
      match,
      teamAScore,
      teamBScore,
    })
  );
  sessionStorage.setItem("scoreHistory", JSON.stringify(history));

  resetWinHistory();
  for (const matchList of history) {
    for (const { match, teamAScore, teamBScore } of matchList) {
      setWinner(match, teamAScore > teamBScore ? match.teamA : match.teamB);
    }
  }
  window.location.href = "history.html";
});

function createWinEntry(player, wins) {
  const winTemplate = document.getElementById("winner_template");
  const winCopy = document.importNode(winTemplate.content, true);
  const winEntry = winCopy.firstElementChild;
  winEntry.querySelector(".winner_player_name").innerHTML = player.name;
  winEntry.querySelector(".win_count").innerHTML = wins.toString();
  results_container.appendChild(winEntry);
}

result_button.addEventListener("click", () => {
  result_modal.showModal();
  const resultsContainer = document.getElementById("results_container");
  resultsContainer.innerHTML = "";
  const winningPlayers = getWinningPlayers();
  winningPlayers.winners.forEach((winningPlayer) =>
    createWinEntry(winningPlayer.player, winningPlayer.wins)
  );
  if (winningPlayers.runnersUp.length > 0) {
    const runnerUpHeader = document.createElement("h2");
    runnerUpHeader.textContent = "Runners-Up";
    resultsContainer.appendChild(runnerUpHeader);
    winningPlayers.runnersUp.forEach((runnerUpPlayer) =>
      createWinEntry(runnerUpPlayer.player, runnerUpPlayer.wins)
    );
  }
});

function closeResultModal() {
  result_modal.close();
}

result_modal.addEventListener("click", function (event) {
  const rect = result_modal.getBoundingClientRect();
  const isInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;
  if (!isInDialog) {
    closeResultModal();
  }
});

close_result_modal.addEventListener('click', closeResultModal);

