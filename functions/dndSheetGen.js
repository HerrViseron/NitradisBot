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
                if (charClassNames != '') charClassNames += '; '; //If there is already a class in the string then append with a semicolon and a whitespace
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

            const charArmorEffectsItems = jsonData.items.filter(item => item.effects.some(effect => 
                        !effect.disabled && // Only retrieve item when the AC Effect is not diabled, so we should end up with only one Item for AC Calc change.
                        effect.changes.some(change => change.key === 'system.attributes.ac.calc')
                    )
                ); //Get all items of char, that have someting which adds to the armor class

            if (charArmorEffectsItems.length > 0) {
                //Actually we still have items here but naming everything correctly is hard, I try my best...
                const firstArmorEffectItem = charArmorEffectsItems[0]; //There should only be one Effect that is not disables, if there are more, the forst one wins
                const armorEffect = firstArmorEffectItem?.effects.find(effect =>
                    !effect.disabled &&
                    effect.changes.some(change => change.key === 'system.attributes.ac.calc')
                ); //now we have the effect separated that is enabled and affects the AC
                const armorChange = armorEffect?.changes.find(change => change.key === 'system.attributes.ac.calc'); //Get the right change, there might be more than one change but only one should effect the AC 
                charArmorClassCalcType = armorChange ? armorChange.value : "default"; //Here we finally have the ArmorClass Calculation Type
            }
            
            const charArmorEquipment = jsonData.items.filter(item => 
                item.system.equipped &&
                item.type === 'equipment' &&
                item.system.armor.value != null //only include equiment that gives Armor
            ); //Get all equipment items of char, that are equipped

            //Calculating the actual ArmorClass...
            //First we always need the Dex Modifier of the char:
            const charDexValue = jsonData.system.abilities.dex.value;
            const charDexMod = Math.floor((charDexValue - 10) / 2);
            
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
        case 'charSpellAttr': {
            const spellAttr = getValueFromJsonByPath(jsonData, 'system.attributes.spellcasting');
            switch (spellAttr) {
                case 'str':
                    return 'Stärke';
                case 'dex':
                    return 'Geschicklichkeit';
                case 'con':
                    return 'Konstitution';
                case 'int':
                    return 'Intelligenz';
                case 'wis':
                        return 'Weisheit';
                case 'cha':
                    return 'Charisma';
                default:
                    return '';
            }
        }
        case 'charSpellClass': {
            const spellAttr = getValueFromJsonByPath(jsonData, 'system.attributes.spellcasting');
            const charClasses = jsonData.items.filter(item => 
                item.type === 'class' &&
                item.system.spellcasting.ability === spellAttr
            ); //Get class of char which has the right spell attribute, Note: the first one will be used in case there are multiple classes with the same attribute
            
            return charClasses[0].name;
        }
        case 'charSpellSaveDC': {
            //get Spellcasting Attr
            const spellAttr = getValueFromJsonByPath(jsonData, 'system.attributes.spellcasting');
            //get the Modifier of this Attribute
            const spellAttrValue = getValueFromJsonByPath(jsonData, 'system.abilities.' + spellAttr + '.value');
            const spellAttrMod = Math.floor((spellAttrValue - 10)/2); //Attribute Value - 10 then deviced by 2 and rounded down

            //Get Char Proficiency Modifier
            let charLevel = 0;
            let charProfMod = 0;
            const charClasses = jsonData.items.filter(item => item.type === 'class'); //Get all char classes
            for (const charClass of charClasses) {
                charLevel += charClass.system.levels;
            }
            if (charLevel === 0) charProfMod = 0; //save value based on Char Level
            if (charLevel >= 1 && charLevel <= 4) charProfMod =  2;
            if (charLevel >= 5 && charLevel <= 8) charProfMod =  3;
            if (charLevel >= 9 && charLevel <= 12) charProfMod =  4;
            if (charLevel >= 13 && charLevel <= 16) charProfMod =  5;
            if (charLevel >= 17 && charLevel <= 20) charProfMod =  6;

            return 8 + spellAttrMod + charProfMod; //8 + Spellcasting Attribute Modifier + Proficiency modifier ( + special Modfiers, not taken into account here!)
        }
        case 'charSpellAttackmod': {
            //get Spellcasting Attr
            const spellAttr = getValueFromJsonByPath(jsonData, 'system.attributes.spellcasting');
            //get the Modifier of this Attribute
            const spellAttrValue = getValueFromJsonByPath(jsonData, 'system.abilities.' + spellAttr + '.value');
            const spellAttrMod = Math.floor((spellAttrValue - 10)/2); //Attribute Value - 10 then deviced by 2 and rounded down
            
            //Get Char Proficiency Modifier
            let charLevel = 0;
            let charProfMod = 0;
            const charClasses = jsonData.items.filter(item => item.type === 'class'); //Get all char classes
            for (const charClass of charClasses) {
                charLevel += charClass.system.levels;
            }
            if (charLevel === 0) charProfMod = 0; //save value based on Char Level
            if (charLevel >= 1 && charLevel <= 4) charProfMod =  2;
            if (charLevel >= 5 && charLevel <= 8) charProfMod =  3;
            if (charLevel >= 9 && charLevel <= 12) charProfMod =  4;
            if (charLevel >= 13 && charLevel <= 16) charProfMod =  5;
            if (charLevel >= 17 && charLevel <= 20) charProfMod =  6;

            return spellAttrMod + charProfMod; //Spellcasting Attribute Modifier + Proficiency modifier
        }
        default:
            return 0;
    }
}

