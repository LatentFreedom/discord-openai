const { Client, Collection, Intents } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

require('dotenv').config();
const fs = require('fs');

// Configure OpenAI API
const configuration = new Configuration({
	organization: process.env.OPENAI_API_ORG,
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Configure Discord Client
const client = new Client({
    intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS]
});

// Set commands
let slashCommands = new Collection();
let textCommands = new Collection();

const createCommands = () => {
	// Set commands from files
	const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		if (command.data) {
			slashCommands.set(command.data.name, command);
		} else {
			textCommands.set(command.name, command);
		}
	}
	// Get guilds bot is in
	const Guilds = client.guilds.cache.map(guild => guild.id);
	// Add commands to all guilds
    Guilds.forEach(guildId => {
        const guild = client.guilds.cache.get(guildId);
		slashCommands.forEach(command => {
			guild.commands.create({
				name: command.data.name,
				description: command.data.description
			})
		})
	})
}

const deleteCommands = async () => {
	console.log(client.application.commands.cache)
	client.application.commands.set([]);
	let commands = await client.guilds.cache.get(process.env.GUILD_ID).commands.fetch()
	commands.forEach(command => {
		command.delete()
	})
}

client.on('ready', async () => {
    console.log('OpenAI Bot Running...');
	// client.user.setActivity(`in the Metaverse`);
	client.user.setPresence({
        activities: [
			{
				name: 'for commands',
				type: 'WATCHING'
			}
		],
		status: "idle"
    });
	createCommands()
});

client.on('messageCreate', async (message) => {
	const prefix = '>';
	
	// Check if message came from a bot
	if (message.author.bot) return;

	// Check for command prefixes
    if (!message.content.startsWith(prefix)) return;

	// if (message.channelId !== data[message.guildId].admin_bot_channel_id) return;
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandText = args.shift().toLowerCase();
	const command = textCommands.get(commandText);
	if (!command) return;

	try {
		await command.execute(message, args, client, openai);
	} catch (error) {
		console.error(error);
		await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
    if (!interaction.isCommand()) return;

	const command = slashCommands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(client, interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
})

client.login(process.env.DISCORD_TOKEN);