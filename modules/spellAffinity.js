const spellAffinity = {
    module: async (api) => {
        const mod = await api.registerModule(
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
    }
}
