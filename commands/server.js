const { SlashCommandBuilder, EmbedBuilder, channelLink, AutocompleteInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { request } = require('undici');
const db = require('../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Display information or control a Nitrado Gameserver.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Delete server entry from Database.')
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('The Servername to detele from the database. (Not the in game Name!) ')
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('import')
				.setDescription('Import Server ID into the Bot\'s Database.')
				.addIntegerOption(option =>
					option
						.setName('serverid')
						.setDescription('The ServerID to import.')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('Displayname for the server. (max. 25 Characters, used for command autocompletion)')
						.setRequired(true)
						.setMaxLength(25)
						.setMinLength(3),
				)
				.addStringOption(option =>
					option
						.setName('nitrado-token')
						.setDescription('API Token to use for this server.')
						.setRequired(true)
						.setMaxLength(100)
						.setMinLength(100),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('info')
				.setDescription('Display Server info.')
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('The ServerID to display info for.')
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('Shows a list existing servers in the database.'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('start')
				.setDescription('Start the server.')
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('The Server to start.')
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('restart')
				.setDescription('Restart the running server.')
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('The Server to restart.')
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('stop')
				.setDescription('Stop a running server.')
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('The Server to stop.')
						.setRequired(true)
						.setAutocomplete(true),
				),
		),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'server-name') {
			const serverList = await db.Server.findAll({ attributes: ['displayname'] });
			choices = serverList.map(s => s.displayname);
		}
		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {
		// It depends on the Subcommand if the response should be epemeral or not!
		// await interaction.deferReply();

		if (interaction.options.getSubcommand() === 'delete') {
			await interaction.deferReply({ ephemeral: true });

			const serverName = interaction.options.getString('server-name');

			try {
				await db.Server.destroy({ where: { displayname: serverName } });

				return interaction.editReply(`Server "${serverName}" successfully deleted from database.`);
			}
			catch (error) {
				return interaction.editReply(`Something went wrong with adding the server. Error: ${error.name}: ${error.message}`);
			}
		}
		else if (interaction.options.getSubcommand() === 'import') {
			await interaction.deferReply({ ephemeral: true });

			const serverID = interaction.options.getInteger('serverid');
			const serverName = interaction.options.getString('server-name');
			const nitradoToken = interaction.options.getString('nitrado-token');

			try {
				const server = await db.Server.create({
					id: serverID,
					displayname: serverName,
					nitradotoken: nitradoToken,
				});

				return interaction.editReply(`Server ${server.displayname} (#${server.id}) added.`);
			}
			catch (error) {
				if (error.name === 'SequelizeUniqueConstraintError') {
					return interaction.editReply('That Server already exists.');
				}

				return interaction.editReply(`Something went wrong with adding the server. Error: ${error.name}: ${error.message}`);
			}
		}
		else if (interaction.options.getSubcommand() === 'info') {
			await interaction.deferReply();

			const serverName = interaction.options.getString('server-name');

			const serverData = await db.Server.findOne({ where: { displayname: serverName } });

			if (serverData === null) {
				await interaction.editReply(`Server "${serverName}" not found in database!`);
			}
			else {
				const infoResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers`, { headers: { authorization: serverData.nitradotoken } });
				const jsonResult = await infoResult.body.json();

				const { 'status': requestStatus, 'message': requestStatus_message } = jsonResult;

				if (requestStatus === 'success') {
					const { data: { gameserver: { status, ip, port, query_port, game, game_human, settings: { config: { 'server-name': name } } } } } = jsonResult;
					const servername = name ?? game_human;

					const buttonServerStart = new ButtonBuilder()
						.setCustomId('serverStart')
						.setLabel('Start')
						.setStyle(ButtonStyle.Success);

					const buttonServerRestart = new ButtonBuilder()
						.setCustomId('serverRestart')
						.setLabel('Restart')
						.setStyle(ButtonStyle.Secondary);

					const buttonServerStop = new ButtonBuilder()
						.setCustomId('serverStop')
						.setLabel('Stop')
						.setStyle(ButtonStyle.Danger);

					const serverInfo = new EmbedBuilder();
					serverInfo.setColor(0xA8A8A8);
					let statusIcon = '⚪';
					switch (status) {
					case 'started':
						statusIcon = '🟢';
						serverInfo.setColor(0x00B000);
						buttonServerStart.setDisabled(true);
						buttonServerRestart.setDisabled(false);
						buttonServerStop.setDisabled(false);
						break;
					case 'stopped':
						statusIcon = '🔴';
						serverInfo.setColor(0xF00000);
						buttonServerStart.setDisabled(false);
						buttonServerRestart.setDisabled(true);
						buttonServerStop.setDisabled(true);
						break;
					case 'restarting':
						statusIcon = '🟡';
						serverInfo.setColor(0xFFEA00);
						buttonServerStart.setDisabled(true);
						buttonServerRestart.setDisabled(true);
						buttonServerStop.setDisabled(false);
						break;
					case 'stopping':
						statusIcon = '🟠';
						serverInfo.setColor(0xFFEA00);
						buttonServerStart.setDisabled(true);
						buttonServerRestart.setDisabled(true);
						buttonServerStop.setDisabled(false);
						break;
					}

					const serverControlButtons = new ActionRowBuilder().addComponents(buttonServerStart, buttonServerRestart, buttonServerStop);

					serverInfo.setTitle(servername);
					serverInfo.setDescription(`${statusIcon} ${game_human}`);
					serverInfo.setThumbnail(`https://static.nitrado.net/cdn/gameicons/256/${game}.jpg`);
					serverInfo.addFields(
						{ name: 'IP Address', value: `${ip}` },
						{ name: 'Game Port', value: `${port}`, inline: true },
						{ name: 'Query Port', value: `${query_port}`, inline: true },
					);
					serverInfo.setTimestamp();

					await interaction.editReply({ embeds: [serverInfo], components: [serverControlButtons] });

				}
				else {
					await interaction.editReply(`There was an error while contacting the NitrAPI: ${requestStatus_message}`);
				}
			}

		}
		else if (interaction.options.getSubcommand() === 'list') {
			await interaction.deferReply();

			const serverList = await db.Server.findAll({ attributes: ['displayname'] });
			const serverListString = serverList.map(s => s.displayname).join('\n') || 'No servers set.';

			await interaction.editReply(`List of servers:\n${serverListString}`);
		}
		else if (interaction.options.getSubcommand() === 'start') {
			await interaction.deferReply();

			const serverName = interaction.options.getString('server-name');

			const serverData = await db.Server.findOne({ where: { displayname: serverName } });

			if (serverData === null) {
				await interaction.editReply(`Server "${serverName}" not found in database!`);
			}
			else {
				const message = `Start via NitradisBot, from Server: ${interaction.guild.name}, by User: ${interaction.user.username}`;
				const query = new URLSearchParams({ message });
				const infoResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers/restart?${query}`, { headers: { authorization: serverData.nitradotoken }, method: 'POST' });
				const jsonResult = await infoResult.body.json();

				const { 'status': requestStatus, 'message': requestStatus_message } = jsonResult;

				if (requestStatus === 'success') {
					await interaction.editReply(`The server "${serverName}" will now start.`);
				}
				else {
					await interaction.editReply(`There was an error while contacting the NitrAPI: ${requestStatus_message}`);
				}
			}
		}
		else if (interaction.options.getSubcommand() === 'restart') {
			await interaction.deferReply();

			const serverName = interaction.options.getString('server-name');

			const serverData = await db.Server.findOne({ where: { displayname: serverName } });

			if (serverData === null) {
				await interaction.editReply(`Server "${serverName}" not found in database!`);
			}
			else {
				const message = `Restart via NitradisBot, from Server: ${interaction.guild.name}, by User: ${interaction.user.username}`;
				const query = new URLSearchParams({ message });
				const infoResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers/restart?${query}`, { headers: { authorization: serverData.nitradotoken }, method: 'POST' });
				const jsonResult = await infoResult.body.json();

				const { 'status': requestStatus, 'message': requestStatus_message } = jsonResult;

				if (requestStatus === 'success') {
					await interaction.editReply(`The server "${serverName}" will now restart.`);
				}
				else {
					await interaction.editReply(`There was an error while contacting the NitrAPI: ${requestStatus_message}`);
				}
			}
		}
		else if (interaction.options.getSubcommand() === 'stop') {
			await interaction.deferReply();

			const serverName = interaction.options.getString('server-name');

			const serverData = await db.Server.findOne({ where: { displayname: serverName } });

			if (serverData === null) {
				await interaction.editReply(`Server "${serverName}" not found in database!`);
			}
			else {
				const message = `Stop via NitradisBot, from Server: ${interaction.guild.name}, by User: ${interaction.user.username}`;
				const query = new URLSearchParams({ message });
				const infoResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers/stop?${query}`, { headers: { authorization: serverData.nitradotoken }, method: 'POST' });
				const jsonResult = await infoResult.body.json();

				const { 'status': requestStatus, 'message': requestStatus_message } = jsonResult; 

				if (requestStatus === 'success') {
					await interaction.editReply(`The server "${serverName}" will now stop.`);
				}
				else {
					await interaction.editReply(`There was an error while contacting the NitrAPI: ${requestStatus_message}`);
				}
			}
		}

	},
};