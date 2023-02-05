const { Events } = require('discord.js');
const db = require('../database.js');
const cron = require('node-cron');
const messageUpdater = require('../messageUpdater.js');

// When the client is ready, run this code (only once)
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// initializing batabase
		// Use db.Server.sync({ force: true }); for Dev Testing, resets Database on every App start
		// in Prod use db.Server.sync();
		await db.Server.sync({ alter: true });
		await db.ServerInfoCron.sync({ alter: true });

		// creating cron tasks to updates pinned server info messages every minute, will also repin the massage
		cron.schedule('0 * * * * *', async () => {
			const cronMessages = await db.ServerInfoCron.findAll({ attributes: ['messageId', 'channelId', 'servername'] });

			for (const cronMessage of cronMessages) {
				const channel = await client.channels.fetch(cronMessage.channelId);
				const message = await channel.messages.fetch(cronMessage.messageId);
				messageUpdater.execute(message, cronMessage.servername);
			}
		});

		// Now we are really ready
		await console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};