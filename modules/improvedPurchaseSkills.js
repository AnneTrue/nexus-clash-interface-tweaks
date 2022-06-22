const improvedPurchaseSkills = {
    module: async (api) => {
        const mod = await api.registerModule(
            'improvedPurchaseSkills',
            'Improved Purchase Skills Page',
            'global',
            '',
        );

        const improvedPurchaseSkills = () => {
            const purchaseTableHead = document.querySelector('tr>td>b>u');
            if (!purchaseTableHead || purchaseTableHead.textContent !== 'CHARACTER SKILLS AVAILABLE FOR PURCHASE') {
                mod.debug('No Purchase Skills table found');
                return;
            }
            // Hierarchy here is tbody>tr>td>b>u, where the u tag is purchaseTableHead
            const purchaseTBody = purchaseTableHead.parentNode.parentNode.parentNode.parentNode;
            for (const tr of purchaseTBody.children) {
                tr.colSpan = 6;
                if (!tr.lastElementChild) continue; // Skip empty rows
                if (tr.lastElementChild.querySelector('input[value="executepurchase"]')) tr.appendChild(document.createElement('td'));
                else if (tr.lastElementChild.querySelector('input[value="buyback"]'));
                else if (tr.firstChild.colSpan === 5) tr.firstChild.colSpan = 6; // If first colSpan is a header of short colSpan
                else if (tr.firstChild.colSpan === 6); // If first colSpan is a header of proper colSpan
                else if (tr.children[tr.children.length - 2].textContent) tr.appendChild(document.createElement('td'));
            }
        }

        await mod.registerMethod(
            'sync',
            improvedPurchaseSkills
        );
    }
}
