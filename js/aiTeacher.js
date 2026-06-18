// js/aiTeacher.js
document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("chat-messages");
    const input = document.getElementById("ai-input");
    const send = document.getElementById("btn-send-ai");

    function appendMsg(txt, sender) {
        const div = document.createElement("div");
        div.className = `msg ${sender}`;
        div.textContent = txt;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        return div;
    }

    async function handleSend() {
        const val = input.value.trim();
        if(!val) return;
        appendMsg(val, "user");
        input.value = "";

        const load = appendMsg("AI O'qituvchi o'ylamoqda...", "ai");
        const res = await API.sendPromptToAI(val);
        load.textContent = res;
    }

    send.addEventListener("click", handleSend);
    input.addEventListener("keypress", (e) => { if(e.key === "Enter") handleSend(); });
});
