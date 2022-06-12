const saveLogs = {
    module: async () => {
        const mod = await argavyonExTweaks.registerModule(
            'logSaver',
            'Message Log Saver',
            'global',
            'Enables saving NC message log into a text file with a single press of a button.\n' +
            'You\'ll need to reload before seeing the dowload button.',
        );

        const download = (filename, text) => {
            const element = document.createElement('a');
            element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
            element.download = filename;
            element.style.display = 'none';

            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        const charLogsRequest = (charId, callback) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: `https://www.nexusclash.com/clash.php?op=character&id=${charId}`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'displaymessages=Display',
                onload: callback
            });
        }

        const logSaver = () => {
            'use strict';
            if (!mod.API.inGame) return;
            const charID = mod.API.charinfo.id;
            document.querySelector('#nexus-tweaks-settings-button').addEventListener('click', function() {
                const dwldButton = document.querySelector('#nexus-tweaks-setting-logSaver')
                .appendChild(document.createElement('tr'))
                .appendChild(document.createElement('td'))
                .appendChild(document.createElement('input'));
                dwldButton.type = 'button';
                dwldButton.value = 'Download Logs';
                dwldButton.style.color = 'black';
                dwldButton.onclick = function () {
                    charLogsRequest(charID, async function(response) {
                        var parser = new DOMParser();
                        var htmlDoc = parser.parseFromString(response.responseText, 'text/html');
                        const logDiv = htmlDoc.querySelector('div#Messages');
                        const logs = logDiv.textContent;
                        download('logs.txt', logs);
                    });
                };
            });
        }

        await mod.registerMethod(
            'sync',
            logSaver
        );
    }
}
