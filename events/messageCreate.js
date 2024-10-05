const { Events } = require('discord.js');

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
        if (message.channel.id !== "1292056999957237802") return;

        // Überprüfe, ob die Nachricht Anhänge enthält
        if (message.attachments.size > 0) {
            // Hole die Datei-Anhänge aus der Nachricht
            message.attachments.forEach(attachment => {
                // Hier kannst du den Link zur Datei verwenden
                console.log(`Datei hochgeladen: ${attachment.url}`);
        
                // Beispiel: Du kannst die Datei herunterladen oder weiterverarbeiten
                // Dafür brauchst du ggf. Bibliotheken wie `node-fetch` oder `axios`, um die Datei herunterzuladen
        
                message.reply(`Danke für das Hochladen der Datei: ${attachment.name}`);
                //message.channel.send(`Danke für das Hochladen der Datei: ${attachment.name}`);
            });
        }
    /* ### DnD-Sheet-Gen ENDE ### */

	},
};