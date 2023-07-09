import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const getJsonData = (fileName) => {
    let rawdata = fs.readFileSync(fileName)
    const data = JSON.parse(rawdata)
    return data
}

const saveJsonData = async (data, fileName) => {
    const json = JSON.stringify(data, null, 4)
    fs.writeFile(fileName, json, (err) => {
        if (err) {
            console.log(err)
        } else {
            console.log(`${fileName} data saved successfully`)
        }
    })
}

const createCommands = async (client, slashCommands, textCommands) => {
	// Set commands from files
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const dirPath = path.resolve(__dirname, '../commands')

	const commandFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'))
	for (const file of commandFiles) {
		const command = await import(`${dirPath}/${file}`)
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

const deleteCommands = async () => {
	console.log(client.application.commands.cache)
	client.application.commands.set([])
	let commands = await client.guilds.cache.get(process.env.GUILD_ID).commands.fetch()
	commands.forEach(command => {
		command.delete()
	})
}

const setPresence = async (client, name, type, status) => {
	const types = {
		'PLAYING':0,
		'STREAMING':1,
		'LISTENING':2,
		'WATCHING':3,
		'CUSTOM':4,
		'COMPETING':5
	}
	client.user.setPresence({
        activities: [
			{
				name: name,
				type: types[type]
			}
		],
		status: status
    })
}

export { getJsonData, saveJsonData, setPresence, createCommands, deleteCommands }