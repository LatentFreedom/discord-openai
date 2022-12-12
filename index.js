import { Client, Collection, Intents }  from 'discord.js'
import { config }  from "dotenv"

import { getJsonData, setPresence, createCommands } from './utils/helpers.js'

config({ path: './.env' })

let data = getJsonData('info.json')

// Configure Discord Client
const client = new Client({
    intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS]
})

// Set commands
let slashCommands = new Collection()
let textCommands = new Collection()

client.on('ready', async () => {
    console.log('OpenAI Bot Running...')
	setPresence(client, 'for commands','WATCHING','idle')
	createCommands(client, slashCommands, textCommands)
})

client.on('messageCreate', async (message) => {
	const prefix = '>'
	
	// Check if message came from a bot
	if (message.author.bot) return

	// Check for command prefixes
    if (!message.content.startsWith(prefix)) return

	// Check for allowed channels
	const allowedChannels = data[message.guildId] ? data[message.guildId].allowed_channels : null
	if (allowedChannels && allowedChannels.length > 0 && allowedChannels.indexOf(message.channelId) === -1) return

	const args = message.content.slice(prefix.length).split(/ +/)
	const commandText = args.shift().toLowerCase()
	const command = textCommands.get(commandText)
	if (!command) return

	try {
		await command.execute(message, args, client)
	} catch (error) {
		console.error(error)
		await message.reply({ content: 'There was an error while executing this command!', ephemeral: true })
		setPresence(client, 'for commands','WATCHING','idle')
	}
})

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return

	const command = slashCommands.get(interaction.commandName)

	if (!command) return

	try {
		await command.execute(client, interaction)
	} catch (error) {
		console.error(error)
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
	}
})

client.login(process.env.DISCORD_TOKEN)