function fillMultiple(jsonData, fillFunction) {
    switch (fillFunction) {
        case 'charSpellSlots':
            //get Spellcasting Attr
            const spellAttr = getValueFromJsonByPath(jsonData, 'system.attributes.spellcasting');
            //Get the total Level of the char
            let charClassLevel = [];
            const charClasses = jsonData.items.filter(item => item.type === 'class'); //Get all char classes
            for (const charClass of charClasses) {
                charClassLevel[charClass.system.identifier] += charClass.system.levels;
            }

            //Get the main Spellcasting class
            const charSpellClass = jsonData.items.filter(item => 
                item.type === 'class' &&
                item.system.spellcasting.ability === spellAttr
            ); //Get class of char which has the right spell attribute, Note: the first one will be used in case there are multiple classes with the same attribute

            console.log(charClassLevel);
            console.log(charSpellClass.system.identifier);

/* These Values are currently not necessary but i'll keep the code here, just in case.....
            // Known Cantrips:
            const charKnownCantrips = charSpellClass.system.advancement.filter(advancement => 
                advancement.type === 'ScaleValue' &&
                advancement.configuration.identifier === 'cantrips-known'
            ).scale;
            // Known Spells:
            const charKnownSpells = charSpellClass.system.advancement.filter(advancement => 
                advancement.type === 'ScaleValue' &&
                advancement.configuration.identifier === 'spells-known'
            ).scale;
*/
            // List of the Spell Slots available to all classes
            // Sources: https://fexlabs.com/5eslots/
            //https://solonarv.github.io/5e-slot-calculator + https://github.com/Solonarv/solonarv.github.io/blob/source/5e-slot-calculator.html
            const slotsByLevel = {
                0:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                1:  [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
                2:  [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
                3:  [0, 4, 2, 0, 0, 0, 0, 0, 0, 0],
                4:  [0, 4, 3, 0, 0, 0, 0, 0, 0, 0],
                5:  [0, 4, 3, 2, 0, 0, 0, 0, 0, 0],
                6:  [0, 4, 3, 3, 0, 0, 0, 0, 0, 0],
                7:  [0, 4, 3, 3, 1, 0, 0, 0, 0, 0],
                8:  [0, 4, 3, 3, 2, 0, 0, 0, 0, 0],
                9:  [0, 4, 3, 3, 3, 1, 0, 0, 0, 0],
                10: [0, 4, 3, 3, 3, 2, 0, 0, 0, 0],
                11: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
                12: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
                13: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
                14: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
                15: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
                16: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
                17: [0, 4, 3, 3, 3, 2, 1, 1, 1, 1],
                18: [0, 4, 3, 3, 3, 3, 1, 1, 1, 1],
                19: [0, 4, 3, 3, 3, 3, 2, 1, 1, 1],
                20: [0, 4, 3, 3, 3, 3, 2, 2, 1, 1],
            };
/*
            let availableSpellSlots = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            switch (charSpellClass.name) {
                case 'cleric':
                case 'druid':
                case 'sorcerer':
                case 'wizard':
                    //availableSpellSlots = slotsByLevel[]
                    break;
                case 'bard':
                case 'paladin':
                case 'ranger':
                    break;
                case 'warlock':
                    break;
            }
*/
            break;
        
    }
}

function convertJsonToPdfData(jsonData, pdfFieldMapping) {
    const pdfData = {};

    for (let field in pdfFieldMapping) {
        const { jsonPath, type, attr, append, calcFunction, fillFunction} = pdfFieldMapping[field];
        let value = 0;
        if(type != 'calculateValue' && type != 'fillMultiple'){ //when we calculate the Value, we dont have a specific JSON Path to search for
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
            case 'fillMultiple':
                fillMultiple(jsonData, fillFunction); //The value mapping and filling data into the fields is handled in the function itself. Most of the functions here are very specific and only apply to one case!
                break;
            case 'list':
                let i = 1;
                for (const listItem of value) {
                    pdfData[field + i] = listItem.charAt(0).toUpperCase() + listItem.slice(1); //Making the first Char uppercase
                    i++;
                    if (i >= 6){ break; } // There are only 6 Fields on the Char sheet, so we need to break at 6
                }
                break;
            case 'listProfWeapons':
                if (value.length > 0) {
                    pdfData['EinfachWaffenProf'] = value.includes('sim');
                    pdfData['KriegswaffenProf'] = value.includes('mar');
                }
                // TODO: Other Weapons that are part of the categories above, but when the char is not proficient in the whole category
                break;
            case 'listProfArmor':
                if (value.length > 0) {
                    pdfData['LeichteRüstungProf'] = value.includes('lgt');
                    pdfData['MittlereRüstungProf'] = value.includes('med');
                    pdfData['SchwereRüstungProf'] = value.includes('hvy');
                    pdfData['SchildeProf'] = value.includes('shl');
                }
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

