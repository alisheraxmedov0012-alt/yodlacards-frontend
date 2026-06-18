// js/flashcards.js
let userSets = {};
let tempNewSetWords = [];
let currentCreatingSetName = "";

let activePlayCards = [];
let activePlayIndex = 0;
let knowCards = [];
let dontCards = [];
let currentSetName = "";
let currentSessionMode = "flashcard"; // "flashcard" yoki "quiz"

document.addEventListener("DOMContentLoaded", () => {
    // View Elements
    const setsView = document.getElementById("sets-view");
    const addSetView = document.getElementById("add-set-view");
    const playSetView = document.getElementById("play-set-view");
    const playQuizView = document.getElementById("play-quiz-view");
    const resultSetView = document.getElementById("result-set-view");

    // Form Elements
    const setsList = document.getElementById("sets-list");
    const inputSetName = document.getElementById("input-set-name");
    const setNameGroup = document.getElementById("set-name-group");
    const wordInputsGroup = document.getElementById("word-inputs-group");
    const currentCreatingSetLabel = document.getElementById("current-creating-set-name");
    const addedWordsCountLabel = document.getElementById("added-words-count");
    const inputEng = document.getElementById("input-eng");
    const inputUzb = document.getElementById("input-uzb");

    // Play Card Elements
    const flashcard = document.getElementById("flashcard");
    const cardEn = document.getElementById("card-en");
    const cardUz = document.getElementById("card-uz");
    const cardAi = document.getElementById("card-ai");
    const cardProgress = document.getElementById("card-progress-indicator");

    // Play Quiz Elements
    const quizQuestionText = document.getElementById("set-quiz-question");
    const quizOptionsContainer = document.getElementById("set-quiz-options");
    const quizProgress = document.getElementById("quiz-progress-indicator");

    // Local Storage or Server Cache init
    userSets = JSON.parse(localStorage.getItem("user_sets")) || {
        "Oxford Essential Words": [
            { id: 1, english: "Abandon", uzbek: "Tark etmoq, tashlab ketmoq", ai_info: "Verb - cease to support or look after." },
            { id: 2, english: "Accurate", uzbek: "Aniq, to'g'ri", ai_info: "Adjective - correct in all details." },
            { id: 3, english: "Beneficial", uzbek: "Foydali, samarali", ai_info: "Adjective - favorable or advantageous." },
            { id: 4, english: "Capable", uzbek: "Qobiliyatli, uddaburon", ai_info: "Adjective - having the ability to do something." }
        ]
    };

    function renderSetsList() {
        setsList.innerHTML = "";
        Object.keys(userSets).forEach(setName => {
            const count = userSets[setName].length;
            const block = document.createElement("div");
            block.className = "set-item-card";
            block.innerHTML = `
                <div class="set-info">
                    <h3>📦 ${setName}</h3>
                    <p>${count} ta so'z</p>
                </div>
                <div class="set-action-buttons">
                    <button class="action-play-btn card-mode">🎴 Flashcard</button>
                    <button class="action-play-btn quiz-mode">📝 Quiz</button>
                </div>
            `;
            
            block.querySelector(".card-mode").addEventListener("click", (e) => {
                e.stopPropagation();
                startSession(setName, userSets[setName], "flashcard");
            });

            block.querySelector(".quiz-mode").addEventListener("click", (e) => {
                e.stopPropagation();
                startSession(setName, userSets[setName], "quiz");
            });

            setsList.appendChild(block);
        });
    }

    // --- CREATE SET LOGIC ---
    document.getElementById("btn-create-set").addEventListener("click", () => {
        setsView.classList.add("hidden-view");
        addSetView.classList.remove("hidden-view");
        setNameGroup.classList.remove("hidden-view");
        wordInputsGroup.classList.add("hidden-view");
        inputSetName.value = "";
    });

    document.getElementById("btn-confirm-set-name").addEventListener("click", () => {
        const name = inputSetName.value.trim();
        if(!name) return;
        currentCreatingSetName = name;
        currentCreatingSetLabel.textContent = name;
        addedWordsCountLabel.textContent = "0";
        setNameGroup.classList.add("hidden-view");
        wordInputsGroup.classList.remove("hidden-view");
        tempNewSetWords = [];
    });

    document.getElementById("btn-add-more-word").addEventListener("click", async () => {
        const eng = inputEng.value.trim();
        const uzb = inputUzb.value.trim();
        if(!eng || !uzb) return;

        const wordObj = {
            id: Date.now() + Math.random(),
            english: eng,
            uzbek: uzb,
            ai_info: "YodlaCards Pro generatori."
        };

        try {
            await fetch(`${API_BASE_URL}/api/flashcard/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 123456789,
                    english: eng,
                    uzbek: uzb
                })
            });
        } catch(e){}

        tempNewSetWords.push(wordObj);
        addedWordsCountLabel.textContent = tempNewSetWords.length;
        inputEng.value = ""; inputUzb.value = "";
        inputEng.focus();
    });

    document.getElementById("btn-finish-set").addEventListener("click", () => {
        const eng = inputEng.value.trim();
        const uzb = inputUzb.value.trim();
        if(eng && uzb) {
            tempNewSetWords.push({ id: Date.now(), english: eng, uzbek: uzb, ai_info: "Qo'shildi" });
        }
        if(tempNewSetWords.length === 0) return;

        userSets[currentCreatingSetName] = tempNewSetWords;
        localStorage.setItem("user_sets", JSON.stringify(userSets));
        addSetView.classList.add("hidden-view");
        setsView.classList.remove("hidden-view");
        renderSetsList();
    });

    // --- ENGINE HANDLER ---
    function startSession(setName, cardsArray, mode) {
        currentSetName = setName;
        activePlayCards = [...cardsArray];
        activePlayIndex = 0;
        knowCards = [];
        dontCards = [];
        currentSessionMode = mode;

        setsView.classList.add("hidden-view");
        resultSetView.classList.add("hidden-view");

        if (mode === "flashcard") {
            playSetView.classList.remove("hidden-view");
            playQuizView.classList.add("hidden-view");
            showFlashcard();
        } else {
            playQuizView.classList.remove("hidden-view");
            playSetView.classList.add("hidden-view");
            showQuizQuestion();
        }
    }

    // --- FLASHCARD MODE ENGINE ---
    function showFlashcard() {
        if(activePlayIndex >= activePlayCards.length) {
            finishSession();
            return;
        }
        flashcard.classList.remove("flipped");
        cardProgress.textContent = `${activePlayIndex + 1} / ${activePlayCards.length}`;
        const current = activePlayCards[activePlayIndex];
        cardEn.textContent = current.english;
        cardUz.textContent = current.uzbek;
        cardAi.textContent = current.ai_info || "Qo'shimcha ma'lumot yo'q.";
    }

    flashcard.addEventListener("click", () => flashcard.classList.toggle("flipped"));

    document.getElementById("btn-correct").addEventListener("click", (e) => {
        e.stopPropagation();
        knowCards.push(activePlayCards[activePlayIndex]);
        API.saveCardProgress(activePlayCards[activePlayIndex].id, true);
        activePlayIndex++;
        showFlashcard();
    });

    document.getElementById("btn-wrong").addEventListener("click", (e) => {
        e.stopPropagation();
        dontCards.push(activePlayCards[activePlayIndex]);
        API.saveCardProgress(activePlayCards[activePlayIndex].id, false);
        activePlayIndex++;
        showFlashcard();
    });

    // --- AUTO-GENERATED QUIZ MODE ENGINE ---
    function showQuizQuestion() {
        if(activePlayIndex >= activePlayCards.length) {
            finishSession();
            return;
        }

        quizProgress.textContent = `${activePlayIndex + 1} / ${activePlayCards.length}`;
        const current = activePlayCards[activePlayIndex];
        quizQuestionText.innerHTML = `Ushbu so'zning to'g'ri tarjimasini toping:<br><br><span class="highlight-q">🇬🇧 ${current.english}</span>`;
        quizOptionsContainer.innerHTML = "";

        // Dinamik variantlar yaratish generatori (4 ta variant)
        let options = [current.uzbek];
        
        // Mavjud global so'zlar zaxirasini shakllantirish
        let globalPool = [];
        Object.values(userSets).forEach(arr => globalPool.push(...arr));

        while(options.length < Math.min(4, globalPool.length)) {
            let randWord = globalPool[Math.floor(Math.random() * globalPool.length)].uzbek;
            if(!options.includes(randWord)) {
                options.push(randWord);
            }
        }
        
        // Variantlarni aralashtirish (Shuffle)
        options.sort(() => Math.random() - 0.5);

        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "quiz-opt-btn";
            btn.textContent = opt;
            btn.addEventListener("click", () => {
                const allBtns = quizOptionsContainer.querySelectorAll(".quiz-opt-btn");
                allBtns.forEach(b => b.style.pointerEvents = "none");

                if(opt === current.uzbek) {
                    btn.classList.add("success-opt");
                    knowCards.push(current);
                    if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                } else {
                    btn.classList.add("error-opt");
                    dontCards.push(current);
                    if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                    
                    // To'g'risini ham ko'rsatamiz Foydalanuvchiga xato darsi bo'lishi uchun
                    allBtns.forEach(b => {
                        if(b.textContent === current.uzbek) b.classList.add("success-opt");
                    });
                }

                setTimeout(() => {
                    activePlayIndex++;
                    showQuizQuestion();
                }, 1500);
            });
            quizOptionsContainer.appendChild(btn);
        });
    }

    // --- RESULTS HANDLING ---
    function finishSession() {
        playSetView.classList.add("hidden-view");
        playQuizView.classList.add("hidden-view");
        resultSetView.classList.remove("hidden-view");

        const total = knowCards.length + dontCards.length;
        const scorePercent = total > 0 ? Math.round((knowCards.length / total) * 100) : 0;

        document.getElementById("res-percent").textContent = `${scorePercent}%`;
        document.getElementById("res-know").textContent = knowCards.length;
        document.getElementById("res-dont").textContent = dontCards.length;

        document.getElementById("btn-retry-wrong").style.display = dontCards.length === 0 ? "none" : "block";
    }

    document.getElementById("btn-retry-wrong").addEventListener("click", () => {
        startSession(currentSetName, dontCards, currentSessionMode);
    });

    document.getElementById("btn-retry-all").addEventListener("click", () => {
        startSession(currentSetName, userSets[currentSetName], currentSessionMode);
    });

    document.getElementById("btn-go-home-sets").addEventListener("click", () => {
        resultSetView.classList.add("hidden-view");
        setsView.classList.remove("hidden-view");
        renderSetsList();
    });

    document.getElementById("btn-back-to-sets").addEventListener("click", () => {
        playSetView.classList.add("hidden-view");
        setsView.classList.remove("hidden-view");
    });
    
    document.getElementById("btn-quiz-back-to-sets").addEventListener("click", () => {
        playQuizView.classList.add("hidden-view");
        setsView.classList.remove("hidden-view");
    });

    renderSetsList();
});

