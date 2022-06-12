const inPain = {
    module: async (api) => {
        const mod = await api.registerModule(
            'inPain',
            'How Hurt Am I?',
            'global',
            'Changes background color based on missing HP.',
        );

        const hpToRGB = (hp, maxHP) => {
            const slide = 115;
            const maxGB = 242;
            const threshold = 0.75;
            const f = hp / maxHP;
            if (f > threshold) return [maxGB, maxGB, maxGB];
            const GB = Math.ceil(Math.max(0, maxGB - (1-f)*slide));
            const R = Math.ceil(Math.min(255, maxGB - (1-f)*slide + 255));
            return [R,GB,GB];
        }

        const inPain = async () => {
            if (mod.API.inGame) {
                if (!await mod.getSetting('in-game')) return;
                if (mod.API.charinfo && mod.API.charinfo.hp) {
                    const [R,G,B] = hpToRGB(mod.API.charinfo.hp, mod.API.charinfo.maxhp);
                    document.querySelector('.panel').style.backgroundColor = `rgb(${R}, ${G}, ${B})`;
                }
            } else {
                if (!await mod.getSetting('character-select')) return;
                document.querySelectorAll('td.hp.stat-bar').forEach(td => {
                    const match = td.textContent.match(/(\d+)\/(\d+)/);
                    const [R,G,B] = hpToRGB(match[1], match[2]);
                    td.parentElement.style.backgroundColor = `rgb(${R}, ${G}, ${B})`;
                });
            }
        }

        await mod.registerSetting(
            'checkbox',
            'in-game',
            'Change Background in-game',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'character-select',
            'Change Background on character select',
            ''
        );

        await mod.registerMethod(
            'async',
            inPain
        );
    }
}
