const { SlashCommandBuilder } = require('discord.js');
const { request } = require('undici');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('waifu')
		.setDescription('Display a random picture of your favorite Waifus.')
		.addBooleanOption(option =>
			option
				.setName('nsfw')
				.setDescription('Should we search for NSFW pictures? (In that case the response will only be shown to you!)'),
		),
	async execute(interaction) {
		const nsfw = interaction.options.getBoolean('nsfw') ?? false;
		if (!nsfw) {
			await interaction.deferReply({ fetchReply: true });
		}
		else {
			await interaction.deferReply({ ephemeral: true, fetchReply: true });
		}

		const query = new URLSearchParams({ nsfw });

		const waifuResult = await request(`https://api.waifu.im/random/?${query}`);
		const { url } = await waifuResult.body.json();

		await interaction.editReply({ content: 'Here is your random Waifu!', files: [url] });
	},
};