# Discord Ollama Bot

Bot conversacional local utilizando Node.js + Ollama.

> [!WARNING]
> O uso de SelfBots rompe com os [Termos de Serviço](https://discord.com/terms), portanto, use em servidores privados ou grupos fechados, **com moderação**. De preferência, utilize uma conta secundária para reduzir o risco de banimento.
>
> Não me responsabilizo pelo uso indevido deste projeto.

## Características

- Respostas geradas localmente
- "Personalidade" configurável
- Histórico de conversa
- Memória básica dos participantes
- Chance contextual de participação
- Cooldown por canal
- Delay de resposta configurável
- Painel web local
- Compatível com modelos disponíveis no Ollama

## Requisitos

- Node.js
- Ollama
- Conta do Discord
- Git (opcional, caso o projeto seja clonado pelo repositório)

| Componente | Mínimos | Recomendados | Confortável |
|---|---|---|---|
| **CPU** | 4 núcleos / 8 threads | 6 núcleos / 12 threads | 8+ núcleos / 16+ threads |
| **RAM** | 8 GB | **16 GB** | 32 GB |
| **GPU** | Não obrigatória | 8–12 GB VRAM | **12–16+ GB VRAM** |
| **Armazenamento** | SSD, 20 GB livres | NVMe SSD, 50 GB livres | NVMe SSD, 100+ GB livres |
| **Sistema** | Windows 10/11, Linux ou macOS | Windows 11/Linux/macOS | Windows 11/Linux/macOS |
| **Modelo local** | 3B–4B quantizado | **7B–8B quantizado** | 7B–14B+ quantizado |
| **Uso esperado** | Testes e uso pessoal leve | **Uso normal do bot** | Respostas mais rápidas / modelos maiores |

> [!NOTE]
> Os requisitos de hardware dependem principalmente do modelo utilizado pelo Ollama. O Node.js, Express e o cliente do Discord possuem consumo relativamente baixo; a maior parte do processamento é realizada pelo modelo de linguagem.
>
> Uma GPU dedicada **não é obrigatória**. O Ollama pode executar modelos utilizando apenas a CPU, embora as respostas normalmente sejam mais lentas.

---

## Instalação

### 1. Instale o Node.js

Baixe e instale uma versão **LTS** do Node.js:

https://nodejs.org/

Após a instalação, verifique se o Node.js e o npm estão disponíveis:

```bash
node --version
npm --version
```

Se os dois comandos retornarem uma versão, a instalação está funcionando.

---

### 2. Instale o Ollama

O Ollama é responsável por executar o modelo de linguagem localmente.

Baixe o instalador correspondente ao seu sistema operacional:

https://ollama.com/download

#### Windows

1. Baixe o instalador para Windows.
2. Execute o instalador.
3. Conclua a instalação.
4. Abra o PowerShell ou Prompt de Comando.
5. Verifique a instalação:

```powershell
ollama --version
```

#### Linux

Instale o Ollama utilizando o instalador oficial:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Depois, verifique:

```bash
ollama --version
```

#### macOS

Baixe o aplicativo correspondente à sua versão do macOS:

https://ollama.com/download

Depois da instalação, confirme pelo terminal:

```bash
ollama --version
```

> [!TIP]
> Em sistemas onde o Ollama possui aplicativo em segundo plano, mantenha o Ollama em execução enquanto o bot estiver sendo utilizado. O projeto se comunica com o Ollama através da API local, normalmente disponível em `http://localhost:11434`.

---

### 3. Baixe um modelo de linguagem

O Ollama não inclui necessariamente um modelo pronto para uso. É necessário baixar pelo menos um modelo antes de iniciar o bot.

Por exemplo:

```bash
ollama pull llama3
```

Esse comando fará o download do modelo e armazenará seus arquivos localmente.

Para verificar os modelos instalados:

```bash
ollama list
```

Você deverá encontrar o modelo baixado na lista.

Também é possível executar o modelo diretamente para testar se o Ollama está funcionando:

```bash
ollama run llama3
```

Digite uma mensagem, como:

```text
Olá! Quem é você?
```

Se o modelo responder, o Ollama está funcionando corretamente.

Para sair da conversa:

```text
/bye
```

> [!IMPORTANT]
> O modelo utilizado pelo bot precisa corresponder ao nome configurado em `config.json`.
>
> Por exemplo, se o arquivo estiver configurado como:
>
> ```json
> "ollamaModel": "llama3"
> ```
>
> então o modelo `llama3` precisa estar instalado através do Ollama.

Para utilizar outro modelo, primeiro faça o download:

```bash
ollama pull nome-do-modelo
```

Depois altere `ollamaModel` no `config.json`.

Consulte a biblioteca de modelos disponíveis em:

https://ollama.com/library

---

### 4. Clone o projeto

Clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/discord-ollama-bot.git
```

Entre na pasta:

```bash
cd discord-ollama-bot
```

---

### 5. Instale as dependências

Dentro da pasta do projeto, execute:

```bash
npm install
```

O npm instalará automaticamente as dependências especificadas no `package.json`.

---

## Configuração

### 6. Configure o arquivo `.env`

Crie uma cópia do arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, caso o comando acima não funcione:

```powershell
Copy-Item .env.example .env
```

Abra o arquivo `.env` e configure:

```env
DISCORD_TOKEN=seu_token
```

### Obtendo o token da conta

Este projeto utiliza `discord.js-selfbot-v13`, portanto o valor esperado é o **token da conta do Discord utilizada pelo SelfBot**.

> [!WARNING]
> **Nunca publique seu token.**
>
> Não coloque o token diretamente no código, no `index.js`, no `public/index.html`, em screenshots ou em commits do Git.
>
> O arquivo `.env` deve permanecer no `.gitignore`.

Para usuários que já sabem como obter o token da própria conta, existem extensões e ferramentas de terceiros que podem facilitar o acesso. **Tenha cuidado ao utilizar ferramentas desse tipo e nunca forneça seu token a serviços desconhecidos.**

---

### 7. Configure o bot

Após instalar o projeto, execute:

```bash
npm start
```

Se tudo estiver configurado corretamente, o servidor web local será iniciado e o cliente do Discord tentará realizar o login.

Abra no navegador:

```text
http://localhost:3000
```

O painel web permite visualizar e modificar as configurações disponíveis do bot.

---

## Primeiro uso

Antes de testar o bot, confirme:

1. O **Ollama está instalado**.
2. Existe pelo menos **um modelo instalado**.
3. O modelo configurado em `config.json` corresponde ao modelo instalado.
4. O arquivo `.env` contém o token da conta.
5. As dependências foram instaladas com `npm install`.
6. O bot foi iniciado com `npm start`.
7. O painel está acessível em `http://localhost:3000`.

Uma configuração inicial pode utilizar:

```json
{
  "systemInstruction": "",
  "triggerName": "",
  "chanceToRespond": 0.06,
  "maxHistoryLength": 24,
  "cooldown": 4000,
  "ollamaModel": "llama3",
  "responseDelayMin": 1000,
  "responseDelayMax": 4500
}
```

Depois de iniciar o projeto, envie algumas mensagens no Discord e aguarde uma eventual resposta do bot.

> [!NOTE]
> O bot possui uma **chance configurável de participação**. Portanto, ele não necessariamente responderá a todas as mensagens.
>
> Além disso, o `cooldown` e o `responseDelay` podem fazer com que uma resposta demore alguns segundos.

---

## Estrutura básica

```text
discord-ollama-bot/
├── index.js
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── config.json
├── config.example.json
├── data/
│   └── .gitkeep
└── public/
    └── index.html
```

Os arquivos `.env`, `config.json` e o conteúdo de `data/` são destinados à configuração e execução local e **não devem ser publicados no repositório**.

---

# Discord Ollama Bot

A local conversational bot using Node.js + Ollama.

> [!WARNING]
> Using SelfBots violates the [Discord Terms of Service](https://discord.com/terms). Therefore, use them only in private servers or closed groups, **with moderation**. Preferably, use a secondary account to reduce the risk of being banned.
>
> I am not responsible for misuse of this project.

## Features

- Locally generated responses
- Configurable "personality"
- Conversation history
- Basic participant memory
- Contextual participation chance
- Per-channel cooldown
- Configurable response delay
- Local web dashboard
- Compatible with models available through Ollama

## Requirements

- Node.js
- Ollama
- Discord account
- Git (optional, if cloning the repository)

| Component | Minimum | Recommended | Comfortable |
|---|---|---|---|
| **CPU** | 4 cores / 8 threads | 6 cores / 12 threads | 8+ cores / 16+ threads |
| **RAM** | 8 GB | **16 GB** | 32 GB |
| **GPU** | Not required | 8–12 GB VRAM | **12–16+ GB VRAM** |
| **Storage** | SSD, 20 GB free | NVMe SSD, 50 GB free | NVMe SSD, 100+ GB free |
| **OS** | Windows 10/11, Linux, or macOS | Windows 11/Linux/macOS | Windows 11/Linux/macOS |
| **Local Model** | 3B–4B quantized | **7B–8B quantized** | 7B–14B+ quantized |
| **Expected Use** | Testing and light personal use | **Standard bot usage** | Faster responses / larger models |

> [!NOTE]
> Hardware requirements depend primarily on the model used by Ollama. Node.js, Express, and the Discord client have relatively low resource usage; most of the processing is performed by the language model.
>
> A dedicated GPU is **not required**. Ollama can run models using only the CPU, although responses will generally be slower.

---

## Installation

### 1. Install Node.js

Download and install an **LTS** version of Node.js:

https://nodejs.org/

After installation, verify that Node.js and npm are available:

```bash
node --version
npm --version
```

If both commands return a version number, the installation is working correctly.

---

### 2. Install Ollama

Ollama is responsible for running the language model locally.

Download the installer for your operating system:

https://ollama.com/download

#### Windows

1. Download the Windows installer.
2. Run the installer.
3. Complete the installation.
4. Open PowerShell or Command Prompt.
5. Verify the installation:

```powershell
ollama --version
```

#### Linux

Install Ollama using the official installer:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Then verify:

```bash
ollama --version
```

#### macOS

Download the appropriate application for your macOS version:

https://ollama.com/download

After installation, verify it through the terminal:

```bash
ollama --version
```

> [!TIP]
> Keep Ollama running while using the bot. The project communicates with Ollama through its local API, normally available at `http://localhost:11434`.

---

### 3. Download a language model

Ollama requires a language model to be installed before the bot can generate responses.

For example:

```bash
ollama pull llama3
```

Check your installed models with:

```bash
ollama list
```

You can also run the model directly to verify that Ollama is working:

```bash
ollama run llama3
```

Try sending:

```text
Hello! Who are you?
```

If the model responds, Ollama is working correctly.

To exit the conversation:

```text
/bye
```

> [!IMPORTANT]
> The model used by the bot must match the model configured in `config.json`.
>
> For example:
>
> ```json
> "ollamaModel": "llama3"
> ```
>
> requires the `llama3` model to be installed.

To use another model, download it first:

```bash
ollama pull model-name
```

Then change `ollamaModel` in `config.json`.

See the available models at:

https://ollama.com/library

---

### 4. Clone the project

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/discord-ollama-bot.git
```

Enter the project directory:

```bash
cd discord-ollama-bot
```

---

### 5. Install dependencies

Inside the project directory, run:

```bash
npm install
```

npm will automatically install the dependencies specified in `package.json`.

---

## Configuration

### 6. Configure `.env`

Create a copy of the example file:

```bash
cp .env.example .env
```

On Windows PowerShell, if the command above does not work:

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure:

```env
DISCORD_TOKEN=your_token
```

### Getting the account token

This project uses `discord.js-selfbot-v13`, so the expected value is the **token of the Discord account being used by the SelfBot**.

> [!WARNING]
> **Never publish your token.**
>
> Do not place it directly in the source code, `index.js`, `public/index.html`, screenshots, or Git commits.
>
> The `.env` file should remain listed in `.gitignore`.

If you already know how to obtain your own account token, third-party extensions and tools may provide ways to access it. **Be careful when using such tools and never provide your token to unknown services.**

---

### 7. Configure the bot

Start the project:

```bash
npm start
```

If everything is configured correctly, the local web server will start and the Discord client will attempt to log in.

Open:

```text
http://localhost:3000
```

The local web dashboard allows you to view and modify the bot's available settings.

---

## First Use

Before testing the bot, make sure:

1. **Ollama is installed**.
2. At least **one model is installed**.
3. The model configured in `config.json` matches the installed model.
4. `.env` contains the account token.
5. Dependencies were installed with `npm install`.
6. The project was started with `npm start`.
7. The dashboard is available at `http://localhost:3000`.

An initial configuration can use:

```json
{
  "systemInstruction": "",
  "triggerName": "",
  "chanceToRespond": 0.06,
  "maxHistoryLength": 24,
  "cooldown": 4000,
  "ollamaModel": "llama3",
  "responseDelayMin": 1000,
  "responseDelayMax": 4500
}
```

After starting the project, send some messages in Discord and wait for the bot to respond.

> [!NOTE]
> The bot has a **configurable chance of participating** in conversations, so it will not necessarily respond to every message.
>
> The `cooldown` and `responseDelay` settings can also cause responses to take several seconds.

---

## Basic Structure

```text
discord-ollama-bot/
├── index.js
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── config.json
├── config.example.json
├── data/
│   └── .gitkeep
└── public/
    └── index.html
```

The `.env`, `config.json`, and contents of `data/` are intended for local configuration/runtime and **should not be published to the repository**.
