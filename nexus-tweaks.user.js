// ==UserScript==
// @name        AnneTrue's Nexus Tweaks
// @version     999.prev.59
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

promiseList.push(characterList.module());
promiseList.push(messageStyle.module());
promiseList.push(safeSpeech.module());
promiseList.push(descriptionHighlight.module());
promiseList.push(inventoryTweaks.module());
promiseList.push(thinBars.module());
promiseList.push(classifyBadges.module());


//##############################################################################
const argavyonExTweaks = new NexusTweaksScaffolding(
    'nexus-tweaks',
    'Argavyon\'s Somewhat Tested Tweaks',
    `${GM.info.script.homepage}`,
    `${GM.info.script.version}`
);

promiseList.push(alchPanel.module());
promiseList.push(betterPurchaseSkills.module());
promiseList.push(bloodhoundFix.module());
promiseList.push(charIconSelect.module());
promiseList.push(classSpecificTweaks.module());
promiseList.push(collapseReleased.module());
promiseList.push(colorStatus.module());
promiseList.push(defaultSetAllPetStance.module());
promiseList.push(easyUsePane.module());
promiseList.push(HELL.module());
promiseList.push(improvePetDisplay.module());
promiseList.push(inPain.module());
promiseList.push(inventorySort.module());
promiseList.push(mapDoor.module());
promiseList.push(messagePaneResize.module());
promiseList.push(mobileEnchants.module());
promiseList.push(noTargetAllies.module());
promiseList.push(saveLogs.module());
promiseList.push(sortSafeSpells.module());
promiseList.push(spellAffinity.module());
promiseList.push(stigyaAmbiance.module());
promiseList.push(zalgofy.module());


//##############################################################################
// Must be last executed step, as this unlocks nexusTweaks to run
const myPromise = nexusTweaks.registerPromise(); // script-file promise
async function main() {
    nexusTweaks.addGlobalStyle(await GM.getResourceUrl('nexusTweaksCSS'));
    await Promise.all(promiseList);
    myPromise.resolve(); // Is this really necessary -- Argavyon
    nexusTweaks.runNexusTweaks();
    argavyonExTweaks.runNexusTweaks();
}

main();
