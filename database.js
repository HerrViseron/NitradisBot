// Require Sequelize
const Sequelize = require('sequelize');

// Create Sequelize Database connection
const sequelize = new Sequelize({
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	// storage: '/var/lib/nitradisbot/nitradisbot.sqlite',
	storage: 'nitradisbot.sqlite',
});

// Create Database Model
const Server = sequelize.define('server', {
	id: {
		type: Sequelize.INTEGER,
		unique: true,
		autoIncrement: false,
		primaryKey: true,
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

module.exports = sequelize;
module.exports = Server;