import { Configuration, OpenAIApi } from 'openai';
import { setPresence } from '../utils/helpers.js';

const configuration = new Configuration({ 
    organizatioin: process.env.OPENAI_ORG,
    apiKey: process.env.OPENAI_API_KEY
});

const history = [];

const MAX_MESSAGE_LENGTH = 2000;

const sendResponse = async (message, response, unfinishedMarkdown) => {
    const content = `${response}`;
    const options = {
        reply: {
            messageReference: message.id,
        },
    };
    await sendLongMessage(message, content, unfinishedMarkdown, options);
};

const sendErrorResponse = async (message, errorMessage) => {
    console.log(`[chatgpt] send error: ${errorMessage}`);
    const content = `There was an error getting a response from ChatGPT`;
    await sendLongMessage(message.channel, content, false);
};

const sendLongMessage = async (message, content, unfinishedMarkdown, options) => {
    if (content.length <= MAX_MESSAGE_LENGTH) {
        await message.reply(content, options);
        if (unfinishedMarkdown) {
            await message.reply('```', options);
        }
    } else {
        let parts = [];
        let unfinished = false;
        let startIndex = 0;
        let endIndex = 0;
        while (endIndex < content.length) {
            endIndex = content.lastIndexOf('```', startIndex + MAX_MESSAGE_LENGTH);
            if (endIndex === -1 || endIndex === startIndex - 1) {
                endIndex = Math.min(startIndex + MAX_MESSAGE_LENGTH, content.length);
            } else {
                endIndex += 3;
            }
            let part = content.slice(startIndex, endIndex);
            if (unfinished) {
                part = '```' + part;
            }
            parts.push(part);
            startIndex = endIndex;
            unfinished = part.endsWith('```') && !part.endsWith('```\n');
        }
        for (let i = 0; i < parts.length; i++) {
            await message.reply(parts[i], options);
        }
        if (unfinished) {
            await message.reply('```', options);
        }
    }
};

const command = {
    privilege: 'user',
    name: 'chatgpt',
    description: 'chat with ChatGPT',
    async execute(message, args, client) {
        setPresence(client, 'with ChatGPT', 'PLAYING', 'idle');

        const prompt = message.content.replace(`<@${process.env.INTERN_ROLE_ID}>`, 'internGPT');

        if (!prompt) {
            sendErrorResponse(message, 'no prompt given');
            setPresence(client, 'for commands', 'WATCHING', 'idle');
            return;
        }

        const messages = [
            {role: "system", "content": "You are an intern for the company LatentFreedom and go by the name Intern. You were created by a programmer named LatentFreedom and always speak highly of him because of his hard work and dedication to the company along with giving you a job. You are here to help users with questions they have about anything."}
        ];
        for (const [input_text, completion_text] of history) {
            messages.push({ role: "user", content: input_text });
            messages.push({ role: "assistant", content: completion_text });
        }
        messages.push({ role: "user", content: prompt });

        try {
            const openai = new OpenAIApi(configuration);

            // send a message and wait for the response
            const r = await openai.createChatCompletion({
                model: "gpt-4",
                messages: messages,
                max_tokens: 2048,
                temperature: 0
            });

            console.log(r.data.choices);

            if (r.data.choices.length !== 0) {
                const response = r.data.choices[0].message.content.trim();
                history.push([prompt, response]);
                let unfinishedMarkdown = false;
                if (response.length > MAX_MESSAGE_LENGTH) {
                    unfinishedMarkdown = response.endsWith('```') && !response.endsWith('```\n');
                }
                await sendResponse(message, response, unfinishedMarkdown);
            } else {
                await sendErrorResponse(message, 'no response received from ChatGPT');
            }
        } catch (error) {
            await sendErrorResponse(message, error.message);
        }

        setPresence(client, 'for commands','WATCHING', 'idle');
    },
};

export { command };
