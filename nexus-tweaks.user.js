// ==UserScript==
// @name        AnneTrue's Nexus Tweaks
// @version     999.prev.54
// @description Tweaks for Nexus Clash's UI
// @namespace   https://github.com/AnneTrue/
// @author      Anne True
// @author      Thalanor
// @author      Argavyon
// @homepage    https://www.nexusclash.com/viewtopic.php?f=8&t=2081
// @source      https://github.com/Argavyon/nexus-clash-interface-tweaks/tree/preview
// @match       *://nexusclash.com/clash.php*
// @match       *://www.nexusclash.com/clash.php*
// @exclude     *?op=map
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceURL
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.listValues
// @grant       GM.getResourceUrl
// @require     scaffolding.js
// @resource    scaffoldingCSS css/scaffolding.css
// @resource    nexusTweaksCSS css/nexus-tweaks.css
// @require     https://code.jquery.com/jquery-3.5.1.min.js
// @require     https://code.jquery.com/ui/1.13.1/jquery-ui.min.js
// @resource    jqueryCSS https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css
// @resource    HELLCSS css/HELL.css
// ==/UserScript==

const nexusTweaks = new NexusTweaksScaffolding(
  'nexus-tweaks',
  'AnneTrue\'s Nexus Tweaks',
  'https://github.com/AnneTrue/nexus-clash-interface-tweaks',
  `1.7.2.1`
);
const argavyonExTweaks = new NexusTweaksScaffolding(
  'nexus-tweaks',
  'Argavyon\'s Experimental Tweaks',
  `${GM.info.script.homepage}`,
  `${GM.info.script.version}`
);
const myPromise = nexusTweaks.registerPromise(); // script-file promise
const promiseList = []; // individual module promises

