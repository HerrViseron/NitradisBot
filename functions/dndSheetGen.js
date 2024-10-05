const fs = require('fs');
const { blockQuote, bold, italic, quote, spoiler, strikethrough, underline, subtext, Attachment, AttachmentBuilder } = require('discord.js');
const { PDFDocument } = require('pdf-lib');


// Hilfsfunktion, um auf verschachtelte JSON-Schlüssel zuzugreifen
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function getValueFromJsonByPath(jsonData, path) {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : undefined, jsonData);
}

function convertJsonToPdfData(jsonData, pdfFieldMapping) {
    const pdfData = {};

    for (let field in pdfFieldMapping) {
        const { jsonPath, type } = pdfFieldMapping[field];
        let value = getValueFromJsonByPath(jsonData, jsonPath);

        // Konvertiere den Wert basierend auf dem Typ
        switch (type) {
            case 'string':
                pdfData[field] = value ? value.toString() : ''; // Convert to String
                break;
            case 'number':
                pdfData[field] = typeof value === 'number' ? value : '0'; // Zahlen in String für PDF-Felder
                break;
            case 'checkbox':
                pdfData[field] = value === 1 || value === true ? true : false; // Checkboxes in PDF are weird...
                break;
            default:
                pdfData[field] = value; // Standardmäßig den Wert direkt übernehmen
        }
    }

    return pdfData;
}

// Funktion zum Laden des PDF-Formulars und der JSON-Daten
async function fillPdfFormWithMapping(jsonData, pdfTemplatePath, outputPdfPath, fieldMapping) {
    // Load PDF Template
    const existingPdfBytes = fs.readFileSync(pdfTemplatePath);
  
    // Create a new PDF-File form Template
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
    // Get the PDF Form
    const form = pdfDoc.getForm();

    //generate Objekt with PDF Form Data from FieldMapping and JSON Data
    const pdfFormData = convertJsonToPdfData(jsonData, fieldMapping)

    // Fill the formfield based on the JSON and Mapping Data
    for (const fieldName in pdfFormData) {
        const fieldValue = pdfFormData[fieldName];

        // Try to find the Field in the PDF Form
        const field = form.getFieldMaybe(fieldName);

        if (!field) {
            console.warn(`Field "${fieldName}" was not found in PDF-File.`);
            continue; // Ignore and move to the next
        }

        // Check Type of field and set Value appropriately
        if (field.constructor.name === 'PDFTextField') {
            // Set Textfield
            field.setText(fieldValue);
        } else if (field.constructor.name === 'PDFCheckBox') {
            // set Checkbox (true oder false)
            if (fieldValue === true) {
                field.check();
            } else {
                field.uncheck();
            }
        } else if (field.constructor.name === 'PDFRadioGroup') {
            // Radio-Gruppe (falls vorhanden)
            field.select(fieldValue);
        } else {
            console.log(`The field type "${field.constructor.name}" is not supported!`);
        }
    }
  
    // Save the PDF file
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPdfPath, pdfBytes);
    console.log(`PDF-Form successfully saved unter ${outputPdfPath}`);
}

async function genDnDCharSheet(character, author, channel) {
    console.log("Current directory:", __dirname);
    const pdfTemplatePath = "/usr/src/nitradisbot/ressources/dnd/DnD_5E_CharacterSheet_DE_FormFillable.pdf";
    const pdfOutputDir = "/tmp/"
    const DateTZString = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
    const currentDate = new Date(DateTZString);
    const dateString = `${currentDate.getFullYear()}${currentDate.getMonth()}${currentDate.getDay()}-${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`;
    const pdfOutputName = `${character.name.replaceAll(' ', '')}_${dateString}.pdf`;
    const pdfOutputPath = `${pdfOutputDir}${pdfOutputName}`;
    const charSheetField = require('../ressources/dnd/DnDCharSheet_fieldMapping_DE');

    //Start the PDF File Mapping and Filling
    await fillPdfFormWithMapping(character, pdfTemplatePath, pdfOutputPath, charSheetField.fieldMapping);

    //send the saved File to the User
    const attachment = new AttachmentBuilder(pdfOutputPath, { name: pdfOutputName, description: `Character Sheet für ${character.name}` });
    await channel.send({
        content: `<@${author.id}>, Hier ist dein Character Sheet für "${bold(character.name)}"`,
        files: [attachment]
    });

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

