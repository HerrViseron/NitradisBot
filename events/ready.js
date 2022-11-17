const { Events } = require('discord.js');
const db = require('../database.js');

// When the client is ready, run this code (only once)
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		// Use db.Server.sync({ force: true }); for Dev Testing, resets Database on every App start
		// in Prod use db.Server.sync();
		db.Server.sync();
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};