//
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
      msg: new RegExp(`${pfx}You attack the barricades to the (North|East|South|West) with`),
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
      messageElement.style.overflow = 'auto';
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
    // for (const child of invTBody.children) {
    //   if (child.children[3] && child.children[3].textContent === '0') {
    //     // We want weightless items that can be manabitten to show up always
    //     const manabiteMissing = document.evaluate(
    //       ".//input[@class='item_use' and starts-with(@value, 'Manabite')]",
    //       child.children[1], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    //     ).snapshotLength === 0
    //     // We also want to unconditionally display worn items
    //     const removeMissing = document.evaluate(
    //       ".//input[@class='item_use' and starts-with(@value, 'Remove')]",
    //       child.children[1], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    //     ).snapshotLength === 0
    //     if (manabiteMissing && removeMissing) {
    //       child.className = hideClass;
    //       child.style.display = hideState;
    //     }
    //   }
    // }
    // Inventory Sorting adds a race condition, this works as a fix
    hideButton.click(); hideButton.click();
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
        'A Heaven of Hell', 'According to Their Works', 'Bloodbreaker', 'Cassandras Truth', 'Club Feral', 'Cognitive Dissonance', 'Convenient', 'Divine Comedy',
        'Earth Was Like a Marble', 'Eternal I Endure', 'Every Mountain Made Low', 'Family Fun', 'Flushed!', 'Forget All That', 'Going Up', 'Grandest of Slams', 'Hear Ye!',
        'Hell is Other People', 'I Stab at Thee', 'Iron Juggernaut', 'Kenopsia', 'Love Eternal', 'Made to Last', 'No Longer Boarding', 'Not a Drill', 'Not Safe',
        'Perseverence of the Saints', 'Receded Waters', 'Skipping Stones', 'Taste of Dried Leaves', 'The Nether Millstone', 'They Shall Not Pass',
        'This Place is Not a Place of Honor', 'Those Lost', 'Trading Places', 'True Blue', 'Two Guns', 'Whole Dome', 'Wild in the Woods', 'With Great Power'
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
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'colorStatus',
    'Colored Status Effects',
    'local',
    'Status effects display colored.',
  );

  const matchAny = (string, matchArray) => {
    for (const m of matchArray) {
      if (string.includes(m)) return true;
    }
    return false;
  }

  const statusColors = { // Warning: CAPS-sensitive
    // ColorName: ['effect1', 'effect2', ...],
    Black: [
      'Deluged', 'Elemental Fog', 'Emergency Bunker', 'Flattened', 'Fog', 'Nimbus of Conquest',
      'Nimbus of Death','Nimbus of Judgement', 'Nimbus of War', 'Parted', 'Rain', 'Raised',
      'Stygian Presence', 'Swimming', 'Thunderstorm', 'Wind Storm'
    ],
    Blue: [ // Buffs
      'Altered Luck', 'Arcane Trail', 'Arcane Well', 'Benevolent Safeguard', 'Blur', 'Burning Incense',
      'Cold Affinity', 'Combat Clarity', 'Conjured Sinews', 'Encourage', 'Flying', 'Gliding', 'Heavy Lifting',
      'Hidden', 'Homing Beacon', 'Incense of Centering', 'Incense of Peace', 'Invisibility', 'Last Rites',
      'Levitation', 'Mystic Mail', 'Mystic Shield', 'Planar Protection', 'Sanctuary Blessing', 'Sharp Vision',
      'Shield of Mercy', 'Sixth Sense', 'Tiger Claw', 'Warriors Blessing', 'Water Breathing', 'on Painkillers'
    ],
    Turquoise: [ // Prayer, Defile, Feeding Fangs
      'Abiding Wickedness', 'Arcane Proficiency', 'Blazing Hosts', 'Blessing of Evasion', 'Blessing of Resistance',
      'Blood Magic', 'Boon of Ahg-Za-Haru', 'Boon of Tholaghru', 'Boon of Tlacolotl', 'Champion of Attunement',
      'Champion of Defiance', 'Champion of Freedom', 'Chaos Cloak', 'Combat Intuition', 'Crusader Blessing',
      'Defensive Power', 'Exalted Fauna', 'Fiendish Foresight', 'Foe of Goliath', 'Hawk Sight', 'Holy Brawn',
      'Holy Eye', 'Holy Mantle', 'Hunter of Iniquity', 'Jericho Shout', 'Light Feet', 'Light Within',
      'Might of Heroes', 'Mystic Insight', 'Oath of Battle', 'Offensive Might', 'Offensive Power', 'Out of Phase',
      'Protective Bulwark', 'Reaper', 'Righteous Judge', 'Sanctuary', 'Soul Devourer', 'Spellgem Affinity',
      'Stone Skin', 'Strength of the Dragon', 'Sulphurous Cloak', 'Transcend Spellgem', 'Unbroken Bond',
      'Unholy Strength', 'Unrelenting Purity', 'Weapon Turning'
    ],
    Green: [ // Class Skill effects
      'Adapted to', 'Adrenaline', 'Angel Hunter', 'Animus of the Bat', 'Animus of the Dust', 'Animus of the Wolf',
      'Aspect of the Ascended', 'Aspect of the Eagle', 'Aspect of the Lion', 'Aspect of the Ox', 'Assassins Edge',
      'Blood Frenzy', 'Bloodlust', 'Bolster Attack', 'Burrowing', 'Cloak of Immanence', 'Cloak of Ineffable Mystery',
      'Cloak of Steadfastness', 'Cloak of Vengeance', 'Cold Touch', 'Combination', 'Covetous Spite',
      'Cruelty of the Assassin', 'Dark Pact', 'Defensive Stance', 'Demon Tracker', 'Dividend of Indolence',
      'Divine Interdiction', 'Divine Providence', 'Divine Resolve', 'Dragon Sight', 'Eldritch Bond', 'Electric Touch',
      'Electrify Blade', 'Exploit Weakness', 'Eye of Storms', 'Faunabond', 'Fiery Shafts', 'Fiery Touch', 'Fires of War',
      'Fists of Holy Resolve', 'Flaming Weapons', 'Flickering Form', 'Grim Mien', 'Harbinger of Conquest',
      'Harbinger of Death', 'Harbinger of Judgement', 'Harbinger of War', 'Healing Aura', 'Holy Fury', 'Holy Light',
      'Holy Radiance', 'Hovering', 'Imperious Demeanor', 'Infernal Jets', 'Invigoration', 'Inviolate Form', 'Judging',
      'Mask of Vengeance', 'Mask of the Impassive', 'Mask of the Penitent', 'Master of the Flow', 'Mutual Suffering',
      'Origami Bow', 'Overclock', 'Passive Regeneration', 'Phasing', 'Precision of the Assassin', 'Rapturous Chant',
      'Resolute', 'Shadow of the Bat', 'Shadow of the Dust', 'Shadow of the Wolf', 'Shield of Faith', 'Sorcerer\'s Might',
      'Steady Aim', 'Stepping of the Assassin', 'Strangling', 'Stygian Fury', 'Unholy Weapons', 'Void Taint', 'Way of Lightning',
      'Way of Void', 'Weapon Breaker', 'Wind Wall', 'Wing Wrap', 'Word of Abolition', 'Word of Censure', 'Word of Condemnation',
      'Word of Opprobrium', 'Word of Wrath'
    ],
    MediumPurple: [ // TLL, Potion effects
      'Acid Affinity', 'Chlorophilter', 'Death Affinity', 'Electric Affinity', 'Fire Affinity', 'Golem Form', 'Holy Affinity',
      'Regenerating', 'Strength', 'Tap Anchor', 'Unholy Affinity'
    ],
    Pink: [ // Zerg
      'Zerg Flag'
    ],
    Red: [ // Debuffs
      'Agony Cursed', 'Arcane Sink', 'Blasphemy against Alonai', 'Blasphemy against Baraas', 'Blasphemy against Namm', 'Blood Curse',
      'Channelled Trail', 'Chilled', 'Choking', 'Cruorblight', 'Defiler Poison', 'Demoralize', 'Doomblight', 'Drained', 'Drunk', 'Enervated',
      'Exposed', 'Fire Storm', 'Frightened', 'Hail Storm', 'Hellfire', 'Hunted By', 'Illuminated', 'Incense of Malice', 'Lethargic',
      'Malice Poison', 'Mark of the Assassin', 'Mark of the Wendigo', 'Minor Poison', 'Pact Debt', 'Phantasmal Terror', 'Plagued with Doubt',
      'Shocked', 'Soul Fray', 'Stunned', 'Succubus Kiss', 'Targeted', 'Touch of the Wendigo', 'Treading Water', 'Twitchy', 'Unsettling Aura',
      'Weakness', 'Wytchfire'
    ]
  };

  const colorStatus = (status) => {
    for (const [color, matchArray] of Object.entries(statusColors)) {
      if (status.textContent && matchAny(status.textContent, matchArray)) {
        status.style.color = color;
        return;
      }
    }
  }

  const setTitle = (status, statusDesc) => {
    status.title = 'Effect: ' + statusDesc[status.textContent];
  }

  const statusDesc = {
    'Abiding Wickedness': 'The character gains +2 damage against all Angels (including Pets) but cannot raise their Morality while the effect is active.',
    'Acid Affinity': 'The character gains +3 damage to all attacks that deal Acid damage, and 50% Resistance to Acid damage.',
    'Adrenaline': 'The character gains a +2 bonus to soak and damage',
    'Adapted to': 'The character gains Immunity to attacks dealing the type of damage they have adapted to. In other words, a character with the \'Adapted to Death\' status effect will take no damage from Death attacks. A character can only have one \'Adapted to\' status effect active at a time.\nBeing hit by an attack that deals damage while the target has the skill Tattoo of Adaptation, which grants 10 status ticks and ends when hit and damaged with another damage type.\nMaking an (even if not successful) attack using Master of Hidden Energy, which grants 5 status ticks and does not end when hit with another damage type.',
    'Agony Cursed': 'While under the effect of this status effect, the character suffers a -15% to all attack rolls. In addition, the character takes extra damage due to the Curse every time the character takes damage from some source. For characters of levels 1- 9, this extra damage is 1 point. For characters of levels 10- 19, this extra damage is 2 points. For characters of levels 20 and higher, this extra damage is 3 points. Regardless of level, the character also loses 1 MP per action taken.',
    'Altered Luck': 'Character gains +1 damage and +5% to hit with all attacks',
    'Angel Hunter': 'The character is informed which tile in a two-tile radius contains the highest total levels of angel characters.',
    'Animus of the Bat': 'This Status Effect grants the character all the bonuses of the Animus of the Bat skill.',
    'Animus of the Dust': 'The character gains +2 Melee damage, heals HP by the full amount of MP drained by the Umbral Sword and can track targets that were successfully hit.',
    'Animus of the Wolf': 'This Status Effect grants the character all the bonuses of the Animus of the Wolf skill.',
    'Arcane Proficiency': 'Grants the Revenant the ability to cast spells from spellgem, but not the ability to learn them.',
    'Arcane Sink': 'All characters in a tile affected by an Arcane Sink - except factionmates of the Conduit who created the Arcane Sink - lose an extra 1 Magic Point per action taken.',
    'Arcane Trail': 'The character gains +5% to attack and a +5% defense bonus, +2 to damage, and +1 to soak vs all damage types.',
    'Arcane Well': 'All characters in the location, including the creator of the Well, gain 1 additional MP per AP Tick.',
    'Aspect of the Ascended': 'Non-combat spells cost 50% of normal MP (rounded up), character is immune to Arcane damage, and character gains the lesser of 4 MP or the damage dealt by Arcane damage, which cannot go over maximum.',
    'Aspect of the Eagle': '+5% accuracy with ranged attacks and +10% bonus to search chances.',
    'Aspect of the Lion': 'When the Holy Champion kills another character in single combat, the kill leaves no corpse and the Champion is not subject to the Hunted By effect if relevant. Pets will not attack the character unless provoked.',
    'Aspect of the Ox': 'Character can pick up and use Super Heavy Items.',
    'Assassins Edge': 'When striking a target afflicted with Mark of the Assassin from hiding or invisibility, Void Walker ignores defense and soak, with the exception of Fortification soak. While it is active, the Void Walker does not benefit from soak, damage resistance, defense and phasing.',
    'Benevolent Safeguard': 'The Redeemed places a single other nonevil character under protection. During this time, any damage the guarded character takes comes out of the Redeemed\'s MP pool on a 1:1 ratio as long as the Redeemed has MP to spend. Every time this protection prevents damage, the Redeemed gains +1 Morality and Experience Points equal to the damage prevented.',
    'Blasphemy against Alonai': 'All healing actions are reduced in effectiveness by 5 points and characters attempting to heal are struck with 5 points of Unholy damage. Healing actions do not raise the healer\'s morality.',
    'Blasphemy against Baraas': 'Characters in the area are treated as members of different factions for the purposes of skill use, such as Way of Void or AOE targeting. Pet targeting is not affected. Restrictions on XP gain for attacking members of your own faction will still apply.',
    'Blasphemy against Namm': 'Holy Supplemental Damage in the area is negated entirely. Attacks that deal Holy damage are reduced in effectiveness by 5 points. Attacking cannot cause a positive Morality shift.',
    'Blazing Hosts': 'The character deals 3 points of fire Supplemental Damage in combat, if they do not have an equal or greater source of Supplemental Damage already.',
    'Blessing of Evasion': 'The character gains +20% to defense.',
    'Blessing of Resistance': 'The character gains +2 soak against all attacks.',
    'Bloodlust': 'Depending on the character\'s skills. Note that a Behemoth must choose between Berzerk Frenzy and Adrenal Healing and may not purchase both skills.\nNormal: The character gains +1 damage and +10% accuracy to any Melee or Hand-to-Hand attack. Character also gains +1 soak.\nAdrenal Healing: The character gains 3 HP for every successful attack action made against a character or pet, and an additional +2 soak.\nChild of Tholaghru: In addition to the benefits of Adrenal Healing, character regenerates 10 HP per ten-second tick.\nBerzerk Frenzy: The character gains an additional +2 damage to any Melee or Hand-to-Hand attack and spends 1 MP per non-attack action, that costs AP, taken (which can end the effect early if no MP is available). Character gains 25% Phasing but loses 10% Defense.\nChild of Tlacolotl: In addition to the benefits of Berzerk Frenzy, Bloodlust is permanent and requires no activation or cost. Non-combat actions during Bloodlust no longer cost MP. The Behemoth deals +2 damage for every 20% of HP it is below maximum.',
    'Blood Curse': 'A character under this Status Effect is unable to be healed by any means, and suffers a -2 penalty to soak.',
    'Blood Frenzy': 'The character gains +2 Damage (all, except spells), +5% to hit (all, including spells), -2 Soak and -5% dodge per Blood Frenzy effect (up to four, the fourth resets one at random). In addition, the character views all other characters as Hostile and spends 1 MP per action, regardless of the amount of Blood Frenzy effects. The character will lose this status effect if they cannot pay the MP cost.',
    'Blood Magic': 'Every time the character spends MP, they gain 2 MP but lose 1 HP.',
    'Blur': '+10% defense, +5% dodge.',
    'Bolster Attack': 'The character with this status effect deals 4 Holy Supplemental Damage with each attack.',
    'Boon of Ahg-Za-Haru': 'See Sulphurous Cloak',
    'Boon of Tholaghru': 'Character gains 2 HP per action or 4 HP per attack action. It is possible to go over maximum HP this way, but any HP over maximum will be lost when the status ends.',
    'Boon of Tlacolotl': 'Supplemental Damage dealt by the character cannot be soaked. Additionally, see Sulphurous Cloak.',
    'Burning Incense': 'The character gains +10% to hit and +2 damage bonus to Melee and Hand-To-Hand attacks.',
    'Burrowing': 'The character moves at half cost through any non-water tile that lacks an interior.',
    'Champion of Attunement': 'The character gains a a damage bonus as if possessing the skill Tattoo of Balance.',
    'Champion of Defiance': 'The character gains a a damage bonus as if possessing the skill Tattoo of Opposition.',
    'Champion of Freedom': 'The character gains a a damage bonus as if possessing the skill Tattoo of Opposition.',
    'Chaos Cloak': 'This status functions like Tattoo of Adaptation, allowing the Demon to adapt to incoming damage types, but works 50% of the time.',
    'Channelled Trail': 'The character gains -5% to attack and a -5% defense, -2 damage and -1 soak vs all damage types',
    'Chilled': 'The character will suffer a -1 soak penalty. Multiple instances will apply multiple penalties to a maximum of -3 soak.',
    'Chlorophilter': 'The character will heal 2 HP per Status Tick if outside in daytime, 1 HP per Status Tick under all other circumstances, and 1 MP per Status Tick if at full HP.',
    'Choking': 'The character will suffer a -10% attack penalty',
    'Cloak of Immanence': 'This status effect has four possible variants:\nBasic: Requires Cloak of Immanence. Character may Infuse even without the Infuse skill. All variants on the Cloak grant this benefit, in addition to their further bonuses.\nEarth: Requires Cloak of Earths Immanence. Character may raise or flatten terrain for 8 hours for 1 AP and 10 MP and is unaffected by Glyph of Sapping vs Good.\nWater: Requires Cloak of Waters Immanence. Character may flood land for 1 hour for 3 AP and 15 MP or part water for 1 hour for 3 AP and 5 MP, and is unaffected by Glyph of Pain vs Good.\nWind: Requires Cloak of Winds Immanence. Character may summon a Wind Storm to thwart outdoor ranged attacks and is unaffected by Glyph of Slowing vs Good.',
    'Cloak of Ineffable Mystery': 'This status effect has four possible variants:\nBasic: Requires Cloak of Ineffable Mystery. Grants lesser flight - May move over Barricades, seep through doors, take no damage from terrain and attack flying characters with close quarters attacks. This movement does not have an AP discount. All variants on the Cloak grant this benefit, in addition to their further bonuses.\nBreeze: Requires Cloak of the Ineffable Breeze. Character may \'Gust\' from tile to tile, spending MP to move instead of AP.\nBurning: Requires Cloak of the Ineffable Burning. Level/6 Fire Aura. Attacks deal Level/7 supplemental fire damage with hand-to-hand, melee and thrown attacks, which is added to Holy Radiance if Holy Radiance is present.\nSea: Requires Cloak of the Ineffable Sea. Character may move through water tiles at no cost, and heal 1 HP per AP-using action.',
    'Cloak of Steadfastness': 'This status effect has four possible variants:\nBasic: Requires Cloak of Steadfastness. +2 Soak vs all damage types and +5% Phasing. All variants on the Cloak grant this benefit, in addition to their further bonuses.\nPurity: Requires Cloak of Steadfast Purity. Character gains Unholy damage immunity and an additional +5% Phasing.\nMountain: Requires Cloak of the Steadfast Mountain. Character gains Impact immunity and an additional +2 Soak vs all damage types.\nSea: Requires Cloak of the Steadfast Sea. Character gains Cold Immunity and 25% damage resistance to all other damage types.',
    'Cloak of Vengeance': 'This status effect has four possible variants:\nBasic: Requires Cloak of Vengeance. +1 damage and +5% accuracy to Innate and Spell attacks. +1 damage and +5% accuracy to Innate and Spell attacks for every angel corpse in the Nexus slain by the target of the Champion\'s attack. All variants on the Cloak grant this benefit, in addition to their further bonuses.\nFiery: Requires Cloak of Fiery Vengeance. Character gains a 8 Fire Thrown \'Ball of Fire\' and a 8 Fire Melee \'Fire Blade\' and may summon a Fire Storm for 10 AP/10 MP.\nIcy: Requires Cloak of Icy Vengeance. Character gains a 8 Cold Thrown \'Ball of Ice\' and a 8 Cold Melee \'Icy Blade\' and may summon a Hail Storm for 10 AP/10 MP.\nThundering: Requires Cloak of Thundering Vengeance. Character gains a 8 Electric Thrown \'Ball of Lightning\' and a 8 Electric Melee \'Static Blade\' and may summon a Thunderstorm for 10 AP/10 MP.',
    'Cold Affinity': 'The character gains +3 damage to all attacks that deal Cold damage, and 50% Resistance to Cold damage.',
    'Cold Touch': 'The character deals Cold damage with Fist/Kick/Haymaker attacks. These attacks apply the Chilled debuff for 5 ticks as per the Cold spell affinity effect.',
    'Conjured Sinews': 'This Status Effect grants +2 damage to hand-to-hand and melee attacks, as well as +20 inventory capacity.',
    'Combat Clarity': 'This Status Effect grants the character a +15% bonus to all attacks.',
    'Combat Intuition': 'The chance of a Critical Hit that raises the Revenant\'s Combination Attack to the next level is raised from 25% to 50%.',
    'Combination': 'The Myrmidon will deal more damage to the target of a Combination Attack. Higher levels of Combination will deal more damage. Attacking a different foe or reaching the highest attainable level of combination will end the combination cycle and start a new one.',
    'Covetous Spite': 'A Fallen with this status effect deals +X damage to targets where X is the number of status effects on the target; however, each attack costs X MP.',
    'Cruelty of the Assassin': 'When striking a target afflicted with Mark of the Assassin from hiding or invisibility, Void Walker ignores 6 points of Soak but gives up three points of damage (i.e., gives up the damage bonus from Mark of the Assassin). If the Void Walker also possesses the Strike of the Assassin skill, additionally any single-combat hit that reduces a target character to 15% of max hit points or lower automatically kills the target (similar to the Affinity ability for Death spells, but works with any damage type). While this toggle is active, the Void Walker does not benefit from soak, damage resistance, defense and phasing.',
    'Cruorblight': 'All healing on the character is halved, whether applied by the self or others.',
    'Crusader Blessing': 'The character gains +2 damage and +20% to hit on all attacks.',
    'Dark Pact': 'The character gains the power of whatever Skill or Spell is inscribed in a Dark Pact. The character is treated as if they are of Evil Morality and cannot gain Morality by any means. If they die they will be bound to serve the creator of their Pact as a Soul Thrall.',
    'Death Affinity': 'The character gains +3 damage to all attacks that deal Death damage, and 50% Resistance to Death damage.',
    'Defensive Power': 'The character gains +10% to defense.',
    'Defensive Stance': 'While this Status Effect is active, any attack that hits the character has a 33% chance of instead being a miss. In addition, every attack action the character (the one with this status effect on them) makes will drain them of 1 MP. If the character attacks while having no MP remaining, the effect ends.',
    'Defiler Poison': 'The character suffers from a demonic poison and as a result takes damage every time they perform an AP-costing action. Tier 1 characters will take 1 point of damage per action, Tier 2 characters 3 points of damage per action, and Tier 3 characters 6 points of damage per action. This damage cannot be soaked by armor or other defensive measures.\nDefiler Poison can be removed through the application of a First Aid Kit, a Healing Herb, a Stygian Bone Leech, through Surgery (with the Surgeon\'s Kit), by drinking a Potion of Healing, Meditation or Absolve Suffering. In all cases the treatment will have its normal effect (recovering Hit Points in the case of Meditation, etc) in addition to removing the poison.\nDeath can be an effective, if somewhat harsh, cure. Upon respawn the character will be rid of the Poison. However, dying only cures the effects of poison for characters under level 10. Poison persists in other characters until they have either cured the effect or has respawned three times.',
    'Deluged': 'A land terrain tile with this effect has been flooded by forces of divine judgement. It will require Athleticism or a travel skill to cross without added AP costs and risk of drowning when remaining there. Any characters present when the effect is cast will begin swimming and be subject to drowning if they did not have some way to bypass swimming. Some demon-specific skills and statuses that normally bypass swimming such as Hovering and Stepping of the Corner will not provide protection. The end of this status effect (or its removal with Rebalance Area) will restore the land to its normal state and will cause any swimming characters present to cease swimming.',
    'Demon Tracker': 'The character is informed which tile in a two-tile radius contains the highest total levels of demon characters.',
    'Demoralize': 'The character suffers a -10% combat accuracy penalty. In addition, this status inflicts a penalty to chance to Hide: 5% at Tier 1, 10% at Tier 2 and 20% at Tier 3.',
    'Dividend of Indolence': 'The Fallen gains this status effect from marking a target with the Dividend of Indolence. If the target is at full MP on a Game Tick (that is, if the MP is wasted), the Fallen gains 1 MP and 2 XP. If the target is at full AP on a Game Tick (the AP is wasted), the Fallen gains 1 AP and 5 XP.',
    'Divine Interdiction': 'All Judgemasters commanded by the Lightspeaker will have their primary damage type changed to the damage type of a spell their master knows. The Lightspeaker may toggle between available damage types at will at no additional cost.',
    'Divine Providence': 'The character gains immunity to Defiler Poison, Dark Heart, Agony Curse and other demonic skills (note that this does not cure existing conditions).',
    'Divine Resolve': 'Normal: Character gains a +5% attack bonus. They can also gain the following bonuses if the Holy Champion responsible for this status effect has the corresponding skill:\nCloak of Immanence: Passive Infusion is increased by one point per action that would already do at least one point of Infusion.\nCloak of Ineffable Mystery: Searching actions are treated as if it was daytime with lights on.\nCloak of Steadfastness: +1 soak to all damage types.\nCloak of Vengeance: +1 damage to Evil characters. If the Holy Champion possesses Hand of Zealotry this is also extended to Neutral characters.',
    'Doomblight': 'Each instance of this effect inflicts a -5% attack penalty and a -5% defense penalty. Multiple instances of the status will have stacking effects.',
    'Dragon Sight': '+5% accuracy with all attacks. Additional benefits can be unlocked with the Tattoo of the Dragons Strength and Tattoo of the Dragons Rage skills.',
    'Drained': 'Characters who are Drained suffer a -1 penalty to damage and -1 soak.',
    'Drunk': 'While drunk, you will receive a +1 damage bonus to Melee and Hand-To-Hand attacks, but a -5% penalty to hit on all attacks.',
    'Electric Affinity': 'The character gains +3 damage to all attacks that deal Electric damage, and 50% Resistance to Electric damage.',
    'Electric Touch': 'The character deals Electric damage with Fist/Kick/Haymaker attacks. These attacks apply the Shocked debuff for 5 ticks as per the Electric spell affinity effect.',
    'Emergency Bunker': 'While an Emergency Bunker is active, members of the Faction that owns the Bunker will receive 7 points of Fortification Soak in the presence of the Bunker. Like Stronghold Fortifications, this Soak value applies to all damage types and stacks with other forms of Soak. If both a Stronghold and an Emergency Bunker are present in the same location, the Fortification values of the Stronghold will override the flat value of the Bunker, even if the Stronghold provides a lower Fortification value.',
    'Eldritch Bond': 'While this status effect is active, the character gains Immunity to both Holy and Unholy damage.',
    'Electrify Blade': 'While this status effect is active, the Seraph\'s Clockwork Blade deals 6 Supplemental Electric damage.',
    'Elemental Fog': 'This is an area status effect that moves with the character. It inflicts -10% search roll penalties on all characters without the skill Water Adept. Characters in other tiles see a “fog” icon instead of the tile population. As an area status it cannot be removed except by another Elementalist with Rebalance Area. The Elementalist cannot use Rebalance Area to remove their own Fog.',
    'Enervated': 'Normal: Characters with the Enervated status effect suffer a penalty to their defense bonus as outlined in the Enervate skill\'s page.\nRend Flesh: Characters that attack a target suffering from the Enervated status effect gain a damage bonus as outlined in the Rend Flesh skill\'s page.',
    'Encourage': 'The character gains +10% accuracy in combat and a +20%/+10%/+5% Searching bonus at Tier 1/2/3.',
    'Exalted Fauna': 'If the Revenant summons a Bat Swarm or Vermin Swarm while under this effect they will get an angelic Exalted Bat Swarm or Exalted Rat Swarm that has better combat stats but will only attack Evil targets.',
    'Exploit Weakness': 'The character will have a higher Damage Floor on attacks - 4 with Unholy damage, 3 with Fire, Cold or Electric damage, and 2 for Acid, Arcane, Impact, Slashing or Piercing damage.',
    'Exposed': 'The character will suffer a -2 soak penalty',
    'Eye of Storms': 'All Archery and Thrown Weapons attacks will deal Electric damage and ignore any Immunities or Resistance a target may possess to Electric damage.',
    'Faunabond': 'Pets will not target the Lightspeaker while this effect is active. The Lightspeaker\'s Pets will not be protected this way. Any attack action by the Lightspeaker will remove this effect.',
    'Fiendish Foresight': 'While under this effect, the character does not suffer extra damage when attacked by Hidden and Invisible characters. They also gain a 10% defense bonus.',
    'Fiery Shafts': 'The character deals 3 points of Fire Supplemental Damage with all Bow attacks, but pays 1 MP per attack. The benefit (but not the status effect) will end if the character does not have MP to pay for it.',
    'Fiery Touch': 'The character deals Fire damage with Fist/Kick/Haymaker attacks. These attacks deal double damage to doors, barricades and fortifications as per the Fire spell affinity effect.',
    'Fists of Holy Resolve': 'While under this effect, the character gains a +20% to hit bonus with Hand-to-Hand attacks. They also have the option to take 1 to 5 points of unsoakable damage per attack, dealing Holy damage those attacks. The character will deal double the amount of damage taken as extra damage.',
    'Fire Affinity': 'The character gains +3 damage to all attacks that deal Fire damage, and 50% Resistance to Fire damage.',
    'Fires of War': 'The character deals 3 Supplemental Fire damage with close-ranged attacks.',
    'Fire Storm': 'Every minute, the Fire Storm rains down 1 point of Fire damage with 70% accuracy upon (caster level)/3 evil targets in the area. Hand of Zealotry extends this to Neutral targets.',
    'Flaming Weapons': 'All Hand-To-Hand and Melee weapon attacks made by the character deal Fire damage instead of their normal damage type and gain a +1 damage bonus.',
    'Flattened': 'A rough terrain tile that requires double AP to move into (e.g. Mountains) is reduced to normal movement costs while this status is active. When the effect ends (or is removed with Rebalance Area) its movement status returns to normal.',
    'Flickering Form': 'The character gains 25 points of Phasing.',
    'Foe of Goliath': 'The Damage Floor of the character\'s attacks is raised to 7 points of damage.',
    'Fog': 'Fog limits the range of vision of characters inside of it. Characters and Pets within Fog cannot be seen from outside the Fog.',
    'Flying': 'The character is flying. The character is able to fly over obstacles on the ground, move for half normal AP cost, and is immune to environmental damage such as from lava. The character cannot be targeted by hand-to-hand and melee attacks from non-flying characters as well as AoE damage.\nThe character cannot engage in close combat against non-flying characters, and must land to interact with objects on the ground, such as doors or portals.\nAt each AP Tick the character will lose this Status Effect and gain the Gliding Status Effect. Moving into a new tile will renew the Flying Status Effect.\nMountains tiles cost 1 AP to move to - half of their base cost of 2 AP - unless the character also has Athleticism.',
    'Frightened': 'Character suffers a -1 penalty to damage and pays 1 MP for every action taken. Pets will suffer the damage penalty if their summoner is afflicted with this status.',
    'Gliding': 'The character is gliding. The character gains this Status Effect after having the Flying Status Effect expire. At the next AP Tick, if the character has not renewed their Flying Status Effect by moving a tile, the character will land at their current location and suffer whatever effects of the terrain they encounter.',
    'Golem Form': 'The character gains 50% damage resistance vs. mundane damage types and +4 damage bonus to all innate HTH attacks. Tile-to-tile movement costs are doubled, character suffers -10% to defense, cannot fly or move into water tiles. If the character is outside and not dead, heal 3 HP and gain 1 MP per AP tick.',
    'Grim Mien': 'A Fallen with this status effect deals 4 points of Unholy Supplemental Damage at a cost of 1 MP per attack.',
    'Hail Storm': 'Every minute, the Hail Storm rains down 1 point of Cold damage with 70% accuracy upon (caster level)/3 evil targets in the area. Hand of Zealotry extends this to Neutral targets.',
    'Harbinger of Conquest': 'This Status Effect grants the character all the bonuses of the Harbinger of Conquest skill.',
    'Harbinger of Death': 'This Status Effect grants the character all the bonuses of the Harbinger of Death skill.',
    'Harbinger of Judgement': 'This Status Effect grants the character all the bonuses of the Harbinger of Judgement skill.',
    'Harbinger of War': 'This Status Effect grants the character all the bonuses of the Harbinger of War skill.',
    'Hawk Sight': 'The character gains +10% to hit on ranged attacks.',
    'Hidden': 'Normal:The character cannot be seen unless they are found with a successful Search action. Characters with certain skills, such as Enhanced Senses, can see all Hidden characters in their location.\nThe hidden character is removed from the description of the location. A Hidden character gains a +10% accuracy bonus to their next attack. This status effect is lost if the character performs an action that costs an Action Point, drops any item, speaks, performs an emote, or promotes a character. This removes the character from hiding, but does not announce their sudden presence to anyone in the room.\nHide: Grants a +4 damage bonus.\nAdvanced Hide: Damage bonus increases to +8 and attack bonus increases to 15%.',
    'Healing Aura': 'The Character will regenerate 1 Hit Point each status tick.',
    'Heavy Lifting': 'The character gains 25 inventory space and is able to pick up and use Super Heavy Items.',
    'Hellfire': 'Other characters who attempt to heal someone afflicted with Hellfire take a number of points of Unholy damage equal to the number of Hellfire minutes remaining. This will consume the status effect.',
    'Holy Affinity': 'The character gains +3 damage to all attacks that deal Holy damage, and 50% Resistance to Holy damage.',
    'Holy Brawn': 'The character gains +2 damage on Hand to Hand and Melee attacks.',
    'Holy Eye': 'The character gains +15% to hit with ranged attacks.',
    'Holy Fury': 'The character gains an extra 20 Hit Points. 1 Hit Point is lost per minute. In addition, each time the character makes an attack while at less than full HP, the character gains 3 HP. The attack must be on a character that the Exalted Harbinger would not lose Morality for attacking.',
    'Holy Light': 'The character gains an extra +1 damage and +10% accuracy with Hand-to-Hand and Archery attacks. The character has the option of spending 1-4 additional MP to gain an additional 5% to 20% accuracy bonus with Hand-to-Hand and Archery attacks and change the damage type to Electric damage.',
    'Holy Mantle': 'Deals +2 damage on all attacks and an additional +2 damage on attacks that deal Holy damage.',
    'Holy Radiance': 'The character will deal 3 points of Supplemental Holy damage on hand-to-hand, melee and thrown weapon attacks. .',
    'Homing Beacon': 'For 1 AP, a character with this Status Effect may teleport once back to the inside of their faction Stronghold if one exists.',
    'Hovering': 'The character is considered to be Flying for purposes of movement (1/2 AP cost for movement), and for combat with other fliers. While under this effect, the character has to pay 3MP every AP tick, if the character cannot pay 3MP, the effect ends and the character lands. Unlike Flying granted e.g. by Wings, Hovering will not protect the user from Pets, nor will it stop the user from entering buildings.',
    'Hunted By': 'The originating character (the hunter) can see the location name and coordinates of anyone with the status effect of \'Hunted By\', regardless of plane.',
    'Hunter of Iniquity': 'The character can detect hidden and invisible characters.',
    'Illuminated': 'All attempts made by the character to hide or go invisible will automatically fail whilst this status is in effect.\nCandle of the Soul: Applies this status effect to Evil characters for 5 Status Ticks\nLamp of Clinging Purity: Applies this status effect to characters for (MO value divided by 5) Status Ticks',
    'Imperious Demeanor': 'The Fallen deals more damage but is more vulnerable. Character ignores 2% of target Defense and has a Damage Floor raised by one. If the Fallen has at least 1/3 of maximum MP this becomes 4% and 2. If the Fallen has at least 2/3 of maximum MP, it becomes 6% and 3. Attacks on the Fallen ignore the same amount of Defense and have the same increased Damage Floor.',
    'Incense of Centering': 'When in an area influenced by Incense of Centering, all Morality-shifting actions are halved. Any time the Incense actually halves a Morality-shifting action, 30 seconds of its duration will be reduced.',
    'Incense of Malice': 'When in an area influenced by Incense of Malice, anyone who is wounded gains an instance of Malice Poison.',
    'Incense of Peace': 'When in an area influenced by Incense of Peace, all characters gain +5% Defense and +1 Soak vs all damage types.',
    'Infernal Jets': 'When inflicted with this status, after the character takes two or more steps in one direction, movement costs are reduced to one third. This effect is lost when changing direction.',
    'Invigoration': 'The Fallen gains 1 MP per Status Tick. It is possible to go over one\'s maximum AP this way. If the character has Dark Aura, this status effect adds +1 MP to the MP that characters lose attacking the Fallen.',
    'Inviolate Form': 'All damage taken by the character subtracts from Magic Points first before affecting Hit Points. If the character has 0MP, the effect does not automatically end.',
    'Invisibility': 'A character that is Invisible cannot be seen or attacked except by a Revenant in Bat Form, Will-O-Wisps, Imps or Aethersprites. The character will lose this status effect if it performs an attack, casts a spell, a nearby spellcaster uses the spell Reveal, or a nearby Redeemed uses the skill Lamp of Clinging Purity. The Demon Tracker skill can also remove invisibility, but only from Demons.\nVoid Walker using Invisibility: Grants the status effect for as long as the Void Walker does not run out of MP, or removes it as outlined previously.\nPotion of Invisibility: Grants the status effect for 15 Minutes\nPotion of Extended Invisibility: Grants the status effect for 720 Minutes (12 hours)',
    'Jericho Shout': 'The character deals 50% greater damage to physical structures: Barricades, Fortifications and Doors. This does not work on characters, pets, or magical structures such as Stronghold Wards and Glyphs.',
    'Judging': 'Each instance of this effect allows the user to reduce 10% of the target\'s resistance, potentially negating Immunity.',
    'Last Rites': 'The character will respawn for Level/3 AP as if they possessed the Paragon of Death skill. If the character also possesses the Paragon of Death skill, both benefits will stack and they will respawn for Level/6 AP.',
    'Lethargic': 'The character will suffer a -10% defense bonus',
    'Levitation': 'The character may travel freely without penalty over obstacles such as water and Void and may attack flying characters. Unlike true flight abilities, Levitation does not confer improved speed, and as such does not reduce the AP cost of travel.',
    'Light Feet': 'The character gains +15% to defense.',
    'Malice Poison': 'The character suffers from a poison and as a result takes 2 damage every time they perform an AP-costing action. This damage cannot be soaked by armor or other defensive measures.',
    'Light Within': 'The character cannot have Magic Points drained by effects such as Dark Heart.',
    'Mark of the Assassin': 'The Void Walker who placed this effect gains +2 bonus damage against the character with the status. Other Void Walker skills enhance this effect further:\nAssassins Edge: Void Walker can activate a toggle to Marked character\'s soak when attacking from hiding.\nCruelty of the Assassin: Void Walker gets +1 damage against Marked target and can activate a toggle to bypass 6 soak at the cost of 3 reduced damage.\nPrecision of the Assassin: +5% accuracy against a marked target and can activate a toggle to instead ignore up to 20% of Defense and Phasing.\nStepping of the Assassin: Void Walker can activate a toggle to ignore damage auras possessed by a marked target.',
    'Mark of the Wendigo': 'While under the influence of the Mark of the Wendigo, the Doom Howler that caused the status may sense the victim from a distance. The Doom Howler may call the victim forth, compelling them to leave cover (even a Stronghold) and walk out into the open. All characters in the surrounding area will hear the call when this happens.',
    'Mask of the Impassive': 'The Redeemed regains 5 HP every 10 seconds.',
    'Mask of the Penitent': 'The character gains a soak bonus equal to Morality divide by 10, 1MO point for each attack dealt to him, a -10% to hit, a -5 to all damage dealt and cannot be inflicted with Agony Curse, Curse of Blood, or Defiler Poison but existing instances are not cured. Any Demon who attacks and misses the character under the influence of Mask of the Penitent gains +2 Morality points, hitting gives an additional +2 points, and scoring a killing blow causes an increase of yet another +2 points (this replaces the normal morality shift for the attack).',
    'Mask of Vengeance': 'The character gains a +2 damage bonus to all Hand-to-Hand, Bow and Thrown Weapons attacks. Attacks made against non-evil characters will shift the character\'s Morality by twice the normal amount.',
    'Master of the Flow': 'All successful attacks made against the character have a 20% chance to miss instead. Only attacks by characters have this chance to miss; attacks by Pets are unaffected.',
    'Might of Heroes': 'The character gains +4 damage on Hand to Hand and Melee attacks.',
    'Minor Poison': 'The character suffers from a poison and as a result takes 1 damage every time they perform an AP-costing action. This damage cannot be soaked by armor or other defensive measures.\nMinor Poison will last 150 Action Point ticks, or until the character receives healing. It can be removed through the application of a First Aid Kit, a Healing Herb, a Stygian Bone Leech, through Surgery (with the Surgeon\'s Kit), by drinking a Potion of Healing, Meditation or Absolve Suffering. In all cases the treatment will have its normal effect (recovering Hit Points in the case of Meditation, etc) in addition to removing the poison.\nDeath is also an effective, if somewhat harsh, cure. Upon respawn the character will be rid of the Minor Poison.\nAlchemical Experimentation through the use of Alchemy can apply a random number (up to 50) of Minor Poison ticks on you.',
    'Mutual Suffering': 'If a character with Mutual Suffering is struck by an attack for ten or more damage, the enemy will be hit with the same amount of unsoakable damage. This applies to both player characters and Pets, but not to AOE attacks.',
    'Mystic Insight': 'Grants the Revenant the ability to see enchantments on items in their inventory.',
    'Mystic Mail': 'Grants the character +6 Soak against Piercing, Impact and Slashing. Unlike the Mystic Shield spell, this soak does not stack with mundane soak granted by equipped armor.',
    'Mystic Shield': 'Grants the character +2 Soak',
    'Nimbus of Conquest': 'All Good characters in the area receive +5% accuracy and all Evil characters lose 5% accuracy. All combat-related passive Infusion in the area has double the effect, regardless of which character caused it.',
    'Nimbus of Death': 'Damage Floor for all attacks in the area is raised by two points. Every time any character in the area kills another character, the Exalted Harbinger who created the effect gains 1 Action Point.',
    'Nimbus of Judgement': 'Actions that would cause Morality loss deal damage to the doer of those actions by an amount equal to the Morality loss. Actions that would cause Morality gain heal the doer of those actions by an amount equal to the morality gain. Fractions round up - an act that would cause 1.2 points of morality loss will deal two damage.',
    'Nimbus of War': 'All characters in the area deal +2 damage on attacks against all targets in the presence of the Nimbus of War.',
    'Oath of Battle': 'While a Lightspeaker is under this status effect, any Pet under the command of the Angel that kills a character will receive the Exalted attribute. Exalted pets deal +2 damage, have +10% attack accuracy, and get +10 maximum AP and MP. Pets can only become Exalted once. The kill must be of a character, not another Pet.',
    'Offensive Might': 'The character gains +2 damage and +10% to hit on all attacks.',
    'Offensive Power': 'The character gains +1 damage on all attacks.',
    'on Painkillers': 'Character gains +1 soak to all damage and suffers from a -5% to hit on all attacks.',
    'Origami Bow': 'While this status is active, the character will have an Origami Bow, an Innate Weapon that deals 10 Slashing damage with +5% accuracy. The bow will vanish when the status ends.',
    'Out of Phase': 'Attacks aimed at the character have a flat 15% chance of failing.',
    'Overclock': 'Every action taken under the effects of this status grants +2 MP. If MP is full but the character is at less than maximum health, it grants +1 HP.',
    'Pact Debt': 'The character is treated as if they are of Evil Morality and cannot gain Morality by any means. If they die they will be bound to serve the creator of their Dark Pact as a Soul Thrall.',
    'Parted': 'A water terrain tile is passable as if it was dry land. Characters cannot swim or drown here nor do they need Athleticism to reduce the cost of passing through. When the effect ends (or is removed with Rebalance Area) its movement status returns to normal. The end of this status effect will cause characters that are not flying nor immune to drowning to start swimming with the possibility of drowning if they idle there.',
    'Passive Regeneration': 'While Passive Regeneration is active, each Game Tick a Summoner will automatically spend MP to Rejuvenate pets that are at lower than half of their maximum AP, MP and HP, provided that the master has the MP with which to do so. In addition, if the summoner is at maximum MP, their lowest-AP pet will be rejuvenated.',
    'Phasing': 'Attacks aimed at the character have a flat 30% chance of failing.',
    'Phantasmal Terror': 'The Doom Howler that inflicted this effect on you gains a 20% defense bonus against your character. Further attacks on the target by the same Doom Howler will reap MP. While under this status, it is possible to have up to the duration in MP drained to serve the Doom Howler via Manifest Nightmare.',
    'Plagued with Doubt': 'While under the effects of Plagued with Doubt, the minimum amount of damage the character takes from an attack is increased from 1 to (character\'s Morality / 10), rounded up. The actual attacks do not do more damage -- only the minimum threshold of damage inflicted is increased.\nA character with this Status Effect has the option (in their skill pane) to \'negate the doubt\'. This costs 0 Action Points, but the character will lose a number of points of Morality equal to the minimum threshold of damage this Status Effect has inflicted upon them (that is, their Morality divided by 10, rounded up).',
    'Planar Protection': 'While under the effect of this Status Effect, the character will not take damage incurred due to being/moving on a hostile plane of existence. Unlike the Planar Protection skill, this status effect will not negate terrain damage such as damage from swimming in a Searing River or passing through Hallowed Ground.',
    'Precision of the Assassin': 'When striking a target afflicted with Mark of the Assassin, Void Walker ignores up to 20% of the target\'s Defense and up to 20% of the target\'s Phasing. The Void Walker gives up 5% of accuracy, forfeiting the passive benefit of the Precision of the Assassin skill. While it is active, the Void Walker does not benefit from soak, damage resistance, defense and phasing.',
    'Protective Bulwark': 'The character gains +6 soak against all attacks.',
    'Rain': '-5% combat accuracy.',
    'Raised': 'The tile requires double AP to move into as if it were Mountains. When the effect ends (or is removed with Rebalance Area) its movement status returns to normal.',
    'Rapturous Chant': 'The character may not use Song of the Word.',
    'Reaper': 'The Revenant deals +5 damage to characters who are near death, defined as below 25% of their maximum health.',
    'Regenerating': 'At each Status Tick the character will gain 3 Hit Points. The character cannot go over their normal Hit Point maximum through use of this potion.',
    'Resolute': 'The character gains a +3 soak bonus for a number of ticks depending on the damage dealt to kill a target using the Greater Smite charged attack.',
    'Righteous Judge': 'The character gains +4 damage and +20% combat accuracy vs Demons.',
    'Sanctuary': 'On gaining this status effect, the character is automatically hidden. The character also gains +2 soak against all attacks and +10% to defense.',
    'Sanctuary Blessing': 'The character gains +1 Soak against all damage types and +5% Defense.',
    'Shadow of the Bat': 'Normal: The character gains +10% to dodge, half AP movement cost and cannot interact with doors, their inventory or take offensive actions.\nAnimus of the Bat: This status effect is improved as detailed on the skill\'s page.',
    'Shadow of the Dust': 'Normal: This Status Effect grants the character all the bonuses of the Shadow of the Dust skill.',
    'Shadow of the Wolf': 'Normal:The character gains +5% to dodge close combat attacks, a +10% to dodge ranged attacks, half AP movement cost, a Bite attack that deals 8 Piercing damage and cannot interact with doors, their inventory or use other weapons than the Bite attack.\nAnimus of the Wolf: This improves the effect as outlined on the skill\'s page.',
    'Sharp Vision': '+15% to hit with Ranged Attacks (both weapons and spells).',
    'Shield of Faith': 'While under the effects of Shield of Faith, the next attack on the Paladin that would deal 10 or more damage is negated and the status effect is consumed.',
    'Shield of Mercy': 'While under the effects of Shield of Mercy, the character gains bonus defense if injured, which provides more protection the greater the character\'s wounds. This increases defense by 10% if injured, 15% if at less than 50% HP and 20% if at less than 25% HP. If the Redeemed who applied the effect had the skill Enfolding Mercy, the Shield provides +1 soak if the target is injured, +2 soak if the target is at 66% or less of maximum HP, and +3 soak if the target is at 33% or less of maximum HP.',
    'Shocked': 'The character will suffer a -5% defense penalty. Multiple instances will apply multiple penalties to a maximum of -15% defense.',
    'Sixth Sense': 'While under the effects of Sixth Sense, attacks from hidden characters do not deal the \'from hiding\' bonus damage. This is similar to Enhanced Senses, but does not grant the ability to see hidden characters.',
    'Sorcerer\'s Might': 'While this Status Effect is active the character cannot receive any healing. Any such attempts will instead decrease the duration by 1 minute per point of healing. Aethersprites\' , Will-O-Wisps\' or Wights\' healing abilities have no effect on a character under Sorcerer\'s Might, they do not reduce the duration of this status effect, nor do they increase the Sorcerer\'s hit points. Characters with First Aid may view whether this status effect is present on another character, and if so will show how many minutes remain. When there is less than one minute remaining on the status, it appears to characters with First Aid as \'SM -0\'. Any heals applied at this point to not dispel the status, and heal for the full amount of HP. In this way, healing can be done by players even in the presence of Aethersprites.',
    'Soul Devourer': 'Skills that grant MP or damage enemy MP on attack actions now double the MP gain. (Focused Attack, Umbral Sword, and Mantle of Vrykokalas)',
    'Soul Fray': 'Any blow dealt on the character that brings health to less than 15% of maximum slays the afflicted character instantly.',
    'Spellgem Affinity': 'The MP cost of recharging spellgems is temporarily halved and the AP cost is reduced to 1.',
    'Steady Aim': 'The character gains a bonus 0% to 10% to hit equal to the amount of MP spent activating it.',
    'Stepping of the Assassin': 'When striking a target afflicted with Mark of the Assassin, Void Walker ignores any Auras the target may have. While it is active, the Void Walker does not benefit from soak, damage resistance, defense and phasing.',
    'Stone Skin': 'The character gains +4 soak against all attacks.',
    'Strangling': 'The character gains +3% accuracy and +1 Death Supplemental Damage against the specific target when making a Hand-to-Hand Combat attack. Multiple instances of the status effect will apply multiple instances of the bonus.',
    'Strength': 'The character will deal +2 points of damage and +10% accuracy with all Hand-to-Hand and Melee attacks. Hand-to-Hand spells will not be affected (for you Liches out there). The character will gain +20 inventory carrying capacity.',
    'Strength of the Dragon': 'The character gains +5 damage on Hand to Hand and Melee attacks.',
    'Stunned': 'While under the effect of this Status Effect, the character will suffer a -10% attack penalty and a -2 damage penalty.',
    'Stygian Fury': 'While under the effects of this status effect, the Pariah will deal +1 damage and gain 1 MP per action, but will lose 2 HP per action. It is possible to go above maximum MP this way.',
    'Stygian Presence': 'Dark Oppressors in the area gain Lord over Domain bonuses as if they were in Stygia, even if they are elsewhere.',
    'Succubus Kiss': 'A character afflicted by this debuff loses 10% combat accuracy. Every form of healing on the character, whether by oneself or others, is reduced in effectiveness - by 20% at levels 1-9, 33% at levels 10-19, and 50% at levels 20+. The Corruptor who inflicted this status gains XP and (if in need of healing) the healing that the victim lost.',
    'Sulphurous Cloak': 'The character gains an aura (6 unholy damage). Close combat attacks made by the character will deal 4 Unholy Supplemental Damage in addition to the normal attack damage. If the attack is a Touch Spell using Taint Spell, this status will simply grant +6 damage instead of Supplemental Damage.',
    'Swimming': 'The character is swimming. The character gains this Status Effect when they enter a water tile. At the next Action Point tick after entering water, the character will lose this Status Effect and gain the Treading Water Status Effect. Moving into a new water tile will renew the Swimming Status Effect.',
    'Tap Anchor': 'This effect is given to a character that has tapped into a Font of magical power, while connected to the Font the character will utilize the Font\'s MP pool as if it were their own.',
    'Targeted': 'Normal: The character gets a -10% defense bonus\nReveal Weakness: The character\'s Damage Floor is set to 4 instead of 1.',
    'Thunderstorm': 'Every minute, the Thunderstorm rains down 1 point of Electric damage with 70% accuracy upon (caster level)/3 evil targets in the area. Hand of Zealotry extends this to Neutral targets.',
    'Touch of the Wendigo': 'After 12 hours, this status effect will mature into the Mark of the Wendigo status effect, allowing the Doom Howler to detect its victims and compel them to leave protective cover.',
    'Transcend Spellgem': 'Spells cast from spellgems will temporarily not use up any stored charges.',
    'Tiger Claw': 'The character gains a +20% attack bonus to close-ranged attacks, including hand-to-hand, melee and swords.',
    'Treading Water': 'The character is treading water. The character gains this Status Effect after having the Swimming Status Effect expire. At the next Action Point tick, if the character has not renewed their Swimming Status Effect by moving, the character with Treading Water will drown and instantly die.',
    'Twitchy': 'The user becomes twitchy and as a result has a -5% to hit with all attacks.',
    'Unbroken Bond': 'Weapons wielded by the character cannot degrade when attacking.',
    'Unholy Affinity': 'The character gains +3 damage to all attacks that deal Unholy damage, and 50% Resistance to Unholy damage.',
    'Unholy Strength': 'All close-quarters attacks made by the character deal Unholy damage instead of their normal damage type and gain a +3 damage bonus.',
    'Unholy Weapons': 'All Hand-To-Hand and Melee weapon attacks made by the character deal Unholy damage instead of their normal damage type and gain a +1 damage bonus.',
    'Unrelenting Purity': 'If the character is Evil, they have 3 lower Soak against Holy damage.',
    'Unsettling Aura': 'All non-factionmates of the Doom Howler in the demon\'s presence suffer a -5% attack and defense penalty.',
    'Void Taint': 'The character receives a negative soak equal to the highest amount of soak they have bypassed while under the current instance of Void Taint.',
    'Warriors Blessing': 'The character gains +1 damage with all attacks and +5% accuracy.',
    'Water Breathing': 'While under the effect of this Status Effect the character is able to move through water tiles for a cost of 1 Action Point per tile moved. It also allows characters to move through lava (such as the rivers in Stygia), although water breathing does not protect against the damage caused by this.',
    'Way of Lightning': 'While under the effect of this Status Effect, the character is able to move across normally walkable tiles at half cost. If the character has Swim, water tiles are also reduced to half the normal travel cost.',
    'Way of Void': 'While in the presence of this status effect, all factionmates of the Eternal Soldier who has the Way of Void skill get +5% accuracy on all attacks. Multiple instances of this skill do not produce multiple bonus. The Eternal Soldier generating the status does not receive the benefit.',
    'Weakness': 'The character will suffer a -2 damage penalty',
    'Weapon Breaker': 'While under this Status Effect, the character has a base 20% chance to damage a weapon in the inventory of a target upon a successful hit. This base chance can be increased to a maximum of 100% by spending 1 additional Magic Point per 10% increase.\nA weapon that can be repaired (for example, a sword or gun) will suffer the loss of 1 step of quality if hit by this effect. A weapon that is at destroyed quality or that cannot be repaired (for example, improvised weapons such as sledgehammers or golf clubs) will be completely destroyed and immediately removed from the target\'s inventory.\nThe chance of any particular weapon being hit by this effect is proportional to its weight. A weapon with a weight of 6 will be twice as likely to be hit as a weapon with a weight of 3.',
    'Weapon Turning': 'All weapons attacking the character have a +5% chance to decay.',
    'Wind Storm': 'Ranged attacks in the area get -20% accuracy.',
    'Wind Wall': '5% defense vs close attacks and 10% defense vs ranged attacks. Incoming attacks have +5% chance of weapon degradation.',
    'Wing Wrap': 'While under this Status Effect the character gets +6 to all soaks but cannot move nor attack.',
    'Wytchfire': 'Every AP Tick, the status effect deals 4 Fire damage to the target. If a target suffering from Wytchfire is hit by any attack, the attack gains 4 Supplemental Death Damage.\nAny actions taken by a target suffering from Wytchfire cause the target to take 4 points of Fire or Death damage (randomly determined).',
    'Zerg Flag': 'Has no direct in-game effect, but exists to notify you that your action failed due to tripping a zerg flag.',
    'Word of Abolition': 'The Archon deals +5 damage against inorganic targets (Glyphs, Wards, Doors, Fortifications, Barricades)',
    'Word of Censure': 'An opponent\'s Defense bonus is only half as effective against the Archon.',
    'Word of Condemnation': 'An opponent\'s Resistance is only half as effective against the Archon.',
    'Word of Opprobrium': 'An opponent\'s Phasing chance is only half as effective against the Archon.',
    'Word of Wrath': 'The Archon\'s attacks deal 4 supplemental death damage with hand-to-hand, melee, thrown and spell attacks.',
  };

  const colorStatusPane = async (mod) => {
    const charInfo = document.getElementById('CharacterInfo');
    if (!charInfo) return;
    const statusPane = charInfo.querySelector('tbody').lastChild;
    for (const status of statusPane.firstChild.children) {
      colorStatus(status);
    }
    for (const status of statusPane.firstChild.children) {
      setTitle(status, statusDesc);
    }
  }

  await mod.registerMethod(
    'sync',
    colorStatusPane
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'inventorySort',
    'Inventory Sorter',
    'local',
    'Sort and Categorize Inventory Items.',
  );

  const matchItem = (itemName, filter) => {
    const parseName = (name, splitMode) => {
      if (!splitMode) return name.trim();
      else if (splitMode === 'tail') return itemName.split(',').slice(-1)[0].trim();
      else if (splitMode === 'head') return itemName.split(',')[0].trim();
      else throw 'Invalid split mode';
    }
    const parsedName = parseName(itemName, filter.split);
    if (filter.op === 'equals') {
      for (const m of filter.match) if (parsedName === m) return true;
    } else {
      for (const m of filter.match) if (parsedName[filter.op](m)) return true;
    }
    return false;
  }

  let filters = [];

  const loadFilter = async (index) => {
    const filter = {};

    const loadPromises = [
      mod.getValue(`filter-${index}-category`)
        .then(value => {
          filter.category = value;
          return true;
      }),
      mod.getValue(`filter-${index}-op`)
        .then(value => {
          filter.op = value;
          return true;
      }),
      mod.getValue(`filter-${index}-split`)
        .then(value => {
          filter.split = value;
          return true;
      }),
      mod.getValue(`filter-${index}-showWeightless`)
        .then(value => {
          filter.showWeightless = (value === 'false') ? false : (value ? true : false);
          return true;
      }),
      mod.getValue(`filter-${index}-match`)
        .then(value => {
          filter.match = value.split('\n');
          return true;
      }),
    ];

    return Promise.all(loadPromises).then(_ => filter);
  }

  const storeFilter = async (index, filter) => {
    const storePromises = [
      mod.setValue(`filter-${index}-category`, filter.category),
      mod.setValue(`filter-${index}-op`, filter.op),
      mod.setValue(`filter-${index}-split`, filter.split),
      mod.setValue(`filter-${index}-showWeightless`, filter.showWeightless),
      mod.setValue(`filter-${index}-match`, filter.match.join('\n'))
    ];

    return Promise.all(storePromises);
  }

  const deleteFilter = async (index) => {
    const deletePromises = [
      mod.deleteValue(`filter-${index}-category`),
      mod.deleteValue(`filter-${index}-op`),
      mod.deleteValue(`filter-${index}-split`),
      mod.deleteValue(`filter-${index}-showWeightless`),
      mod.deleteValue(`filter-${index}-match`)
    ];

    return Promise.all(deletePromises);
  }

  const updateFilterCount = async () => {
    return mod.setValue('filter-count', filters.length);
  }

  const defaultFilter = () => {
    return {
      category: '', op: 'equals', split: '', showWeightless: false, match: []
    };
  }

  const inventoryFilterUI = (index) => {
    const filterUI = document.createElement('tbody');
    // category: 'Innate Weapons', op: 'includes', split: 'tail', showWeightless: true, match: []
    const firstRow = filterUI.appendChild(document.createElement('tr'));

    const category = firstRow.appendChild(document.createElement('td'));
    category.dataset.id = 'category';
    category.textContent = 'Category ';
    const categoryInput = category.appendChild(document.createElement('input'));
    categoryInput.type = 'text';

    const compare = firstRow.appendChild(document.createElement('td'));
    compare.dataset.id = 'op';
    compare.colSpan = 2;
    compare.textContent = 'Comparing Operator ';
    const compareSelect = compare.appendChild(document.createElement('select'));
    compareSelect.add(new Option('Starts With', 'startsWith'));
    compareSelect.add(new Option('Ends With', 'endsWith'));
    compareSelect.add(new Option('Equals', 'equals'));
    compareSelect.add(new Option('Includes', 'includes'));

    const secondRow = filterUI.appendChild(document.createElement('tr'));

    const splitMode = secondRow.appendChild(document.createElement('td'));
    splitMode.dataset.id = 'split';
    splitMode.textContent = 'String Splitting ';
    const splitSelect = splitMode.appendChild(document.createElement('select'));
    splitSelect.add(new Option('None', ''));
    splitSelect.add(new Option('Head', 'head'));
    splitSelect.add(new Option('Tail', 'tail'));

    const showWt0 = secondRow.appendChild(document.createElement('td'));
    showWt0.dataset.id = 'showWeightless';
    showWt0.textContent = 'Show Weightless ';
    const showWt0Box = showWt0.appendChild(document.createElement('input'));
    showWt0Box.type = 'checkbox';

    const remove = secondRow.appendChild(document.createElement('td')).appendChild(document.createElement('input'));
    remove.parentNode.dataset.id = 'remove';
    remove.type = 'button';
    remove.value = 'Remove Filter';
    remove.onclick = function() {
      const last = filters.length - 1;
      if (index < last) {
        storeFilter(index, filters[last]);
        filters[index] = { ...filters[last] };
      }
      filters.pop();
      deleteFilter(last);
      updateFilterCount();
      mod.debug(`Removed filter #${Number(index)+1}`);

      const table = document.querySelector('table#inventorySort');
      table.querySelectorAll('tbody').forEach(tb => tb.remove());
      filterSettingsTable(table);
    }

    const thirdRow = filterUI.appendChild(document.createElement('tr'));

    const matchBox = thirdRow.appendChild(document.createElement('td')).appendChild(document.createElement('textarea'));
    matchBox.parentNode.dataset.id = 'match';
    matchBox.parentNode.colSpan = 3;
    matchBox.style.width = '97%';
    matchBox.style.resize = 'vertical';

    return filterUI;
  }

  const clearInventorySettingsTable = (table) => {
    table.querySelectorAll('tbody').forEach(tb => tb.remove());
  }

  const filterSettingsTable = (table) => {
    for (const index in filters) {
      const filter = filters[index];
      // category: str, op: str select, split: str select, showWeightless: bool, match: str array
      const filterUI = inventoryFilterUI(index);

      const category = filterUI.querySelector('[data-id="category"] input');
      category.value = filter.category;
      category.addEventListener('change', () => {
        mod.setValue(`filter-${index}-category`, category.value);
        filter.category = category.value;
      });
      const op = filterUI.querySelector('[data-id="op"] select');
      op.value = filter.op;
      op.addEventListener('change', () => {
        mod.setValue(`filter-${index}-op`, op.value);
        filter.op = op.value;
      });
      const split = filterUI.querySelector('[data-id="split"] select');
      split.value = filter.split;
      split.addEventListener('change', () => {
        mod.setValue(`filter-${index}-split`, split.value);
        filter.split = split.value;
      });
      const showWeightless = filterUI.querySelector('[data-id="showWeightless"] input');
      showWeightless.checked = filter.showWeightless;
      showWeightless.addEventListener('change', () => {
        mod.setValue(`filter-${index}-showWeightless`, showWeightless.checked);
        filter.showWeightless = showWeightless.value;
      });
      const match = filterUI.querySelector('[data-id="match"] textarea');
      match.value = filter.match.join('\n');
      match.addEventListener('change', () => {
        mod.setValue(`filter-${index}-match`, match.value);
        filter.match = match.value;
      });

      const remove = filterUI.querySelector('[data-id="remove"] input');

      table.appendChild(filterUI);
    }
    const newFilterTD = table.appendChild(document.createElement('tbody')).appendChild(document.createElement('tr')).appendChild(document.createElement('td'));
    newFilterTD.colSpan = 3;
    const newFilterButton = newFilterTD.appendChild(document.createElement('input'));
    newFilterButton.type = 'button';
    newFilterButton.value = '+';
    newFilterButton.style.width = '98.5%';
    newFilterButton.onclick = function() {
      filters.push(defaultFilter());
      storeFilter(filters.length - 1, filters[filters.length - 1]);
      updateFilterCount();
      clearInventorySettingsTable(table);
      filterSettingsTable(table);
      mod.debug('Added new filter');
    }
  }

  const restoreDefaultFilters = async () => {
    filters = [];
    const defaultFilters = [
      {
        category: 'Ammo', op: 'equals',
        match: [
          'Fuel Can', 'Pistol Clip', 'Shotgun Shell', 'Rifle Magazine', 'SMG Magazine', 'Battery', 'Quiver of Arrows'
        ]
      },
      {
        category: 'Innate Weapons', op: 'includes', split: 'tail', showWeightless: true,
        match: [
          'Oaken Greatbow', 'Verdant Sling', 'Origami Bow', 'Voltcaster', 'Spellwand'
        ]
      },
      {
        category: 'Weapons', op: 'includes', split: 'tail', showWeightless: true,
        match: [
          'Axe', 'Baseball Bat', 'Battleaxe', 'Blackened Gauntlet', 'Broken Bottle', 'Bullwhip', 'Carving Knife',
          'Cat of Nine Tails', 'Cavalry Saber', 'Chainsaw', 'Chaos Shard', 'Chunk of Cobblestone', 'Compound Bow',
          'Concussion Grenade', 'Crowbar', 'Cutlass', 'Dagger', 'Double-Barrelled Shotgun', 'Fishing Pole', 'Fist',
          'Flamethrower', 'Flaming Pitchfork', 'Flaming Sword', 'Flintlock Pistol', 'Flintlock Rifle', 'Fragmentation Grenade',
          'Frozen Gauntlet', 'Frying Pan', 'Golf Club', 'Greater Rod of Doom', 'Greater Rod of Flame', 'Greater Rod of Frost',
          'Greater Rod of Lightning', 'Harpoon', 'Harpoon Gun', 'Hatchet', 'Icy Blade', 'Katar', 'Kick', 'Length of Chain',
          'Long Bow', 'Long Rifle', 'Marrakunian Soul Cannon', 'Melee Weapons', 'Pipewrench', 'Pistol', 'Pitchfork',
          'Poison Pistol', 'Poison Ring', 'Pump Action Shotgun', 'Quarterstaff', 'Ranged Weapons', 'Rapier', 'Rifle', 'Rock',
          'Rod of Doom', 'Rod of Flame', 'Rod of Frost', 'Rod of Lightning', 'Rod of Wonder', 'Rotten Crossbow', 'Runesword',
          'Rusty Flail', 'Saber', 'Set of Brass Knuckles', 'Set of Spiked Knuckles', 'Shock Sphere', 'Short Bow', 'Sledgehammer',
          'Sling', 'Small Cannon', 'Spear', 'Spellgems', 'Sub-Machine Gun', 'Sword', 'Tarnished Sword', 'Taser', 'Throwing Knife',
          'Tire Iron', 'Torch', 'Trident', 'Truncheon', 'Virtuecaster', 'Warhammer', 'White Phosphorus Grenade', 'Wooden Club'
        ]
      },
      {
        category: 'Armor', op: 'includes', split: 'tail',
        match: [
          'Chainmail Shirt', 'Fireman\'s Jacket', 'Leather Cuirass', 'Leather Jacket', 'Plate Cuirass',
          'Suit of Gothic Plate', 'Suit of Light Body Armor', 'Suit of Military Encounter Armor',
          'Suit of Police Riot Armor', 'Suit of Rusty Armor'
        ]
      },
      {
        category: 'Potions', op: 'startsWith',
        match: [
          'Potion of', 'Oil of', 'Incense of', 'Termite Paste', 'Chlorophilter', 'Cruorblight'
        ]
      },
      {
        category: 'Demonic Boons', op: 'startsWith',
        match: [
          'Blood Ice', 'Soul Ice', 'Boon of Ahg-Za-Haru', 'Boon of Tholaghru', 'Boon of Tlacolotl', 'Dark Pact with'
        ]
      },
      {
        category: 'Tools', op: 'equals',
        match: [
          'Portable Toolkit', 'Set of Lockpicks', 'Surgeon\'s Kit'
        ]
      },
      {
        category: 'Reading', op: 'equals', showWeightless: false,
        match: [
          'Book', 'Arcane Book', 'Holy Book', 'Unholy Book', 'Newspaper'
        ]
      },
      {
        category: 'Spell Gems', op: 'includes', split: 'tail',
        match: [
          'Small Gem',
          'Small Black Gem', 'Small Blue Gem', 'Small Brown Gem', 'Small Clear Gem',
          'Small Green Gem', 'Small Opalescent Gem', 'Small Orange Gem', 'Small Purple Gem',
          'Small Red Gem', 'Small Tan Gem', 'Small White Gem', 'Small Yellow Gem'
        ]
      },
      {
        category: 'Alchemy Components', op: 'startsWith',
        match: [
          'Bottle of Holy Water','Bottle of Paradise Water','Chunk of Stygian Iron','Femur',
          'Handful of Grave Dirt','Humerus','Piece of Stygian Coal','Rose','Skull','Handful of Horehound',
          'Batch of Mushrooms','Bunch of Daisies','Bunch of Paradise Lilies','Chunk of Ivory','Lead Brick',
          'Patch of Lichen','Patch of Moss','Chunk of Coral','Silver Ingot','Gold Ingot',
          'Chunk of Brimstone','Pinch of Saltpeter','Handful of Clover','Bunch of Lilies','Chunk of Onyx',
          'Spool of Copper Wire','Sprig of Nightshade','Chunk of Celestial Bronze','Piece of Amber',
          'Nacre Shell','Mandrake Root','Sprig of Holly','Handful of Red Clay'
        ]
      },
      {
        category: 'Crafting Components', op: 'equals',
        match: [
          'Bag of Industrial Plastic', 'Batch of Leather', 'Chunk of Brass', 'Chunk of Iron',
          'Chunk of Steel', 'Piece of Wood', 'Small Bottle of Gunpowder'
        ]
      },
    ];

    for (const df of defaultFilters) {
      filters.push({
        category: df.category, op: df.op, split: df.split, showWeightless: df.showWeightless, match: [...df.match]
      });
    }
    const storeFilterPromises = [];
    for (const index in filters) storeFilterPromises.push(storeFilter(index, filters[index]));
    await Promise.all(storeFilterPromises);
    updateFilterCount();
    mod.log('Restored default filters');
  }

  const sortInventorySettings = (table, button) => {
    const defaultButton = table.appendChild(document.createElement('tr')).appendChild(document.createElement('td')).appendChild(document.createElement('input'));
    defaultButton.type = 'button';
    defaultButton.value = 'Restore Default Filters';
    defaultButton.parentNode.colSpan = 3;
    defaultButton.style.width = '98.5%';
    defaultButton.onclick = function() {
      restoreDefaultFilters();
      clearInventorySettingsTable(table);
      filterSettingsTable(table);
    }
    filterSettingsTable(table);
  }

  const loadFiltersFromStorage = async () => {
    if (!mod.API.inGame) return false;
    const filterCount = Number(await mod.getValue('filter-count'));
    if (!filterCount) restoreDefaultFilters();
    else for (let index = 0; index < filterCount; index++) filters.push(await loadFilter(index));
    return true;
  }

  const deleteAllFiltersFromStorage = async() => {
    mod.log('deleting filters from storage');
    const deletionPromises = [];
    for (const identifier of (await GM.listValues()).filter(id => id.match(/nexus-tweaks-\d*-inventorySort-filter-.*/))) {
      deletionPromises.push(GM.deleteValue(identifier));
    }
    return Promise.all(deletionPromises);
  }

  // await deleteAllFiltersFromStorage();
  const filterPromise = loadFiltersFromStorage();

  const sortInventory = async () => {
    await filterPromise;

    const inv = document.getElementById('inventory');
    if (!inv) return;
    const itable = inv.querySelector('tbody');

    let content = {};
    for (const filter of filters) {
      const cat = filter.category;
      content[cat] = [document.createElement('tr')];
      content[cat][0].appendChild(document.createElement('th'));
      content[cat][0].firstChild.textContent = cat;
      content[cat][0].firstChild.colSpan = 6;
    }
    content.Others = [document.createElement('tr')];
    content.Others[0].appendChild(document.createElement('th'));
    content.Others[0].firstChild.textContent = 'Others';
    content.Others[0].firstChild.colSpan = 6;
    content.Worn = [];

    const weightlessClass = 'nexusTweaksHideWeightless';
    const weightless = [];
    for (const item of Array.from(itable.children).slice(3)) {
      if (content.Worn.length == 0) {
        if (item.querySelector('th')) {
          item.colSpan = 6;
          item.lastChild.colSpan = 2;
          content.Worn.push(item);
          continue;
        }

        if (item.children.length >= 4 && item.children[3].textContent === '0') {
          item.classList.add(weightlessClass);
          weightless.push(item);
          continue;
        }

        let categorized = false;
        for (const filter of filters) {
          if (matchItem(item.querySelector('span').textContent, filter)) {
            content[filter.category].push(item);
            categorized = true;
            break;
          }
        }
        if (!categorized) content.Others.push(item);
      } else {
        item.colSpan = 6;
        item.lastChild.colSpan = 2;
        content.Worn.push(item);
      }
    }
    for (const item of weightless) {
      let categorized = false;
      for (const filter of filters) {
        if (matchItem(item.querySelector('span').textContent, filter)) {
          content[filter.category].push(item);
          categorized = true;
		  if (filter.showWeightless) item.classList.remove(weightlessClass);
          continue;
        }
      }
      if (!categorized) content.Others.push(item);
    }

    const newItable = itable.parentNode.cloneNode(false);
    let head = [];
    for (let i = 0; i < 3; i++) head.push(itable.children[i]);
    inv.replaceChild(newItable, itable);

    let nextBG = '#eeeeee';
    const getNextBG = () => { let ret = nextBG; nextBG = (nextBG == '#ffffff' ? '#eeeeee' : '#ffffff'); return ret; }
    for (const tr of head) newItable.appendChild(tr);
    for (const [cat, rows] of Object.entries(content)) {
      if (rows.length > 1) {
        if(rows[1].classList.contains(weightlessClass)) rows[0].classList.add(weightlessClass);
        rows[0].bgColor = getNextBG();
        newItable.appendChild(rows[0]);
        const catBody = newItable.appendChild(document.createElement('tbody'));
        for (const row of rows.slice(1)) {
          row.bgColor = getNextBG();
          catBody.appendChild(row);
        }

        const collapseIcon = rows[0].lastChild.appendChild(document.createElement('img'));
        collapseIcon.src = 'https://www.nexusclash.com/images/g/inf/close.gif';
        collapseIcon.align = 'right';
        rows[0].onclick = function() {
          const setHide = !rows[0].classList.contains('collapsed-inventory-category');
          mod.setSetting(`hide-${cat}`, setHide);
          rows[0].nextSibling.hidden = setHide;
          rows[0].classList.toggle('collapsed-inventory-category');
          collapseIcon.src = setHide ? 'https://www.nexusclash.com/images/g/inf/open.gif' : 'https://www.nexusclash.com/images/g/inf/close.gif';
        }

        mod.getSetting(`hide-${cat}`).then((setHide) => { if (setHide) rows[0].click() });
      }
    }

    if (inv.querySelector('input.item_use[value="Show"]')) {
      inv.querySelector('input.item_use[value="Show"]').click();
      inv.querySelector('input.item_use[value="Hide"]').click();
    }
  }

  const sortFloorItems = async () => {
    await filterPromise;

    const pickup = document.querySelector('form[name="pickup"]');
    if (!pickup) return;
    const pickselect = pickup.querySelector('select[name="item"]');

    const optGroups = {};
    for (const filter of filters) {
      optGroups[filter.category] = document.createElement('optgroup');
      optGroups[filter.category].label = filter.category;
    }
    optGroups.Others = document.createElement('optgroup');
    optGroups.Others.label = "Others";

    for (const opt of Array.from(pickselect.options)) {
      let categorized = false;
      for (const filter of filters) {
        if (matchItem(opt.textContent, filter)) {
          optGroups[filter.category].appendChild(opt);
          categorized = true;
          break;
        }
      }
      if (!categorized) optGroups.Others.appendChild(opt);
    }
    for (const optGroup of Object.values(optGroups)) {
      if (optGroup.children.length === 0) optGroup.hidden = true;
      pickselect.options.add(optGroup);
    }
  }

  const inventoryFilterPane = async () => {
	const {table, button} = mod.API.createRightSidePane(mod.name, null, mod.id);
    await filterPromise;
    sortInventorySettings(table, button);
  }

  await mod.registerMethod(
    'async',
    inventoryFilterPane
  );

  await mod.registerMethod(
    'async',
    sortInventory
  );

  await mod.registerMethod(
    'async',
    sortFloorItems
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'alchPanel+',
    'Enhanced Alchemy Panel',
    'local',
    'Enables researching, brewing and forgetting from the recipes panel.',
  );

  const EnhancedAlchemyNode = async (node, grade, researchButton, researchComp, researchPotion, forgetNode, brewButton, brewSelect, transButton, transFrom, transTo) => {
    const recipeName = node.children[0].textContent.trim();

    node.children[0].style.width = '59.69%';
    node.children[0].childNodes[1].nodeValue = node.children[0].childNodes[1].nodeValue + ` [${grade}/6]`;

    node.children[0].appendChild(document.createElement('br'));
    const span = node.children[0].appendChild(document.createElement('span'));
    span.style.display = 'block-inline';
    span.style.width = '100%';
    span.hidden = true;

    const collapseButton = document.createElement('input');
    collapseButton.type = 'Button';
    collapseButton.value = node.children[0].children[0].value;
    collapseButton.title = node.children[0].children[0].title;
    node.children[0].replaceChild(collapseButton, node.children[0].children[0]);

    collapseButton.onclick = function(event) {
      const wasCollapsed = collapseButton.value == '+';

      collapseButton.value = wasCollapsed ? '-' : '+';
      collapseButton.title = wasCollapsed ? 'Collapse' : 'Expand';
      span.hidden = wasCollapsed ? false : true;
      node.children[1].children[0].classList.toggle('toggled');

      mod.setValue(recipeName, !wasCollapsed);
    }
    if ((await mod.getValue(recipeName)) === false) collapseButton.click();

    if (grade < 6) { // At least one of the components hasn't been found
      const rComp = span.appendChild(researchComp.cloneNode(true));
      rComp.style.width = '100%';
      rComp.onchange = function() {
        const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
        this.style.color = style.color;
        this.style.backgroundColor = style.backgroundColor;
      }
      rComp.onchange();

      const rButton = span.appendChild(researchButton.cloneNode(true));
      rButton.style.width = '100%';
      rButton.onclick = function() {
        researchComp.value = rComp.value;
        researchPotion.value = recipeName;
        mod.setValue('alchemy-alarm', 1);
        researchButton.click();
      }
    }
    else if (grade == 6) { // fully researched
      if (node.children[1].children[0].querySelector('.missing')) {
        const tForm = span.appendChild(document.createElement('form'));
        const tLabel = tForm.appendChild(document.createElement('div'));
        tLabel.textContent = 'Transmute from:';
        tLabel.style.width = '37%';
        tLabel.style.display = 'inline-block';

        const tComp = tForm.appendChild(transFrom.cloneNode(true));
        tComp.style.width = '63%';
        tComp.style.display = 'inline-block';
        tComp.onchange = function() {
          const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
          this.style.color = style.color;
          this.style.backgroundColor = style.backgroundColor;
        }
        tComp.onchange();

        for (const li of node.children[1].children[0].children) {
          if (li.classList.contains('missing')) {
            const tButton = li.lastChild.insertBefore(document.createElement('input'), li.lastChild.firstChild);
            tButton.type = 'button';
            tButton.value = '🔃';
            tButton.style.padding = '0px';
            tButton.style.border = 'none';
            tButton.style.background = 'none';
            tButton.style.display = 'inline-block';
            tButton.onclick = function(){
              transFrom.value = tComp.value;
              transTo.selectedIndex = transTo.options.namedItem(li.lastElementChild.textContent).index;
              transButton.click();
            }
          }
        }
      }

      const brew = span.appendChild(brewButton.cloneNode(true));
      brew.style.width = '100%';
      brew.onclick = function() {
        brewSelect.value = recipeName;
        brewButton.click();
      }
    }

    if (grade > 0) { // At least one of the components has been found
      span.appendChild(document.createElement('hr'));
      const forButton = span.appendChild(document.createElement('input'));
      forButton.value = 'Forget Recipe (5 AP, 5 MP)';
      forButton.type = 'Button';
      forButton.style.width = '100%';
      forButton.onclick = function() { // This basically imitates whatever magic goes on when forgetting a recipe
        if (confirm('Confirm forgetting: ' + recipeName + ' (5 AP, 5 MP)')) {
          const forgetList = forgetNode.querySelector('select');
          const forgetButton = forgetList.nextSibling;
          const opt = forgetList.appendChild(document.createElement('option'));
          opt.value = recipeName;
          opt.textContent = recipeName;

          const i1 = forgetNode.insertBefore(document.createElement('input'), forgetList);
          i1.type = 'hidden';
          i1.name = 'op';
          i1.value = 'alchemy';

          const i2 = forgetNode.insertBefore(document.createElement('input'), forgetList);
          i2.type = 'hidden';
          i2.name = 'forget';
          i2.value = 'forget';

          forgetList.selectedIndex = forgetList.options.length - 1;
          forgetList.options[forgetList.selectedIndex].setAttribute('selected', '');
          forgetList.name = 'potion';

          forgetButton.type = 'submit';
          forgetButton.value = 'Confirm Forget Recipe (5 AP, 5 MP)';
          forgetList.dispatchEvent(new Event('change'));
          forgetButton.click();
        }
      }
    }
  }

  const SimpleAlchemyNode = async (node, grade) => {
    const recipeName = node.children[0].textContent.trim();
    node.children[0].childNodes[1].nodeValue = node.children[0].childNodes[1].nodeValue + ` [${grade}/6]`;

    const collapseButton = document.createElement('input');
    collapseButton.type = 'Button';
    collapseButton.value = node.children[0].children[0].value;
    collapseButton.title = node.children[0].children[0].title;
    node.children[0].replaceChild(collapseButton, node.children[0].children[0]);

    collapseButton.onclick = function(event) {
      const wasCollapsed = collapseButton.value == '+';

      collapseButton.value = wasCollapsed ? '-' : '+';
      collapseButton.title = wasCollapsed ? 'Collapse' : 'Expand';
      node.children[1].children[0].classList.toggle('toggled');

      mod.setValue(recipeName, !wasCollapsed);
    }
    if ((await mod.getValue(recipeName)) === false) collapseButton.click();
  }

  const EnhancedAlchemyPanelUI = (trackerNode) => {
    if (document.getElementById('pane-alchemy')) {
      const alchemyResearch = document.getElementById('main-left').querySelector('form[name="alchemyresearch"]');
      const resButton = alchemyResearch ? alchemyResearch.children[1] : null;
      const resComp = alchemyResearch ? alchemyResearch.children[2] : null;
      const resPotion = alchemyResearch ? alchemyResearch.children[3] : null;
      const alchemyForget = document.getElementById('main-left').querySelector('form[name="alchemyforget"]');
      const alchKnown = document.getElementById('main-left').querySelector('form[name="alchemyknown"]');
      const brewButton = alchKnown ? alchKnown.children[2] : null;
      const brewSelect = alchKnown ? alchKnown.children[1] : null;
      const transmute = document.getElementById('main-left').querySelector('form[name="alchemytransmute"]');
      const transButton = transmute ? transmute.children[1] : null;
      const transFrom = transmute ? transmute.children[2] : null;
      const transTo = transmute ? transmute.children[3] : null;

      const compLists = [];
      if (resComp) compLists.push(resComp);
      if (transFrom) compLists.push(transFrom);
      for (const compList of compLists) {
        const commons = document.createElement('optgroup');
        const uncommons = document.createElement('optgroup');
        const rares = document.createElement('optgroup');
        const spellgems = document.createElement('optgroup');
        commons.label = 'Common Ingredients';
        uncommons.label = 'Uncommon Ingredients';
        rares.label = 'Rare Ingredients';
        spellgems.label = 'Spellgems';
        for (const comp of Array.from(compList.options)) {
          if (comp.textContent.includes('Small Gem')) spellgems.appendChild(comp);
          else if (comp.textContent.endsWith('(C)')) commons.appendChild(comp);
          else if (comp.textContent.endsWith('(U)')) uncommons.appendChild(comp);
          else if (comp.textContent.endsWith('(R)')) rares.appendChild(comp);
          else mod.error(`Unknown component rarity for ${comp.textContent}`);
        }

        compList.add(commons);
        compList.add(uncommons);
        compList.add(rares);
        compList.add(spellgems);
        compList.selectedIndex = 0;

        for (const optGroup of [commons, uncommons, rares, spellgems]) {
          if (optGroup.children.length === 0) optGroup.hidden = true;
          else {
            const style = document.defaultView.getComputedStyle(optGroup.children[0], '');
            optGroup.style.color = style.color;
            optGroup.style.backgroundColor = style.backgroundColor;
          }
        }

        compList.onchange = function() {
          const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
          this.style.color = style.color;
          this.style.backgroundColor = style.backgroundColor;
        }
        compList.onchange();
      }

      for (const optGroup of transTo.children) {
        if (optGroup.children.length === 0) optGroup.hidden = true;
        else {
          const style = document.defaultView.getComputedStyle(optGroup.children[0], '');
          optGroup.style.color = style.color;
          optGroup.style.backgroundColor = style.backgroundColor;
        }
      }
      transTo.onchange = function() {
        const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
        this.style.color = style.color;
        this.style.backgroundColor = style.backgroundColor;
      }
      transTo.onchange();

      for (let node = trackerNode.nextSibling; node && node.children[1]; node = node.nextSibling) {
        const grade = 6 - node.children[1].querySelectorAll('li[title="unknown"').length;
        EnhancedAlchemyNode(
          node, grade,
          resButton, resComp, resPotion,
          alchemyForget,
          brewButton, brewSelect,
          transButton, transFrom, transTo
        );
      }
    } else {
      mod.debug('No Alchemy pane found');
      for (let node = trackerNode.nextSibling; node && node.children[1]; node = node.nextSibling) {
        const grade = 6 - node.children[1].querySelectorAll('li[title="unknown"').length;
        SimpleAlchemyNode(node, grade);
      }
    }

    trackerNode.firstChild.textContent = '';
    const CollapseAllButton = trackerNode.firstChild.appendChild(document.createElement('input'));
    trackerNode.firstChild.appendChild(document.createTextNode(' Recipe Tracker'));
    CollapseAllButton.type = 'button';
    CollapseAllButton.value = 'Collapse All';
    CollapseAllButton.style.color = 'black';
    CollapseAllButton.onclick = function() {
      for (const collapseButton of trackerNode.parentNode.querySelectorAll('input[type="Button"][value="-"]')) collapseButton.click();
    }
  }

  const EnhancedAlchemyPanel = () => {
    'use strict';
    mod.getValue('alarm').then(async alarm => {
      if (await mod.getSetting('HP-warning')) {
        if (alarm && mod.API.charinfo.hp && mod.API.charinfo.hp < 20) alert('Your HP is low from performing alchemy');
        else mod.setValue('alchemy-alarm', 0);
      } else mod.setValue('alchemy-alarm', 0);
    });
    const trackerNode = document.getElementById('recipe-tracker');
    if (trackerNode) EnhancedAlchemyPanelUI(trackerNode);
    else mod.debug('No Recipe Tracker found');
  }

  await mod.registerSetting(
    'checkbox',
    'HP-warning',
    'Low HP warning',
    'Warns you after performing alchemy and ending with low HP.'
  );

  await mod.registerMethod(
    'sync',
    EnhancedAlchemyPanel
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'zalgofy',
    'Zalgo Speech',
    'local',
    'Z A L G O   S P E E C H',
  );

  const randIndex = (length) => Math.floor(Math.random() * length);

  // Based off https://github.com/casieber/zalgo-js
  const zalgo = {
    up : [
      768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783,
      784, 785, 786, 787, 788, 789, 794, 795, 829, 830, 831, 832, 833, 834, 835, 836,
      838, 842, 843, 844, 848, 849, 850, 855, 856, 859, 861, 862, 864, 865, 867, 868,
      869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879
    ],
    middle : [
      820, 821, 822, 823, 824
    ],
    down : [
      790, 791, 792, 793, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807,
      808, 809, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 825, 826, 827, 828,
      837, 839, 840, 841, 845, 846, 851, 852, 853, 854, 857, 858, 860, 863, 866
    ]
  };

  const zalgofyString = (string, settings) => {
    if (!settings) settings = {};
    const defaultSettings = {
      up: true, middle: true, down: true, intensity: 3
    };
    for (const key of Object.keys(defaultSettings)) if (!settings[key]) settings[key] = defaultSettings[key];

    const directions = Object.keys(zalgo).reduce((acc, value) => (settings[value] ? [...acc, value] : acc), []);
    if (directions.length === 0) return string;

    let HECOMES = '';
    for (const char of Array.from(string)) {
      HECOMES += char;
      for (let i = 0; i < settings.intensity; i++) {
        const direction = directions[randIndex(directions.length)];
        HECOMES += String.fromCharCode(zalgo[direction][randIndex(zalgo[direction].length)]);
      }
    }

    return HECOMES;
  }

  const zalgofyForm = (form, settings) => {
    const textInput = form.querySelector('input[type="text"]');
    const speechButton = form.querySelector('input[type="submit"]');
    const newSpeechButton = speechButton.cloneNode();
    newSpeechButton.disabled = false;
    speechButton.type = 'button';
    speechButton.classList.add('hidden');
    form.insertBefore(newSpeechButton, speechButton);
    const emoteRE = new RegExp(String.raw`^/(?<code>\w+)(?<tail>.*?)$`);
    newSpeechButton.onclick = function() {
      const emoteMatch = textInput.value.match(emoteRE);
      if (!emoteMatch) textInput.value = zalgofyString(textInput.value, settings);
      else {
        const code = emoteMatch.groups.code.toLowerCase();
        const tail = emoteMatch.groups.tail;

        if (code === 'em' || code === 'me') textInput.value = '/em' + tail;
        else if (code === 'plain') textInput.value = tail;
        else if (code === 'zalgo') textInput.value = zalgofyString(tail, settings);
        else ;
      }
      speechButton.click();
    }
  }

  const zalgofy = async (mod) => {
    'use strict';

    const settings = {
      up: await mod.getSetting('zalgo-up'),
      middle: await mod.getSetting('zalgo-middle'),
      down: await mod.getSetting('zalgo-down'),
      intensity: Number(await mod.getSetting('zalgo-intensity'))
    };

    const speakForm = document.querySelector('form[name="speak"]');
    const bullForm = document.querySelector('form[name="bullhorn"]');
    const writeForm = document.querySelector('form[name="writing"]');

    if (speakForm) zalgofyForm(speakForm, settings);
    if (bullForm) zalgofyForm(bullForm, settings);
    if (writeForm) zalgofyForm(writeForm, settings);
  }

  await mod.registerSetting(
    'checkbox',
    'zalgo-up',
    'Zalgo up',
    ''
  );

  await mod.registerSetting(
    'checkbox',
    'zalgo-middle',
    'Zalgo middle',
    ''
  );

  await mod.registerSetting(
    'checkbox',
    'zalgo-down',
    'Zalgo down',
    ''
  );

  await mod.registerSetting(
    'select',
    'zalgo-intensity',
    'Zalgo Intensity',
    'Choose how Zalgo you want to Zalgo',
    [{'value' : '1', 'text' : '1'},
     {'value' : '2', 'text' : '2'},
     {'value' : '3', 'text' : '3'},
     {'value' : '4', 'text' : '4'},
     {'value' : '5', 'text' : '5'},
    ]
  );

  await mod.registerMethod(
    'async',
    zalgofy
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'messagePaneResize',
    'Message Pane Resize',
    'global',
    'Enables custom resizing of the message pane.',
  );

  const paneResize = async () => {
    const messagePane = document.querySelector('#main-left #Messages');
    if (!messagePane) {
      mod.debug('No message pane found.');
      return;
    }
    const settingContent = await mod.getSetting('message-pane-height');
    if (!settingContent) mod.setSetting('message-pane-height', '100');

    if (await mod.getSetting('mesage-pane-autosize')) {
      messagePane.style.height = 'auto';
    } else if (settingContent) {
      const num = settingContent.match(/.*?(?<num>\d*).*/).groups.num;
      if (num) messagePane.style.height = `${num}px`;
      else messagePane.style.height = '100px';
    } else {
      messagePane.style.height = '100px';
    }
  }

  await mod.registerSetting(
    'textfield',
    'message-pane-height',
    'Pane Height',
    'Choose pane height (default is 100px)'
  );

  await mod.registerSetting(
    'checkbox',
    'mesage-pane-autosize',
    'Auto Resize Message Pane',
    'Auto Resize Message Pane (overrides pane height)',
  );

  await mod.registerMethod(
    'async',
    paneResize
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'defaultSetAllPetStance',
    'Default Set-All Pet Stance',
    'local',
    'Allows the user to set the default stance for Set All pets, instead of defaulting to "Passive". Doesn\'t affect default summoning stance.',
  );

  const defaultStance = async () => {
    const petTable = document.querySelector('.petTable');
    if (!petTable) {
      mod.debug('No pet pane found.');
      return;
    }
    if (!petTable.querySelector('form[name="petstance"] select[name="stance"]')) {
      mod.debug('Pet table doesn\'t have stance dropdowns.');
      return;
    }
    const defaultStance = await mod.getSetting('default-stance');
    petTable.querySelector('form[name="petstance"] select[name="stance"]').value = defaultStance;
  }

  await mod.registerSetting(
    'select',
    'default-stance',
    'Default Stance',
    'Choose the default pet stance',
    [
      {value: 'Passive', text: 'Passive'},
      {value: 'Defensive', text: 'Defensive'},
      {value: 'Aggressive to Hostiles', text: 'Hostiles'},
      {value: 'Aggressive to Non-Allied', text: 'Non-Allied'},
      {value: 'Aggressive to Non-Faction', text: 'Non-Faction'},
      {value: 'Aggressive', text: 'All'},
    ]
  );

  await mod.registerMethod(
    'async',
    defaultStance
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'noTargetAllies',
    'No Targeting Allies',
    'local',
    'Allows disabling targeting factionmates/allies/friendlies on the attack selection box.',
  );

  const noTargetAllies = async () => {
    const combatTargetDropdown = document.getElementById('combat_target_id');
    const petTargetDropdown = document.getElementById('pet_target_id');
    if (!combatTargetDropdown) {
      mod.debug('No combat target dropdown found');
      return;
    }
    const noFac = await mod.getSetting('no-target-faction');
    const noAlly = await mod.getSetting('no-target-allies');
    const noFriend = await mod.getSetting('no-target-friendlies');
    const noEnemy = await mod.getSetting('no-target-enemies');
    const noHostile = await mod.getSetting('no-target-hostiles');
    const noOther = await mod.getSetting('no-target-others');
    const noTargetPets = await mod.getSetting('no-target-pets');

    const charList = document.querySelector('#AreaDescription .charListArea');
    const charListLinks = charList.querySelectorAll('[onclick^="SelectItem"],[href^="javascript:SelectItem"]');
    const charPoliticsDict = {};
    const charNameToId = {};
    const SMDict = {};
    for (const link of charListLinks) {
      const selectItem = link.href ? link.href : link.onclick;
      const charId = Number(selectItem.toString().match(/\d+/)[0]);
      const containsPolitics = (classList, politics) => (classList.contains(politics) || classList.contains(`politics-${politics}`));
      let charPolitics = 'other';
      const possiblePolitics = ['faction', 'ally', 'friendly', 'enemy', 'hostile'];
      for (const politics of possiblePolitics) {
        if (containsPolitics(link.classList, politics)) {
          charPolitics = politics;
          break;
        }
      }
      charPoliticsDict[charId] = charPolitics;
      const SMitem = charList.querySelector(`img[title^="${link.textContent.trim()}"][title*="Sorcerers Might"]`) || link.parentElement.querySelector(`.status-tag[title^="Sorcerer's Might"`);
      if (SMitem) {
        const SMtime = Number(SMitem.title.match(/(\d+) minutes/)[1]);
        SMDict[charId] = SMtime;
      }
    }

    const newCombatDropdown = combatTargetDropdown.cloneNode(false);
    for (const opt of Array.from(combatTargetDropdown.options)) {
      const charId = Number(opt.value);
      if (charPoliticsDict[charId] == 'faction') { if (!noFac) newCombatDropdown.appendChild(opt); }
      else if (charPoliticsDict[charId] == 'ally') { if (!noAlly) newCombatDropdown.appendChild(opt); }
      else if (charPoliticsDict[charId] == 'friendly') { if (!noFriend) newCombatDropdown.appendChild(opt); }
      else if (charPoliticsDict[charId] == 'enemy') { if (!noEnemy) newCombatDropdown.appendChild(opt); }
      else if (charPoliticsDict[charId] == 'hostile') { if (!noHostile) newCombatDropdown.appendChild(opt); }
      else { if (!noOther) newCombatDropdown.appendChild(opt); }
    }
    combatTargetDropdown.parentNode.replaceChild(newCombatDropdown, combatTargetDropdown);

    const petList = document.querySelector('#AreaDescription .petListArea');
    const petListLinks = petList.querySelectorAll('[href^="javascript:SelectItem"]');
    const petPoliticsDict = {};
    const petNameToId = {};
    for (const link of petListLinks) {
      const selectItem = link.href;
      const petId = Number(selectItem.toString().match(/\d+/)[0]);
      let petPolitics = link.className;
      petPolitics = petPolitics ? petPolitics : 'other';
      petPoliticsDict[petId] = petPolitics;
    }

    if (noTargetPets && petTargetDropdown) {
      const newPetDropdown = petTargetDropdown.cloneNode(false);
      for (const opt of Array.from(petTargetDropdown.options)) {
        const petId = Number(opt.value);
        if (petPoliticsDict[petId] == 'faction') { if (!noFac) newPetDropdown.appendChild(opt); }
        else if (petPoliticsDict[petId] == 'ally') { if (!noAlly) newPetDropdown.appendChild(opt); }
        else if (petPoliticsDict[petId] == 'friendly') { if (!noFriend) newPetDropdown.appendChild(opt); }
        else if (petPoliticsDict[petId] == 'enemy') { if (!noEnemy) newPetDropdown.appendChild(opt); }
        else if (petPoliticsDict[petId] == 'hostile') { if (!noHostile) newPetDropdown.appendChild(opt); }
        else { if (!noOther) newPetDropdown.appendChild(opt); }
      }
      petTargetDropdown.parentNode.replaceChild(newPetDropdown, petTargetDropdown);
    }

    const healTargetDropdowns = [];
    const healDropdownSelectors = [
      'form[name="FAKHeal"] select[name="target_id"]',
      'form[name="Surgery"] select[name="target_id"]',
      'form[name="Heal Others"] select[name="target_id"]',
      'form[name="Energize"] select[name="target_id"]',
      'form[name="give"] select[name="target_id"]',
    ];
	for (const selector of healDropdownSelectors) {
      const dropdown = document.querySelector(selector);
      if (dropdown) healTargetDropdowns.push(dropdown);
	}
    if (healTargetDropdowns.length === 0) {
      mod.debug('No heal target dropdown found');
      return;
    }

    const noHealFac = await mod.getSetting('no-heal-faction');
    const noHealAlly = await mod.getSetting('no-heal-allies');
    const noHealFriend = await mod.getSetting('no-heal-friendlies');
    const noHealEnemy = await mod.getSetting('no-heal-enemies');
    const noHealHostile = await mod.getSetting('no-heal-hostiles');
    const noHealOther = await mod.getSetting('no-heal-others');
    const ht = await mod.getSetting('healing-threshold')
    const healingThreshold = Number(ht) ? Number(ht) : 0;
    const noHealSM = await mod.getSetting('no-heal-SM');
    for (const dropdown of healTargetDropdowns) {
      const newHealDropdown = dropdown.cloneNode(false);
      for (const opt of Array.from(dropdown.options)) {
        const charId = Number(opt.value);

        if (healingThreshold > 0) { // If there's a healing threshold
          const matchHP = opt.textContent.match(/\((?<currHP>\d+)\/(?<maxHP>\d+) HP\)/);
          if (matchHP) { // If we can read a target's HP
            // If the target is missing less health than the threshold
            // Then skip target from healing dropdown
            if (Number(matchHP.groups.maxHP) - Number(matchHP.groups.currHP) < healingThreshold) continue;
          }
        }
        if (charId in SMDict) {
          if (noHealSM) continue;
          opt.textContent += ` (SM ${SMDict[charId]})`;
        }

        if (charPoliticsDict[charId] == 'faction') { if (!noHealFac) newHealDropdown.appendChild(opt); }
        else if (charPoliticsDict[charId] == 'ally') { if (!noHealAlly) newHealDropdown.appendChild(opt); }
        else if (charPoliticsDict[charId] == 'friendly') { if (!noHealFriend) newHealDropdown.appendChild(opt); }
        else if (charPoliticsDict[charId] == 'enemy') { if (!noHealEnemy) newHealDropdown.appendChild(opt); }
        else if (charPoliticsDict[charId] == 'hostile') { if (!noHealHostile) newHealDropdown.appendChild(opt); }
        else { if (!noHealOther) newHealDropdown.appendChild(opt); }
      }
      dropdown.parentNode.replaceChild(newHealDropdown, dropdown);
    }
  }

  await mod.registerSetting(
    'checkbox',
    'no-target-faction',
    'Prevent Targeting Factionmates',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-target-allies',
    'Prevent Targeting Allies',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-target-friendlies',
    'Prevent Targeting Friendlies',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-target-enemies',
    'Prevent Targeting Enemies',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-target-hostiles',
    'Prevent Targeting Hostiles',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-target-others',
    'Prevent Targeting Others',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-target-pets',
    'Apply to Pet dropdown',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-heal-faction',
    'Prevent Healing Factionmates',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-heal-allies',
    'Prevent Healing Allies',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-heal-friendlies',
    'Prevent Healing Friendlies',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-heal-enemies',
    'Prevent Healing Enemies',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-heal-hostiles',
    'Prevent Healing Hostiles',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'no-heal-others',
    'Prevent Healing Others',
    ''
  );
  await mod.registerSetting(
    'textfield',
    'healing-threshold',
    'Healing Threshold',
    'Characters missing less than this much HP won\'t be shown on healing dropdowns.'
  );
  await mod.registerSetting(
    'checkbox',
    'no-heal-SM',
    'No SM Healing',
    'Characters under SM effects won\'t be shown on healing dropdowns.'
  );

  await mod.registerMethod(
    'async',
    noTargetAllies
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'collapseReleased',
    'Collapse Released Characters',
    'global',
    'Collapse released characters on the character select page.',
  );

  const collapseReleased = () => {
    const releasedH2 = document.querySelector('tr>td>h2');
    if (!releasedH2 || releasedH2.textContent !== 'Released Characters') {
      mod.debug('Released Characters section not found');
      return;
    }

    releasedH2.classList.add('collapsed-released');
    const H2text = document.createElement('text');
    H2text.textContent = releasedH2.firstChild.textContent
    releasedH2.replaceChild(H2text, releasedH2.firstChild)
    const collapseIcon = releasedH2.appendChild(document.createElement('img'));
    collapseIcon.src = 'https://www.nexusclash.com/images/g/inf/open.gif';
    collapseIcon.align = 'right';

    const releasedChars = [];
    H2text.hidden = true;
    // The first one is actually the AP/HP/MP/... header for released characters
    let nextReleasedChar = releasedH2.parentNode.parentNode.nextSibling;
    while (!nextReleasedChar.querySelector('form[name="create_character"]')) {
      nextReleasedChar.hidden = true;
      releasedChars.push(nextReleasedChar);
      nextReleasedChar = nextReleasedChar.nextElementSibling;
    }

    releasedH2.onclick = function() {
      const setHide = !releasedH2.classList.contains('collapsed-released');
      H2text.hidden = setHide;
      for (const rc of releasedChars) rc.hidden = setHide;
      releasedH2.classList.toggle('collapsed-released');
      collapseIcon.src = setHide ? 'https://www.nexusclash.com/images/g/inf/open.gif' : 'https://www.nexusclash.com/images/g/inf/close.gif';
    }
  }

  await mod.registerMethod(
    'sync',
    collapseReleased
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'betterPurchaseSkills',
    'Improved Purchase Skills Page',
    'global',
    '',
  );

  const betterPurchaseSkills = () => {
    const purchaseTableHead = document.querySelector('tr>td>b>u');
    if (!purchaseTableHead || purchaseTableHead.textContent !== 'CHARACTER SKILLS AVAILABLE FOR PURCHASE') {
      mod.debug('No Purchase Skills table found');
      return;
    }
    // Hierarchy here is tbody>tr>td>b>u, where the u tag is purchaseTableHead
    const purchaseTBody = purchaseTableHead.parentNode.parentNode.parentNode.parentNode;
    for (const tr of purchaseTBody.children) {
      tr.colSpan = 6;
      if (!tr.lastElementChild) continue; // Skip empty rows
      if (tr.lastElementChild.querySelector('input[value="executepurchase"]')) tr.appendChild(document.createElement('td'));
      else if (tr.lastElementChild.querySelector('input[value="buyback"]'));
      else if (tr.firstChild.colSpan === 5) tr.firstChild.colSpan = 6; // If first colSpan is a header of short colSpan
      else if (tr.firstChild.colSpan === 6); // If first colSpan is a header of proper colSpan
      else if (tr.children[tr.children.length - 2].textContent) tr.appendChild(document.createElement('td'));
    }
  }

  await mod.registerMethod(
    'sync',
    betterPurchaseSkills
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'improvePetDisplay',
    'Pet Display Improvement',
    'local',
    'Sort pets by petmaster, and according to faction politics',
  );

  const defaultCollapseAllyPets = async (AlignmentDiv) => {
    if (!await mod.getSetting('collapse-allied-pets')) return;
    AlignmentDiv.click();
  }
  const defaultCollapsePMList = async (PMDiv, petCount) => {
    if (!await mod.getSetting('collapse-long-petlists')) return;
    if (petCount > 15) PMDiv.click();
  }

  const improvePetDisplay = () => {
    const petList = document.querySelector('div.petListArea');
    if (!petList) {
      mod.debug('No pet list found');
      return;
    }

    const classifiedPetList = {
      enemy: {},
      hostile: {},
      neutral: {},
      friendly: {},
      ally: {},
      faction: {}
    };
    const petCount = petList.firstChild.textContent.substr(0, petList.firstChild.length - 2);
    for (const pet of petList.getElementsByTagName('a')) {
      const alignment = pet.className;
      const master = pet.title.split('Master: ')[1] ? pet.title.split('Master: ')[1] : ' ';
      if (!classifiedPetList[alignment][master]) classifiedPetList[alignment][master] = [];
      const HP = pet.nextElementSibling;
      const MP = pet.nextElementSibling.nextElementSibling;
      if (MP && HP.tagName === MP.tagName) {// assume HP is always img tag, check if MP is same
        classifiedPetList[alignment][master].push([pet, document.createTextNode(' '), HP, MP]);
      } else classifiedPetList[alignment][master].push([pet, document.createTextNode(' '), HP]);
    }

    const newPetList = petList.cloneNode(false);
    newPetList.appendChild(document.createTextNode(petCount));
    const firstUppercase = (str) => str.at(0).toUpperCase() + str.substr(1);
    for (const alignment of Object.keys(classifiedPetList)) {
      if (Object.keys(classifiedPetList[alignment]).length == 0) continue;
      const AlignmentSpan = newPetList.appendChild(document.createElement('span'));
      const AlignmentDiv = AlignmentSpan.appendChild(document.createElement('div'));
      AlignmentDiv.appendChild(document.createElement('b')).textContent = firstUppercase(alignment);
      const collapseIcon = AlignmentDiv.appendChild(document.createElement('img'));
      collapseIcon.src = 'https://www.nexusclash.com/images/g/inf/close.gif';
      collapseIcon.align = 'right';
      const PMspan = AlignmentSpan.appendChild(document.createElement('span'));
      AlignmentDiv.onclick = function() {
        const setHide = !AlignmentDiv.classList.contains('collapsed-allied-pets');
        PMspan.hidden = setHide;
        AlignmentDiv.classList.toggle('collapsed-allied-pets');
        collapseIcon.src = setHide ? 'https://www.nexusclash.com/images/g/inf/open.gif' : 'https://www.nexusclash.com/images/g/inf/close.gif';
      }

      let alignmentPetCount = 0;
      for (const master of Object.keys(classifiedPetList[alignment]).sort((a,b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1)) {
        const PMDiv = PMspan.appendChild(document.createElement('div'));
        // PMDiv.textContent = 'Master: ';
        const PMName = PMDiv.appendChild(document.createElement('b'));
        PMName.textContent = master;
        const PMPetCount = classifiedPetList[alignment][master].length;
        alignmentPetCount += PMPetCount;
        const PMPetCountText = PMDiv.appendChild(document.createTextNode(` [${PMPetCount} pets]`));
        const collapseIcon = PMDiv.appendChild(document.createElement('img'));
        collapseIcon.src = 'https://www.nexusclash.com/images/g/inf/close.gif';
        collapseIcon.align = 'right';

        const PetDiv = PMspan.appendChild(document.createElement('div'));
        const petCounts = {};
        const petLinks = {};
        for (const pet of classifiedPetList[alignment][master]) {
          const petType = pet[0].textContent.split(', ').slice(-1)[0].split('a(n) ').slice(-1)[0];
          if (!(petType in petCounts)) {
            petCounts[petType] = 1;
            petLinks[petType] = pet[0].href;
          }
          else petCounts[petType] += 1;
          PetDiv.append(...pet);
          PetDiv.appendChild(document.createTextNode(', '));
        }
        PetDiv.removeChild(PetDiv.lastChild);

        PMDiv.appendChild(document.createTextNode(`: `));
        for (const petType of Object.keys(petCounts)) {
          const PMPetCountInfo = PMDiv.appendChild(document.createElement('a'));
          PMPetCountInfo.className = alignment;
          PMPetCountInfo.href = petLinks[petType];
          PMPetCountInfo.textContent = petType;
          PMDiv.appendChild(document.createTextNode(` x ${petCounts[petType]}, `));
        }

        PMDiv.onclick = function() {
          const setHide = !PMDiv.classList.contains('collapsed-PM-petlist');
          PetDiv.hidden = setHide;
          PMDiv.classList.toggle('collapsed-PM-petlist');
          collapseIcon.src = setHide ? 'https://www.nexusclash.com/images/g/inf/open.gif' : 'https://www.nexusclash.com/images/g/inf/close.gif';
        }
        defaultCollapsePMList(PMDiv, PMPetCount);
      }
      AlignmentDiv.appendChild(document.createTextNode(` [${alignmentPetCount} pets]:`));

      if (alignment === 'faction' || alignment === 'ally') defaultCollapseAllyPets(AlignmentDiv);
    }
    petList.parentNode.replaceChild(newPetList, petList);
  }

  await mod.registerSetting(
    'checkbox',
    'collapse-allied-pets',
    'Collapse faction and allied pets',
    ''
  );
  await mod.registerSetting(
    'checkbox',
    'collapse-long-petlists',
    'Collapse long pet lists (for PMs with >15 pets)',
    ''
  );

  await mod.registerMethod(
    'sync',
    improvePetDisplay
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'spellAffinity',
    'Display Spell Affinity',
    'global',
    'Display Spell Affinity bonus for known spells in the character page.',
  );

  const spellAffinity = () => {
    const skillPane = document.querySelector('div.panetitle[name="Skills"]');
    if (!skillPane) {
      mod.debug('No skills pane found');
      return;
    }
    const spellTable = skillPane.nextElementSibling.firstElementChild.firstElementChild.lastElementChild.firstElementChild.firstElementChild;
    const affinities = {};
    for (const spellRow of spellTable.children) {
      if (spellRow.children.length >= 3) {
        const spellText = spellRow.children[2].textContent;
        if (spellText.includes('Aura') || spellText.includes('Autohit') || spellText.includes('Ranged') || spellText.includes('Touch')) {
          const damageType = spellRow.children[2].textContent.split(' ').pop();
          if (!(damageType in affinities)) affinities[damageType] = 0;
          else affinities[damageType] += 1;
        }
      }
    }
    for (const spellRow of spellTable.children) {
      if (spellRow.children.length >= 3) {
        const spellText = spellRow.children[2].textContent;
        // Affinity-based bonus damage is now accounted on the vanilla UI, no need to double-up
        // if (spellText.includes('Autohit') || spellText.includes('Ranged') || spellText.includes('Touch')) {
        //   const splitText = spellRow.children[2].textContent.split(' ');
        //   const damageType = splitText.pop();
        //   const damage = parseInt(splitText.pop()) + affinities[damageType];
        //   const spellType = splitText.pop();
        //   spellRow.children[2].textContent = `${spellType} ${damage} ${damageType}`;
        // } else if (spellText.includes('Aura')) {
        if (spellText.includes('Aura')) {
          const damageType = spellRow.children[2].textContent.split(' ').pop();
          spellRow.children[2].textContent = spellText + `, ${10 + 2 * affinities[damageType]} ticks`;
        }
      }
    }
  }

  await mod.registerMethod(
    'sync',
    spellAffinity
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'sortSafeSpells',
    'Safe Spellgem Sorter',
    'local',
    'Sort Spellgems in Faction Safe.',
  );

  const sortSafeSpells = () => {
    const safeSpellButton = document.querySelector('form[name="footlockergrab"] input[value^="Retrieve Spell"]');
    if (!safeSpellButton) {
      mod.debug('Retrieve Spell From Safe button not found.');
      return;
    }
    const safeSpellSelect = safeSpellButton.parentNode.querySelector('select');
    const sortedOpt = Array.from(safeSpellSelect.options).sort((a,b) => a.textContent < b.textContent ? -1 : 1);
    safeSpellSelect.innerHTML = '';
    for (const opt of sortedOpt) safeSpellSelect.add(opt);
    safeSpellSelect.selectedIndex = 0;
  }

  await mod.registerMethod(
    'sync',
    sortSafeSpells
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'HELL',
    'HELL',
    'global',
    'HELL',
  );

  const unleash = (str) => {
    if (!str) return null;
    const hellSpan = [];
    for (let i = 0; i < str.length; i += 6) {
      const cursedText = document.createElement('text');
      cursedText.textContent = str.slice(i+5, i+6);
      cursedText.style.fontFamily = 'Garamond';
      hellSpan.push(str.slice(i, i+5), cursedText);
    }
    return hellSpan;
  }

  const HELL = () => {
	document.body.classList.add('HELL');
    for (const node of document.body.querySelector('#page-body').querySelectorAll('text,div,span,option,a,b,td,th')) {
      if (node.children && node.children.length !== 0) {
        for (const childNode of node.childNodes) {
          if (childNode.children && childNode.children.length !== 0) continue;
          const hellSpan = unleash(childNode.textContent);
          if (!hellSpan) continue;
          childNode.textContent = '';
          if (childNode.nodeType === Node.TEXT_NODE) {
            childNode.before(...hellSpan);
            childNode.parentNode.removeChild(childNode);
          }
          else if (childNode.nodeType === Node.COMMENT_NODE) continue;
          else childNode.append(...hellSpan);
        }
      }
      else {
        const hellSpan = unleash(node.textContent);
        if (!hellSpan) continue;
        node.textContent = '';
        node.append(...hellSpan);
      }
    }
	Array.from(document.getElementsByClassName('content')).forEach(e => {
      e.style.fontFamily = 'Comic Helvetic';
      e.style.fontWeight = '300';
    });
  }
  
  // Dear Grid Square
  if (mod.API.charinfo.class && mod.API.charinfo.id && mod.API.charinfo.class.includes('Void Walker') && mod.API.charinfo.id === '13227') {
    mod.isEnabled().then(enabled => { if (!enabled) HELL(); });
  }
  
  argavyonExTweaks.addGlobalStyle(await GM.getResourceUrl('HELLCSS'));

  await mod.registerMethod(
    'sync',
    HELL
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'charIconSelect',
    'Character Icon Selection',
    'global',
    'Enables selecting your character icon from a visual dropdown',
  );

  const charIconSelectUI = () => {
    const charIconForm = document.querySelector('form[action="/clash.php?op=charsettings&category=set_avatar"]');
    if (!charIconForm) {
      mod.debug('No character icon selection form found');
      return;
    }

    const charIconSelect = charIconForm.querySelector('select[name="switch"]');
    charIconSelect.hidden = true;

    const showUIbutton = charIconSelect.parentNode.insertBefore(document.createElement('input'), charIconSelect);
    showUIbutton.type = 'button';
    showUIbutton.value = 'Display Avatar List';

    const UIdiv = charIconForm.appendChild(document.createElement('div'));
    UIdiv.hidden = true;
    UIdiv.id = 'char-selectable';
    UIdiv.class = 'selectable';
    showUIbutton.onclick = function() { UIdiv.hidden = !UIdiv.hidden; }

    for (const opt of charIconSelect.options) {
      const img = UIdiv.appendChild(document.createElement('img'));
      img.src = `https://www.nexusclash.com/images/g/YouAreHere/Avatar${opt.value}.gif`;
      img.className = 'ui-widget-content';
    }

    $(function() {
      $("#char-selectable").selectable({
        selected: function() {
          $("#char-selectable img").each(function(index) {
            if ($(this).hasClass("ui-selected")) {
              charIconSelect.selectedIndex = index;
              charIconSelect.onchange();
            }
          });
        }
      });
    });
  }

  await mod.registerMethod(
    'sync',
    charIconSelectUI
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'easyUsePane',
    'Easy Use Pane',
    'local',
    'Creates a left-side pane with trigger-able spellgems and consumables from inventory.',
  );

  const easyUsePane = () => {
    if (document.querySelector('form[name="connect"] input[value="respawn"]')) {
      mod.debug('Character is currently dead.');
      return;
    }
    const easy_use_pane = mod.API.createPane('Easy Spellgem and Consumable Use', 'custompane-easy_use', mod.API.getPaneById('pane-targetshoot'));
    easy_use_pane.content.className = 'panecontent';

    const spellgem_trigger_select = document.querySelector('form[name="spellattack"] select[name="item"]');
    const inventory_consumables = [...document.querySelectorAll('#inventory form[name="ItemUse"] input[value="useitem"]')].map(e => e.parentNode);
    const usables = easy_use_pane.content.appendChild(document.createElement('table')).appendChild(document.createElement('tbody'));
    if (document.querySelector('form[name="spellattack"] select[name="item"]')) {
      for (const opt of document.querySelector('form[name="spellattack"] select[name="item"]').options) {
        const tr = usables.appendChild(document.createElement('tr'));
        const gem_match = opt.textContent.match(/(?<spell>.*) - \((?<cost>.*), (?<charges>.*)\)/);
        const chargesTd = tr.appendChild(document.createElement('td'));
        chargesTd.textContent = gem_match.groups.charges;
        chargesTd.style.width = '10%';
        const useTd = tr.appendChild(document.createElement('td'));
        useTd.align = 'center';
        useTd.style.width = '15%';
        const useForm = useTd.appendChild(document.createElement('form'));
        useForm.name = 'ItemUse';
        useForm.action = '';
        useForm.method = 'POST';
        const inp1 = useForm.appendChild(document.createElement('input'));
        inp1.type = 'hidden';
        inp1.name = 'op';
        inp1.value = 'castspell';
        const inp2 = useForm.appendChild(document.createElement('input'));
        inp2.type = 'hidden';
        inp2.name = 'item';
        inp2.value = opt.value;
        const inp3 = useForm.appendChild(document.createElement('input'));
        inp3.class = 'item_use';
        inp3.type = 'submit';
        inp3.value = `Trigger (${gem_match.groups.cost})`;
        inp3.style.width = '100%';
        tr.appendChild(document.createElement('td')).textContent = gem_match.groups.spell;
      }
    }
    for (const inp of document.querySelectorAll('#inventory form[name="ItemUse"] input[value="useitem"]')) {
      const invRow = inp.parentNode.parentNode.parentNode;
      const tr = usables.appendChild(document.createElement('tr'));
      const countTd = tr.appendChild(document.createElement('td'));
      countTd.style.width = '10%';
      countTd.textContent = `${invRow.children[2].textContent} unit(s)`;
      const inpTd = tr.appendChild(invRow.children[1].cloneNode(true));
      inpTd.align = 'center';
      inpTd.style.width = '15%';
      inpTd.querySelector('input[type="submit"]').style.width = '100%';
      tr.appendChild(document.createElement('td')).textContent = invRow.children[0].textContent;
    }
  }

  await mod.registerMethod(
    'sync',
    easyUsePane
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'classSpecificTweaks',
    'Class-Specific Tweaks',
    'local',
    'A module that contains various class-specific tweaks.',
  );

  const tweakList = {
    'shepherd-maxEnergize': {
      callback: () => {
        const e_amount = document.querySelector('form[name="Energize"] select[name="amount"]');
        if (e_amount) e_amount.options[e_amount.options.length-1].selected = true;
      },
      name: 'Shepherd - Energize defaults to Max',
      desc: 'Energize\'s dropdown selects the maximum amount by default.'
    },
    'archon-sortWords': {
      callback: () => {
        const divineWordButton = document.querySelector('form[name="skilluse"] input[value="Divine Words"]');
        if (!divineWordButton) {
          mod.debug('Divine Word button not found');
          return;
        }
        const divineWordSelect = divineWordButton.parentNode.querySelector('select');
        let options = Array.from(divineWordSelect.children);
        // Sort 'none' first, then sort everything else lexicographically, with 'End' words last
        options.sort((opt1, opt2) => {
          if (opt1.value === 'none') return -1;
          if (opt2.value === 'none') return 1;
          if (opt1.value.startsWith('End') === opt2.value.startsWith('End')) return (opt1.value < opt2.value ? -1 : 1);
          if (opt1.value.startsWith('End')) return 1;
          return -1;
        });
        divineWordSelect.innerHTML = '';
        for (const opt of options) divineWordSelect.options.add(opt);
      },
      name: 'Archon - Word of Sorting',
      desc: 'Sorts Archons\' Word powers.',
    },
    'lich-rearrangeSummoningButtons': {
      callback: () => {
        const petTableTable = document.querySelector('.petTable');
        if (!petTableTable) return;

        // Pets summon buttons
        const petSummons = petTableTable.querySelector('tbody').querySelector('table.summonsButtons>tbody');
        const FM = petSummons.querySelector('input[value="Fossil Monstrosity"]');
        const necro = petSummons.querySelector('input[value="Necrophage"]');

        if (FM) {
          // This is how they currently display by default
          // FM.nextSibling.value = 'Fossil Monstrosity (3 Skeletons) '
          if (petSummons.children.length < 3) petSummons.appendChild(document.createElement('tr'));
          petSummons.children[2].insertBefore(FM.parentNode.parentNode, petSummons.children[2].firstChild);
        }
        if (necro) {
          // This is how they currently display by default
          // necro.nextSibling.value = 'Necrophage (3 Zombies/Ghouls) '
          if (petSummons.children.length < 3) petSummons.appendChild(document.createElement('tr'));
          petSummons.children[2].appendChild(necro.parentNode.parentNode);
        }
      },
      name: 'Lich - Pet Summon fix',
      desc: 'Fixes the UI for summoning lich pets. Should make the pet list more eye-friendly.',
    },
    'petmaster-potatoStance': {
      callback: () => {
        const petTableTable = document.querySelector('.petTable');
        if (!petTableTable) {
          mod.debug('No pet table found.');
          return;
        }

        // Pets are on an unnamed table inside the pet table
        // There may or may not be another table of class 'summonsButtons' (which you don't get if you're at pet cap)
        const petTable = petTableTable.querySelector('tbody').querySelector('table:not(.summonsButtons)>tbody');
        // With two title rows and a tail row, at least 4 rows are needed if there's any pet
        if (petTable.children.length < 4) return;
        // Last row is the set-all button
        const setAllRow = petTable.lastElementChild;

        // Pets start on the third row
        for (const petRow of Array.from(petTable.children).slice(2, -1)) {
          petRow.querySelector('select[name="stance"] option[value="Passive"]').textContent = 'Potato';
        }
        setAllRow.querySelector('select[name="stance"] option[value="Passive"]').textContent = 'Potato';
      },
      name: 'Petmaster - Potato Stance',
      desc: 'Replaces the Passive pet stance by a functionally-equivalent Potato stance. It\'s pretty useless. Absolutely useless.',
    }
  };

  const mergeAlert = () => {
    mod.getSetting('alert-displayed-1').then(displayed => {
      if (!displayed) {
        if (confirm(
          'The following modules have been merged into the "Class-specific Tweaks" module and will need to be re-enabled:' +
          '\n- Max Energize\n- Word of Sorting\n- Lich\'s Delight\n- Potato Pet Stance'
        )) {
          mod.setSetting('alert-displayed-1', true);
        }
      }
    });
  }
  if (mod.API.inGame) mergeAlert();

  const classSpecificTweaks = () => {
    for (const key of Object.keys(tweakList)) {
      mod.getSetting(key).then(enabled => { if (enabled) tweakList[key].callback(); });
    }
  }

  for (const key of Object.keys(tweakList)) {
    await mod.registerSetting('checkbox', key, tweakList[key].name, tweakList[key].desc);
  }

  await mod.registerMethod(
    'sync',
    classSpecificTweaks
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'mapDoor',
    'Enter/Exit button on Map',
    'global',
    'Adds an Enter/Exit button on the Map layout.',
  );

  const mapDoor = () => {
    const mapTab = document.querySelector('#Map');
    const doorForm = document.querySelector('form[name="doorenter"]');
    if (!mapTab || !doorForm) {
      if (!mapTab) mod.debug('Map tab not detected.');
      if (!doorForm) mod.debug('Door form not detected.');
      mod.debug('Cannot add enter/exit button to map.');
      return;
    }
    const mapDoorButton = mapTab.querySelector('.TableBody').children[2].children[2].appendChild(doorForm.cloneNode(true));
    mapDoorButton.name = 'mapDoor';
    mapDoorButton.style.textAlign = 'center';
    mapDoorButton.querySelector('input[type="submit"]').value = mapDoorButton.querySelector('input[name="action"]').value;
    mapDoorButton.querySelector('input[type="submit"]').className = 'Move';
  }

  await mod.registerMethod(
    'sync',
    mapDoor
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'mobileEnchants',
    'Mobile Enchantment Display',
    'local',
    'Displays items\' enchantments to mobile users (provided they can see them).',
  );

  const mobileEnchants = () => {
    document.querySelectorAll('span span font[color="#881111"]').forEach(ench => {
      ench.parentNode.appendChild(document.creteElement('br'));
      ench.parentNode.appendChild(document.createTextNode(ench.parentNode.title));
    });
  }

  await mod.registerMethod(
    'sync',
    mobileEnchants
  );
})());


