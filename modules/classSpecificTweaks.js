const classSpecificTweaks = {
    module: async (api) => {
        const mod = await api.registerModule(
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
    }
}
