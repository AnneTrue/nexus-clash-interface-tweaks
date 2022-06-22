const potatoStance = {
    module: async (api) => {
        const mod = await api.registerModule(
            'potatoStance',
            'Potato Stance',
            'local',
            'Replaces the Passive pet stance by a functionally-equivalent Potato stance. It\'s pretty useless. Absolutely useless.',
        );

        const potatoStance = () => {
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
        }
				
        await mod.registerMethod('sync', potatoStance);
    }
}