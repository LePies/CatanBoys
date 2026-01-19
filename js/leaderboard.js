// Leaderboard CSV loader and renderer

async function loadCSV(path) {
    const response = await fetch(path);
    const text = await response.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, i) => {
            obj[header.trim()] = values[i]?.trim() || '';
        });
        return obj;
    });
}

function formatWins(wins) {
    const num = parseFloat(wins);
    if (num === Math.floor(num)) {
        return num.toString();
    }
    if (num % 1 === 0.5) {
        const floor = Math.floor(num);
        return floor === 0 ? '½' : `${floor}½`;
    }
    return wins;
}

function sortAndRankPlayers(players) {
    // Sort by Wins (descending), then by GamesPlayed (ascending)
    const sorted = [...players].sort((a, b) => {
        const winsA = parseFloat(a.Wins) || 0;
        const winsB = parseFloat(b.Wins) || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (parseInt(a.GamesPlayed) || 0) - (parseInt(b.GamesPlayed) || 0);
    });
    
    // Assign ranks
    let rank = 1;
    let prevWins = null;
    
    return sorted.map((player, index) => {
        const wins = parseFloat(player.Wins) || 0;
        let rankDisplay;
        
        if (wins === 0) {
            rankDisplay = '-';
        } else if (prevWins === wins) {
            rankDisplay = rank;
        } else {
            rank = index + 1;
            rankDisplay = rank;
        }
        
        if (wins > 0) {
            prevWins = wins;
        }
        
        return {
            ...player,
            Rank: rankDisplay,
            WinsFormatted: formatWins(player.Wins)
        };
    });
}

function renderLeaderboard(players, tableId = 'leaderboard') {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const ranked = sortAndRankPlayers(players);
    
    ranked.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.Rank}</td>
            <td>${player.Player}</td>
            <td>${player.WinsFormatted}</td>
            <td>${player.GamesPlayed}</td>
        `;
        tbody.appendChild(row);
    });
}

// Merge data from multiple CSVs (for combined leaderboard)
function mergePlayers(standardPlayers, caravanPlayers) {
    const merged = {};
    
    // Add standard data
    standardPlayers.forEach(p => {
        merged[p.Player] = {
            Player: p.Player,
            Wins: parseFloat(p.Wins) || 0,
            GamesPlayed: parseInt(p.GamesPlayed) || 0
        };
    });
    
    // Add caravan data
    caravanPlayers.forEach(p => {
        if (merged[p.Player]) {
            merged[p.Player].Wins += parseFloat(p.Wins) || 0;
            merged[p.Player].GamesPlayed += parseInt(p.GamesPlayed) || 0;
        } else {
            merged[p.Player] = {
                Player: p.Player,
                Wins: parseFloat(p.Wins) || 0,
                GamesPlayed: parseInt(p.GamesPlayed) || 0
            };
        }
    });
    
    return Object.values(merged);
}

// Initialize leaderboard based on page type
async function initLeaderboard(type, csvPath) {
    try {
        if (type === 'combined') {
            const [standard, caravan] = await Promise.all([
                loadCSV(csvPath.standard),
                loadCSV(csvPath.caravan)
            ]);
            const combined = mergePlayers(standard, caravan);
            renderLeaderboard(combined);
        } else {
            const players = await loadCSV(csvPath);
            renderLeaderboard(players);
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}
