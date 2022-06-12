const thinBars = {
    module: async (api) => {
        const mod = await api.registerModule(
            'thinbars',
            'Thin HP/MP Bars',
            'local',
            'If a character has full HP or MP, their resource bar is displayed thinner.',
        );

        const healthBars = async (mod) => {
            const healthResult = document.evaluate(
                "//img[@src='images/g/HealthBar_1.gif']",
                document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
            );
            const len = healthResult.snapshotLength;
            for (let i = 0; i < len; i++) {
                healthResult.snapshotItem(i).width = '2';
            }
        }

        const magicBars = async (mod) => {
            const manaResult = document.evaluate(
                "//img[@src='images/g/MagicBar_1.gif']",
                document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
            );
            const len = manaResult.snapshotLength;
            for (let i = 0; i < len; i++) {
                manaResult.snapshotItem(i).width = '2';
            }
        }

        await mod.registerMethod(
            'async',
            healthBars
        );
        await mod.registerMethod(
            'async',
            magicBars
        );
    }
}
