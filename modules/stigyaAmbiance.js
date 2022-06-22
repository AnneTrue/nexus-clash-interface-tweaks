const stigyaAmbiance = {
    module: async (api) => {
        const mod = await api.registerModule(
            'stigyaAmbiance',
            'Stigya Ambiance',
            'global',
            'Makes Stygia feel like Stygia',
        );

        const stigyaAmbiance = () => {
            const AD = document.querySelector('#AreaDescription');
            if (AD) {
                const {x, y, plane} = AD.children[0].textContent.match(/(?<x>\d+), (?<y>\d+) (?<plane>.*?),/).groups;
                if (plane === 'Stygia') {
                    const CharacterInfo = document.querySelector('#CharacterInfo');
                    mod.getSetting('flashy-banner').then(enabled => { if (enabled) {
                        const hellBanner = CharacterInfo.parentElement.insertBefore(new Image(), CharacterInfo.nextElementSibling);
                        hellBanner.src = 'https://media1.tenor.com/images/e03e205229123dff188e4d58f683b91e/tenor.gif';
                    }});
                    mod.getSetting('with-music').then(enabled => { if (enabled) {
                        const audio = new Audio('https://github.com/Argavyon/nexus-clash-interface-tweaks/raw/preview/media/fighting hell & warriors.mp3');
                        audio.loop = true;
                        audio.play();
                    }});
                }
            }
        }

         await mod.registerSetting(
            'checkbox',
            'flashy-banner',
            'Seizure Warning: Excessively Flashy Banner',
            'FLASHY\n\HELL\nBANNER\nFLASHY\n\hELL\nBANNER\nFLASHy\n\HELL\nBANNER'
        );

        await mod.registerSetting(
            'checkbox',
            'with-music',
            'Music from hell',
            'Can\'t have an epic crusade without proper music.\nDon\'t refresh too much.'
        );

        await mod.registerMethod(
            'sync',
            stigyaAmbiance
        );
    }
}
