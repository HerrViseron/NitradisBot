const fs = require('fs');
const { blockQuote, bold, italic, quote, spoiler, strikethrough, underline, subtext } = require('discord.js');
const { PDFDocument } = require('pdf-lib');


// Hilfsfunktion, um auf verschachtelte JSON-Schlüssel zuzugreifen
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
}

// Funktion zum Laden des PDF-Formulars und der JSON-Daten
async function fillPdfFormWithMapping(jsonDataPath, pdfTemplatePath, outputPdfPath, fieldMapping) {
    // Lade die JSON-Daten
    const jsonData = JSON.parse(fs.readFileSync(jsonDataPath, 'utf8'));
  
    // Lade das PDF-Template
    const existingPdfBytes = fs.readFileSync(pdfTemplatePath);
  
    // Erstelle ein neues PDF-Dokument auf Basis des Templates
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
    // Greife auf die Formularfelder zu
    const form = pdfDoc.getForm();
  
    // Fülle die Formularfelder basierend auf den JSON-Daten und dem Mapping aus
    Object.keys(fieldMapping).forEach(jsonKey => {
        const pdfFieldName = fieldMapping[jsonKey]; // Hole den entsprechenden PDF-Feldnamen
        const field = form.getField(pdfFieldName);  // Greife auf das Formularfeld im PDF zu
        const value = getNestedValue(jsonData, jsonKey); // Greife auf den verschachtelten JSON-Wert zu
        if (field && value !== undefined) {
            field.setText(value); // Setze den Text des Formularfeldes
        }
    });
  
    // Speichere das ausgefüllte PDF-Dokument
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPdfPath, pdfBytes);
    console.log(`PDF-Formular erfolgreich ausgefüllt und unter ${outputPdfPath} gespeichert.`);
}

async function genDnDCharSheet(character, author, channel) {
    channel.send(`<@${author.id}>, Danke, für deinen Character "${bold(character.name)}"`)
};

module.exports = { genDnDCharSheet };

// Beispielaufruf der Funktion
//const jsonDataPath = './form-data.json'; // Pfad zur JSON-Datei
//const pdfTemplatePath = './template.pdf'; // Pfad zum PDF-Template
//const outputPdfPath = './filled-form.pdf'; // Pfad für die Ausgabe

//fillPdfFormWithMapping(jsonDataPath, pdfTemplatePath, outputPdfPath, fieldMapping).catch(err => {
//  console.error('Fehler beim Ausfüllen des PDF-Formulars:', err);
//});

