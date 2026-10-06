const { Client } = require('discord.js-selfbot-v13');
require('dotenv').config();

const client = new Client();

const SYSTEM_INSTRUCTION = `

`;

let lastRequestTime = 0;
const COOLDOWN = 4000;

client.on('ready', () => {
    console.log(`[+] Bot conectado localmente via Ollama como: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;

    const startsWithNome = message.content.toLowerCase().startsWith('NOME_GATILHO');
    const isMentioned = message.mentions.has(client.user) || message.content.toLowerCase().includes('NOME_GATILHO');

    if (!startsWithNome && !isMentioned) return;

    const now = Date.now();
    if (now - lastRequestTime < COOLDOWN) return;
    lastRequestTime = now;

    try {
        await message.channel.sendTyping();

        const userMessage = message.content.replace(/^NOME_GATILHO/i, '').replace(/<@!?\d+>/g, '').trim();

        const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                messages: [
                    { role: 'system', content: SYSTEM_INSTRUCTION },
                    { role: 'user', content: userMessage || 'Oi' }
                ],
                stream: false,
                options: {
                    num_predict: 150,
                    temperature: 0.8
                }
            })
        });

        const responseData = await ollamaResponse.json();
        const replyText = responseData.message?.content ? responseData.message.content.trim() : null;

        if (!replyText) {
            console.log("Ollama retornou um texto vazio:", JSON.stringify(responseData));
            return;
        }

        await message.reply(replyText);

    } catch (error) {
        console.error('Erro ao conectar com o Ollama local:', error);
        await message.reply("Alguma estabilidade no servidor ocorreu");
    }
});

client.login(process.env.DISCORD_TOKEN);