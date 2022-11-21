const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whereami')
		.setDescription('Tells you on which Server you are and how many members that server has.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		await interaction.reply({ content: `You are on ${interaction.guild.name}, which has ${interaction.guild.memberCount} members.`, ephemeral: true });
	},
};