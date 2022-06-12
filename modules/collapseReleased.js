const collapseReleased = {
    module: async (api) => {
        const mod = await api.registerModule(
            'collapseReleased',
            'Collapse Released Characters',
            'global',
            'Collapse released characters on the character select page.',
        );

        const collapseReleased = () => {
            const releasedH2 = document.querySelector('tr>td>h2');
            if (!releasedH2 || releasedH2.textContent !== 'Released Characters') {
                mod.debug('Released Characters section not found');
                return;
            }

            releasedH2.classList.add('collapsed-released');
            const H2text = document.createElement('text');
            H2text.textContent = releasedH2.firstChild.textContent
            releasedH2.replaceChild(H2text, releasedH2.firstChild)
            const collapseIcon = releasedH2.appendChild(document.createElement('img'));
            collapseIcon.src = 'https://www.nexusclash.com/images/g/inf/open.gif';
            collapseIcon.align = 'right';

            const releasedChars = [];
            H2text.hidden = true;
            // The first one is actually the AP/HP/MP/... header for released characters
            let nextReleasedChar = releasedH2.parentNode.parentNode.nextSibling;
            while (!nextReleasedChar.querySelector('form[name="create_character"]')) {
                nextReleasedChar.hidden = true;
                releasedChars.push(nextReleasedChar);
                nextReleasedChar = nextReleasedChar.nextElementSibling;
            }

            releasedH2.onclick = function() {
                const setHide = !releasedH2.classList.contains('collapsed-released');
                H2text.hidden = setHide;
                for (const rc of releasedChars) rc.hidden = setHide;
                releasedH2.classList.toggle('collapsed-released');
                collapseIcon.src = setHide ? 'https://www.nexusclash.com/images/g/inf/open.gif' : 'https://www.nexusclash.com/images/g/inf/close.gif';
            }
        }

        await mod.registerMethod(
            'sync',
            collapseReleased
        );
    }
}
