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

function getWinRate(player) {
    const games = parseInt(player.GamesPlayed) || 0;
    if (games === 0) return 0;
    return (parseFloat(player.Wins) || 0) / games;
}

function formatWinRate(player) {
    const rate = getWinRate(player);
    if (rate === 0 && (parseInt(player.GamesPlayed) || 0) === 0) return '-';
    return (rate * 100).toFixed(1) + '%';
}

function sortAndRankPlayers(players, sortBy = 'wins') {
    const withWinRate = players.map(p => ({
        ...p,
        WinRate: getWinRate(p),
        WinRateFormatted: formatWinRate(p)
    }));

    const sorted = [...withWinRate].sort((a, b) => {
        if (sortBy === 'winRate') {
            if (b.WinRate !== a.WinRate) return b.WinRate - a.WinRate;
            const gamesA = parseInt(a.GamesPlayed) || 0;
            const gamesB = parseInt(b.GamesPlayed) || 0;
            if (gamesB !== gamesA) return gamesB - gamesA;
        }
        const winsA = parseFloat(a.Wins) || 0;
        const winsB = parseFloat(b.Wins) || 0;
        if (winsB !== winsA) return winsB - winsA;
        return (parseInt(a.GamesPlayed) || 0) - (parseInt(b.GamesPlayed) || 0);
    });

    const rankKey = sortBy === 'winRate' ? 'WinRate' : 'Wins';
    let rank = 1;
    let prevValue = null;

    return sorted.map((player, index) => {
        const value = rankKey === 'WinRate' ? player.WinRate : parseFloat(player.Wins) || 0;
        const hasValue = rankKey === 'WinRate' ? (player.WinRate > 0 && (parseInt(player.GamesPlayed) || 0) > 0) : value > 0;
        let rankDisplay;

        if (!hasValue) {
            rankDisplay = '-';
        } else if (prevValue === value) {
            rankDisplay = rank;
        } else {
            rank = index + 1;
            rankDisplay = rank;
        }
        if (hasValue) prevValue = value;

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
    const winRateText = player.WinRateFormatted !== '-' ? ` (${player.WinRateFormatted})` : '';
    return `
        <div class="podium-place">
            <div class="avatar">
                <img src="${profilePath}" alt="${player.Player}">
            </div>
            <div class="name">${player.Player}</div>
            <div class="score">${player.WinsFormatted} wins${winRateText}</div>
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
                <div class="item-games">${player.GamesPlayed} games played · ${player.WinRateFormatted} win rate</div>
            </div>
            <div class="item-wins">${player.WinsFormatted}</div>
        </div>
    `;
}

// Stored for re-render when sort changes
let currentLeaderboardPlayers = null;
let currentLeaderboardContainerId = 'leaderboard-container';
let currentLeaderboardBasePath = '';

function renderLeaderboard(players, containerId = 'leaderboard-container', basePath = '', sortBy = 'wins') {
    const container = document.getElementById(containerId);
    if (!container) return;

    currentLeaderboardPlayers = players;
    currentLeaderboardContainerId = containerId;
    currentLeaderboardBasePath = basePath;

    const ranked = sortAndRankPlayers(players, sortBy);

    // For podium: top 3 by current sort (wins or win rate; require at least 1 game for win rate)
    const hasSignificant = sortBy === 'winRate'
        ? (p) => (parseInt(p.GamesPlayed) || 0) > 0 && p.WinRate > 0
        : (p) => parseFloat(p.Wins) > 0;
    const playersForPodium = ranked.filter(hasSignificant);
    const top3 = playersForPodium.slice(0, 3);
    const rest = ranked.slice(top3.length);

    let html = '';

    // Sort control (button toggles between Wins and Win rate)
    const sortLabel = sortBy === 'wins' ? 'Sort: Wins' : 'Sort: Win rate';
    html += '<div class="leaderboard-sort">';
    html += '<button type="button" id="leaderboard-sort-btn" class="leaderboard-sort-btn" aria-label="Switch sort">' + sortLabel + '</button>';
    html += '</div>';

    // Render podium if we have top 3 by current sort
    if (top3.length > 0) {
        html += '<div class="podium">';
        if (top3.length >= 2) {
            html += renderPodiumPlace(top3[1], 2, basePath);
        } else {
            html += '<div class="podium-place"></div>';
        }
        html += renderPodiumPlace(top3[0], 1, basePath);
        if (top3.length >= 3) {
            html += renderPodiumPlace(top3[2], 3, basePath);
        } else {
            html += '<div class="podium-place"></div>';
        }
        html += '</div>';
    }

    if (rest.length > 0) {
        html += '<div class="leaderboard">';
        rest.forEach(player => {
            html += renderLeaderboardItem(player, basePath);
        });
        html += '</div>';
    }

    if (top3.length === 0 && rest.length === 0) {
        html += '<div class="empty-podium">No players yet</div>';
    }

    container.innerHTML = html;

    const sortBtn = document.getElementById('leaderboard-sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            const nextSort = sortBy === 'wins' ? 'winRate' : 'wins';
            renderLeaderboard(currentLeaderboardPlayers, currentLeaderboardContainerId, currentLeaderboardBasePath, nextSort);
        });
    }
}

// Merge data from multiple CSVs (for combined leaderboard)
function mergePlayers(standardPlayers, caravanPlayers, seafarersPlayers = []) {
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
    
    // Add seafarers data
    seafarersPlayers.forEach(p => {
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
            const [standard, caravan, seafarers] = await Promise.all([
                loadCSV(csvPath.standard),
                loadCSV(csvPath.caravan),
                loadCSV(csvPath.seafarers)
            ]);
            const combined = mergePlayers(standard, caravan, seafarers);
            renderLeaderboard(combined, 'leaderboard-container', basePath);
        } else {
            const players = await loadCSV(csvPath);
            renderLeaderboard(players, 'leaderboard-container', basePath);
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}
