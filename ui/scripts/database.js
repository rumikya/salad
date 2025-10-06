// name,role,elo,win,participation,salad_elo
let players = [];
let eloMode = "salad_elo"; // or elo
let saved_players = [];
let deleting = false;

document.addEventListener("DOMContentLoaded", function() {
    localStorage.getItem('databaseCache') ? players = JSON.parse(localStorage.getItem('databaseCache')) : players = [];

    players.sort((a,b) => a.name.localeCompare(b.name));
    players.forEach(player => createPlayerEntry(player));
    eloMode = sessionStorage.getItem('eloMode') || "salad_elo";
    saved_players = sessionStorage.getItem('playersList') ? JSON.parse(sessionStorage.getItem('playersList')) : [];

    setupColumnResizers();
    syncColWidths();


    const backgroundChoices = Array.from({length: 7}, (_, i) => `bg${i + 1}.png`);
    background.src = `assets/images/backgrounds/${backgroundChoices[Math.floor(Math.random() * backgroundChoices.length)]}`;
});

function createPlayerEntry(player) {
    const playerList = document.getElementById('database_table_body');
    const playerTemplate = document.getElementById('player_template');
    const playerTemplateCopy = document.importNode(playerTemplate.content, true);
    const playerEntry = playerTemplateCopy.firstElementChild;
    playerEntry.dataset.name = player.name;
    playerEntry.dataset.role = player.role;
    playerEntry.querySelector('.player_name').firstElementChild.value = player.name;
    playerEntry.querySelector('.player_role').firstElementChild.value = player.role;
    playerEntry.querySelector('.original_elo').firstElementChild.value = player.elo;
    playerEntry.querySelector('.salad_elo').firstElementChild.value = player.salad_elo;
    playerList.appendChild(playerEntry);

    playerEntry.addEventListener('click', (e) => {
        if (deleting) {
            const name = playerEntry.dataset.name;
            const role = playerEntry.dataset.role;
            if (confirm(`T'ES SUR QUE TU VEUX SUPPRIMER "${name}" (${role})? Cette action ne peut pas être annulée.`)) {

                document.querySelectorAll('.player_entry').forEach(el => el.classList.remove('delete_mode'));
                playerEntry.remove();

            }
        }
        document.querySelectorAll('.player_entry').forEach(el => el.classList.remove('delete_mode'));  
    });
    

    return playerEntry
}

function syncColWidths() {
    const table = document.querySelector('.table-content-container table');
    if (!table) return;
    const cols = Array.from(table.querySelectorAll('col'));
    const ths = Array.from(table.querySelectorAll('thead th'));
    const totalWidth = table.getBoundingClientRect().width || ths.reduce((s,t)=>s+t.getBoundingClientRect().width,0);
    if (totalWidth <= 0) return;
    ths.forEach((th, i) => {
        const w = th.getBoundingClientRect().width;
        const pct = (w / totalWidth) * 100;
        if (cols[i]) cols[i].style.width = `${pct}%`;
    });
}

// Re-sync on window resize (debounced)
let __resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(__resizeTimer);
    __resizeTimer = setTimeout(syncColWidths, 120);
});

function setupColumnResizers() {
    const table = document.querySelector('.table-content-container table');
    if (!table) return;

    const thead = table.querySelector('thead');
    if (!thead) return;

    const headers = Array.from(thead.querySelectorAll('th'));

    // Ensure CSS variables exist for all columns
    const colCount = headers.length;
    for (let i = 1; i <= colCount; i++) {
        const varName = `--col-${i}`;
        if (!getComputedStyle(table).getPropertyValue(varName)) {
            // keep existing defaults in CSS
        }
    }

    // Add resizers except on the last header
    const cols = Array.from(table.querySelectorAll('col'));
    headers.forEach((th, index) => {
        if (index === headers.length - 1) return; // no resizer on last column

        const resizer = document.createElement('div');
        resizer.className = 'col-resizer';
        th.appendChild(resizer);

        let startX = 0;
        let startWidths = [];
        let dragging = false;

        const onMouseDown = (e) => {
            e.preventDefault();
            startX = e.clientX;
            const styles = getComputedStyle(table);
            // read current percentages from CSS variables, fall back to computed widths
            const totalWidth = table.getBoundingClientRect().width;
            // read current widths from col elements (preferred) or computed cell widths
            startWidths = cols.map((c, i) => {
                const w = c.style.width || getComputedStyle(c).width;
                if (w && w.endsWith('%')) return parseFloat(w) * totalWidth / 100;
                if (w && w.endsWith('px')) return parseFloat(w);
                const cell = table.querySelector(`thead tr th:nth-child(${i+1})`);
                return cell ? cell.getBoundingClientRect().width : 0;
            });
            dragging = true;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            // adjust column index and next column so total width remains the same
            const leftIndex = index; // column being dragged (0-based)
            const rightIndex = index + 1;
            const leftStart = startWidths[leftIndex];
            const rightStart = startWidths[rightIndex];
            const totalWidth = table.getBoundingClientRect().width;

            let newLeft = leftStart + dx;
            let newRight = rightStart - dx;

            // Enforce minimum widths
            const minPx = 40;
            if (newLeft < minPx) {
                newLeft = minPx;
                newRight = leftStart + rightStart - minPx;
            }
            if (newRight < minPx) {
                newRight = minPx;
                newLeft = leftStart + rightStart - minPx;
            }

            // Convert to percentages and update <col> widths for both columns
            const leftPct = (newLeft / totalWidth) * 100;
            const rightPct = (newRight / totalWidth) * 100;

            if (cols[leftIndex]) cols[leftIndex].style.width = `${leftPct}%`;
            if (cols[rightIndex]) cols[rightIndex].style.width = `${rightPct}%`;
        };

        const onMouseUp = (e) => {
            dragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        // touch support
        const onTouchStart = (e) => onMouseDown(e.touches[0]);

        resizer.addEventListener('mousedown', onMouseDown);
        resizer.addEventListener('touchstart', onTouchStart, {passive: true});
    });
}


remove_player_button.addEventListener("click", function() {
    deleting = true;

    document.querySelectorAll('.player_entry').forEach(el => el.classList.add('delete_mode'));
})

edit_player_button.addEventListener("click", function() {
    const entries = Array.from(document.querySelectorAll(".player_entry"));

    // update playerList
    const newPlayers = entries.map(entry => {
        const name = entry.querySelector(".player_name").firstElementChild.value.trim();
        const role = entry.querySelector(".player_role").firstElementChild.value.trim();
        const originalName = entry.dataset.name;
        const originalRole = entry.dataset.role;
        const elo = parseInt(entry.querySelector(".original_elo").firstElementChild.value) || 1200;
        const salad_elo = parseInt(entry.querySelector(".salad_elo").firstElementChild.value) || 1200;
        return { ...players.find(p => p.name === originalName && p.role === originalRole), name, role, elo, salad_elo };
    });

    players = newPlayers;
    localStorage.setItem('databaseCache', JSON.stringify(players));
    
    newPlayers.filter(x => saved_players.some(p => p.name === x.name)).forEach(p => {
        const sp = saved_players.find(sp => sp.name === p.name);
        sp.name = p.name;
        sp.role = p.role;
    });

    sessionStorage.setItem('playersList', JSON.stringify(saved_players));
})

add_player_button.addEventListener("click", function() {
    const entry = createPlayerEntry({ name: "", role: "", elo: 1200, salad_elo: 1200 });
    entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
});