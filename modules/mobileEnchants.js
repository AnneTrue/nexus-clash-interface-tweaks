const mobileEnchants = {
    module: async (api) => {
        const mod = await api.registerModule(
            'mobileEnchants',
            'Mobile Enchantment Display',
            'local',
            'Displays items\' enchantments to mobile users (provided they can see them).',
        );

        const mobileEnchants = () => {
            document.querySelectorAll('span span font[color="#881111"]').forEach(ench => {
                ench.parentNode.appendChild(document.creteElement('br'));
                ench.parentNode.appendChild(document.createTextNode(ench.parentNode.title));
            });
        }

        await mod.registerMethod(
            'sync',
            mobileEnchants
        );
    }
}
