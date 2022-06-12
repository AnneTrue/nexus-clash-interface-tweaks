const inventorySort = {
    module: async (api) => {
        const mod = await api.registerModule(
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
            // const clearButton = table.appendChild(document.createElement('tr')).appendChild(document.createElement('td')).appendChild(document.createElement('input'));
            // clearButton.type = 'button';
            // clearButton.value = 'Clear Inventory Sort Data';
            // clearButton.parentNode.colSpan = 3;
            // clearButton.style.width = '98.5%';
            // clearButton.onclick = async function() {
            //   await deleteAllFiltersFromStorage();
            //   clearInventorySettingsTable(table);
            // }
            const defaultButton = table.appendChild(document.createElement('tr')).appendChild(document.createElement('td')).appendChild(document.createElement('input'));
            defaultButton.type = 'button';
            defaultButton.value = 'Restore Default Filters';
            defaultButton.parentNode.colSpan = 3;
            defaultButton.style.width = '98.5%';
            defaultButton.onclick = async function() {
                await restoreDefaultFilters();
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
    }
}
