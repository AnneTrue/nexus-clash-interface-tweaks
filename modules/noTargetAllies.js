const noTargetAllies = {
    module: async (api) => {
        const mod = await api.registerModule(
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
    }
}
