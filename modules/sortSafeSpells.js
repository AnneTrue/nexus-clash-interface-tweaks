const sortSafeSpells = {
    module: async (api) => {
        const mod = await api.registerModule(
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
    }
}
