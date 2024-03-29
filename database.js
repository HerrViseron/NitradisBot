const path = require('node:path');
// Require Sequelize
const Sequelize = require('sequelize');

const db = {};
db.Sequelize = Sequelize;

// Database File location is dependet on the system platform
// for Linux the file will be under /var/lib/nitradisbot/
// for win32 the file will be under %AppData/nitradisbot/
// for everything else the file will be in the same directory as the App Files
let dbPath = '';
if (process.platform === 'linux') {
	dbPath = path.join('/var/lib/', 'nitradisbot', 'nitradisbot.sqlite');
}
else if (process.platform === 'win32') {
	dbPath = path.join(process.env.APPDATA, 'nitradisbot', 'nitradisbot.sqlite');;
}
else {
	dbPath = path.join('.', 'nitradisbot', 'nitradisbot.sqlite');
}

// Create Sequelize Database connection
const sequelize = new Sequelize({
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: dbPath,
});
db.sequelize = sequelize;

const Server = sequelize.define('server', {
	id: {
		type: Sequelize.INTEGER,
		unique: true,
		autoIncrement: false,
		primaryKey: true,
	},
	displayname: {
		type: Sequelize.STRING(25),
		unique: true,
		defaultValue: 'Nameless Server',
		allowNull: false,
	},
	nitradotoken: {
		type: Sequelize.STRING(100),
		defaultValue: 'no-token',
		allowNull: false,
	},
	installedGames: {
		type: Sequelize.STRING(),
		defaultValue: 'unkown',
		allowNull: true,
	},
	activeGame: {
		type: Sequelize.STRING(100),
		defaultValue: 'unkown',
		allowNull: true,
	},
});
db.Server = Server;

const ServerInfoCron = sequelize.define('serverInfoCron', {
	messageId: {
		type: Sequelize.STRING(20),
		unique: true,
		primaryKey: true,
	},
	channelId: {
		type: Sequelize.STRING(20),
	},
	servername: {
		type: Sequelize.STRING(25),
		unique: true,
		defaultValue: 'none',
		allowNull: false,
	},
});
db.ServerInfoCron = ServerInfoCron;

module.exports = db;

// module.exports = sequelize;
// module.exports = ServerList;