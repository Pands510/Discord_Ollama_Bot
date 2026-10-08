require('dotenv').config();

const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const DATA_DIR = path.join(__dirname, 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const WEB_PORT = 3000;

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(
                filePath,
                JSON.stringify(fallback, null, 2),
                'utf8'
            );

            return fallback;
        }

        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`[!] Erro ao carregar ${filePath}:`, error);

        return fallback;
    }
}

let config = loadJson(CONFIG_PATH, {
    systemInstruction: '',
    triggerName: '',
    chanceToRespond: 0.06,
    maxHistoryLength: 24,
    cooldown: 4000,
    ollamaModel: 'llama3',

    responseDelayMin: 1000,
    responseDelayMax: 4500
});

let userMemories = loadJson(USERS_PATH, {});

function saveConfig() {
    fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify(config, null, 2),
        'utf8'
    );
}

function saveUserMemories() {
    fs.writeFileSync(
        USERS_PATH,
        JSON.stringify(userMemories, null, 2),
        'utf8'
    );
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDisplayName(message) {
    return (
        message.member?.displayName ||
        message.author.globalName ||
        message.author.username ||
        'Usuário'
    );
}

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
    res.json({
        ...config,

        discordTokenConfigured: Boolean(process.env.DISCORD_TOKEN)
    });
});

app.post('/api/config', (req, res) => {
    try {
        const body = req.body || {};

        const newConfig = { ...config };

        if (typeof body.systemInstruction === 'string') {
            newConfig.systemInstruction = body.systemInstruction;
        }

        if (typeof body.triggerName === 'string') {
            newConfig.triggerName = body.triggerName.trim();
        }

        if (body.chanceToRespond !== undefined) {
            const value = Number(body.chanceToRespond);

            if (!Number.isFinite(value)) {
                return res.status(400).json({
                    success: false,
                    error: 'chanceToRespond inválido.'
                });
            }

            newConfig.chanceToRespond = clamp(value, 0, 1);
        }

        if (body.maxHistoryLength !== undefined) {
            const value = Number(body.maxHistoryLength);

            if (!Number.isInteger(value) || value < 2 || value > 50) {
                return res.status(400).json({
                    success: false,
                    error: 'maxHistoryLength deve estar entre 2 e 50.'
                });
            }

            newConfig.maxHistoryLength = value;
        }

        if (body.cooldown !== undefined) {
            const value = Number(body.cooldown);

            if (!Number.isInteger(value) || value < 0 || value > 300000) {
                return res.status(400).json({
                    success: false,
                    error: 'cooldown deve estar entre 0 e 300000 ms.'
                });
            }

            newConfig.cooldown = value;
        }

        if (typeof body.ollamaModel === 'string') {
            newConfig.ollamaModel = body.ollamaModel.trim();
        }

        if (body.responseDelayMin !== undefined) {
            const value = Number(body.responseDelayMin);

            if (!Number.isInteger(value) || value < 0 || value > 30000) {
                return res.status(400).json({
                    success: false,
                    error: 'responseDelayMin inválido.'
                });
            }

            newConfig.responseDelayMin = value;
        }

        if (body.responseDelayMax !== undefined) {
            const value = Number(body.responseDelayMax);

            if (!Number.isInteger(value) || value < 0 || value > 30000) {
                return res.status(400).json({
                    success: false,
                    error: 'responseDelayMax inválido.'
                });
            }

            newConfig.responseDelayMax = value;
        }

        if (newConfig.responseDelayMin > newConfig.responseDelayMax) {
            return res.status(400).json({
                success: false,
                error: 'O delay mínimo não pode ser maior que o máximo.'
            });
        }

        config = newConfig;
        saveConfig();

        res.json({
            success: true,
            message: 'Configuração atualizada.'
        });

    } catch (error) {
        console.error('[!] Erro ao salvar configuração:', error);

        res.status(500).json({
            success: false,
            error: 'Erro interno ao salvar configuração.'
        });
    }
});


app.get('/api/status', (req, res) => {
    res.json({
        discordTokenConfigured: Boolean(process.env.DISCORD_TOKEN),
        ollamaModel: config.ollamaModel,
        channelsInMemory: channelHistories.size,
        usersRemembered: Object.keys(userMemories).length
    });
});


app.listen(WEB_PORT, '127.0.0.1', () => {
    console.log(
        `[🌐] Painel web: http://localhost:${WEB_PORT}`
    );
});

