const fieldMapping = {
    'Charaktername_page1': { jsonPath: 'name', type: 'string' },
    'Charaktername_page2': { jsonPath: 'name', type: 'string' },
    "name": "Charaktername_page2",
    // Money Money Money
    'PM': { jsonPath: 'system.abilities.pp.value', type: 'string' },
    'GM': { jsonPath: 'system.abilities.gp.value', type: 'string' },
    'EM': { jsonPath: 'system.abilities.ep.value', type: 'string' },
    'SM': { jsonPath: 'system.abilities.sp.value', type: 'string' },
    'KM': { jsonPath: 'system.abilities.cp.value', type: 'string' },
    //Char Stats
    'Str': { jsonPath: 'system.abilities.str.value', type: 'string' },
    'StrProf': { jsonPath: 'system.abilities.str.proficient', type: 'checkbox' },
    'Ges': { jsonPath: 'system.abilities.des.value', type: 'string' },
    'GesProf': { jsonPath: 'system.abilities.des.proficient', type: 'checkbox' },
    'Kon': { jsonPath: 'system.abilities.con.value', type: 'string' },
    'KonProf': { jsonPath: 'system.abilities.con.proficient', type: 'checkbox' },
    'Int': { jsonPath: 'system.abilities.int.value', type: 'string' },
    'IntProf': { jsonPath: 'system.abilities.int.proficient', type: 'checkbox' },
    'Wei': { jsonPath: 'system.abilities.wis.value', type: 'string' },
    'WeiProf': { jsonPath: 'system.abilities.wis.proficient', type: 'checkbox' },
    'Cha': { jsonPath: 'system.abilities.cha.value', type: 'string' },
    'ChaProf': { jsonPath: 'system.abilities.cha.proficient', type: 'checkbox' },
};
module.exports = { fieldMapping };