// js/quiz.js
document.addEventListener("DOMContentLoaded", () => {
    const qText = document.getElementById("quiz-question");
    const qOptions = document.getElementById("quiz-options");

    async function loadGlobalQuiz() {
        const cards = await API.getFlashcards();
        if(cards.length < 2) {
            qText.textContent = "Global test uchun lug'atda so'zlar yetarli emas.";
            return;
        }
        const correct = cards[Math.floor(Math.random() * cards.length)];
        qText.innerHTML = `Ushbu so'zning to'g'ri tarjimasini toping:<br><br><span class="highlight-q">🇬🇧 ${correct.english}</span>`;
        qOptions.innerHTML = "";

        let opts = [correct.uzbek];
        while(opts.length < Math.min(4, cards.length)) {
            let r = cards[Math.floor(Math.random() * cards.length)].uzbek;
            if(!opts.includes(r)) opts.push(r);
        }
        opts.sort(() => Math.random() - 0.5);

        opts.forEach(o => {
            const btn = document.createElement("button");
            btn.className = "option-btn"; btn.textContent = o;
            btn.addEventListener("click", () => {
                if(o === correct.uzbek) btn.classList.add("correct");
                else btn.classList.add("wrong");
                setTimeout(loadGlobalQuiz, 1500);
            });
            qOptions.appendChild(btn);
        });
    }
    loadGlobalQuiz();
});
                                     
