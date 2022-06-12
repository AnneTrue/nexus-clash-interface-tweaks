const mapDoor = {
    module: async () => {
        const mod = await argavyonExTweaks.registerModule(
            'mapDoor',
            'Enter/Exit button on Map',
            'global',
            'Adds an Enter/Exit button on the Map layout.',
        );

        const mapDoor = () => {
            const mapTab = document.querySelector('#Map');
            const doorForm = document.querySelector('form[name="doorenter"]');
            if (!mapTab || !doorForm) {
                if (!mapTab) mod.debug('Map tab not detected.');
                if (!doorForm) mod.debug('Door form not detected.');
                mod.debug('Cannot add enter/exit button to map.');
                return;
            }
            const mapDoorButton = mapTab.querySelector('.TableBody').children[2].children[2].appendChild(doorForm.cloneNode(true));
            mapDoorButton.name = 'mapDoor';
            mapDoorButton.style.textAlign = 'center';
            mapDoorButton.querySelector('input[type="submit"]').value = mapDoorButton.querySelector('input[name="action"]').value;
            mapDoorButton.querySelector('input[type="submit"]').className = 'Move';
        }

        await mod.registerMethod(
            'sync',
            mapDoor
        );
    }
}
