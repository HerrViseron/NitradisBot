const fs = require('fs');
const { blockQuote, bold, italic, quote, spoiler, strikethrough, underline, subtext, Attachment, AttachmentBuilder } = require('discord.js');
const { PDFDocument } = require('pdf-lib');


// Hilfsfunktion, um auf verschachtelte JSON-Schlüssel zuzugreifen
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function getValueFromJsonByPath(jsonData, path) {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : undefined, jsonData);
}

function calculateValue(jsonData, calcFunction) {
    switch (calcFunction) {
        case 'baseProficiency':
            let charLevel = 0;
            const charClasses = jsonData.items.filter(item => item.type === 'class');
            console.log(`CharClasses: ${jsonData}`);
            for (const charClass in charClasses) {
                console.log(charClass);
                charLevel += charClass.levels;
                console.log(`CharLevel: ${charLevel}`);
            }
            if (charLevel === 0) return 0;
            if (charLevel >= 1 && charLevel <= 4) return 2;
            if (charLevel >= 5 && charLevel <= 8) return 3;
            if (charLevel >= 9 && charLevel <= 12) return 4;
            if (charLevel >= 13 && charLevel <= 16) return 5;
            if (charLevel >= 17 && charLevel <= 20) return 6;
            return 0;
            //no Break since we always return above           
        default:
            return 0;
    }
}

function convertJsonToPdfData(jsonData, pdfFieldMapping) {
    const pdfData = {};

    for (let field in pdfFieldMapping) {
        const { jsonPath, type, attr, append, calcFunction} = pdfFieldMapping[field];
        let value = 0;
        if(type != 'calculateValue'){ //when we calculate the Value, we dont have a specific JSON Path to search for
            value = getValueFromJsonByPath(jsonData, jsonPath);
        }

        // Konvertiere den Wert basierend auf dem Typ
        switch (type) {
            case 'string':
                if(append){    
                    field = field.split('_')[0].trim(); //Keys in pdfFieldMapping need to be uinique, so we have to add a suffix which needs to be removed when we append to a field
                    if(!pdfData[field]){
                        pdfData[field] = ''; //just to be sure
                    }
                    pdfData[field] += ` ${value ? value.toString() : ''}`; // Convert to String
                }else{
                    pdfData[field] = value ? value.toString() : ''; // Convert to String
                }
                break;
            case 'number':
                pdfData[field] = typeof value === 'number' ? value : '0'; // Convert Numbers to String for PDF-Field
                break;
            case 'checkbox':
                pdfData[field] = value === 1 || value === true ? true : false; // Checkboxes in PDF are weird...
                break;
            case 'checkboxSkillProf':
                pdfData[field] = value === 1 || value === 2 || value === true ? true : false; // Proficieny is granted if value is 1 or 2
                break;
            case 'checkboxSkillExp':
                pdfData[field] = value === 2 ? true : false; // Experience is only active if Value equals two
                break;
            case 'searchID':
                const itemObject = jsonData.items.find(item => item._id === value);
                if(append){
                    field = field.split('_')[0].trim(); //Keys in pdfFieldMapping need to be uinique, so we have to add a suffix which needs to be removed when we append to a field
                    if(!pdfData[field]){
                        pdfData[field] = ''; //just to be sure
                    }
                    pdfData[field] += ` ${getNestedValue(itemObject, attr).toString()}`; //always make a string out of it, we'll see how far we get with this
                }else{
                    pdfData[field] = getNestedValue(itemObject, attr).toString(); //always make a string out of it, we'll see how far we get with this
                }
                break;
            case 'calculateValue':
                pdfData[field] = calculateValue(jsonData, calcFunction).toString(); // getting the value with a calculation function and always convert to string
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
    //console.log("Current directory:", __dirname);
    const pdfTemplatePath = "/usr/src/nitradisbot/ressources/dnd/DnD_5E_CharacterSheet_DE_FormFillable.pdf";
    const pdfOutputDir = "/tmp/"
    //const DateTZString = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
    //const currentDate = new Date(DateTZString);
    const currentDate = new Date();
    const dateString = `${currentDate.getFullYear()}${currentDate.getMonth()+1}${currentDate.getDate()}-${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`;
    //console.log(`DateTZString: ${DateTZString}, currentDate: ${currentDate}, dateString: ${dateString}`);
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

