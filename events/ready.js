const { Events } = require('discord.js');
const { sequelize } = require('../database.js');

// When the client is ready, run this code (only once)
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		sequelize.sync();
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};