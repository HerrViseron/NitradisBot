const { Events } = require('discord.js');

const CHANNEL_ID_DND_SHEET_GEN = '1292056999957237802'; // Channel ID in der auf DnD Sheet Dateien reagiert werden soll
const ALLOWED_MIME_TYPES_DND_SHEET_GEN = ['application/json']; // Allowed MIME-Types for DnD-Sheet-Gen

// Event Listener for Bot command interaction
// if interaction is not a command -> return an do nothing
// if command is not log to error console and do nothing
// if command execures great!
// if command fails reply the error to the user
module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
	/* ### Verarbeite hochgeladene JSON Dateien für den DnD-Sheet-Generator ### */	  
        // Überprüfe, ob die Nachricht im gewünschten Channel gesendet wurde
        if (message.channel.id !== CHANNEL_ID_DND_SHEET_GEN) return;

        // Überprüfe, ob die Nachricht Anhänge enthält
        if (message.attachments.size <= 0) {
            console.log(`No Attachement`);
            return;
        }
        // Hole die Datei-Anhänge aus der Nachricht
        message.attachments.forEach(attachment => {
            
            if (!ALLOWED_MIME_TYPES_DND_SHEET_GEN.includes(attachment.contentType)) {
                console.log(`No allowed MIME-Type, uploaded: ${attachment.contentType}`);
                return;
            }

            // Hier kannst du den Link zur Datei verwenden
            console.log(`Datei hochgeladen: ${attachment.name}`);
    
            // Beispiel: Du kannst die Datei herunterladen oder weiterverarbeiten
            // Dafür brauchst du ggf. Bibliotheken wie `node-fetch` oder `axios`, um die Datei herunterzuladen
    
            message.reply(`Danke für das Hochladen der Datei: ${attachment.name}`);
            //message.channel.send(`Danke für das Hochladen der Datei: ${attachment.name}`);
        });

    /* ### DnD-Sheet-Gen ENDE ### */

	},
};