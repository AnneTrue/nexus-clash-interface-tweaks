const easyUsePane = {
    module: async () => {
        const mod = await argavyonExTweaks.registerModule(
            'easyUsePane',
            'Easy Use Pane',
            'local',
            'Creates a left-side pane with trigger-able spellgems and consumables from inventory.',
        );

        const easyUsePane = () => {
            if (document.querySelector('form[name="connect"] input[value="respawn"]')) {
                mod.debug('Character is currently dead.');
                return;
            }
            const easy_use_pane = mod.API.createPane('Easy Spellgem and Consumable Use', 'custompane-easy_use', mod.API.getPaneById('pane-targetshoot'));
            easy_use_pane.content.className = 'panecontent';

            const spellgem_trigger_select = document.querySelector('form[name="spellattack"] select[name="item"]');
            const inventory_consumables = [...document.querySelectorAll('#inventory form[name="ItemUse"] input[value="useitem"]')].map(e => e.parentNode);
            const usables = easy_use_pane.content.appendChild(document.createElement('table')).appendChild(document.createElement('tbody'));
            if (document.querySelector('form[name="spellattack"] select[name="item"]')) {
                for (const opt of document.querySelector('form[name="spellattack"] select[name="item"]').options) {
                    const tr = usables.appendChild(document.createElement('tr'));
                    const gem_match = opt.textContent.match(/(?<spell>.*) - \((?<cost>.*), (?<charges>.*)\)/);
                    const chargesTd = tr.appendChild(document.createElement('td'));
                    chargesTd.textContent = gem_match.groups.charges;
                    chargesTd.style.width = '10%';
                    const useTd = tr.appendChild(document.createElement('td'));
                    useTd.align = 'center';
                    useTd.style.width = '15%';
                    const useForm = useTd.appendChild(document.createElement('form'));
                    useForm.name = 'ItemUse';
                    useForm.action = '';
                    useForm.method = 'POST';
                    const inp1 = useForm.appendChild(document.createElement('input'));
                    inp1.type = 'hidden';
                    inp1.name = 'op';
                    inp1.value = 'castspell';
                    const inp2 = useForm.appendChild(document.createElement('input'));
                    inp2.type = 'hidden';
                    inp2.name = 'item';
                    inp2.value = opt.value;
                    const inp3 = useForm.appendChild(document.createElement('input'));
                    inp3.class = 'item_use';
                    inp3.type = 'submit';
                    inp3.value = `Trigger (${gem_match.groups.cost})`;
                    inp3.style.width = '100%';
                    tr.appendChild(document.createElement('td')).textContent = gem_match.groups.spell;
                }
            }
            for (const inp of document.querySelectorAll('#inventory form[name="ItemUse"] input[value="useitem"]')) {
                const invRow = inp.parentNode.parentNode.parentNode;
                const tr = usables.appendChild(document.createElement('tr'));
                const countTd = tr.appendChild(document.createElement('td'));
                countTd.style.width = '10%';
                countTd.textContent = `${invRow.children[2].textContent} unit(s)`;
                const inpTd = tr.appendChild(invRow.children[1].cloneNode(true));
                inpTd.align = 'center';
                inpTd.style.width = '15%';
                inpTd.querySelector('input[type="submit"]').style.width = '100%';
                tr.appendChild(document.createElement('td')).textContent = invRow.children[0].textContent;
            }
        }

        await mod.registerMethod(
            'sync',
            easyUsePane
        );
    }
}
