const bloodhoundFix = {
    module: async (api) => {
        const mod = await api.registerModule(
            'bloodhoundFix',
            'Collapsible Bloodhound Pane',
            'local',
            'Makes Bloodhound pane properly collapse',
        );
		
		const bloodhoundFix = () => {
			const bloodhoundPaneContent = document.querySelector('label[for="pane-bloodhound"]')?.parentNode.parentNode.nextElementSibling;
			bloodhoundPaneContent?.appendChild(bloodhoundPaneContent.nextElementSibling.nextElementSibling);
			bloodhoundPaneContent?.appendChild(bloodhoundPaneContent.nextElementSibling);
		}
        
        await mod.registerMethod('sync', bloodhoundFix);
	}
}