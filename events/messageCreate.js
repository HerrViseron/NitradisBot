const { Events } = require('discord.js');
const path = require('node:path');
const { baseDir } = require('../nitradisbot');

baseDir = path.resolve(__dirname, './')
const { genDnDCharSheet } = require(path.join(baseDir, 'functions/dnd-sheet-gen'))

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
                console.log(`No allowed MIME-Type, uploaded: ${attachment.contentType}`);
                message.delete()
                    .then(message.channel.send(`<@${message.author.id}>, dein Upload hat leider nicht das richtige Dateiformat.`))
                    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
                    .catch(console.error);
                return;
            }

            // Reply to User and start working on the File
            message.reply(`Danke für das Hochladen der Datei: ${attachment.name}\nIch kümmere mich jetzt um das Erstellen des Character Sheets, bitte hab etwas Geduld. Ich antworte Dir, wenn ich fertig bin.`);
            // Log the URL to the Uploaded File
            console.log(`File uploaded: ${attachment.url}`);
    
            // The Attachment will be handed over to the Sheet Generator Funktion, the rest is handled over there
            genDnDCharSheet(attachment, message.author.username, message.channel);

        });

    /* ### DnD-Sheet-Gen ENDE ### */

	},
};