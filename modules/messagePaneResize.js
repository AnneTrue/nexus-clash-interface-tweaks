const messagePaneResize = {
    module: async (api) => {
        const mod = await api.registerModule(
            'messagePaneResize',
            'Message Pane Resize',
            'global',
            'Enables custom resizing of the message pane.',
        );

        const paneResize = async () => {
            const messagePane = document.querySelector('#main-left #Messages');
            if (!messagePane) {
                mod.debug('No message pane found.');
                return;
            }
            const settingContent = await mod.getSetting('message-pane-height');
            if (!settingContent) mod.setSetting('message-pane-height', '100');

            if (await mod.getSetting('mesage-pane-autosize')) {
                messagePane.style.height = 'auto';
            } else if (settingContent) {
                const num = settingContent.match(/.*?(?<num>\d*).*/).groups.num;
                if (num) messagePane.style.height = `${num}px`;
                else messagePane.style.height = '100px';
            } else {
                messagePane.style.height = '100px';
            }
        }

        await mod.registerSetting(
            'textfield',
            'message-pane-height',
            'Pane Height',
            'Choose pane height (default is 100px)'
        );

        await mod.registerSetting(
            'checkbox',
            'mesage-pane-autosize',
            'Auto Resize Message Pane',
            'Auto Resize Message Pane (overrides pane height)',
        );

        await mod.registerMethod(
            'async',
            paneResize
        );
    }
}
