# Discord OpenAI Bot
Discord bot that interacts with the OpenAI API

## Sites Used
1. Discord Dev URL **[https://discord.com/developers/applications](https://discord.com/developers/applications)**
2. Discord Bot Docs **[https://discord.com/developers/docs/intro](https://discord.com/developers/docs/intro)**
3. OpenAI Docs **[https://beta.openai.com/docs/api-reference](https://beta.openai.com/docs/api-reference)**

## Running the bot
1. Get the needed packages with `npm install`
2. Create `.env` and fill it with the needed values
3. Edit `info.json` with the optional values
4. run with `node index.js`

## Values in `.env`
```
DISCORD_TOKEN=
CHATGPT_SESSION_TOKEN=
OPENAI_API_KEY=
OPENAI_API_ORG=
```

## Discord -Commands (admin)
1. **>createimage** | Fetch Dalle-2 generated image given a prompt
2. **>chatgpt** | Fetch response using ChatGPT given a prompt
