const { Events } = require('discord.js');
const fetch = require('node-fetch');

const { genDnDCharSheet } = require('../functions/dndSheetGen')

const CHANNEL_ID_DND_SHEET_GEN = '1292056999957237802'; // Channel ID in der auf DnD Sheet Dateien reagiert werden soll
const ALLOWED_MIME_TYPES_DND_SHEET_GEN = ['application/json']; // Allowed MIME-Types for DnD-Sheet-Gen

// Event Listener for Messages send in Discord
module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
	/* ### Convert uploaded JSON Files from FoundryVTT to a DnD Character PDF Sheet ### */	  
        // Check if Message was send in the right Channel, return otherwise
        if (message.channel.id !== CHANNEL_ID_DND_SHEET_GEN) return;

        // Return if no attachment was uploaded
        if (message.attachments.size <= 0) return;

        // Get Attachments from Message
        message.attachments.forEach(attachment => {
            // Check MIME-Type of Attachment, return if not on allowed list
            mimeType = attachment.contentType.split(';')[0].trim(); // Only retrieve the MIME-Type and ignore everything after that
            if (!ALLOWED_MIME_TYPES_DND_SHEET_GEN.includes(mimeType)) {
                message.delete()
                    .then(message.channel.send(`<@${message.author.id}>, dein Upload hat leider nicht das richtige Dateiformat.`))
                    .then(msg => console.log(`Deleted message from ${msg.author.username}, no allowed MIME-Type, uploaded: ${attachment.contentType}`))
                    .catch(console.error);
                return;
            }

            const attachmentResponse = fetch(attachment.url);
            const attachmentJSON = attachmentResponse.json(); //Get Attachment File and read it as JSON Data

            if (attachmentJSON._stats.systemId != 'dnd5e' || attachmentJSON.type != 'character') {
                message.delete()
                    .then(message.channel.send(`<@${message.author.id}>, dein Upload scheint leider keine DnD5e Charakter zu enthalten`))
                    .then(msg => console.log(`Deleted message from ${msg.author.username}, no Character Data or Wrong Foundry System`))
                    .catch(console.error);
                return;
            }


            // Reply to User and start working on the File
            message.reply(`Danke für das Hochladen deines Charakters "${attachmentJSON.name}"\nIch kümmere mich jetzt um das Erstellen des Charakter Sheets, bitte hab etwas Geduld. Ich antworte Dir, wenn ich fertig bin.`);
            // Log the URL to the Uploaded File
            console.log(`File uploaded: ${attachment.url}`);
    
            // The Attachment will be handed over to the Sheet Generator Funktion, the rest is handled over there
            genDnDCharSheet(attachment, message.author, message.channel);

        });

    /* ### DnD-Sheet-Gen ENDE ### */

	},
};