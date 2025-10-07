import { setPlayers } from "../../caches.js";
import { eloToRank, databaseRoleToRole } from "../../models.js";
// name,role,elo,win,participation,salad_elo
let players = [];
let eloMode = "salad_elo"; // or elo
let gameMode = "swiss";

document.addEventListener("DOMContentLoaded", function() {
    localStorage.getItem('databaseCache') ? players = JSON.parse(localStorage.getItem('databaseCache')) : players = [];
    const savedPlayers = sessionStorage.getItem('playersList') ? JSON.parse(sessionStorage.getItem('playersList')) : [];
    savedPlayers.forEach(player => createPlayerEntry(player));
    eloMode = sessionStorage.getItem('eloMode') || "salad_elo";
    gameMode = sessionStorage.getItem('gameMode') || "swiss";

    document.querySelector(`input[name="elo"][value="${eloMode}"]`).checked = true;
    document.querySelector(`input[name="type"][value="${gameMode}"]`).checked = true;

    const backgroundChoices = Array.from({length: 7}, (_, i) => `bg${i + 1}.png`);
    background.src = `assets/images/backgrounds/${backgroundChoices[Math.floor(Math.random() * backgroundChoices.length)]}`;
});

file_input.addEventListener("change", handleFileSelect);

import_button.addEventListener("click", function () {
    file_input.click(); 
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const contents = e.target.result;
        processCSV(contents);
        file_input.value = "";
        import_button.blur();
    };
    reader.readAsText(file);
}

function processCSV(data) {
    const lines = data.split("\n");
    const newPlayers = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const [name, role, elo, win, participation, salad_elo] = line.split(",");
            newPlayers.push({
                name: name.trim(),
                role: role.trim(),
                elo: parseInt(elo.trim()),
                win: parseInt(win.trim()),
                participation: parseInt(participation.trim()),
                salad_elo: parseInt(salad_elo.trim())
            });
        }
    }
    
    players = newPlayers;

    localStorage.setItem('databaseCache', JSON.stringify(players));
    location.reload();
}


add_player_button.addEventListener("click", function() {
    createPlayerEntry()
})

remove_player_button.addEventListener("click", function() {
    const entries = document.querySelectorAll(".player_entry");
    if (entries.length > 0) {
        entries[entries.length - 1].remove();
        setPlayerSelects();
        setPlayerCount();
    }
})

add_random_players.addEventListener("click", function() {
    const availableNames = players.map(p => p.name);
    const currentNames = Array.from(document.querySelectorAll(".player_entry")).map(entry => entry.querySelector("#player_select").value);
    const namesToAdd = availableNames.filter(name => !currentNames.includes(name));
    const randomName = namesToAdd[Math.floor(Math.random() * namesToAdd.length)];

    const player = players.find(p => p.name === randomName);
    createPlayerEntry({name: randomName, role: player.role});
})


function createPlayerEntry(player = {name: "", role: "Flex"}) {
    /**
     * @type {HTMLTemplateElement}
     */
    const template = document.getElementById("player_template");
    const importedNode = document.importNode(template.content, true);
    const entry = importedNode.firstElementChild;
    
    entry.id = "";
    entry.hidden = false;
    entry.classList.add("player_entry");

    const select = entry.querySelector("#player_select");
    const roleSelect = entry.querySelector("#player_role");

    const node = player_list.appendChild(entry);


    select.addEventListener("change", function() {
        playerNameChanged(node);
    });

    roleSelect.addEventListener("change", function() {
        playerRoleChanged(node);
    });

    if(player.name && players.find(p => p.name === player.name && p.role === player.role)) {
        const player_entries = document.querySelectorAll(".player_entry");
        const selects = Array.from(player_entries).map(entry => entry.querySelector("#player_select"));
        const selectedNames = selects.map(select => select.value);
        const availableNames = new Set(players.map(player => player.name).filter(name => !selectedNames.includes(name)));
        setPlayerSelect(select, availableNames);


        select.value = player.name;
        setPlayerRoles(node);
        roleSelect.value = player.role;
        
        playerRoleChanged(node);
        setPlayerCount();
        return;
    }

    player_list.appendChild(entry);

    updatePlayerList();
    setPlayerSelects();
    setPlayerCount();
}

