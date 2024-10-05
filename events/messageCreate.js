const { Events } = require('discord.js');

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
                return;
            }

            // Hier kannst du den Link zur Datei verwenden
            console.log(`File uploaded: ${attachment.url}`);
    
            // Beispiel: Du kannst die Datei herunterladen oder weiterverarbeiten
            // Dafür brauchst du ggf. Bibliotheken wie `node-fetch` oder `axios`, um die Datei herunterzuladen
    
            message.reply(`Danke für das Hochladen der Datei: ${attachment.name}`);
            //message.channel.send(`Danke für das Hochladen der Datei: ${attachment.name}`);
        });

    /* ### DnD-Sheet-Gen ENDE ### */

	},
};