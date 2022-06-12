const characterList = {
    module: async () => {
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

        const truncate = (input, maxSize) => (input.length > maxSize ? input.substring(0, maxSize) + '..' : input);
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
    }
}
