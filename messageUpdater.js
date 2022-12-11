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
			const infoResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers`, { headers: { authorization: serverData.nitradotoken } });
			const jsonResult = await infoResult.body.json();

			// get Info about the active Games, for example to get the URL of the Icon
			const gamesResult = await request(`https://api.nitrado.net/services/${serverData.id}/gameservers/games`, { headers: { authorization: serverData.nitradotoken } });
			const gamesJson = await gamesResult.body.json();
			const { data: { games } } = gamesJson;
			const [activeGame] = await games.filter(entry => entry.active === true);

			const { 'status': requestStatus, 'message': requestStatus_message } = jsonResult;

			if (requestStatus === 'success') {
				const { data: { gameserver: { status, ip, port, query_port, game, game_human, settings: { config: { 'server-name': name } } } } } = jsonResult;
				const servername = name ?? game_human;

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
				}

				serverInfo.setTitle(servername);
				serverInfo.setDescription(`${statusIcon} ${game_human}`);
				serverInfo.setThumbnail(activeGame.icons.x256);
				serverInfo.addFields(
					{ name: 'IP Address', value: `${ip}` },
					{ name: 'Game Port', value: `${port}`, inline: true },
					{ name: 'Query Port', value: `${query_port}`, inline: true },
				);
				serverInfo.setTimestamp();
				serverInfo.setFooter({ text: 'This Message will update every minute!' });

				await message.edit({ content: '', embeds: [serverInfo] });

				// Repin the massage if it became unpinned
				if (await !message.pinned && await message.pinnable) {
					await message.pin();
				}

			}
			else {
				await message.edit(`Error updating message while contacting NitrAPI: ${requestStatus_message}`);
			}
		}

	},
};