// js/stats.js
async function updateStatsView() {
    const data = await API.getUserStats();
    if(data) {
        document.getElementById("stat-level").textContent = data.level || 1;
        document.getElementById("stat-xp").textContent = data.xp || 0;
        document.getElementById("stat-coins").textContent = data.coins || 0;
        document.getElementById("stat-streak").textContent = data.streak || 0;
        document.getElementById("stat-words").textContent = data.total_words || 0;
    }
}
