const defaultSetAllPetStance = {
    module: async () => {
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
    }
}
