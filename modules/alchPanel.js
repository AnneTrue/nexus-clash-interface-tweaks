const alchPanel = {
    module: async (api) => {
        const mod = await api.registerModule(
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
                    rComp.className = 'alchemy-comp ' + this.options[this.selectedIndex].className;
                    // const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
                    // this.style.color = style.color;
                    // this.style.backgroundColor = style.backgroundColor;
                }
                rComp.onchange();

                const rButton = span.appendChild(researchButton.cloneNode(true));
                rButton.style.width = '100%';
                rButton.onclick = function() {
                    researchComp.value = rComp.value;
                    researchPotion.value = recipeName;
                    mod.setValue('alchemy-alarm', 1).then(researchButton.click());
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
                        tComp.className = 'alchemy-comp ' + this.options[this.selectedIndex].className;
                        // const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
                        // this.style.color = style.color;
                        // this.style.backgroundColor = style.backgroundColor;
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
                for (const li of node.children[1].children[0].children) {
                    if (li.title === 'unknown') break;
                    const liSpan = li.querySelector('span');
                    liSpan.className = 'alchemy-comp ' + transTo.options.namedItem(li.lastElementChild.textContent).className;
                    // const style = document.defaultView.getComputedStyle(transTo.options.namedItem(li.lastElementChild.textContent));
                    // liSpan.style.color = style.color;
                    // liSpan.style.backgroundColor = style.backgroundColor;
                    liSpan.style.width = '100%';
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
            let resComps = 0;
            let resRecipes = 0;
            let craftRecipes = 0;
            let totalRecipes = 0;

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
                            // const style = document.defaultView.getComputedStyle(optGroup.children[0], '');
                            // optGroup.style.color = style.color;
                            // optGroup.style.backgroundColor = style.backgroundColor;
                            optGroup.className = 'alchemy-comp ' + optGroup.children[0].className;
                        }
                    }

                    compList.onchange = function() {
                        // const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
                        // this.style.color = style.color;
                        // this.style.backgroundColor = style.backgroundColor;
                        this.className = 'alchemy-comp ' + this.options[this.selectedIndex].className;
                    }
                    compList.onchange();
                }

                for (const optGroup of transTo.children) {
                    if (optGroup.children.length === 0) optGroup.hidden = true;
                    else {
                        // const style = document.defaultView.getComputedStyle(optGroup.children[0], '');
                        // optGroup.style.color = style.color;
                        // optGroup.style.backgroundColor = style.backgroundColor;
                        optGroup.className = 'alchemy-comp ' + optGroup.children[0].className;
                    }
                }
                transTo.onchange = function() {
                    // const style = document.defaultView.getComputedStyle(this.options[this.selectedIndex], '');
                    // this.style.color = style.color;
                    // this.style.backgroundColor = style.backgroundColor;
                    this.className = 'alchemy-comp ' + this.options[this.selectedIndex].className;
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
                    resComps += grade;
                    resRecipes += grade === 6;
                    craftRecipes += node.children[1].querySelectorAll('li[title="inventory"').length === 6;
                    totalRecipes += 1;
                }
            } else {
                mod.debug('No Alchemy pane found');
                for (let node = trackerNode.nextSibling; node && node.children[1]; node = node.nextSibling) {
                    const grade = 6 - node.children[1].querySelectorAll('li[title="unknown"').length;
                    SimpleAlchemyNode(node, grade);
                    resComps += grade;
                    resRecipes += grade === 6;
                    craftRecipes += node.children[1].querySelectorAll('li[title="inventory"').length === 6;
                    totalRecipes += 1;
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

            const infoDiv = trackerNode.firstChild.appendChild(document.createElement('div'));
            const trackerRR = infoDiv.appendChild(document.createElement('div'));
            const trackerCR = infoDiv.appendChild(document.createElement('div'));
            const trackerRC = infoDiv.appendChild(document.createElement('div'));
            trackerRR.textContent = `Researched Recipes: ${resRecipes}/${totalRecipes}`;
            trackerCR.textContent = `Craftable Recipes: ${craftRecipes}/${totalRecipes}`;
            trackerRC.textContent = `Researched Components: ${resComps}/${totalRecipes*6}`;
            trackerRR.style.display = 'inline-block';
            trackerCR.style.display = 'inline-block';
            trackerCR.style.float = 'right';
        }

        const EnhancedAlchemyPanel = () => {
            'use strict';
            mod.getValue('alchemy-alarm').then(async alarm => {
                // mod.debug(`Alchemy Alarm: ${alarm}`);
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
    }
}
