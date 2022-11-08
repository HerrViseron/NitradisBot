const { REST, Routes } = require('discord.js');
// Require dotenv for loading the config vomr tne .env file
const dotenv = require('dotenv');
dotenv.config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const commandId = '';

// for guild-based commands
rest.delete(Routes.applicationGuildCommand(process.env.clientId, process.env.guildId, commandId))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);

// for global commands
rest.delete(Routes.applicationCommand(process.env.clientId, commandId))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);