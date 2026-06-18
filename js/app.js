// js/app.js
document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".app-section");

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const target = button.getAttribute("data-target");
            navButtons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");

            sections.forEach(s => {
                if(s.id === target) s.classList.add("active");
                else s.classList.remove("active");
            });

            if(target === "stats-section" && typeof updateStatsView === "function") {
                updateStatsView();
            }
        });
    });
});
