const inventoryTweaks = {
    module: async () => {
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
    }
}
