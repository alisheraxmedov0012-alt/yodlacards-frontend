// js/api.js
const API_BASE_URL = "http://yodlacards-ai-bot-production.up.railway.app";

const getTelegramUserId = () => {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 123456789;
};

const API = {
    async getFlashcards() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/${getTelegramUserId()}/cards`);
            if (!response.ok) throw new Error("Xatolik");
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async saveCardProgress(cardId, isCorrect) {
        try {
            await fetch(`${API_BASE_URL}/api/flashcard/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: getTelegramUserId(),
                    card_id: cardId,
                    action: isCorrect ? "know" : "dont"
                })
            });
        } catch (error) {
            console.error("Progress saqlanmadi:", error);
        }
    },

    async sendPromptToAI(message) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-teacher`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: message })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "Serverda xatolik yuz berdi.";
        }
    },

    async getUserStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/${getTelegramUserId()}/stats`);
            return await response.json();
        } catch (error) {
            return null;
        }
    }
};
