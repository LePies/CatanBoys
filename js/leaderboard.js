// Leaderboard CSV loader and renderer

// Player profile picture mappings
const playerProfiles = {
    'Micki': 'city',
    'Daniel': 'knight',
    'Morn': 'ore',
    'Mohr': 'settlement',
    'Andreas': 'wheat',
    'Fournaise': 'brick',
    'Emil': 'wood',
    'Rasmus': 'sheep',
    'Alex': 'dice',
    'Reimer': 'harbor'
};

// Get profile path for a player
function getProfilePath(playerName, basePath = '') {
    const profile = playerProfiles[playerName] || 'robber'; // Default to robber if no profile assigned
    return `${basePath}profiles/${profile}.svg`;
}

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

function getInitials(name) {
    return name
        .split(' ')
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
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
            WinsFormatted: formatWins(player.Wins),
            Initials: getInitials(player.Player)
        };
    });
}

function renderPodiumPlace(player, position, basePath = '') {
    const profilePath = getProfilePath(player.Player, basePath);
    return `
        <div class="podium-place">
            <div class="avatar">
                <img src="${profilePath}" alt="${player.Player}">
            </div>
            <div class="name">${player.Player}</div>
            <div class="score">${player.WinsFormatted} wins</div>
            <div class="stand">
                <div class="rank">${position}</div>
            </div>
        </div>
    `;
}

function renderLeaderboardItem(player, basePath = '') {
    const profilePath = getProfilePath(player.Player, basePath);
    return `
        <div class="leaderboard-item">
            <div class="item-rank">${player.Rank}</div>
            <div class="item-avatar">
                <img src="${profilePath}" alt="${player.Player}">
            </div>
            <div class="item-info">
                <div class="item-name">${player.Player}</div>
                <div class="item-games">${player.GamesPlayed} games played</div>
            </div>
            <div class="item-wins">${player.WinsFormatted}</div>
        </div>
    `;
}

function renderLeaderboard(players, containerId = 'leaderboard-container', basePath = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const ranked = sortAndRankPlayers(players);
    
    // Filter players with wins for podium (top 3 with wins > 0)
    const playersWithWins = ranked.filter(p => parseFloat(p.Wins) > 0);
    const top3 = playersWithWins.slice(0, 3);
    const rest = ranked.slice(top3.length);
    
    let html = '';
    
    // Render podium if we have players with wins
    if (top3.length > 0) {
        html += '<div class="podium">';
        
        // Podium order: 2nd, 1st, 3rd (visual layout)
        if (top3.length >= 2) {
            html += renderPodiumPlace(top3[1], 2, basePath); // 2nd place (left)
        } else {
            html += '<div class="podium-place"></div>'; // Empty placeholder
        }
        
        html += renderPodiumPlace(top3[0], 1, basePath); // 1st place (center)
        
        if (top3.length >= 3) {
            html += renderPodiumPlace(top3[2], 3, basePath); // 3rd place (right)
        } else {
            html += '<div class="podium-place"></div>'; // Empty placeholder
        }
        
        html += '</div>';
    }
    
    // Render remaining players list
    if (rest.length > 0) {
        html += '<div class="leaderboard">';
        rest.forEach(player => {
            html += renderLeaderboardItem(player, basePath);
        });
        html += '</div>';
    }
    
    // Empty state
    if (top3.length === 0 && rest.length === 0) {
        html = '<div class="empty-podium">No players yet</div>';
    }
    
    container.innerHTML = html;
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
async function initLeaderboard(type, csvPath, basePath = '') {
    try {
        if (type === 'combined') {
            const [standard, caravan] = await Promise.all([
                loadCSV(csvPath.standard),
                loadCSV(csvPath.caravan)
            ]);
            const combined = mergePlayers(standard, caravan);
            renderLeaderboard(combined, 'leaderboard-container', basePath);
        } else {
            const players = await loadCSV(csvPath);
            renderLeaderboard(players, 'leaderboard-container', basePath);
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}
