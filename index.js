const { Client } = require('discord.js-selfbot-v13');
require('dotenv').config();

const client = new Client();

const SYSTEM_INSTRUCTION = `

`;

const channelHistories = new Map();
const MAX_HISTORY_LENGTH = 6;

let lastRequestTime = 0;
const COOLDOWN = 4000;

client.on('ready', () => {
    console.log(`[+] Bot conectado localmente com histórico de chat como: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {

    const isSelf = message.author.id === client.user.id;

    const channelId = message.channel.id;
    if (!channelHistories.has(channelId)) {
        channelHistories.set(channelId, []);
    }
    const history = channelHistories.get(channelId);

    const role = isSelf ? 'assistant' : 'user';
    const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();

    if (cleanContent) {
        history.push({ role, content: `${message.author.username}: ${cleanContent}` });

        if (history.length > MAX_HISTORY_LENGTH) {
            history.shift();
        }
    }

    if (isSelf) return;

    const isMentioned = message.mentions.has(client.user) || message.content.toLowerCase().includes('NOME_GATILHO');
    const CHANCE_DE_RESPONDER = 1.0; 

    if (!isMentioned && Math.random() > CHANCE_DE_RESPONDER) return;

    const now = Date.now();
    if (now - lastRequestTime < COOLDOWN) return;
    lastRequestTime = now;

    try {
        await message.channel.sendTyping();

        const messagesPayload = [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...history
        ];

        const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                messages: messagesPayload,
                stream: false,
                options: {
                    num_predict: 150,
                    temperature: 0.85
                }
            })
        });

        const responseData = await ollamaResponse.json();
        const replyText = responseData.message?.content ? responseData.message.content.trim() : null;

        if (!replyText) return;

        history.push({ role: 'assistant', content: replyText });
        if (history.length > MAX_HISTORY_LENGTH) {
            history.shift();
        }

        await message.reply(replyText);

    } catch (error) {
        console.error('Erro ao conectar com o Ollama local:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);