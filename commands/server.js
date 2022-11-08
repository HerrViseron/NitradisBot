const { SlashCommandBuilder } = require('discord.js');
const { request } = require('undici');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Display information or control a Nitrado Gameserver.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('info')
				.setDescription('Display Server info.')
				.addIntegerOption(option =>
					option
						.setName('serverid')
						.setDescription('The ServerID to display info for.')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('start')
				.setDescription('Start the server.')
				.addIntegerOption(option =>
					option
						.setName('serverid')
						.setDescription('The ServerID to start.')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('stop')
				.setDescription('Stop a running server.')
				.addIntegerOption(option =>
					option
						.setName('serverid')
						.setDescription('The ServerID to stop.')
						.setRequired(true),
				),
		),
	async execute(interaction) {
		await interaction.deferReply();

		// since the ID is always required we can directly retriev it
		const serverID = interaction.options.getInteger('serverid');

		if (interaction.options.getSubcommand() === 'info') {
			const infoResult = await request(`https://api.nitrado.net/services/${serverID}/gameservers`, { headers: { authorization: process.env.NITRAPI_TOKEN } });
			const { data: { status, ip, port, query_port, game, game_human } } = await infoResult.body.json();
			await interaction.editReply(`Server Status: ${status}, Server IP: ${ip}, Server Port: ${port}, Server Query Port: ${query_port}, Server Game: ${game}, Server Game Human: ${game_human}`);
		}
		else if (interaction.options.getSubcommand() === 'start') {
			await interaction.editReply('Command is still WIP!');
		}
		else if (interaction.options.getSubcommand() === 'stop') {
			await interaction.editReply('Command is still WIP!');
		}

	},
};