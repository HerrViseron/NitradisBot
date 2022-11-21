const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays a list of all available commands with a little description!'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const commandsPath = path.join(__dirname, './');
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		const helpContent = new EmbedBuilder();
		helpContent.setColor(0xA8A8A8);

		helpContent.setTitle('Command Help');
		helpContent.setDescription('Here is a list of all available commands:');
		helpContent.setTimestamp();

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			// helpText += `/${command.data.name}	:	${command.data.description}\n`;
			helpContent.addFields(
				{ name: 'Command', value: `/${command.data.name}`, inline: true },
				{ name: 'Description', value: `${command.data.description}`, inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
			);
		}

		await interaction.editReply({ embeds: [helpContent] });

	},
};