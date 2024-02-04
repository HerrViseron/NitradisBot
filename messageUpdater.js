// const { Events } = require('discord.js');
const db = require('./database.js');
const { EmbedBuilder } = require('discord.js');
const { request } = require('undici');

// This Modules is used to updated server Info Messages via Cron
module.exports = {
	name: 'messageUpdater',
	async execute(message, serverName) {
		const serverData = await db.Server.findOne({ where: { displayname: serverName } });

		if (serverData === null) {
			await message.edit('Error updating message: Server was not found in Database!');
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
				statusIcon = '🟠';
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
			serverInfo.setFooter({ text: 'This Message will update every minute!' });

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

			await message.edit({ content: '', embeds: [serverInfo] });

			// Repin the massage if it became unpinned
			if (await !message.pinned && await message.pinnable) {
				await message.pin();
			}

		}

	},
};