const fs = require('fs');
const { blockQuote, bold, italic, quote, spoiler, strikethrough, underline, subtext, Attachment } = require('discord.js');
const { PDFDocument } = require('pdf-lib');


// Hilfsfunktion, um auf verschachtelte JSON-Schlüssel zuzugreifen
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
}

// Funktion zum Laden des PDF-Formulars und der JSON-Daten
async function fillPdfFormWithMapping(jsonData, pdfTemplatePath, outputPdfPath, fieldMapping) {
    // Load PDF Template
    const existingPdfBytes = fs.readFileSync(pdfTemplatePath);
  
    // Create a new PDF-File form Template
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
    // Get the PDF Form
    const form = pdfDoc.getForm();
  
    // Fill the formfield based on the JSON and Mapping Data
    Object.keys(fieldMapping).forEach(jsonKey => {
        const pdfFieldName = fieldMapping[jsonKey]; // Get the corresponding PDF Fieldname
        const field = form.getField(pdfFieldName);  // Access the field in the PDF
        const value = getNestedValue(jsonData, jsonKey); // get the Mapping with nested JSON Objects
        if (field && value !== undefined) {
            field.setText(value); // Set the field Content
        }
    });
  
    // Save the PDF file
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPdfPath, pdfBytes);
    console.log(`PDF-Form successfully saved unter ${outputPdfPath}`);
}

async function genDnDCharSheet(character, author, channel) {
    console.log("Current directory:", __dirname);
    const pdfTemplatePath = "/usr/src/nitradisbot/ressources/dnd/DnD_5E_CharacterSheet_DE_FormFillable.pdf";
    const pdfOutputDir = "/tmp/"
    const currentDate = new Date();
    const dateString = `${currentDate.getFullYear()}${currentDate.getMonth}${currentDate.getDay}-${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`;
    const pdfOutputName = `${character.name.replaceAll(' ', '')}_${dateString}.pdf`
    const pdfOutputPath = `${pdfOutputDir}${pdfOutputName}`
    const fieldMappingFile = '/usr/src/nitradisbot/ressources/dnd/DnDCharSheet_fieldMapping_DE.js'

    //Start the PDF File Mapping and Filling
    await fillPdfFormWithMapping(character, pdfTemplatePath, pdfOutputPath, fieldMappingFile);

    //send the saved File to the User
    await channel.send(`<@${author.id}>, Hier ist dein Charakter Sheet für "${bold(character.name)}"`, {
        files: [{
            attachment: pdfOutputPath,
            name: pdfOutputName,
            description: `Character Sheet für ${character.name}`
        }]
    })

    //clean up PDF File from local storage
    fs.unlinkSync(pdfOutputPath);
};

module.exports = { genDnDCharSheet };

// Beispielaufruf der Funktion
//const jsonDataPath = './form-data.json'; // Pfad zur JSON-Datei
//const pdfTemplatePath = './template.pdf'; // Pfad zum PDF-Template
//const outputPdfPath = './filled-form.pdf'; // Pfad für die Ausgabe

//fillPdfFormWithMapping(jsonDataPath, pdfTemplatePath, outputPdfPath, fieldMapping).catch(err => {
//  console.error('Fehler beim Ausfüllen des PDF-Formulars:', err);
//});

