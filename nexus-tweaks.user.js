// ==UserScript==
// @name        AnneTrue's Nexus Tweaks
// @version     999.prev.59.1
// @description Tweaks for Nexus Clash's UI
// @namespace   https://github.com/AnneTrue/
// @author      Anne True
// @author      Thalanor
// @author      Argavyon
// @homepage    https://www.nexusclash.com/viewtopic.php?f=8&t=2081
// @source      https://github.com/Argavyon/nexus-clash-interface-tweaks/tree/preview
// @downloadURL https://github.com/Argavyon/nexus-clash-interface-tweaks/raw/preview/nexus-tweaks.user.js
// @updateURL   https://github.com/Argavyon/nexus-clash-interface-tweaks/raw/preview/nexus-tweaks.user.js
// @match       *://nexusclash.com/clash.php*
// @match       *://www.nexusclash.com/clash.php*
// @exclude     *?op=map
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.listValues
// @grant       GM.getResourceUrl
// @grant       GM.xmlHttpRequest
// @require     scaffolding.js
// @require     https://code.jquery.com/jquery-3.5.1.min.js
// @require     https://code.jquery.com/ui/1.13.1/jquery-ui.min.js
// @resource    jqueryCSS https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css
// @resource    scaffoldingCSS css/scaffolding.css
// @resource    nexusTweaksCSS css/nexus-tweaks.css
// @resource    HELLCSS css/HELL.css
// @require     modules/alchPanel.js
// @require     modules/betterPurchaseSkills.js
// @require     modules/bloodhoundFix.js
// @require     modules/characterList.js
// @require     modules/charIconSelect.js
// @require     modules/classifyBadges.js
// @require     modules/classSpecificTweaks.js
// @require     modules/collapseReleased.js
// @require     modules/colorStatus.js
// @require     modules/defaultSetAllPetStance.js
// @require     modules/descriptionHighlight.js
// @require     modules/easyUsePane.js
// @require     modules/HELL.js
// @require     modules/improvePetDisplay.js
// @require     modules/inPain.js
// @require     modules/inventorySort.js
// @require     modules/inventoryTweaks.js
// @require     modules/mapDoor.js
// @require     modules/messagePaneResize.js
// @require     modules/messageStyle.js
// @require     modules/mobileEnchants.js
// @require     modules/noTargetAllies.js
// @require     modules/safeSpeech.js
// @require     modules/saveLogs.js
// @require     modules/sortSafeSpells.js
// @require     modules/spellAffinity.js
// @require     modules/stigyaAmbiance.js
// @require     modules/thinBars.js
// @require     modules/zalgofy.js
// ==/UserScript==

'use strict';
const promiseList = []; // individual module promises


//##############################################################################
const nexusTweaks = new NexusTweaksScaffolding(
    'nexus-tweaks',
    'AnneTrue\'s Nexus Tweaks',
    'https://github.com/AnneTrue/nexus-clash-interface-tweaks',
    `1.7.2.1`
);

promiseList.push(characterList.module(nexusTweaks));
promiseList.push(messageStyle.module(nexusTweaks));
promiseList.push(safeSpeech.module(nexusTweaks));
promiseList.push(descriptionHighlight.module(nexusTweaks));
promiseList.push(inventoryTweaks.module(nexusTweaks));
promiseList.push(thinBars.module(nexusTweaks));
promiseList.push(classifyBadges.module(nexusTweaks));


//##############################################################################
const argavyonTweaks = new NexusTweaksScaffolding(
    'nexus-tweaks',
    'Argavyon\'s Somewhat Tested Tweaks',
    `${GM.info.script.homepage}`,
    `${GM.info.script.version}`
);

promiseList.push(alchPanel.module(argavyonTweaks));
promiseList.push(betterPurchaseSkills.module(argavyonTweaks));
promiseList.push(bloodhoundFix.module(argavyonTweaks));
promiseList.push(charIconSelect.module(argavyonTweaks));
promiseList.push(classSpecificTweaks.module(argavyonTweaks));
promiseList.push(collapseReleased.module(argavyonTweaks));
promiseList.push(colorStatus.module(argavyonTweaks));
promiseList.push(defaultSetAllPetStance.module(argavyonTweaks));
promiseList.push(easyUsePane.module(argavyonTweaks));
promiseList.push(HELL.module(argavyonTweaks));
promiseList.push(improvePetDisplay.module(argavyonTweaks));
promiseList.push(inPain.module(argavyonTweaks));
promiseList.push(inventorySort.module(argavyonTweaks));
promiseList.push(mapDoor.module(argavyonTweaks));
promiseList.push(messagePaneResize.module(argavyonTweaks));
promiseList.push(mobileEnchants.module(argavyonTweaks));
promiseList.push(noTargetAllies.module(argavyonTweaks));
promiseList.push(saveLogs.module(argavyonTweaks));
promiseList.push(sortSafeSpells.module(argavyonTweaks));
promiseList.push(spellAffinity.module(argavyonTweaks));
promiseList.push(stigyaAmbiance.module(argavyonTweaks));
promiseList.push(zalgofy.module(argavyonTweaks));


//##############################################################################
// Must be last executed step, as this unlocks nexusTweaks to run
const myPromise = nexusTweaks.registerPromise(); // script-file promise
async function main() {
    nexusTweaks.addGlobalStyle(await GM.getResourceUrl('nexusTweaksCSS'));
    await Promise.all(promiseList);
    myPromise.resolve(); // Is this really necessary -- Argavyon
    nexusTweaks.runNexusTweaks();
    argavyonTweaks.runNexusTweaks();
}

main();
