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
		const is_nsfw = interaction.options.getBoolean('nsfw') ?? false;
		if (!is_nsfw) {
			await interaction.deferReply();
		}
		else if (is_nsfw) {
			await interaction.deferReply({ ephemeral: true });
		}

		const query = new URLSearchParams({ is_nsfw });

		const waifuResult = await request(`https://api.waifu.im/search/?${query}`);
		const { images } = await waifuResult.body.json();

		// await interaction.editReply({ files: [{ attachment: url, name: 'waifu.jpg' }] });
		await interaction.editReply({ content: 'Here is you random Waifu!', files: [images[0].url] });
	},
};