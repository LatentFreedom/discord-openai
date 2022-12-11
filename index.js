import { Client, Collection, Intents }  from 'discord.js'
import { Configuration, OpenAIApi } from "openai"
import { config }  from "dotenv"

config({ path: './.env' })

import fs from 'fs'

const getJsonData = () => {
    let rawdata = fs.readFileSync('info.json');
    const data = JSON.parse(rawdata);
    // console.log(data);
    return data;
}

let data = getJsonData();

// Configure OpenAI API
const configuration = new Configuration({
	organization: process.env.OPENAI_API_ORG,
	apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

// Configure Discord Client
const client = new Client({
    intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS]
})

// Set commands
let slashCommands = new Collection()
let textCommands = new Collection()

const createCommands = async () => {
	// Set commands from files
	const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
	for (const file of commandFiles) {
		const command = await import(`./commands/${file}`)
		if (command.command.data) {
			slashCommands.set(command.command.data.name, command.command)
		} else {
			textCommands.set(command.command.name, command.command)
		}
	}
	// Get guilds bot is in
	const Guilds = client.guilds.cache.map(guild => guild.id)
	// Add commands to all guilds
    Guilds.forEach(guildId => {
        const guild = client.guilds.cache.get(guildId)
		slashCommands.forEach(command => {
			guild.commands.create({
				name: command.data.name,
				description: command.data.description
			})
		})
	})
}

client.on('ready', async () => {
    console.log('OpenAI Bot Running...')
	// client.user.setActivity(`in the Metaverse`)
	client.user.setPresence({
        activities: [
			{
				name: 'for commands',
				type: 'WATCHING'
			}
		],
		status: "idle"
    })
	createCommands()
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
		await command.execute(message, args, client, openai)
	} catch (error) {
		console.error(error)
		await message.reply({ content: 'There was an error while executing this command!', ephemeral: true })
		client.user.setPresence({
            activities: [
                {
                    name: 'commands',
                    type: 'LISTENING'
                }
            ],
            status: "idle"
        })
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