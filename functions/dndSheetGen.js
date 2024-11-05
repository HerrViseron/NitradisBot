const fs = require('fs');
const { blockQuote, bold, italic, quote, spoiler, strikethrough, underline, subtext, Attachment, AttachmentBuilder } = require('discord.js');
const { PDFDocument, rgb } = require('pdf-lib');
const { v7: uuidv7 } = require('uuid');

// Hilfsfunktion, um auf verschachtelte JSON-Schlüssel zuzugreifen
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function getValueFromJsonByPath(jsonData, path) {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : undefined, jsonData);
}

function calculateValue(jsonData, calcFunction) {
    switch (calcFunction) {
        case 'charClasses': { //Needs to be a block to declare the same Variable in multiple cases
            let charClassNames = '';
            const charClasses = jsonData.items.filter(item => item.type === 'class'); //Get all char classes
            for (const charClass of charClasses) {
                if (charClassNames != '') charClassNames += '; '; //If there is already a class in the strin then append with a semicolon and a whitespace
                charClassNames += `${charClass.name} ${charClass.system.levels}`; //append the class and Level to the string
            }
            return charClassNames;
            //no Break since we always return above
        }
        case 'baseProficiency': {
            let charLevel = 0;
            const charClasses = jsonData.items.filter(item => item.type === 'class'); //Get all char classes
            for (const charClass of charClasses) {
                charLevel += charClass.system.levels;
            }
            if (charLevel === 0) return 0; //return value based on Char Level
            if (charLevel >= 1 && charLevel <= 4) return 2;
            if (charLevel >= 5 && charLevel <= 8) return 3;
            if (charLevel >= 9 && charLevel <= 12) return 4;
            if (charLevel >= 13 && charLevel <= 16) return 5;
            if (charLevel >= 17 && charLevel <= 20) return 6;
            return 0;
            //no Break since we always return above
        }
        case 'hitDice': {
            let charHitDice = '';
            const charClasses = jsonData.items.filter(item => item.type === 'class'); //Get all char classes
            for (const charClass of charClasses) {
                if (charHitDice != '') charHitDice += ' + '; //If there is already a class in the strin then append with a semicolon and a whitespace
                charHitDice += `${charClass.system.levels}x${charClass.system.hitDice.replaceAll('d',"W")}`; //Hit Dice times Class Level and change d to W for German
            }
            return charHitDice;
        }
        case 'armorClass': {
            let charArmorClassValue = 0;
            let charArmorClassCalcType = "default";
            const charBaseAC = jsonData.system.attributes.ac; //The AC from the Attributes Field, seems to be mostly NULL, but also sets the calculation method (which might be overridden later!)
            if (charBaseAC.value != null) {
                charArmorClassValue = charBaseAC.value;
            }
            if (charBaseAC.calc != "") {
                charArmorClassCalcType = charBaseAC.calc;
            }

            const charArmorEffects = jsonData.items.filter(item => item.effects.some(effect => 
                        !effect.disabled && // Only retrieve item when the AC Effect is not diabled, so we should end up with only one Item for AC Calc change.
                        effect.changes.some(change => change.key === 'system.attributes.ac.calc')
                    )
                ); //Get all items of char, that have someting which adds to the armor class
            console.log(charArmorEffects)
                if (charArmorEffects.length > 0) {
                const effectWithACChange = charArmorEffects[0].effects.find(effect =>
                    !effect.disabled &
                    effect.changes.find(change => change.key === "system.attributes.ac.calc")
                )
                console.log(effectWithACChange);
                const change = effectWithACChange?.changes.find(change => change.key === 'system.attributes.ac.calc');
                console.log(change);
                charArmorClassCalcType = change ? change.value : "default"; //Here we finally have the ArmorClass Calculation Type
            }
            console.log(charArmorClassCalcType);
            //Calculating the actual ArmorClass...
            //First we always need the Dex Modifier of the char:
            const charDexValue = jsonData.system.abilities.dex.value;
            console.log(charDexValue);
            const charDexMod = Math.floor((charDexValue - 10) / 2);
            console.log(charDexMod);
            switch (charArmorClassCalcType) {
                case 'default': {
                    //The Default Armor Calculation, Base of 10 plus Dex Mod, Plus equipped Armor AC Stats
                    charArmorClassValue = 10 + charDexMod;
                    break; //Here we need breaks...
                }
                case 'draconic': {
                    //With Draconic resilience you always have a base AC of 13 plus Dex Mod, nothing else.
                    charArmorClassValue = 13 + charDexMod;
                    break;
                }
                case 'mage': {
                    //With Mage Armor you always have a base AC of 13 plus Dex Mod, nothing else.
                    charArmorClassValue = 13 + charDexMod;
                    break;
                }
            }

            return charArmorClassValue;
        }
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

    //Finally add the current Date and Time to the corner of each page, just for convenience
    /* ToDo for later
    const currentDate = new Date().toLocaleString('de-DE');
    const pdfPages = pdfDoc.getPages();
    const fontSize = 12;
    const fontColor = rgb(0, 0, 0);  // Black
    for (const page of pdfPages) {
        const { width, height } = page.getSize();
        //Add the Text
        page.drawText(currentDate, {
            x: 10, //Distance from left edge
            y: height - fontSize - 10, //Distance from top edge
            size: fontSize,
            color: fontColor,
        });
    }
    */
   
    // Save the PDF file
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPdfPath, pdfBytes);
    console.log(`PDF-Form successfully saved under ${outputPdfPath}`);
}

async function genDnDCharSheet(character, author, channel) {
    //console.log("Current directory:", __dirname);
    const pdfTemplatePath = "/usr/src/nitradisbot/ressources/dnd/DnD_5E_CharacterSheet_DE_FormFillable.pdf";
    const pdfOutputDir = "/tmp/"
    //const DateTZString = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
    //const currentDate = new Date(DateTZString);
    //const currentDate = new Date();
    //const dateString = `${currentDate.getFullYear()}${currentDate.getMonth()+1}${currentDate.getDate()}-${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`;
    //console.log(`DateTZString: ${DateTZString}, currentDate: ${currentDate}, dateString: ${dateString}`);
    const pdfUUID = uuidv7();
    const pdfOutputName = `${character.name.replaceAll(' ', '')}_${pdfUUID}.pdf`;
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

