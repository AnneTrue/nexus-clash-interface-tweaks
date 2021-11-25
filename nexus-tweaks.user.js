// ==UserScript==
// @name        AnneTrue's Nexus Tweaks
// @version     1.1
// @description Tweaks for Nexus Clash's UI
// @namespace   https://github.com/AnneTrue/
// @author      Anne True
// @homepage    https://github.com/AnneTrue/nexus-clash-interface-tweaks
// @source      https://github.com/AnneTrue/nexus-clash-interface-tweaks
// @match       *://nexusclash.com/clash.php*
// @match       *://www.nexusclash.com/clash.php*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceURL
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.getResourceUrl
// @require     scaffolding.user.js
// @resource    scaffoldingCSS css/scaffolding.css
// @resource    nexusTweaksCSS css/nexus-tweaks.css
// ==/UserScript==

const myPromise = nexusTweaks.registerPromise(); // script-file promise
const promiseList = []; // individual module promises


//##############################################################################
// Generic functions

// returns number of char c in x
function timesCharExist(x, c){
  return (x.match(new RegExp(c,'g')) || []).length;
}


//##############################################################################
promiseList.push((async () => {
  const mod = await nexusTweaks.registerModule(
    'messagestyle',
    'Colour Message History',
    'global',
    'Adds styling to the message history to improve ease of reading. Includes combat actions, searches, speech, and more. Runs in both in-game and the character profile\'s week log',
  );

  const pfx = '^[ ]?- (?:\\(\\d+ times\\) )?'; // message prefix
  const globalMatches = [
    { // fix the a(n) text based on vowels
      msg: /( a)(\((n)\)( [AEIOUaeiou])|\(n\)( [^AEIOUaeiou]))/g,
      op:'replace', val:'$1$3$4$5'
    },
    {
      msg: /(Your weapon was damaged during the attack\. It is now less effective!)/,
      op:'replace', val:'<b><u>$1</u></b>'
    },
    { //replace '' with ' due to a bug in the game
      msg: /(\'\')/g, op:'replace', val:"'"
    },
  ]
  const messageMatches = [
    {
      msg: new RegExp(`${pfx}You attack .*? with your .*? and hit for .*? damage\\.`),
      op:'pad', val:'libAttackHit'
    },
    {
      msg: new RegExp(`${pfx}You attack the (door|ward|fortifications) with `),
      op:'pad', val:'libFort'
    },
    {
      msg: new RegExp(`${pfx}You attack .*? with your .*? and miss\\.`),
      op:'pad', val:'libAttackMiss'
    },
    {
      msg:/You summon (dark forces and attempt to steal.+? You meet with success and drain|the Curse of Blood and touch .+?, inflicting the curse|your inner hatred to inflict the Agony Curse and touch .+?, inflicting the curse)/,
      op:'pad', val:'libAttackHit'
    },
    {
      msg: new RegExp(`${pfx}.*? attacked you with `),
      op:'pad', val:'libAttacked'
    },
    {
      msg:/( Your action causes you to| You| you|The Agony Curse causes you to) take( an additional)? \d+ (point(s)? of( \b[a-z]+\b)? damage|damage)(\.|!)?/,
      op:'pad', val:'libAttackedbyEnvironment'
    },
    {
      msg:/Your pet, .*? has been rejuvenated.\s*You spent \d+ Magic Point/,
      op:'pad', val:'libPetRejuv'
    },
    {
      msg:/ belonging to .*?, (healed you|has funneled life energy)/,
      op:'pad', val:'libPetHealMe'
    },
    {
      msg:/ belonging to .*?, healed .*? for \d+ hit point/,
      op:'pad', val:'libPetHealOthers'
    },
    {
      msg:/Your pet .+? attacked .+? and hit for /,
      op:'pad', val:'libPetHit'
    },
    {
      msg:/((Shambling|Infectious|Rotting) Zombie|.*, belonging to .*,) attacked you and hit for/,
      op:'pad', val:'libPetHitMe'
    },
    {
      msg:/(Your pet |[^,].*, belonging to).*, killing them!/,
      op:'pad', val:'libPetKill'
    },
    {
      msg:/(Your pet |[^,].*, belonging to|(Shambling|Infectious|Rotting) Zombie).* and missed/,
      op:'pad', val:'libPetMiss'
    },
    {msg:/attacked your pet,.*?and hit for /, op:'pad', val:'libPetHit'},
    {msg:/attacked your pet,.* killing it!.*/, op:'pad', val:'libPetKill'},
    {msg:/attacked .*? killing it!/, op:'pad', val:'libPetKill'},
    {msg:/attacked your pet.*? and missed/, op:'pad', val:'libPetMiss'},
    {
      msg:/, belonging to .*?, was killed by a defensive aura projected by /,
      op:'pad', val:'libPetKill'
    },
    {
      msg:/(Your pet .*?|.*?, belonging to .*?,|.*?, a .*?) has despawned/,
      op:'pad', val:'libPetDespawn'
    },
    {
      msg:/(.+?)<font color="#DD0000">(<b>.*<\/b>)<\/font>(.+)/,
      op:'replace',
      val:'<div class="libAchievement">$1<span class="libAchievementColour">$2</span>$3</div>'
    },
    {
      msg:/attacked .+? with .+?, killing (him|her|them)/,
      op:'pad', val:'libKill'
    },
    {msg:new RegExp(`${pfx}<a .+?</a> gave you a`), op:'pad', val:'libReceiveItem'},
    {msg:new RegExp(`${pfx}You give your `), op:'pad', val:'libGave'},
    {msg:/You call upon your crafting skills.*/, op:'pad', val:'libCraft'},
    {msg:/You search and find nothing.*/, op:'pad', val:'libSearchNothing'},
    {msg:/You search and find a.*/, op:'pad', val:'libSearchSuccess'},
    {msg:/You step (inside |outside of )/, op:'pad', val:'libGave'},
    {
      msg:/(You heal yourself and|healed you. You) gain \d+ hit point(s)?.*/,
      op:'pad', val:'libHealed'
    },
    {
      msg:/(heal|healed) you for \d+ point(s)? of damage.*/,
      op:'pad', val:'libHealed'
    },
    {
      msg:/(You heal|You use the .*? to heal|your surgeon skills to tend to .*?|place a stygian bone leech) .*? for \d+ point(s)? of damage/,
      op:'pad', val:'libHealed'
    },
    {msg:/You feel the effects of .+? fade\./, op:'pad', val:'libFaded'},
    {
      msg: new RegExp(`${pfx}<a [^<>]+?>[^<>]+</a> summoned a`),
      op:'pad', val:'libSummon'
    },
    {
      msg:/(suddenly appeared out of thin air\.|disappeared from view\.)/,
      op:'pad', val:'libSummon'
    },
    {
      msg:/spoke words of mystic power and traced eldritch shapes into the air. A burst of warmth rushed through the area as they finished the incantation/,
      op:'pad', val:'libSummon'
    },
    {
      msg: new RegExp(`(${pfx}You (?:say|whisper|emote), )(".+)`),
      op: 'replace',
      val:'<div class="libSpeech"><span class="libEmote">$1</span>$2</div>'
    },
    {
      msg: new RegExp(`${pfx}((Someone used a|You use your) bullhorn to say: ')`),
      op:'pad', val:'libEmote'
    },
    { // broad catch-all emote
      msg: new RegExp(`(${pfx}<a [^<>]+>[^<>]+</a> [^<>]+?)(".+")(.+)`),
      op: 'replace',
      val:'<div class="libSpeech"><span class="libEmote">$1</span>$2<span class="libEmote">$3</span></div>'
    },
  ];

  const singleMatcher = (message, mmObj) => {
    if (!message.match(mmObj.msg)) { return null; }
    if (mmObj.op === 'pad') {
      return `<div class="${mmObj.val}">${message}</div>`;
    } else if (mmObj.op === 'replace') {
      return message.replace(mmObj.msg, mmObj.val);
    } else {
      mod.error(`Unrecognised message matcher object operation '${mmObj.op}'`);
    }
    return null;
  }

  const singleMessage = async (message) => {
    let finalStr = message;
    let found = false;
    for (const mmObj of messageMatches) {
      const matcherResult = singleMatcher(finalStr, mmObj);
      if (matcherResult) {
        finalStr = matcherResult;
        found = true;
        break;
      }
    }
    if (!found) {
      // Make sure we always return a new div
      finalStr = `<div class="libUnknown">${finalStr}</div>`;
    }
    for (const mmObj of globalMatches) {
      const matcherResult = singleMatcher(finalStr, mmObj);
      if (matcherResult) {
        finalStr = matcherResult;
      }
    }
    return finalStr;
  }

  const messagehistory = async (mod) => {
    const messageElement = document.getElementById('Messages');
    if (!messageElement) { return; }
    const histSib = messageElement.previousElementSibling;
    if (histSib && !histSib.innerHTML.match(/This Week/)) {
      // resize message history box
      if (timesCharExist(messageElement.innerHTML, '<br>') > 10) {
        messageElement.style.height = '250px';
      }
      messageElement.style.resize = 'vertical';
    }
    const messages = messageElement.innerHTML.split('\n').join('').split('<br>');
    const msgPromises = messages.map(singleMessage);
    await Promise.all(msgPromises);
    const finalMessages = [];
    for (const msgPromise of msgPromises) {
      finalMessages.push(await msgPromise);
    }
    messageElement.innerHTML = finalMessages.join('');
  }

  await mod.registerMethod(
    'async',
    messagehistory
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await nexusTweaks.registerModule(
    'inventoryTweaks',
    'Inventory Tweaks',
    'local',
    'Inventory functions such as hiding weightless items and contextual buttons.',
  );
  const hideClass = 'nexusTweaksHideWeightless';

  const getInventoryTableBody = () => {
    const invTBodyResult = document.evaluate(
      "//b[starts-with(.,'INVENTORY')]/../../../..",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
     );
     if (invTBodyResult.snapshotLength === 1) {
       return invTBodyResult.snapshotItem(0);
     } else {
       mod.debug('No inventory table body found, or too many found.');
       return null;
     }
  }

  const getInventoryTableHead = (invTBody) => {
    if (invTBody === null) { return null; }
    const invHeadResult = document.evaluate(
      "//th[starts-with(.,'Item')]",
      invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (invHeadResult.snapshotLength === 1) {
      return invHeadResult.snapshotItem(0);
    } else {
      mod.debug('No inventory table head found, or too many found.');
      return null;
    }
  }

  const inventoryToggle = (e) => {
    const button = e.target;
    let action = null;
    if (button.value === 'Show') {
      button.value = 'Hide';
      action = 'table-row';
    } else if (button.value === 'Hide') {
      button.value = 'Show';
      action = 'none';
    }
    mod.setSetting('inventory-toggle-hide', action);
    const elements = document.getElementsByClassName(hideClass);
    for (const element of elements) {
      element.style.display = action;
    }
  }

  const hideWeightless = async (mod) => {
    const disabled = await mod.getSetting('always-show-weightless');
    if (disabled === true) { return; }
    const invTBody = getInventoryTableBody();
    const invTHead = getInventoryTableHead(invTBody);
    if (invTHead === null) { return; }
    let hideState = 'table-row';
    if (await mod.getSetting('inventory-toggle-hide') !== 'table-row') {
      hideState = 'none';
    }
    // Create and add the show/hide button at the top of inventory
    const hideButton = document.createElement('input');
    hideButton.type = 'submit';
    hideButton.className = 'item_use';
    if (hideState === 'none') {
      hideButton.value = 'Show';
    } else {
      hideButton.value = 'Hide';
    }
    hideButton.addEventListener('click', inventoryToggle, false);
    invTHead.nextElementSibling.appendChild(hideButton);
    // Now actually hide all weightless items
    for (const child of invTBody.children) {
      if (child.children[3] && child.children[3].textContent === '0') {
        // We want weightless items that can be manabitten to show up always
        const manabiteMissing = document.evaluate(
          "input[@value='Manabite']",
          child.children[1], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        ).snapshotLength === 0
        if (manabiteMissing) {
          child.className = hideClass;
          child.style.display = hideState;
        }
      }
    }
  }

  await mod.registerSetting(
    'checkbox',
    'always-show-weightless',
    'Always Show Weightless Items',
    'Not recommended to enable. Always displays weightless items, instead of hiding them.',
    null,
  )

  await mod.registerMethod(
    'async',
    hideWeightless
  );
})());


//##############################################################################
// Must be last executed step, as this unlocks nexusTweaks to run
(async () => {
  nexusTweaks.addGlobalStyle(await GM.getResourceUrl('nexusTweaksCSS'));
  await Promise.all(promiseList);
  myPromise.resolve();
  nexusTweaks.runNexusTweaks();
})();
