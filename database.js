// Require Sequelize
const Sequelize = require('sequelize');

// Create Sequelize Database connection
const sequelize = new Sequelize({
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: '/var/lib/nitradisbot/nitradisbot.sqlite',
});

// Create Database Model
const Server = sequelize.define('server', {
	id: {
		type: Sequelize.INTEGER,
		unique: true,
	},
	displayname: {
		type: Sequelize.STRING(25),
		defaultValue: 'Nameless Server',
		allowNull: false,
	},
	nitradotoken: {
		type: Sequelize.STRING(100),
		defaultValue: 0,
		allowNull: false,
	},
});

module.exports = {
	name: Server.Sync,
	execute() {
		Server.sync();
	},
};