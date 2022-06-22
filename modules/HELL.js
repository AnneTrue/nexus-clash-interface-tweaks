const HELL = {
    module: async (api) => {
        const mod = await api.registerModule(
            'HELL',
            'HELL',
            'global',
            'HELL',
        );

        const unleash = (str) => {
            if (!str) return null;
            const hellSpan = [];
            for (let i = 0; i < str.length; i += 6) {
                const cursedText = document.createElement('text');
                cursedText.textContent = str.slice(i+5, i+6);
                cursedText.style.fontFamily = 'Garamond';
                hellSpan.push(str.slice(i, i+5), cursedText);
            }
            return hellSpan;
        }

        const HELL = () => {
            document.body.classList.add('HELL');
            for (const node of document.body.querySelector('#page-body').querySelectorAll('text,div,span,option,a,b,td,th')) {
                if (node.children && node.children.length !== 0) {
                    for (const childNode of node.childNodes) {
                        if (childNode.children && childNode.children.length !== 0) continue;
                        const hellSpan = unleash(childNode.textContent);
                        if (!hellSpan) continue;
                        childNode.textContent = '';
                        if (childNode.nodeType === Node.TEXT_NODE) {
                            childNode.before(...hellSpan);
                            childNode.parentNode.removeChild(childNode);
                        }
                        else if (childNode.nodeType === Node.COMMENT_NODE) continue;
                        else childNode.append(...hellSpan);
                    }
                }
                else {
                    const hellSpan = unleash(node.textContent);
                    if (!hellSpan) continue;
                    node.textContent = '';
                    node.append(...hellSpan);
                }
            }
            Array.from(document.getElementsByClassName('content')).forEach(e => {
                e.style.fontFamily = 'Comic Helvetic';
                e.style.fontWeight = '300';
            });
        }

        // Dear Grid Square
        if (mod.API.charinfo.class && mod.API.charinfo.id && mod.API.charinfo.class.includes('Void Walker') && mod.API.charinfo.id === '13227') {
            mod.isEnabled().then(enabled => { if (!enabled) HELL(); });
        }

        api.addGlobalStyle(await GM.getResourceUrl('HELLCSS'));

        await mod.registerMethod(
            'sync',
            HELL
        );
    }
}
