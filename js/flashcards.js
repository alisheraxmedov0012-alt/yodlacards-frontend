// js/flashcards.js

let userSets = {};
let tempNewSetWords = [];
let currentCreatingSetName = "";

let activePlayCards = [];
let activePlayIndex = 0;
let knowCards = [];
let dontCards = [];
let currentSetName = "";
let currentSessionMode = "flashcard"; 

document.addEventListener("DOMContentLoaded", async () => {
    const tg = window.Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;
    
    if (tgUser) {
        const usernameEl = document.getElementById("username");
        const avatarEl = document.getElementById("user-avatar");
        if (usernameEl) usernameEl.textContent = `${tgUser.first_name} ${tgUser.last_name || ""}`.trim();
        if (avatarEl && tgUser.photo_url) avatarEl.src = tgUser.photo_url;
    }

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

    // 🛠 KARTANING ORQA TOMONINI KO'RSATISH MEXANIZMI (ENG ISHONCHLI USUL)
    if (flashcard) {
        flashcard.onclick = function(e) {
            // Tugmalar bosilsa karta aylanmaydi
            if (e.target.closest('#btn-correct') || e.target.closest('#btn-wrong')) return;

            this.classList.toggle("flipped");

            // AGAR KARTA AYLANSA (flipped klassi bo'lsa) MATNNI ALMASHTIRAMIZ
            if (this.classList.contains("flipped")) {
                cardEn.style.display = "none"; // Inglizchani yashirish
                cardUz.style.display = "block"; // O'zbekchani ko'rsatish
                if (cardAi) cardAi.style.display = "block";
            } else {
                cardEn.style.display = "block"; // Inglizchani qaytarish
                cardUz.style.display = "none";  // O'zbekchani yashirish
                if (cardAi) cardAi.style.display = "none";
            }
        };
    }

    // --- SERVERDAN KARTALARNI YUKLASH (ESKI USUL) ---
    async function loadUserSetsFromServer() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/flashcards`);
            if (response.ok) {
                const cards = await response.json();
                userSets = {};
                cards.forEach(card => {
                    const setName = card.set_name || "Asosiy To'plam";
                    if (!userSets[setName]) userSets[setName] = [];
                    userSets[setName].push({
                        id: card.id,
                        english: card.english,
                        uzbek: card.uzbek,
                        ai_info: card.ai_info || "YodlaCards AI ta'rifi."
                    });
                });
            }
        } catch (error) {
            console.error("Xatolik:", error);
            userSets = JSON.parse(localStorage.getItem("user_sets")) || {};
        }
        renderSetsList();
    }

    function renderSetsList() {
        if (!setsList) return;
        setsList.innerHTML = "";
        
        const setNames = Object.keys(userSets);
        if (setNames.length === 0) {
            setsList.innerHTML = `<p style="text-align:center; color:#64748b; margin-top:20px;">Sizda hali to'plamlar yo'q. "Yangi Set" tugmasi orqali yarating!</p>`;
            return;
        }

        setNames.forEach(setName => {
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
            
            block.querySelector(".card-mode").onclick = function(e) {
                e.stopPropagation();
                startSession(setName, userSets[setName], "flashcard");
            };

            block.querySelector(".quiz-mode").onclick = function(e) {
                e.stopPropagation();
                startSession(setName, userSets[setName], "quiz");
            };

            setsList.appendChild(block);
        });
    }

    // --- YANGI SET YARATISH ---
    if(document.getElementById("btn-create-set")) {
        document.getElementById("btn-create-set").onclick = function() {
            setsView.classList.add("hidden-view");
            addSetView.classList.remove("hidden-view");
            setNameGroup.classList.remove("hidden-view");
            wordInputsGroup.classList.add("hidden-view");
            inputSetName.value = "";
        };
    }

    if(document.getElementById("btn-confirm-set-name")) {
        document.getElementById("btn-confirm-set-name").onclick = function() {
            const name = inputSetName.value.trim();
            if(!name) return;
            currentCreatingSetName = name;
            currentCreatingSetLabel.textContent = name;
            addedWordsCountLabel.textContent = "0";
            setNameGroup.classList.add("hidden-view");
            wordInputsGroup.classList.remove("hidden-view");
            tempNewSetWords = [];
        };
    }

    if(document.getElementById("btn-add-more-word")) {
        document.getElementById("btn-add-more-word").onclick = function() {
            const eng = inputEng.value.trim();
            const uzb = inputUzb.value.trim();
            if(!eng || !uzb) return;

            tempNewSetWords.push({
                id: Date.now() + Math.random(),
                english: eng,
                uzbek: uzb,
                ai_info: "Yuklanmoqda..."
            });
            
            addedWordsCountLabel.textContent = tempNewSetWords.length;
            inputEng.value = ""; inputUzb.value = "";
            inputEng.focus();
        };
    }

    if(document.getElementById("btn-finish-set")) {
        document.getElementById("btn-finish-set").onclick = async function() {
            const eng = inputEng.value.trim();
            const uzb = inputUzb.value.trim();
            if(eng && uzb) {
                tempNewSetWords.push({ id: Date.now(), english: eng, uzbek: uzb, ai_info: "Qo'shildi" });
            }
            if(tempNewSetWords.length === 0) return;

            for (let word of tempNewSetWords) {
                try {
                    await fetch(`${API_BASE_URL}/api/flashcard/add`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            set_name: currentCreatingSetName,
                            english: word.english,
                            uzbek: word.uzbek
                        })
                    });
                } catch(e){ console.error(e); }
            }

            userSets[currentCreatingSetName] = tempNewSetWords;
            localStorage.setItem("user_sets", JSON.stringify(userSets));
            
            addSetView.classList.add("hidden-view");
            setsView.classList.remove("hidden-view");
            await loadUserSetsFromServer();
        };
    }

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

    // --- FLASHCARD REJIMI ---
    function showFlashcard() {
        if(activePlayIndex >= activePlayCards.length) {
            finishSession();
            return;
        }
        if(flashcard) {
            flashcard.classList.remove("flipped");
            cardEn.style.display = "block";  // Keyingi so'zga o'tganda inglizcha ochilsin
            cardUz.style.display = "none";   // O'zbekcha yashirilsin
            if (cardAi) cardAi.style.display = "none";
        }
        
        cardProgress.textContent = `${activePlayIndex + 1} / ${activePlayCards.length}`;
        const current = activePlayCards[activePlayIndex];
        cardEn.textContent = current.english;
        cardUz.textContent = current.uzbek;
        cardAi.textContent = current.ai_info || "Qo'shimcha ma'lumot yo'q.";
    }

    document.getElementById("btn-correct").onclick = function(e) {
        e.stopPropagation();
        knowCards.push(activePlayCards[activePlayIndex]);
        activePlayIndex++;
        showFlashcard();
    };

    document.getElementById("btn-wrong").onclick = function(e) {
        e.stopPropagation();
        dontCards.push(activePlayCards[activePlayIndex]);
        activePlayIndex++;
        showFlashcard();
    };

    // --- QUIZ REJIMI ---
    function showQuizQuestion() {
        if(activePlayIndex >= activePlayCards.length) {
            finishSession();
            return;
        }

        quizProgress.textContent = `${activePlayIndex + 1} / ${activePlayCards.length}`;
        const current = activePlayCards[activePlayIndex];
        quizQuestionText.innerHTML = `Ushbu so'zning to'g'ri tarjimasini toping:<br><br><span class="highlight-q">🇬🇧 ${current.english}</span>`;
        quizOptionsContainer.innerHTML = "";

        let options = [current.uzbek];
        let globalPool = [];
        Object.values(userSets).forEach(arr => globalPool.push(...arr));

        while(options.length < Math.min(4, globalPool.length)) {
            let randWord = globalPool[Math.floor(Math.random() * globalPool.length)].uzbek;
            if(!options.includes(randWord)) options.push(randWord);
        }
        
        options.sort(() => Math.random() - 0.5);

        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "quiz-opt-btn";
            btn.textContent = opt;
            btn.onclick = function() {
                const allBtns = quizOptionsContainer.querySelectorAll(".quiz-opt-btn");
                allBtns.forEach(b => b.style.pointerEvents = "none");

                if(opt === current.uzbek) {
                    btn.classList.add("success-opt");
                    knowCards.push(current);
                } else {
                    btn.classList.add("error-opt");
                    dontCards.push(current);
                    allBtns.forEach(b => {
                        if(b.textContent === current.uzbek) b.classList.add("success-opt");
                    });
                }

                setTimeout(() => {
                    activePlayIndex++;
                    showQuizQuestion();
                }, 1500);
            };
            quizOptionsContainer.appendChild(btn);
        });
    }

    // --- NATIJALAR ---
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

    document.getElementById("btn-retry-wrong").onclick = function() {
        startSession(currentSetName, dontCards, currentSessionMode);
    };

    document.getElementById("btn-retry-all").onclick = function() {
        startSession(currentSetName, userSets[currentSetName], currentSessionMode);
    };

    document.getElementById("btn-go-home-sets").onclick = function() {
        resultSetView.classList.add("hidden-view");
        setsView.classList.remove("hidden-view");
        renderSetsList();
    };

    document.getElementById("btn-back-to-sets").onclick = function() {
        playSetView.classList.add("hidden-view");
        setsView.classList.remove("hidden-view");
    };
    
    document.getElementById("btn-quiz-back-to-sets").onclick = function() {
        playQuizView.classList.add("hidden-view");
        setsView.classList.remove("hidden-view");
    };

    await loadUserSetsFromServer();
});
                
