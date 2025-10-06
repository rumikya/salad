// name,role,elo,win,participation,salad_elo
let players = [];
let eloMode = "salad_elo"; // or elo

document.addEventListener("DOMContentLoaded", function() {
    localStorage.getItem('databaseCache') ? players = JSON.parse(localStorage.getItem('databaseCache')) : players = [];


    players.forEach(player => createPlayerEntry(player));
    eloMode = sessionStorage.getItem('eloMode') || "salad_elo";


    const backgroundChoices = Array.from({length: 7}, (_, i) => `bg${i + 1}.png`);
    background.src = `assets/images/backgrounds/${backgroundChoices[Math.floor(Math.random() * backgroundChoices.length)]}`;
});

function createPlayerEntry(player) {
    const playerList = document.getElementById('database_table_body');
    const playerTemplate = document.getElementById('player_template');
    const playerTemplateCopy = document.importNode(playerTemplate.content, true);
    const playerEntry = playerTemplateCopy.firstElementChild;
    playerEntry.querySelector('.player_name').textContent = player.name;
    playerEntry.querySelector('.player_role').textContent = player.role;
    playerEntry.querySelector('.original_elo').textContent = player.elo;
    playerEntry.querySelector('.salad_elo').textContent = player.salad_elo;
    playerList.appendChild(playerEntry);
}
