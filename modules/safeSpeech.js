const safeSpeech = {
    module: async (api) => {
        const mod = await api.registerModule(
            'safespeech',
            'Global Safe Speech Buttons',
            'global',
            'Places a safety on speech and bullhorn buttons so that you cannot accidentally send an empty message.',
        );

        const enableSpeechForm = (e) => {
            const button = e.target.previousElementSibling;
            if (e.target.value !== '') {
                button.disabled = false;
            } else {
                button.disabled = true;
            }
        }

        const safeSpeech = async (mod) => {
            const form = document.evaluate(
                "//form[@name='speak' or @name='bullhorn']/input[@type='submit']",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
            );
            const len = form.snapshotLength
            if (len === 0) { return; }
            for (let i = 0; i < len; i++) {
                let inputButton = form.snapshotItem(i);
                inputButton.disabled = true;
                inputButton = document.evaluate(
                    "input[@type='text']",
                    inputButton.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
                );
                inputButton.snapshotItem(0).addEventListener('input', enableSpeechForm, false);
            }
        }

        await mod.registerMethod(
            'async',
            safeSpeech
        );
    }
}
