const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bot')
		.setDescription('Some commands to control the Bot itself. Start typing command for subcommands.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('ping')
				.setDescription('Measures the roundtrip time a command takes.'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('restart')
				.setDescription('Restart the Bot process. (Actually kills it and relies on PM2 to restart the process)')
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'ping') {
			const pingsent = await interaction.deferReply({ ephemeral: true, fetchReply: true });
			await interaction.editReply(`Roundtrip latency: ${pingsent.createdTimestamp - interaction.createdTimestamp}ms
and the Websocket heartbeat is: ${interaction.client.ws.ping}ms.`);
		}
		else if (interaction.options.getSubcommand() === 'restart') {
			await interaction.reply({ content: 'Goodbye cruel world...', ephemeral: true });
			console.log('Restart command triggerd!');
			process.exit();
		}
	},
};