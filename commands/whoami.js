const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whoami')
		.setDescription('Tells you who you are and when you joined the Server.'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.reply({ content: `You are ${interaction.user.username}, and you joined on ${interaction.member.joinedAt}.`, ephemeral: true });
	},
};