function playerNameChanged(entry) {
    setPlayerSelects();
    setPlayerRoles(entry);
    updatePlayerList();
}

function setPlayerSelect(select, availableNames) {
    const value = select.value;
    select.innerHTML = "";
    availableNames.forEach(name => {
        select.appendChild(createOption(name));
    });
    select.appendChild(createOption(value));
    select.value = value;
}

function setPlayerSelects() {
    const player_entries = document.querySelectorAll(".player_entry");

    const selects = Array.from(player_entries).map(entry => entry.querySelector("#player_select"));
    const selectedNames = selects.map(select => select.value);
    const availableNames = new Set(players.map(player => player.name).filter(name => !selectedNames.includes(name)));
    console.log(availableNames)
    selects.forEach(select => {
        setPlayerSelect(select, availableNames);
    })
}

function createOption(value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    return option;
}

function setPlayerRoles(entry) {
    const select = entry.querySelector("#player_select");
    const name = select.value;
    const playerRoles = players.filter(p => p.name === name).map(p => p.role);
    if (!playerRoles.length) {
        return
    }

    const roleSelect = entry.querySelector("#player_role");
    roleSelect.innerHTML = "";
    playerRoles.map(createOption).forEach(option => roleSelect.appendChild(option));
    roleSelect.value = playerRoles[0];   

    playerRoleChanged(entry);
}

function playerRoleChanged(entry) {
    const select = entry.querySelector("#player_select");
    const roleSelect = entry.querySelector("#player_role");
    const rankImg = entry.querySelector("#player_rank_img");

    const playerName = select.value;
    let playerElo;
    if(eloMode == "salad_elo") {
        playerElo = players.find(p => p.name === playerName && p.role === roleSelect.value)?.salad_elo || 1000;
    }
    else {
        playerElo = players.find(p => p.name === playerName && p.role === roleSelect.value)?.elo || 1000;
    }
    const playerEloValue = eloToRank(playerElo);
    rankImg.src = `assets/images/ranks/${playerEloValue}.png`;

    updatePlayerList();
}


function updatePlayerList() {
    sessionStorage.setItem('playersList', JSON.stringify([...player_list.querySelectorAll(".player_entry")].map(entry => {
        const name = entry.querySelector("#player_select").value;
        const role = entry.querySelector("#player_role").value;
        return {name, role};
    })));
}

document.getElementsByName("elo").forEach(radio => {
    radio.addEventListener("change", function() {
        eloMode = this.value;
        console.log(eloMode)
        sessionStorage.setItem('eloMode', eloMode);
        document.querySelectorAll(".player_entry").forEach(entry => {
            playerRoleChanged(entry);
        });
        updatePlayerList();        
    });
});

document.getElementsByName("type").forEach(radio => {
    radio.addEventListener("change", function() {
        gameMode = this.value;
        sessionStorage.setItem('gameMode', gameMode);
        updatePlayerList();        
    });
});

function setPlayerCount() {
    player_count_value.textContent = document.querySelectorAll(".player_entry").length;
}


start_button.addEventListener("click", function() {
    let eloKey = "elo";
    if(eloMode == "salad_elo") {
        eloKey = "salad_elo";
    }


    setPlayers(JSON.parse(sessionStorage.getItem('playersList')).map(p => ({
        name: p.name,
        rank: players.find(t => t.name === p.name && t.role === p.role)[eloKey],
        role: databaseRoleToRole(p.role),
        isActive: true
    })), gameMode);

    window.location.href = "matches.html";
})

to_database_button.addEventListener("click", function() {
    window.location.href = "database.html";
});