//##############################################################################
promiseList.push((async () => {
  const mod = await argavyonExTweaks.registerModule(
    'inPain',
    'How Hurt Am I?',
    'local',
    'Changes background color based on missing HP.',
  );

  const inPain = () => {
    const threshold = 0.75;
    if (mod.API.charinfo && mod.API.charinfo.hp && mod.API.charinfo.hp < mod.API.maxhp*threshold) {
      const f = 1 - mod.API.charinfo.hp / mod.API.maxhp;
      const slide = 275;
      const maxGB = 242;
      const GB = Math.ceil(Math.max(0, 242 - f*slide));
      const R = Math.ceil(Math.min(242, 2*242 - f*slide));
      document.querySelector('.panel').style.backgroundColor = `rgb(${R}, ${GB}, ${GB})`;
    }
  }

  await mod.registerMethod(
    'sync',
    inPain
  );
})());


//##############################################################################
// Must be last executed step, as this unlocks nexusTweaks to run
(async () => {
  nexusTweaks.addGlobalStyle(await GM.getResourceUrl('nexusTweaksCSS'));
  await Promise.all(promiseList);
  myPromise.resolve(); // Is this really necessary -- Argavyon
  nexusTweaks.runNexusTweaks();
  argavyonExTweaks.runNexusTweaks();
})();
