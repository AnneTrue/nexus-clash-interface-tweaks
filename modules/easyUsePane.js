const easyUsePane = {
    module: async (api) => {
        const mod = await api.registerModule(
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
            usables.parentNode.style.width = '100%';

            let nextRow = null;

            if (document.querySelector('form[name="spellattack"] select[name="item"]')) {
                for (const opt of document.querySelector('form[name="spellattack"] select[name="item"]').options) {
                    let row = null;
                    if (!nextRow) {
                        row = usables.appendChild(document.createElement('tr'));
                        nextRow = row;
                    } else {
                        row = nextRow;
                        nextRow = null;
                    }
                    const div = row.appendChild(document.createElement('td'));
                    div.style.width = '50%';

                    const gem_match = opt.textContent.match(/(?<spell>.*) - \((?<cost>.*), (?<charges>.*)\)/);
                    const chargesTd = div.appendChild(document.createElement('div'));
                    chargesTd.textContent = gem_match.groups.charges;
                    chargesTd.style.width = '20%';
                    chargesTd.style.display = 'inline-block';
                    const useTd = div.appendChild(document.createElement('div'));
                    useTd.align = 'center';
                    useTd.style.width = '30%';
                    useTd.style.display = 'inline-block';
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
                    div.appendChild(document.createElement('div')).textContent = gem_match.groups.spell;
                    div.lastChild.style.display = 'inline-block';
                }
            }
            for (const inp of document.querySelectorAll('#inventory form[name="ItemUse"] input[value="useitem"]')) {
                let row = null;
                if (!nextRow) {
                    row = usables.appendChild(document.createElement('tr'));
                    nextRow = row;
                } else {
                    row = nextRow;
                    nextRow = null;
                }
                const div = row.appendChild(document.createElement('td'));
                div.style.width = '50%';

                const invRow = inp.parentNode.parentNode.parentNode;
                const countTd = div.appendChild(document.createElement('div'));
                countTd.style.width = '20%';
                countTd.textContent = `${invRow.children[2].textContent} unit(s)`;
                countTd.style.display = 'inline-block';
                const inpTd = div.appendChild(invRow.children[1].cloneNode(true));
                inpTd.align = 'center';
                inpTd.style.width = '30%';
                inpTd.style.display = 'inline-block';
                inpTd.querySelector('input[type="submit"]').style.width = '100%';
                div.appendChild(document.createElement('div')).textContent = invRow.children[0].textContent;
                div.lastChild.style.display = 'inline-block';
            }
        }

        await mod.registerMethod(
            'sync',
            easyUsePane
        );
    }
}
