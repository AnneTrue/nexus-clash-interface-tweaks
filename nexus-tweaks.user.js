// ==UserScript==
// @name        AnneTrue's Nexus Tweaks
// @version     1.7.0
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

const nexusTweaks = new NexusTweaksScaffolding(
  'nexus-tweaks',
  `${GM.info.script.name}`,
  `${GM.info.script.homepage}`
  `${GM.info.script.version}`
);
const myPromise = nexusTweaks.registerPromise(); // script-file promise
const promiseList = []; // individual module promises


//##############################################################################
// Generic functions

// returns number of char c in x
function timesCharExist(x, c){
  return (x.match(new RegExp(c,'g')) || []).length;
}

function truncate(input, maxSize) {
  if (input.length > maxSize) {
    return input.substring(0, maxSize) + '..';
  }
  return input;
};

//##############################################################################
promiseList.push((async () => {
  const mod = await nexusTweaks.registerModule(
      'characterList',
      'Character Interface',
      'local',
      'Replace the default character list with a sorted graphical layout',
  );

  const calculateSortValue = (person) => {
    // higher value = higher up in the list
    let sortValue = 0;

    // layer 1: allegiance, hostiles sort higher
    switch (person.politics) {
      case "faction": sortValue = 0; break;
      case "ally": sortValue = 10000; break;
      case "friendly": sortValue = 20000; break;
      case "neutral": sortValue = 30000; break;
      case "hostile": sortValue = 40000; break;
      case "enemy": sortValue = 50000; break;
    }

    // layer 2: healthiness, hurt people sort higher
    sortValue -= person.currentHp * 1000.0 / person.maxHp;

    person.sortValue = sortValue;
  };

  const checkStatus = (status, lookFor, abbrev, sortValue, cssClass = 'status-tag-standard') => {
    if (status.title.toLowerCase().indexOf(lookFor.toLowerCase()) > -1) {
      status.abbrev = abbrev;
      status.class = cssClass;
      status.sortValue = sortValue;
    }
  };

  const createPerson = (charHtml) => {
    // creates an object of the character's stats from a html string
    const person = {
      'name': null,
      'politics': null,
      'level': null,
      'rank' : null,
      'hpVisible': false,
      'currentHp': null,
      'previousHp': null,
      'maxHp': null,
      'mpVisible': false,
      'currentMp': null,
      'maxMp': null,
      'morality': null,
      'smDuration': null,
      'hpTooltip': null,
      'sortValue': null,
      'newlyJoined': false,
      'statusTags': []
    };

    // character ID and name
    const idNameMatch = /href="javascript:SelectItem\('target_id','(\d+)'\)">(.*?)</.exec(charHtml)
    if (idNameMatch) {
      person.id = idNameMatch[1];
      person.name = idNameMatch[2];
    } else {
      mod.error("Failed to extract name and id of character");
      throw "NAME_ID_NOT_FOUND";
    }

    // politics
    const politicsMatch = /a[^>]+class="(faction|ally|friendly|neutral|enemy|hostile)"/.exec(
        charHtml);
    if (politicsMatch) {
      person.politics = politicsMatch[1];
    } else {
      mod.error(`Failed to extract politics for character ${person.name}`);
      throw "POLITICS_NOT_FOUND";
    }

    // character link (level, and alternate ID)
    const linkMatch = /\(<a href="clash.php\?op=character&amp;id=(\d+)">(\d+)([A-J]?)<\/a>\)/.exec(
        charHtml)
    if (linkMatch) {
      person.level = linkMatch[2];
      // UNTESTED! No example for ranks yet available
      if (linkMatch[3]) {
        person.rank = linkMatch[3];
      }
    } else {
      mod.error(`Failed to extract level for character ${person.name}`);
      throw "LEVEL_NOT_FOUND";
    }

    // HP, first check if actual hit points available
    const hpValuesMatch = /title="(\d+)\/(\d+)\s+hit points"/.exec(
        charHtml)
    if (hpValuesMatch) {
      // with first aid: store correct HP current and maximum values
      person.hpVisible = true;
      person.currentHp = parseInt(hpValuesMatch[1]);
      person.maxHp = parseInt(hpValuesMatch[2]);
      person.hpTooltip = person.currentHp + '/' + person.maxHp + ' HP';
    } else {
      // without first aid: store fake HP values for display purposes only
      person.hpVisible = false;
      // get health estimate from health bar image
      const hpImageMatch = /src="images\/g\/HealthBar_([1-4]).gif"/.exec(charHtml);
      if (!hpImageMatch || !hpImageMatch[1]) {
      mod.error(`Failed to extract fallback hp for character ${person.name}`);
      throw "HP_DATA_NOT_FOUND";
      }
      person.maxHp = 40;
      switch (parseInt(hpImageMatch[1])) {
        case 1:
          person.currentHp = 40;
          person.hpTooltip = 'Healthy';
          break;
        case 2:
          person.currentHp = 30;
          person.hpTooltip = 'Injured';
          break;
        case 3:
          person.currentHp = 20;
          person.hpTooltip = 'Serious';
          break;
        case 4:
          person.currentHp = 10;
          person.hpTooltip = 'Critical';
          break;
      }
    }

    // MP
    const mpValuesMatch = /title="(\d+)\/(\d+)\s+magic points"/.exec(
        charHtml)
    if (mpValuesMatch) {
      person.mpVisible = true;
      person.currentMp = parseInt(mpValuesMatch[1]);
      person.maxMp = parseInt(mpValuesMatch[2]);
      person.hpTooltip += ', ' + person.currentMp + '/' + person.maxMp + ' MP';
    } else {
      person.currentMp = 0;
      person.maxMp = 0;
    }

    // Morality
    const moralityMatch = /title="(\w+)\s+alignment"/.exec(charHtml)
    if (moralityMatch) {
      person.morality = moralityMatch[1];
    }

    // Sorcerers Might
    const smTimeMatch = /SM (\d+) min/.exec(charHtml);
    if (smTimeMatch) {
      person.smDuration = smTimeMatch[1];
      const smStatus = {
        'abbrev': 'SM ' + person.smDuration,
        'title': 'Sorcerer\'s Might (' + person.smDuration + ' minutes)',
        'class': 'status-tag-negative',
        'sortValue': 10
      };
      person.statusTags.push(smStatus);
    }

    // Get all externally visible statuses (displayed as images in vanilla)
    // This will fetch hidden, poison, agony curse etc. (see below)
    const statusRegExp = /<img.+?title="(.+?)".+?src="(.+?)"/;
    let statusMatch = statusRegExp.exec(charHtml);

    let circuitBreaker = 0;
    while (statusMatch != null && circuitBreaker < 20) {
      // ignore health, magic and SM, since already handled
      if (statusMatch[2].indexOf("HealthBar") < 0
          && statusMatch[2].indexOf("MagicBar") < 0
          && statusMatch[1].indexOf("Sorcerers Might") < 0) {
        let newStatus = {
          'abbrev': statusMatch[1].substring(0, 2),
          'title': statusMatch[1],
          'class': 'status-tag-standard',
          'sortValue' : 0
        };
        // parse the character html for hints at player-visible status effects.
        // The description is not consistent ingame (see agony curse!)
        // arg0 target status tag to set (visible) abbreviation and css class
        // arg1 string to look for in the description (not case sensitive)
        // arg2 abbreviation to show in the interface (keep short!)
        // arg3 sort value, higher = further right
        // arg4 css class, either generic positive/negative or morality
        checkStatus(newStatus, 'Evil', 'E', 30, 'status-tag-ev');
        checkStatus(newStatus, 'Neutral', 'N', 30, 'status-tag-nt');
        checkStatus(newStatus, 'Good', 'G', 30, 'status-tag-gd');
        checkStatus(newStatus, 'Hidden', 'H', 20, 'status-tag-positive');
        checkStatus(newStatus, 'Flying', 'F', 20, 'status-tag-positive');
        checkStatus(newStatus, 'Hellfire', 'HF', 10, 'status-tag-negative');
        checkStatus(newStatus, 'Defiler Poison', 'DP', 10, 'status-tag-negative');
        checkStatus(newStatus, 'cursed by', 'AC', 10, 'status-tag-negative');
        person.statusTags.push(newStatus);
      }
      // remove processed status, move on to next one
      charHtml = charHtml.replace(statusMatch[0], '');
      statusMatch = statusRegExp.exec(charHtml);
      circuitBreaker++;
    }
    return person;
  };

  const clearModuleLocalStorage = async (prefix) => {
    const toClear = Object.keys(localStorage)
      .filter(key => key.indexOf(prefix) === 0);
    for(const key of toClear) {
      localStorage.removeItem(key);
    }
  };

  const updatePersonFromLocalStorage = (person, localStorageHpPrefix, locationUnchanged) => {
    // try to see if previous HP is available
    let savedHp = localStorage.getItem(localStorageHpPrefix + person.id);
    if (!savedHp) {
      // person has not been present in last refresh, no previous hp data
      person.previousHp = person.currentHp;
      // also mark as new target if location unchanged and no hp stored
      if (locationUnchanged) {
        let newTargetStatus = {
          'abbrev': 'NEW',
          'title': 'This player has newly appeared in this location',
          'class': 'status-tag-new',
          'sortValue' : 90
        };
        person.newlyJoined = true;
        person.statusTags.unshift(newTargetStatus);
      }
    } else {
      // person has been present, save previous hp to detect new damage
      person.previousHp = parseInt(savedHp);
    }

    // update record of person hp
    localStorage.setItem(localStorageHpPrefix + person.id, person.currentHp);
  };

  const createCharacterHtml = (person) => {
    let hpClass = 'hp-full';
    const percentage = person.currentHp * 100.0 / person.maxHp;
    if (percentage < 99) {
      hpClass = 'hp-injured';
    }
    if (percentage < 51) {
      hpClass = 'hp-serious';
    }
    if (percentage < 26) {
      hpClass = 'hp-critical';
    }
    let statusTagsHtml = '';
    const statusTagsSorted = person.statusTags.sort((a, b) => b.sortValue - a.sortValue);

    // create html for all status tags
    for (let j = 0; j < person.statusTags.length; j++) {
      const currentStatusTag = statusTagsSorted[j];
      statusTagsHtml = statusTagsHtml + `
        <div class="status-tag ${currentStatusTag.class}" 
        title="${currentStatusTag.title}">${currentStatusTag.abbrev}
        </div>
        `;
    }

    const estimatedStatusLength = person.statusTags.map(s => s.abbrev).join('_').length * 8;
    const maxBarValue = Math.max(
        Math.max(person.currentHp, person.maxHp),
        Math.max(person.currentMp, person.maxMp));
    const estimatedAvailableSpace = 160 - estimatedStatusLength;
    let scalingFactor = 1;
    if (maxBarValue > estimatedAvailableSpace) {
      scalingFactor = estimatedAvailableSpace / maxBarValue;
    }

    // transform a HP or MP value into pixels for the bar display.
    // because of a separator at every 10 health, add one for every 10
    // health completed. Scale magic similarily to be consistent.
    // arg0 HP or MP value
    // arg1 whether to round X9 to the nearest multiple of 10.
    // this will treat the ugliness of maxed characters' MP
    const getPixelOffset = (value, round9to10 = false) => {
      let effectiveValue = value;
      if (round9to10 && value % 10 === 9) {
        effectiveValue++;
      }
      return effectiveValue + Math.max(0, Math.floor((effectiveValue-1)/10));
    };
    const previousHpOffset = getPixelOffset(person.previousHp);
    const currentHpOffset = getPixelOffset(person.currentHp);
    const maxHpOffset = getPixelOffset(person.maxHp);
    const levelOrRank = person.rank ? person.rank : person.level;

    // create html for character
    let resultHtml = `
      <div class="char-div">
        <div class="char-div-element level-div">
          <a href="https://nexusclash.com/clash.php?op=character&id=${person.id}"
           target="_blank">${levelOrRank}</a>
        </div>
        <div class="char-div-element name-div politics-${person.politics}" 
        onclick="SelectItem(\'target_id\',\'${person.id}\')">
          ${truncate(person.name, 20)}
        </div>
        <div title="${person.hpTooltip}" 
          class="char-div-element hp-div hp-div-max" style="width: 
          ${maxHpOffset * scalingFactor}px;">
        </div>
        <div title="${person.hpTooltip}" 
        class="char-div-element hp-div hp-div-current ${hpClass}" 
        style="width: ${currentHpOffset * scalingFactor}px;">
        </div>
        <div class="status-images">
          ${statusTagsHtml}
        </div>
      `;

    // optionally add hurt animation
    if (person.currentHp < person.previousHp) {
      const hurtWidth = (previousHpOffset - currentHpOffset) * scalingFactor;
      const offset = 188 + (currentHpOffset + 1) * scalingFactor;
      resultHtml = resultHtml + `
        <div title="${person.hpTooltip}"
        class="char-div-element hp-div hp-div-hurt"
        style="left: ${offset}px; width: ${hurtWidth}px;">
        </div>
        `;
    }

    // optionally add heal animation
    if (person.currentHp > person.previousHp) {
      const healWidth = (currentHpOffset - previousHpOffset) * scalingFactor;
      const offset = 188 + (previousHpOffset + 1) * scalingFactor;
      resultHtml = resultHtml + `
        <div title="${person.hpTooltip}"
        class="char-div-element hp-div hp-div-heal"
        style="left: ${offset}px; width: ${healWidth}px;">
        </div>
        `;
    }

    // optionally add MP bars if MP values known
    if (person.maxMp > 0) {
      const currentMpOffset = getPixelOffset(person.currentMp, true);
      const maxMpOffset = getPixelOffset(person.maxMp, true);
      resultHtml = resultHtml + `
        <div title="${person.hpTooltip}" 
        class="char-div-element mp-div mp-div-max" 
        style="width: ${maxMpOffset * scalingFactor}px;">
        </div>
        <div title="${person.hpTooltip}" 
        class="char-div-element mp-div mp-div-current" 
        style="width: ${currentMpOffset * scalingFactor}px;">         
        </div>
        `;
    }

    // add segmentation for health bar (10hp = 1 segment)
    for(let hpseg = 11;
      hpseg < (Math.max(maxHpOffset, currentHpOffset)); hpseg = hpseg + 11) {
      resultHtml = resultHtml + `
        <div class="char-div-element bar-segments-div" 
        style="left: ${188 + hpseg * scalingFactor}px;">
        </div>
        `;
    }
    resultHtml = resultHtml + '</div>';
    return resultHtml;
  };

  const visualCharacterList = (mod) => {
    const coordArea = document.getElementById('AreaDescription');
    const localStoragePrefix = "ntcl-";
    const localStorageLastLocationKey = `${localStoragePrefix}last-location`;
    const localStorageHpPrefix = `${localStoragePrefix}person-hp-`;
    if (!coordArea) {
      // dead
      clearModuleLocalStorage(localStoragePrefix);
      return;
    }
    const charArea = document.getElementsByClassName('charListArea')[0];
    let peopleMatch = /There (is|are) (\d+) other (person|people) here, (.*)/
    .exec(charArea.innerHTML);

    const locationMatch = /(\d+, \d+ .+?),/.exec(coordArea.innerHTML);
    let location = null;
    // do not fail when location is not available
    if (locationMatch && locationMatch[1]) {
      location = locationMatch[1];
    }
    const previousLocation = localStorage.getItem(localStorageLastLocationKey);
    const locationUnchanged = location && (location === previousLocation);
    localStorage.setItem(localStorageLastLocationKey, location);

    if (!peopleMatch || (peopleMatch[2] === '0')) {
      // no people present, can clear saved previous HP values
      clearModuleLocalStorage(localStoragePrefix);
      localStorage.setItem(localStorageLastLocationKey, location);
      return;
    }
    const charHtmls = peopleMatch[4].substring(1, peopleMatch[4].length - 1).split(
        '>, <');
    const charCount = charHtmls.length;
    let personList = [];

    // save list of people previously seen on last refresh.
    // used to remove entries for people no longer present later
    const peopleToDelete = Object.keys(localStorage)
      .filter(key => key.indexOf(localStorageHpPrefix) === 0);

    // create list of people and calculate sorting value
    for (let i = 0; i < charCount; i++) {
      let element = charHtmls[i];
      let person = createPerson(element);
      calculateSortValue(person);
      updatePersonFromLocalStorage(person, localStorageHpPrefix, locationUnchanged);
      personList.push(person);

      // remove from list of people marked for deletion from local storage
      const index = peopleToDelete.indexOf(localStorageHpPrefix + person.id);
      if (index > -1) {
        peopleToDelete.splice(index, 1);
      }
    }

    // remove all previously saved people that are no longer present
    // so they can register as new again when they reappear
    for(const personToDelete of peopleToDelete) {
      localStorage.removeItem(personToDelete);
    }

    // sort list of people, higher sortValue sorts to top of list
    personList = personList.sort((a, b) => b.sortValue - a.sortValue);

    let title = `There ${peopleMatch[1]} ${personList.length} other ${peopleMatch[3]} here.`;

    const peopleJoined = personList.filter(p => p.newlyJoined);

    if (peopleJoined.length > 0) {
      title += ' New: ';
      let joinedHtml = peopleJoined
        .map((p =>
      `<span class="politics-${p.politics}">
         <a href="https://nexusclash.com/clash.php?op=character&id=${p.id}"
         target="_blank">${p.name}</a></span>`));
      title += joinedHtml.join(', ');
    }

    // create html
    charArea.innerHTML = title + '<br><br>'
      + personList.map(createCharacterHtml).join('')
      + '<br>';

    // necessary hack because of new float child elements in charAreaDiv
    // this should also keep the petListArea div unchanged and intact
    charArea.style.float = 'left';
    charArea.style.width = '100%';
  };

  await mod.registerSetting(
      'select',
      'character-list-display-style',
      'Display Style',
      'Choose the character list tweak to use',
      [{'value' : 'character-list-thalanor', 'text' : 'Thalanor\'s Graphical'},
      {'value' : 'character-list-nexus-tweaks', 'text' : 'Default Nexus Tweaks'}]
  );

  await mod.registerMethod(
      'sync',
      visualCharacterList
  );
})());

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
    'safespeech',
    'Global Safe Speech Buttons',
    'global',
    'Places a safety on speech and bullhorn buttons so that you cannot accidentally send an empty message.',
  );

  const enableSpeechForm = (e) => {
    const button = e.target.previousElementSibling;
    if (e.target.value !== '') {
      button.disabled = false;
    } else {
      button.disabled = true;
    }
  }

  const safeSpeech = async (mod) => {
    const form = document.evaluate(
      "//form[@name='speak' or @name='bullhorn']/input[@type='submit']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const len = form.snapshotLength
    if (len === 0) { return; }
    for (let i = 0; i < len; i++) {
        let inputButton = form.snapshotItem(i);
        inputButton.disabled = true;
        inputButton = document.evaluate(
          "input[@type='text']",
          inputButton.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        );
        inputButton.snapshotItem(0).addEventListener('input', enableSpeechForm, false);
    }
  }

  await mod.registerMethod(
    'async',
    safeSpeech
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await nexusTweaks.registerModule(
    'descriptionHighlight',
    'Global Description Highlight',
    'global',
    'Highlights building light status in the description, and displays how many items are available for pickup.',
  );

  const buildingLights = async (mod) => {
    const lightSpanResult = document.evaluate(
      "//span[@class='building_lights' or @class='neighborhood_lights']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (lightSpanResult.snapshotLength !== 1) {
      mod.debug('Could not find (or too many) light spans')
      return;
    }
    const lightSpan = lightSpanResult.snapshotItem(0);
    const lightsMatch = lightSpan.textContent.match(
      /(The lights are on inside the building|The building lights illuminate the area)/
    );
    let lightClass = ' libLightsOff';  // prefix with a space to append to class names
    if (lightsMatch) {
      lightClass = ' libLights';
    }
    lightSpan.className += lightClass;
  }

  const itemPickup = async (mod) => {
    // count number of items to pickup first
    const pickupResult = document.evaluate(
      "//form[@name='pickup']/select[@name='item']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (pickupResult.snapshotLength !== 1) {
      return;
    }
    const countItemsToPickup = pickupResult.snapshotItem(0).length;
    // count number of targets to shoot
    const shootResult = document.evaluate(
      "//form[@name='targetshooting']/select[@name='item']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    let countItemsToShoot = 0;
    if (shootResult.snapshotLength === 1) {
      countItemsToShoot = shootResult.snapshotItem(0).length;
    }
    // find the sky description span, so that we can add our span after it
    const skyDescResult = document.evaluate(
      "//span[@class='sky_desc']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (skyDescResult.snapshotLength !== 1) {
      mod.log('Cannot find exactly one sky_desc span.');
      return;
    }
    // create the item info span
    const itemSpan = document.createElement('span');
    itemSpan.className = 'libLights';
    itemSpan.textContent = `There are ${countItemsToPickup} items to pickup, ${countItemsToShoot} of which are targets.`;
    skyDescResult.snapshotItem(0).insertAdjacentElement('afterend', itemSpan);
  }

  await mod.registerMethod(
    'async',
    buildingLights
  );
  await mod.registerMethod(
    'async',
    itemPickup
  )
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
          ".//input[@class='item_use' and starts-with(@value, 'Manabite')]",
          child.children[1], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        ).snapshotLength === 0
        // We also want to unconditionally display worn items
        const removeMissing = document.evaluate(
          ".//input[@class='item_use' and starts-with(@value, 'Remove')]",
          child.children[1], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        ).snapshotLength === 0
        if (manabiteMissing && removeMissing) {
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

  const contextOptions = [
    ['give', 'Give'],
    ['safe', 'Safe'],
    ['locker', 'Locker'],
    ['null', 'None'],
  ];

  const createContextButton = (itemID, contextAction) => {
    const contextButton = document.createElement('input');
    contextButton.type = 'button';
    contextButton.value = '-';
    contextButton.title = `Context Button: ${contextAction}`;
    contextButton.id = `nexus-tweaks-context-item-${itemID}`;
    contextButton.classList.add('nexus-tweaks-context-button');
    if (contextAction === 'give' || contextAction === 'safe' || contextAction === 'locker') {
      contextButton.style.display = 'inline';
    } else {
      contextButton.style.display = 'none';
    }
    return contextButton;
  };

  const inventoryContextUse = async (e) => {
    const contextAction = await mod.getSetting('context-select', 'null');
    let formPattern = null;
    switch (contextAction) {
      case 'give': formPattern = "//form[@name='give']/select[@name='give_item_id']"; break;
      case 'safe': formPattern = "//form[@name='safestock' and input[@value='safe']]/select[@name='item']"; break;
      case 'locker': formPattern = "//form[@name='safestock' and input[@value='footlocker']]/select[@name='item']"; break;
      default: mod.log(`Somehow tried to context use with action ${contextAction}?`); return;
    }
    const formResult = document.evaluate(formPattern, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
    if (formResult.snapshotLength !== 1) {
      mod.log(`Unable to find exactly one form for context action ${contextAction}`);
    }
    const formSelect = formResult.snapshotItem(0);
    const formInput = document.evaluate(
      "input[@type='submit']",
      formSelect.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    ).snapshotItem(0);
    const itemID = e.target.id.match(/nexus-tweaks-context-item-([\d]+)/)[1];
    let flag = false;
    const len = formSelect.options.length;
    for (let i = 0; i < len; i++) {
      if (formSelect.options[i].value === itemID) {
        formSelect.selectedIndex = i;
        flag = true;
        break;
      }
    }
    if (!flag) {
      mod.log(`Could not find the option for action ${contextAction} and itemID ${itemID}`);
      return;
    }
    formInput.click();
  };

  const insertContextButton = (contextAction, invRow) => {
    // Get the item ID from the "Drop" button
    const dropButtonResult = document.evaluate(
      "td/form[@name='ItemDrop']/input[@name='item']",
      invRow, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (dropButtonResult.snapshotLength === 0) {
      return;  // this can happen with renamed items that are unable to be dropped
    } else if (dropButtonResult.snapshotLength > 1) {
      mod.log(`Too many drop buttons for inventory row: ${invRow.innerHTML}`);
      return;
    }
    const itemID = dropButtonResult.snapshotItem(0).value;
    const nameSpanResult = document.evaluate(
      ".//td[1]/span", // first td element's span (the item name)
      invRow, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (nameSpanResult.snapshotLength !== 1) {
      mod.log(`Expected one nameSpanResult but got a different amount, returning early for row: ${invRow.innerHTML}`);
      return;
    }
    const contextButton = createContextButton(itemID, contextAction);
    contextButton.addEventListener('click', inventoryContextUse, false);
    nameSpanResult.snapshotItem(0).insertAdjacentElement('beforeBegin', contextButton);
  };

  const inventoryContextSetting = (e) => {
    const selectedSetting = e.target.options[e.target.selectedIndex].value;
    mod.setSetting('context-select', selectedSetting);
    const allContextButtons = document.getElementsByClassName('nexus-tweaks-context-button');
    for (const contextButton of allContextButtons) {
      if (selectedSetting === 'give' || selectedSetting === 'safe' || selectedSetting === 'locker') {
        contextButton.style.display = 'inline';
        contextButton.title = `Context Button: ${selectedSetting}`;
      } else {
        contextButton.style.display = 'none';
        contextButton.title = 'Context Button: disabled';
      }
    }
  };

  const insertContextMenu = (invTHead, contextAction) => {
    const contextSelect = document.createElement('select');
    contextSelect.id = 'nexus-tweaks-context-select';
    contextSelect.title = 'Select Action for Context Buttons';
    const len = contextOptions.length;
    let sIdx = -1;
    for (let i = 0; i < len; i++) {
      if (contextOptions[i][0] === contextAction) {
        sIdx = i;
      }
      let singleOption = document.createElement('option');
      singleOption.value = contextOptions[i][0];
      singleOption.text = contextOptions[i][1];
      contextSelect.add(singleOption);
    }
    contextSelect.selectedIndex = sIdx;
    contextSelect.addEventListener('change', inventoryContextSetting, false);
    invTHead.appendChild(contextSelect);
  };

  const inventoryContextButtons = async (mod) => {
    if (await mod.getSetting('disable-context-button', false)) {
      return;
    }
    const invTBody = getInventoryTableBody();
    const invTHead = getInventoryTableHead(invTBody);
    if (invTHead === null) {
      return;  // not in the inventory, skip trying to add context buttons
    }
    const contextAction = await mod.getSetting('context-select', 'null');
    const invRows = document.evaluate(
      "//tr[@bgcolor='#eeeeee' or @bgcolor='#ffffff']",
      invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const lenRows = invRows.snapshotLength;
    for (let i = 0; i < lenRows; i++) {
      insertContextButton(contextAction, invRows.snapshotItem(i));
    }
    insertContextMenu(invTHead, contextAction);
  };

  await mod.registerSetting(
    'checkbox',
    'disable-context-button',
    'Disable Context Use Button',
    'Not recomended to enable. Disables the contextual buttons for giving/placing in a safe.',
    null,
  );

  await mod.registerMethod(
    'async',
    inventoryContextButtons
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await nexusTweaks.registerModule(
    'thinbars',
    'Thin HP/MP Bars',
    'local',
    'If a character has full HP or MP, their resource bar is displayed thinner.',
  );

  const healthBars = async (mod) => {
    const healthResult = document.evaluate(
      "//img[@src='images/g/HealthBar_1.gif']",
      document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const len = healthResult.snapshotLength;
    for (let i = 0; i < len; i++) {
      healthResult.snapshotItem(i).width = '2';
    }
  }

  const magicBars = async (mod) => {
    const manaResult = document.evaluate(
      "//img[@src='images/g/MagicBar_1.gif']",
      document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const len = manaResult.snapshotLength;
    for (let i = 0; i < len; i++) {
      manaResult.snapshotItem(i).width = '2';
    }
  }

  await mod.registerMethod(
    'async',
    healthBars
  );
  await mod.registerMethod(
    'async',
    magicBars
  );
})());


//##############################################################################
promiseList.push((async () => {
    const mod = await nexusTweaks.registerModule(
        'classifyBadges',
        'Badge Classifier',
        'global',
        'Classifies character badges into a hierarchy on the character info page.',
    );

    const Badges = {
        'Career' : {
            'Alcohol Drunk' : ['Low Tolerance', 'Frat Boy', 'Alcoholic', 'Sinatra', 'Friend of Bill'],
            'Angels Killed' : ['Perverter', 'Ruiner', 'Nightmare Whisperer', 'Voice of Armageddon', 'The End of Hope'],
            'Books Read' : ['Reader', 'Bookworm', 'Librarian', 'Bibliophile', 'Teacher\'s Pet', ...['Teachers Pet']],
            'Deaths' : ['Buried', 'Wormfood', 'Aspect Hunter', 'Lich Pet', 'Coffinmaker\'s Friend', ...['Coffinmakers Friend']],
            'Demons Killed' : ['Cleanser', 'Demonslayer', 'Hammer of Light', 'Justicebringer', 'Blade of the Word'],
            'Doors Destroyed' : ['Opportunity Knocks', 'Big Bad Wolf', 'Here\'s Johnny', 'Landshark', 'Homewrecker', ...['Heres Johnny']],
            'Doors Repaired' : ['Apprentice Carpenter', 'Woodworker', 'Journeyman Carpenter', 'Architect', 'Master Carpenter'],
            'Food Eaten' : ['Taste Tester', 'Gourmand', 'Glutton', 'Masticator', 'Food Critic'],
            'Items Crafted' : ['Sweat Shop Worker', 'Journeyman Blacksmith', 'Factory Foreman', 'Artisan', 'Artifex', ...['Sweatshop Worker']],
            'Items Repaired' : ['Tinker', 'Mender', 'Fixer', 'Handyman', '80s Action Hero'],
            'Kills' : ['Killer', 'Warrior', 'Disciple of Death', 'Master of Death', 'Gravemaker'],
            'Locks Picked' : ['Thief', 'Burglar', 'Second-Story Man', 'Locksmith', 'Master of Tumblers'],
            'Pets Killed' : ['Dogkiller', 'Exterminator', 'Pest Control', 'Trophy Hunter', 'Director of Animal Testing'],
            'Pills Taken' : ['I Have a Headache', 'Pill-popper', 'Living the High Life', 'Monster Addict', 'Slave to the Habit'],
            'Power Removed' : ['Wiresnipper', 'Fusebreaker', 'Circuitbreaker', 'Blackout', 'Degenerate'],
            'Power Restored' : ['Apprentice Electrician', 'Fusemaker', 'Journeyman Electrician', 'Circuitmaker', 'Master Electrician'],
            'Targets Shot' : ['Barn Assassin', 'Sharpshooter', 'Deadeye', 'Gunslinger', 'Hickok'],
            'Damage Dealt' : ['Crusher', 'Smasher', 'Bloodletter', 'Assassin', 'Surgeon\'s Lament', 'Widowmaker', ...['Surgeons Lament']],
            'Damage Taken' : ['Punching Bag', 'Bruised', 'Crushed', 'All Stitched Up', 'Keeping Healers in Business', 'Constantly in Traction'],
            'HP Healed' : ['Medic', 'Doctor', 'Surgeon', 'Healer', 'Bodyweaver', 'Lifesaver']
        },
        'Breath 5' : {
            'Alcohol Drunk': [],
            'Angels Killed': [],
            'Books Read': [],
            'Damage Dealt': [],
            'Damage Taken': [],
            'Deaths': [],
            'Demons Killed': [],
            'Doors Destroyed': [],
            'Doors Repaired': [],
            'Food Eaten': [],
            'HP Healed': [],
            'Items Crafted': [],
            'Items Repaired': [],
            'Kills': [],
            'Locks Picked': [],
            'Pets Killed': [],
            'Pills Taken': [],
            'Power Removed': [],
            'Power Restored': [],
            'Targets Shot': []
        },
        'Breath 4' : {
            'Alcohol Drunk': ['Pink Elephant Rider', 'Trapped in a Bottle'],
            'Angels Killed': ['Darkness Visible', 'Abomination of Desolation'],
            'Books Read': ['Researcher', 'Overeducated'],
            'Damage Dealt': ['Bruiser', 'Apex Predator'],
            'Damage Taken': ['Traumatized', 'Impervious to Pain'],
            'Deaths': ['Cemetery Monopolist', 'Deader than Dead'],
            'Demons Killed': ['Avenger of Blood', 'Hand of Namm'],
            'Doors Destroyed': ['Barrier Free', 'Uninvited'],
            'Doors Repaired': ['Security Expert', 'Siege Warrior'],
            'Food Eaten': ['Gastronomist', 'Great Devourer'],
            'HP Healed': ['First Responder', 'Panacea'],
            'Items Crafted': ['Forgemaster', 'Titan of Industry'],
            'Items Repaired': ['Jerry Rigger', 'Master Mechanic'],
            'Kills': ['Executioner', 'Chooser of the Slain'],
            'Locks Picked': ['Plunderer', 'Five Finger Bargain Hunter'],
            'Pets Killed': ['Varmint Hunter', 'Harbinger of Extinction'],
            'Pills Taken': ['High Roller', 'Everlasting Rehab'],
            'Power Removed': ['Luddite', 'Brings the Night'],
            'Power Restored': ['Illuminati', 'Lights up the World'],
            'Targets Shot': ['Eagle Eyed', 'Gunshepherd']
        },
        'Breath 3' : {
            'Alcohol Drunk': ['Lush', 'Inebriate'],
            'Angels Killed': ['Author of Despair', 'Shroudbringer'],
            'Books Read': ['Critic', 'Proofreader'],
            'Damage Dealt': ['Mauler', 'State of Contusion'],
            'Damage Taken': ['Hemophiliac', 'Uninsurable'],
            'Deaths': ['Rory Williams', 'Disciple of Kenny'],
            'Demons Killed': ['Demonsbane', 'Dawnbringer'],
            'Doors Destroyed': ['Gatecrasher', 'Urban Lumberjack'],
            'Doors Repaired': ['Framer', 'Master Framer'],
            'Food Eaten': ['Gorger', 'Competetive [sic] Eater'],
            'HP Healed': ['Sawbones', 'Hippocrat'],
            'Items Crafted': ['Manufacturer', 'Assembly Line'],
            'Items Repaired': ['Refurbisher', 'Restoration Artist'],
            'Kills': ['Slayer', 'Hand of Death'],
            'Locks Picked': ['Pilferer', 'Midnighter'],
            'Pets Killed': ['Big Game Hunter', 'Taxidermist'],
            'Pills Taken': ['Junkie', 'Cabinet Raider'],
            'Power Removed': ['Pitchman', 'Black Knight'],
            'Power Restored': ['Linesman', 'Head Linesman'],
            'Targets Shot': ['Crack Shot', 'Sniper']
        },
        'Exploration' : {
            'Breath 5' : [
                'A Heaven of Hell', 'According to Their Works', 'Cassandras Truth', 'Club Feral', 'Cognitive Dissonance', 'Convenient', 'Divine Comedy',
                'Earth Was Like a Marble', 'Eternal I Endure', 'Every Mountain Made Low', 'Family Fun', 'Flushed!', 'Going Up', 'Grandest of Slams', 'Hear Ye!',
                'Hell is Other People', 'I Stab at Thee', 'Kenopsia', 'Love Eternal', 'Made to Last', 'No Longer Boarding', 'Not a Drill', 'Not Safe', 'Perseverence of the Saints',
                'Receded Waters', 'Skipping Stones', 'Taste of Dried Leaves', 'They Shall Not Pass', 'This Place is Not a Place of Honor', 'Those Lost', 'Trading Places', 'True Blue',
                'Two Guns', 'Whole Dome', 'Wild in the Woods'
            ],
            'Breath 4' : [
                'A New Chapter', 'Academic Probation', 'All In The Family', 'And I Must Scream', 'At All Costs', 'Baraas Ascends', 'Birthing Pool', 'Broken Alliance',
                'Broken Promises', 'Circumnavigation', 'Citadel', 'Clinging to Life', 'Cloudwatching', 'Cops and Robbers', 'Dedicated Few', 'Enthroned', 'Explosive Yield',
                'Fall of the Watcher', 'Four Corners', 'Fragmented Return', 'Halls of the Scholar', 'Halls of Wrath', 'Idle Hands', 'In The Name Of Science', 'Institute of Arts',
                'Into the Dark', 'Last Confession', 'Reasons to Live', 'Remorse', 'Stolen Victory', 'Tapestry of Time', 'The Earth Shudders', 'The Legend', 'The Little King',
                'The Rise of Kafa-El', 'The Voice', 'Under The Boot', 'Untouched Wilderness', 'Well of Truth', 'What Once Was Lost'
            ],
            'Breath 3' : [
                'Bloodlines', 'Common Touch', 'Cromahl-Hult', 'Deluge', 'Effervescence', 'Eresius Rest', 'Fatigued', 'Favored of Baraas', 'Fire and Ice', 'Flakes of Delight',
                'Fought the Law', 'Four Winds', 'Harmonious Joining', 'Hole in None', 'Immutable Law', 'Landfall', 'Netherland', 'Paradise Lost', 'Riptide', 'Shades of Black',
                'Shades of Grey', 'Sincerest Flattery', 'Tainted Fruit', 'The Crypt of Maeval', 'View from the Top'
            ],
            'Breath 2' : [
                'A Whole New World', 'All Ye All Ye Outs In Free', 'Beginning of the End', 'Blinded by Lust', 'Bloodlust', 'Bridge Magic Built', 'Captain Bloodbeards Folly',
                'Crystal Farm', 'Deck of Cards', 'Goldlust', 'Ground Zero', 'Impassable Dream', 'Last Ship Leaving', 'Mene Mene Tekel Upharsin', 'Smiles All Around', 'Snicker-Snack',
                'Time Sink', 'Tree Hugger', 'Viva La Revolucion', 'Walking Home', 'Watery Grave', 'When The Walls Came Tumbling Down'
            ],
            'Breath 1' : [
                'Altar of the Ancients', 'Big Bang', 'Confluence', 'Founding Father', 'Great Bowl', 'Hermits Repose', 'Iron Barracks', 'Lord Mayor', 'Shrine of the Wound', 'Slowpoke'
            ]
        },
        'Monster Hunting' : {
            'Crystal Guardian' : ['Shardbreaker', 'Crystal Smasher', 'Entropy Incarnate'],
            'Great Wyrm' : ['Wyrm Hunter', 'Wyrm Slayer', 'Wyrmsbane'],
            'Maeval' : ['Stalker of Death', 'Hunter of Death', 'Foe of Death']
        }
    };

    const classifyBadges = (badgesText) => {
        const badgeTexts = badgesText.trim().split(',').map(str => str.trim());
        const classifiedBadges = {};

        for (let bT of badgeTexts) {
            let found = false;
            for (let mainCategory in Badges) {
                for (let subCategory in Badges[mainCategory]) {
                    if (Badges[mainCategory][subCategory].includes(bT)) {
                        if (!(mainCategory in classifiedBadges)) classifiedBadges[mainCategory] = {};
                        if (!(subCategory in classifiedBadges[mainCategory])) classifiedBadges[mainCategory][subCategory] = [];
                        classifiedBadges[mainCategory][subCategory].push(bT);
                        found = true;
                        continue;
                    }
                }
                if (found) continue;
            }
            if (!found) {
                if (!classifiedBadges.Others) classifiedBadges.Others = [];
                classifiedBadges.Others.push(bT);
            }
        }

        return classifiedBadges;
    }

    const printClassifiedBadges = (classifiedBadges, badgesNode) => {
        const MainBadgeCategory = (text, parent) => {
            const categoryNode = parent.appendChild(document.createElement('div'));
			categoryNode.className = 'classify-badges-MBcategory';
            const titleNode = categoryNode.appendChild(document.createElement('div'));
            const contentNode = categoryNode.appendChild(document.createElement('div'));
			titleNode.className = 'classify-badges-MBtitle';
            titleNode.textContent = text;
            titleNode.title = 'Click to expand/collapse';
            titleNode.onclick = () => { contentNode.classList.toggle('hidden'); }
            return contentNode;
        }
        const SecondaryBadgeCategory = (text, parent) => {
            const newNode = document.createElement('div');
			newNode.className = 'classify-badges-SBcategory';
            newNode.textContent = text;
            return parent.appendChild(newNode);
        }
        const BadgeList = (text, parent) => {
            const newNode = document.createElement('div');
			newNode.className = 'classify-badges-BLcategory';
            newNode.textContent = text;
            return parent.appendChild(newNode);
        }

      // unordered: object with unordered keys
      // ordering: a properly ordered object
      // returns: an object with the same keys as "unordered", with the keys holding the same relative order than in "ordering"
      const orderObject = (unordered, ordering) => {
            return Object.keys(unordered).sort(
                (a,b) => (Object.keys(ordering).indexOf(a) < Object.keys(ordering).indexOf(b) ? -1 : 1)
            ).reduce(
                (obj, key) => { obj[key] = unordered[key]; return obj },
                {}
            );
        }

        const EM_SPACE = '\u2003'; // &emsp;
        if (classifiedBadges.Career) {
            const nodeL1 = MainBadgeCategory('Career:', badgesNode);
            Object.entries(orderObject(classifiedBadges.Career, Badges.Career)).forEach(e => {
                const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/${badge6.includes(e[0]) ? '6':'5'}]`, nodeL1);
                BadgeList(e[1].join(', '), nodeL2);
            });
        }
        if (classifiedBadges['Breath 5']) {
            const nodeL1 = MainBadgeCategory('Breath 5:', badgesNode);
            Object.entries(orderObject(classifiedBadges['Breath 5'], Badges['Breath 5'])).forEach(e => {
                const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/2]`, nodeL1);
                BadgeList(e[1].join(', '), nodeL2);
            });
        }
        if (classifiedBadges['Breath 4']) {
            const nodeL1 = MainBadgeCategory('Breath 4:', badgesNode);
            Object.entries(orderObject(classifiedBadges['Breath 4'], Badges['Breath 4'])).forEach(e => {
                const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/2]`, nodeL1);
                BadgeList(e[1].join(', '), nodeL2);
            });
        }
        if (classifiedBadges['Breath 3']) {
            const nodeL1 = MainBadgeCategory('Breath 3:', badgesNode);
            Object.entries(orderObject(classifiedBadges['Breath 3'], Badges['Breath 3'])).forEach(e => {
                const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/2]`, nodeL1);
                BadgeList(e[1].join(', '), nodeL2);
            });
        }
        if (classifiedBadges.Exploration) {
            const nodeL1 = MainBadgeCategory('Exploration:', badgesNode);
            Object.entries(orderObject(classifiedBadges.Exploration, Badges.Exploration)).forEach(e => {
                const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}]`, nodeL1);
                BadgeList(e[1].join(', '), nodeL2);
            });
        }
        if (classifiedBadges['Monster Hunting']) {
            const nodeL1 = MainBadgeCategory('Monster Hunting:', badgesNode);
            Object.entries(orderObject(classifiedBadges['Monster Hunting'], Badges['Monster Hunting'])).forEach(e => {
                const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/3]`, nodeL1);
                BadgeList(e[1].join(', '), nodeL2);
            });
        }
        if (classifiedBadges.Others) {
            const nodeL1 = MainBadgeCategory('Others:', badgesNode);
            BadgeList(classifiedBadges.Others.join(', '), nodeL1);
        }
    }

    const classify = (mod) => {
        const badgesTitle = [...document.querySelectorAll('div.panetitle')].find(div => div.textContent === 'Badges Earned:');
        if (!badgesTitle) {
            mod.debug('Could not find badges pane');
            return;
        }
        const oldBadgesNode = badgesTitle.nextSibling;
        const classifiedBadges = classifyBadges(oldBadgesNode.textContent);
        const newBadgesNode = document.createElement('div');
        oldBadgesNode.parentNode.replaceChild(newBadgesNode, oldBadgesNode);
        printClassifiedBadges(classifiedBadges, newBadgesNode);
    }

    await mod.registerMethod(
        'sync',
        classify
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
