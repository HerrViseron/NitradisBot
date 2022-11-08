const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('botping')
		.setDescription('Measures the roundtrip time a command takes.'),
	async execute(interaction) {
		const pingsent = await interaction.deferReply({ ephemeral: true, fetchReply: true });
		await interaction.editReply(`Roundtrip latency: ${pingsent.createdTimestamp - interaction.createdTimestamp}ms
and the Websocket heartbeat is: ${interaction.client.ws.ping}ms.`);
	},
};