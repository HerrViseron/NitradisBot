const { SlashCommandBuilder, EmbedBuilder, channelLink } = require('discord.js');
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
				.setName('import')
				.setDescription('Import Server ID into the Bot\'s Database. Imported Servers will be available for control and autopcomplete in commands.')
				.addIntegerOption(option =>
					option
						.setName('serverid')
						.setDescription('The ServerID to import.')
						.setRequired(true),
				)
				.addIntegerOption(option =>
					option
						.setName('server-name')
						.setDescription('Displayname for the server (max. 25 Characters). Not the actual name which will be used in game, but this name is used for all comannds refering a server. This name will be used for command autocompletion.')
						.setRequired(true),
				)
				.addIntegerOption(option =>
					option
						.setName('nitrado-token')
						.setDescription('API Token to use for this server.')
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
			const jsonResult = await infoResult.body.json();

			const { 'status': requestStatus, message } = jsonResult;

			if (requestStatus === 'success') {
				const { data: { gameserver: { status, ip, port, query_port, game, game_human, settings: { config: { 'server-name': name } } } } } = jsonResult;
				const servername = name ?? game_human;

				const serverInfo = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle(servername)
					.setDescription(`${status} Game: ${game_human}`)
					.addFields(
						{ name: 'IP Address', value: `${ip}` },
						{ name: 'Game Port', value: `${port}` },
						{ name: 'Query Port', value: `${query_port}` },
					)
					.setTimestamp();

				if (status === 'started') {
					serverInfo.setColor(0x00B000);
				}
				else if (status === 'stopped') {
					serverInfo.setColor(0xF00000);
				}
				else if (status === 'restarting') {
					serverInfo.setColor(0xFFEA00);
				}
				else if (status === 'stopping') {
					serverInfo.setColor(0xFFEA00);
				}

				/*
				await interaction.editReply(`Request Status: ${requestStatus}, Server Status: ${status}, Server Name: ${servername} Server IP: ${ip}, Server Port: ${port}, Server Query Port: ${query_port}, Server Game: ${game}, Server Game Human: ${game_human}
	Settings Name: ${name}`);
				*/
				// await interaction.deleteReply();
				await interaction.editReply({ embeds: [serverInfo] });
				// await message.channel.send({ embed: [serverInfo] });

			}
			else {
				await interaction.editReply(`There was an error while contacting the NitrAPI: ${message}`);
			}

		}
		else if (interaction.options.getSubcommand() === 'start') {
			await interaction.editReply('Command is still WIP!');
		}
		else if (interaction.options.getSubcommand() === 'stop') {
			await interaction.editReply('Command is still WIP!');
		}

	},
};