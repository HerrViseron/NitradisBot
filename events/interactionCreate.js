const { Events } = require('discord.js');

// Event Listener for Bot command interaction
// if interaction is not a command -> return an do nothing
// if command is not log to error console and do nothing
// if command execures great!
// if command fails reply the error to the user
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {

			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
		else if (interaction.isAutocomplete()) {

			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.autocomplete(interaction);
			}
			catch (error) {
				console.error(error);
			}
		}
		else if (interaction.isButton()) {

			const command = interaction.client.commands.get(interaction.customId);

			if (!command) {
				console.error(`No button interaction matching ${interaction.customId} was found.`);
				return;
			}

			try {
				await command.buttonClick(interaction);
			}
			catch (error) {
				console.error(error);
			}
		}
	},
};