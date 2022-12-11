import { MessageEmbed } from 'discord.js'
import { ChatGPTAPI } from 'chatgpt'

const sendResponse = async (message, data, prompt) => {
    console.log('[chatgpt] send response')
    const embed = new MessageEmbed()
    .setTitle(`ChatGPT`)
    .addFields(
        { name: 'Prompt', value: `${prompt}` },
        { name: 'Response', value: `${data}`, inline: true }
    )
    await message.channel.send({ embeds: [embed] })
}

const sendErrorResponse = async (message, e) => {
    console.log(`[chatgpt] send error: ${e}`)
    const embed = new MessageEmbed()
    .setTitle(`ChatGPT`)
    .addFields(
        { name: 'Response', value: `There was an error getting a response from chatGPT`, inline: true }
    )
    await message.channel.send({ embeds: [embed] })
}

const command = {
    privilege: 'user',
	name : 'chatgpt',
    description : 'chat with chatgpt',
	async execute(message, args, client) {

        client.user.setPresence({
            activities: [
                {
                    name: 'with ChatGPT',
                    type: 'PLAYING'
                }
            ],
            status: "online"
        })
        
        const prompt = message.content.replace('>chatgpt ','')
        // console.log(prompt)

        if (!prompt) {
            sendErrorResponse(message, 'no prompt given')
        } else {

            try {
                const api = new ChatGPTAPI({
                    sessionToken: process.env.CHATGPT_SESSION_TOKEN
                })

                // ensure the API is properly authenticated
                await api.ensureAuth()

                // send a message and wait for the response
                const response = await api.sendMessage(
                    `${prompt}`
                )

                if (response.length > 900) {
                    // console.log('[chatgpt] response is longer than 1024')

                    // find total parts in response to make
                    const responseLength = response.length / 900

                    // split on ```
                    // const occurrences = (response.match(/```/g) || []).length

                    let unfinishedMarkdown = false
                    for (let i = 0; i < responseLength; i++) {
                        let r = response.slice(i*900,(1+i)*900)
                        
                        const firstIndex = response.indexOf('```')
                        const secondIndex = response.indexOf('```', firstIndex+1)

                        // Check if there is unfinished markdown
                        if (unfinishedMarkdown && firstIndex === -1 && sec) {
                            r = "```" + r
                        }

                        // Check if ``` is occurring once in this response part
                        if (firstIndex !== -1 && secondIndex === -1) {
                            r = r + "```"
                            unfinishedMarkdown = true
                        } else {
                            unfinishedMarkdown = false
                        }

                        await sendResponse(message, `**part ${i+1}**: ${r}`, prompt)
                    }
                } else {
                    await sendResponse(message, response, prompt)
                }
                
            } catch(e) {
                await sendErrorResponse(message, e)
            }

        }

        client.user.setPresence({
            activities: [
                {
                    name: 'for commands',
                    type: 'WATCHING'
                }
            ],
            status: "idle"
        })

	},
}

export { command }