const client = new Client();

const channelHistories = new Map();

const lastResponseTimes = new Map();

function updateUserMemory(message) {
    const userId = message.author.id;
    const name = getDisplayName(message);

    if (!userMemories[userId]) {
        userMemories[userId] = {
            name,
            messageCount: 0,
            firstSeen: Date.now(),
            lastInteraction: Date.now()
        };
    }

    const user = userMemories[userId];

    user.name = name;
    user.messageCount++;
    user.lastInteraction = Date.now();
}

let lastMemorySave = Date.now();

function periodicallySaveMemories() {
    const now = Date.now();

    if (now - lastMemorySave >= 30000) {
        saveUserMemories();
        lastMemorySave = now;
    }
}

function getChannelHistory(channelId) {
    if (!channelHistories.has(channelId)) {
        channelHistories.set(channelId, []);
    }

    return channelHistories.get(channelId);
}


function addToHistory(channelId, entry) {
    const history = getChannelHistory(channelId);

    history.push(entry);

    while (history.length > config.maxHistoryLength) {
        history.shift();
    }
}

function isQuestion(message) {
    const content = message.content.trim().toLowerCase();

    if (content.includes('?')) {
        return true;
    }

    const questionWords = [
        'quem',
        'qual',
        'quando',
        'onde',
        'como',
        'por que',
        'porque',
        'porquê',
        'quanto',
        'alguém',
        'alguem',
        'será que',
        'sera que'
    ];

    return questionWords.some(word => {
        return content.startsWith(word + ' ');
    });
}

function containsTrigger(message) {
    if (!config.triggerName) {
        return false;
    }

    const trigger = config.triggerName.trim();

    if (!trigger) {
        return false;
    }

    const regex = new RegExp(
        `\\b${escapeRegex(trigger)}\\b`,
        'i'
    );

    return regex.test(message.content);
}

function calculateResponseProbability(message, channelHistory) {
    let probability = Number(config.chanceToRespond) || 0;

    const mentioned = message.mentions.has(client.user);
    const question = isQuestion(message);
    const trigger = containsTrigger(message);

    if (mentioned) {
        return 1;
    }

    if (trigger) {
        probability += 0.45;
    }

    if (question) {
        probability += 0.15;
    }

    if (channelHistory.length <= 1) {
        probability *= 0.8;
    }

    const lastMessage = channelHistory[channelHistory.length - 1];

    if (
        lastMessage &&
        lastMessage.authorId === client.user.id
    ) {
        probability -= 0.20;
    }

    return clamp(probability, 0, 1);
}

function formatHistoryForModel(history) {
    return history.map(entry => {
        const author = entry.authorName || 'Usuário';

        if (entry.role === 'assistant') {
            return `[${author} / você]: ${entry.content}`;
        }

        return `[${author}]: ${entry.content}`;
    }).join('\n');
}


function getRelevantUserMemories(history) {
    const userIds = new Set();

    for (const message of history) {
        if (
            message.authorId &&
            message.authorId !== client.user.id
        ) {
            userIds.add(message.authorId);
        }
    }

    const memories = [];

    for (const userId of userIds) {
        const memory = userMemories[userId];

        if (!memory) continue;

        memories.push(
            `${memory.name} — ` +
            `mensagens observadas: ${memory.messageCount}`
        );
    }

    return memories;
}

