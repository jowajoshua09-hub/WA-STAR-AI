const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const { setupPairRoutes } = require('./pair.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Memory + Anti-spam
const MEMORY_FILE = './memory.json';
let memory = fs.existsSync(MEMORY_FILE)? JSON.parse(fs.readFileSync(MEMORY_FILE)) : {};
const MAX_MEMORY = 10;
const cooldowns = {};
const COOLDOWN_TIME = 10000;

const DEEPSEEK_URL = "http://API/hostify.indev.in/api/ai/deepseek";
const PORT = process.env.PORT || 3000;
let sock;

function saveMemory() {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory));
}

async function callDeepSeek(messages) {
    try {
        const res = await axios.post(DEEPSEEK_URL, { messages }, { timeout: 20000 });
        return res.data.reply || res.data.response || res.data.content;
    } catch (e) {
        console.log("API Error:", e.message);
        return null;
    }
}

async function start(sockInstance) {
    sockInstance.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const message = msg.message;
        let text = message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || message.videoMessage?.caption || "";

        // ANTI-BAN
        if (Math.random() < 0.1) return;
        if(cooldowns[from] && Date.now() - cooldowns[from] < COOLDOWN_TIME) {
            const left = Math.ceil((COOLDOWN_TIME - (Date.now() - cooldowns[from])) / 1000);
            return sockInstance.sendMessage(from, {text: `chill bro, wait ${left}s 😅`});
        }
        cooldowns[from] = Date.now();
        await sockInstance.sendPresenceUpdate('composing', from);
        await new Promise(r => setTimeout(r, 2000 + Math.random()*3000));

        if (!memory[from]) memory[from] = [];
        let chatHistory = memory[from];
        let userInput = "";

        // 1. REPLY TO MESSAGE
        if(message.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = message.extendedTextMessage.contextInfo.quotedMessage;
            const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || quoted.imageMessage?.caption || "[media]";
            userInput = `User is replying to: "${quotedText}"\nAnd said: "${text}"`;
        }
        // 2. FORWARDED
        else if(message.extendedTextMessage?.contextInfo?.isForwarded) {
            userInput = `User forwarded this: "${text}"`;
        }
        // 3. IMAGE
        else if(message.imageMessage) {
            userInput = text? `User sent an image with caption: ${text}` : `User sent an image`;
        }
        // 4. VIDEO
        else if(message.videoMessage) {
            userInput = text? `User sent a video with caption: ${text}` : `User sent a video`;
        }
        // 5. NORMAL TEXT
        else if(text) {
            userInput = text;
        } else {
            return;
        }

        // HELP
        if(userInput.toLowerCase() === 'help') {
            return sockInstance.sendMessage(from, {text: `⭐ *Star AI Commands*\n\n1. Chat normally\n2. Reply to my messages\n3. \`generate image of [prompt]\`\n4. Send images/videos\nI remember last 10 messages 😄`});
        }

        // IMAGE GEN
        if (userInput.toLowerCase().includes("generate image of") || userInput.toLowerCase().includes("draw")) {
            const prompt = userInput.replace(/generate image of|draw|make a picture of/i, "").trim();
            if(!prompt) return sockInstance.sendMessage(from, {text: "what should I draw bro?"});
            await sockInstance.sendMessage(from, {text: "okay making it for you 🎨"});
            const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024`;
            await sockInstance.sendMessage(from, { image: { url: imgUrl }, caption: `Prompt: ${prompt}` });
            return;
        }

        chatHistory.push({ role: "user", content: userInput });
        if (chatHistory.length > MAX_MEMORY) chatHistory = chatHistory.slice(-MAX_MEMORY);
        memory[from] = chatHistory; saveMemory();

        const messagesForAI = [
            { role: "system", content: "You are Star AI, a friendly and funny WhatsApp assistant. You can see when users reply to messages, forward messages, or send images/videos. Reply casually like a close friend. Keep it short, max 2 sentences." },
       ...chatHistory
        ];

        const aiReply = await callDeepSeek(messagesForAI);
        let finalReply = aiReply || ["huh what 😅","say that again bro?"][Math.floor(Math.random()*2)];
        if(aiReply) {
            chatHistory.push({ role: "assistant", content: finalReply });
            memory[from] = chatHistory; saveMemory();
        }
        await sockInstance.sendMessage(from, { text: finalReply });
    });
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Star AI', 'Chrome', '1.0.0']
    });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'open') console.log('✅ Star AI connected');
        if(connection === 'close') {
            const code = lastDisconnect.error?.output?.statusCode
            if(code === 401) return console.log("❌ Logged out / Banned");
            setTimeout(connectToWhatsApp, 30000);
        }
    });
    start(sock);
}

setupPairRoutes(app, () => sock);
connectToWhatsApp();
app.listen(PORT, () => console.log(`Star AI running on ${PORT}`));