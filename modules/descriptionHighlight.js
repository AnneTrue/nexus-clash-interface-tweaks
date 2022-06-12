const descriptionHighlight = {
    module: async () => {
        const mod = await nexusTweaks.registerModule(
            'descriptionHighlight',
            'Global Description Highlight',
            'global',
            'Highlights building light status in the description, and displays how many items are available for pickup.',
        );

        const buildingLights = async (mod) => {
            const lightSpanResult = document.evaluate(
                "//span[@class='building_lights' or @class='neighborhood_lights']",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
            );
            if (lightSpanResult.snapshotLength !== 1) {
                mod.debug('Could not find (or too many) light spans')
                return;
            }
            const lightSpan = lightSpanResult.snapshotItem(0);
            const lightsMatch = lightSpan.textContent.match(
                /(The lights are on inside the building|The building lights illuminate the area)/
            );
            let lightClass = ' libLightsOff';  // prefix with a space to append to class names
            if (lightsMatch) {
                lightClass = ' libLights';
            }
            lightSpan.className += lightClass;
        }

        const itemPickup = async (mod) => {
            // count number of items to pickup first
            const pickupResult = document.evaluate(
                "//form[@name='pickup']/select[@name='item']",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
            );
            if (pickupResult.snapshotLength !== 1) {
                return;
            }
            const countItemsToPickup = pickupResult.snapshotItem(0).length;
            // count number of targets to shoot
            const shootResult = document.evaluate(
                "//form[@name='targetshooting']/select[@name='item']",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
            );
            let countItemsToShoot = 0;
            if (shootResult.snapshotLength === 1) {
                countItemsToShoot = shootResult.snapshotItem(0).length;
            }
            // find the sky description span, so that we can add our span after it
            const skyDescResult = document.evaluate(
                "//span[@class='sky_desc']",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
            );
            if (skyDescResult.snapshotLength !== 1) {
                mod.log('Cannot find exactly one sky_desc span.');
                return;
            }
            // create the item info span
            const itemSpan = document.createElement('span');
            itemSpan.className = 'libLights';
            itemSpan.textContent = `There are ${countItemsToPickup} items to pickup, ${countItemsToShoot} of which are targets.`;
            skyDescResult.snapshotItem(0).insertAdjacentElement('afterend', itemSpan);
        }

        await mod.registerMethod(
            'async',
            buildingLights
        );
        await mod.registerMethod(
            'async',
            itemPickup
        )
    }
}