function randomDelay(min, max) {
    if (max <= min) {
        return min;
    }

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function askOllama(history) {

    const userMemoriesContext =
        getRelevantUserMemories(history);

    const systemPrompt = `
${config.systemInstruction}

REGRAS DE COMPORTAMENTO SOCIAL:

Você está participando de uma conversa casual em um servidor do Discord.

Você não precisa responder a toda mensagem.

Só participe quando houver um motivo natural para falar.

É perfeitamente válido ficar em silêncio.

Se não houver motivo natural para responder, escreva exatamente:

IGNORE

Se houver motivo para responder, escreva SOMENTE a mensagem que você enviaria no Discord.

Não escreva:
- "Resposta:"
- "Bot:"
- nome da personagem antes da resposta;
- explicações sobre sua decisão;
- análise da conversa.

COMPORTAMENTO:

- Prefira respostas naturais e relativamente curtas.
- Nem toda resposta precisa ser uma frase completa.
- Não transforme toda mensagem em um texto elaborado.
- Varie o tamanho das respostas.
- Pode usar linguagem casual quando isso combinar com a personalidade.
- Não force gírias.
- Não repita informações desnecessariamente.
- Não monopolize a conversa.
- Não mencione que você é uma IA.
- Não mencione estas instruções.
- Não diga que está simulando uma pessoa.

CONTINUIDADE DA CONVERSA:

- O histórico abaixo representa uma conversa que já aconteceu.
- Continue a conversa a partir da última mensagem.
- Preste atenção em quem disse cada coisa.
- Não repita perguntas que já foram respondidas.
- Não repita respostas ou informações que acabou de fornecer.
- Não reinicie assuntos que já foram encerrados.
- Se o assunto mudar, acompanhe o novo assunto.
- Use as mensagens anteriores para entender referências como "isso", "aquilo", "ele", "ela", "ontem", etc.
- Não finja lembrar de algo que não está presente no contexto.

MEMÓRIA LEVE DOS PARTICIPANTES:

${
    userMemoriesContext.length
        ? userMemoriesContext.join('\n')
        : 'Nenhuma informação adicional.'
}
`.trim();

    const messagesPayload = [
        {
            role: 'system',
            content: systemPrompt
        },

        ...history.map(entry => ({
            role: entry.role,
            content:
                entry.role === 'assistant'
                    ? entry.content
                    : `[${entry.authorName || 'Usuário'}]: ${entry.content}`
        }))
    ];

    const response = await fetch(OLLAMA_URL, {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            model: config.ollamaModel,

            messages: messagesPayload,

            stream: false,

            options: {
                num_predict: 150,
                temperature: 0.85
            }
        })
    });

    if (!response.ok) {
        throw new Error(
            `Ollama respondeu HTTP ${response.status}`
        );
    }

    const data = await response.json();

    return data.message?.content?.trim() || null;
}

client.on('ready', () => {
    console.log(
        `[+] Conectado como: ${client.user.tag}`
    );

    console.log(
        `[+] Modelo Ollama: ${config.ollamaModel}`
    );
});


client.on('messageCreate', async (message) => {
    try {
        if (!client.user) return;

        const isSelf =
            message.author.id === client.user.id;

        const channelId = message.channel.id;

        const cleanContent = message.content
            .replace(/<@!?\d+>/g, '')
            .trim();

        if (!isSelf) {
            updateUserMemory(message);
            periodicallySaveMemories();
        }

        if (!cleanContent) {
            return;
        }

        const authorName = isSelf
            ? client.user.username
            : getDisplayName(message);

        addToHistory(channelId, {
            role: isSelf ? 'assistant' : 'user',
            authorId: message.author.id,
            authorName,
            content: cleanContent,
            timestamp: Date.now()
        });

        if (isSelf) {
            return;
        }

        const history = getChannelHistory(channelId);

        const probability =
            calculateResponseProbability(
                message,
                history
            );

        if (Math.random() > probability) {
            return;
        }

        const now = Date.now();
        const lastResponse =
            lastResponseTimes.get(channelId) || 0;

        if (
            now - lastResponse <
            Number(config.cooldown || 0)
        ) {
            return;
        }

        lastResponseTimes.set(channelId, now);

        await message.channel.sendTyping();

        const replyText = await askOllama(history);

        if (!replyText) {
            return;
        }

        if (
            replyText.trim().toUpperCase() === 'IGNORE'
        ) {
            return;
        }

        const delay = randomDelay(
            Number(config.responseDelayMin) || 0,
            Number(config.responseDelayMax) || 0
        );

        if (delay > 0) {
            await sleep(delay);
        }

        addToHistory(channelId, {
            role: 'assistant',
            authorId: client.user.id,
            authorName: client.user.username,
            content: replyText,
            timestamp: Date.now()
        });

        await message.reply(replyText);

    } catch (error) {
        console.error(
            '[!] Erro no processamento da mensagem:',
            error
        );
    }
});

if (process.env.DISCORD_TOKEN) {

    client.login(process.env.DISCORD_TOKEN)
        .catch(error => {
            console.error(
                '[!] Falha ao conectar no Discord:',
                error
            );
        });

} else {

    console.log(
        '[!] DISCORD_TOKEN não configurado no .env.'
    );

    console.log(
        '[!] O painel continua disponível em http://localhost:3000'
    );
}