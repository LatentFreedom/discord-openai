import { MessageEmbed } from 'discord.js'

const sendResponse = async (message, data, prompt) => {
    // console.log('[sendResponse:createimage]')
    const embed = new MessageEmbed()
    .setTitle(`Create Image`)
    .addFields(
        { name: 'prompt', value: prompt }
    )
    const embed1 = new MessageEmbed()
    .setTitle(`Image 1`)
    .setImage(data.data.data[0].url)
    const embed2 = new MessageEmbed()
    .setTitle(`Image 2`)
    .setImage(data.data.data[1].url)
    await message.channel.send({ embeds: [embed, embed1, embed2] })
}

const sendErrorResponse = async (message, e) => {
    // console.log(`[sendErrorResponse:createimage] [ERROR] ${e}`)
    const embed = new MessageEmbed()
    .setTitle(`Create Image`)
    .addFields(
        { name: 'Response', value: `There was an error getting a response from OpenAI`, inline: true }
    )
    await message.channel.send({ embeds: [embed] })
}

const command = {
    privilege: 'user',
	name : 'createimage',
    description : 'Get AI images from a given prompt created with OpenAI',
	async execute(message, args, client, openai) {

        client.user.setPresence({
            activities: [
                {
                    name: 'using AI',
                    type: 'PLAYING'
                }
            ],
            status: "online"
        })

        const prompt = message.content.replace('>createimage ','')
        // console.log(prompt)

        if (!prompt) {
            sendErrorResponse(message, 'no prompt given')
        } else {

            try {
                const response = await openai.createImage({
                    prompt: `"${prompt}"`,
                    n: 2,
                    size: "1024x1024",
                })
                sendResponse(message, response, prompt)
            } catch(e) {
                sendErrorResponse(message, e)
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