const { SlashCommandBuilder, EmbedBuilder, channelLink, AutocompleteInteraction } = require('discord.js');
const { request } = require('undici');
const db = require('../database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Control a Nitrado Gameserver or display information. Start typing command for subcommands.')
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
				)
				.addBooleanOption(option =>
					option
						.setName('pin-message')
						.setDescription('Should the message be pinned in the channel? Content will auto update every minute.')
						.setRequired(false),
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
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('switch')
				.setDescription('Switch active game on server.')
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('Server where the games shoud be switched.')
						.setRequired(true)
						.setAutocomplete(true),
				)
				.addStringOption(option =>
					option
						.setName('game')
						.setDescription('Select which installed game should be the active game.')
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('unpin')
				.setDescription('Unpin a Server Info Message and remove od from autoupdate.')
				.addStringOption(option =>
					option
						.setName('server-name')
						.setDescription('The Server to remove the Message for')
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
		if (focusedOption.name === 'game') {
			const serverName = await interaction.options.getString('server-name');
			const gameList = await db.Server.findAll({
				where: {
					displayname: serverName
				},
				attributes: ['installedGames'] 
			}); 
			gamesString = gameList.map(s => s.installedGames).join('');
			console.log(gameList);
			choices = gamesString.split(', ');
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
			const pinMessage = interaction.options.getBoolean('pin-message') ?? false;

			const serverData = await db.Server.findOne({ where: { displayname: serverName } });

			if (serverData === null) {
				await interaction.editReply(`Server "${serverName}" not found in database!`);
			}
			else {
				// Try Catch the API Response for the initial Server Info
				const infoResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers`, { headers: { authorization: serverData.nitradotoken } });
				// Try Catch the JSON Parse for the initial Server Info
				const jsonResult = await infoResult.body.json();
				
				const { 'status': requestStatus, 'message': requestStatus_message } = jsonResult;
				if (requestStatus !== 'success') {
					return interaction.editReply(`Something went wrong while getting server information from NitrAPI. Error: ${gamrequestStatusesStatus}: ${requestStatus_message}`);
				}

				// get Info about the active Games, for example to get the URL of the Icon
				// Try Catch the API Response for the Server Games List
				const gamesResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers/games`, { headers: { authorization: serverData.nitradotoken } });
				// Try Catch the JSON Parse for the Server Games List
				const gamesJson = await gamesResult.body.json();

				const { 'status': gamesStatus, 'message': gamesStatus_message } = gamesJson;
				if (gamesStatus !== 'success') {
					return interaction.editReply(`Something went wrong while getting istalled Games from NitrAPI. Error: ${gamesStatus}: ${gamesStatus_message}`);
				}

				const { data: { games } } = gamesJson;
				const [activeGame] = await games.filter(entry => entry.active === true);
				const installedGames = [];
				for (const game of games) {
					if (game.installed === true){
						installedGames.push(game.name);
					}
				}

				//const { data: { gameserver: { status, ip, port, query_port, game, game_human, settings: { config: { 'server-name': name } } } } } = jsonResult;
				//const servername = name ?? game_human;
				const { data: { gameserver: { status, ip, port, query_port, game, game_human } } } = jsonResult;

				const serverInfo = new EmbedBuilder();
				serverInfo.setColor(0xA8A8A8);
				let statusIcon = '⚪';
				switch (status) {
				case 'started':
					statusIcon = '🟢';
					serverInfo.setColor(0x00B000);
					break;
				case 'stopped':
					statusIcon = '🔴';
					serverInfo.setColor(0xF00000);
					break;
				case 'restarting':
					statusIcon = '🟡';
					serverInfo.setColor(0xFFEA00);
					break;
				case 'stopping':
					statusIcon = '🟡';
					serverInfo.setColor(0xFFEA00);
					break;
				case 'gs_installation':
					statusIcon = '🟣';
					serverInfo.setColor(0x8D65C5);
					break;
				}

				serverInfo.setTitle(serverName);
				serverInfo.setDescription(`${statusIcon} ${game_human}`);
				serverInfo.setThumbnail(activeGame.icons.x256);
				serverInfo.addFields(
					{ name: 'IP Address', value: `${ip}` },
					{ name: 'Game Port', value: `${port}`, inline: true },
					{ name: 'Query Port', value: `${query_port}`, inline: true },
				);

				//Some Server specific query information, only for selected games!
				const games_with_query = ["valheim"]
				if(games_with_query.includes(game)) {
					const { data: { gameserver: { query } } } = jsonResult;
					serverInfo.addFields(
						{name: 'Server Name:', value: `${query.server_name}` },
						{name: 'Players Online:', value: `${query.player_current}`, inline: true },
					);
				}

				serverInfo.addFields(
					{ name: 'Installed Games:', value: `${installedGames.join(', ')}` },
				);
				serverInfo.setTimestamp();

				try {
					await db.Server.update({
						installedGames: installedGames.join(', '),
						activeGame: game_human
					},{
						where: {
							id: serverData.id
						}
					});
				}
				catch (error) {
					return interaction.editReply(`Something went wrong while updating the database entry. Error: ${error.name}: ${error.message}`);
				}

				if (pinMessage) {
					serverInfo.setFooter({ text: 'This Message will update every minute!' });
				}
				const message = await interaction.editReply({ embeds: [serverInfo] });

				if (pinMessage) {

					try {

						await db.ServerInfoCron.create({
							messageId: message.id,
							channelId: interaction.channelId,
							servername: serverName,
						});

						await message.pin();

					}
					catch (error) {
						if (error.name === 'SequelizeUniqueConstraintError') {
							return interaction.editReply('That Server or Message is already in the schedules tables.');
						}

						return interaction.editReply(`Something went wrong while adding the message into the schedule table. Error: ${error.name}: ${error.message}`);
					}
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
		else if (interaction.options.getSubcommand() === 'switch') {
			await interaction.deferReply();

			const serverName = interaction.options.getString('server-name');
			const serverGame = interaction.options.getString('game');
/*** TO DO */
			const serverData = await db.Server.findOne({ where: { displayname: serverName } });

			if (serverData === null) {
				await interaction.editReply(`Server "${serverName}" not found in database!`);
			}
			else if (serverGame === null) {
				await interaction.editReply(`You need to specify a game!`);
			}
			else {
				const gamesResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers/games`, { headers: { authorization: serverData.nitradotoken } });
				const gamesJson = await gamesResult.body.json();

				const { 'status': gamesRequestStatus, 'message': gamesRequestStatus_message } = gamesJson; 

				if (gamesRequestStatus === 'success') {
					const { data: { games } } = gamesJson;
					const [selectedGame] = await games.filter(entry => entry.name === serverGame);

					const game = selectedGame.folder_short;
					const query = new URLSearchParams({ game });
					const infoResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers/games/start?${query}`, { headers: { authorization: serverData.nitradotoken }, method: 'POST' });
					const jsonResult = await infoResult.body.json();

					const { 'status': requestStatus, 'message': requestStatus_message } = jsonResult; 

					if (requestStatus === 'success') {
						await interaction.editReply(`The game of "${serverName}" will now switch to "${serverGame}".`);
					}
					else {
						await interaction.editReply(`There was an error while contacting the NitrAPI: ${requestStatus_message}`);
					}
					
				}
				else {
					await interaction.editReply(`There was an error while contacting the NitrAPI: ${gamesRequestStatus_message}`);
				}
			}
		}
		else if (interaction.options.getSubcommand() === 'unpin') {
			await interaction.deferReply({ ephemeral: true });

			const serverName = interaction.options.getString('server-name');

			const serverInfoMessage = await db.ServerInfoCron.findOne({ where: { servername: serverName } });

			if (serverInfoMessage === null) {
				await interaction.editReply(`No Message found for Server "${serverName}"!`);
			}
			else {
				try {
					const channel = await interaction.client.channels.fetch(serverInfoMessage.channelId);
					const message = await channel.messages.fetch(serverInfoMessage.messageId);
					message.unpin();

					const serverInfoMessageCount = await db.ServerInfoCron.destroy({ where: { servername: serverName } });

					if (!serverInfoMessageCount) {
						await interaction.editReply(`No Message in database for server "${serverName}"!`);
					}

					await interaction.editReply(`Message for server "${serverName}" successfully unpinned and deleted from database!`);
				}
				catch (error) {
					await interaction.editReply(`Unable to unpin message. Error: "${error}"!`);
				}

			}
		}

	},
};