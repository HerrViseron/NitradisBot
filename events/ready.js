const { Events } = require('discord.js');
const { Server } = require('database.js');

// When the client is ready, run this code (only once)
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		Server.sync();
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};