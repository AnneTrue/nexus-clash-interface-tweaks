const charIconSelect = {
    module: async (api) => {
        const mod = await api.registerModule(
            'charIconSelect',
            'Character Icon Selection',
            'global',
            'Enables selecting your character icon from a visual dropdown',
        );

        const charIconSelectUI = () => {
            const charIconForm = document.querySelector('form[action="/clash.php?op=charsettings&category=set_avatar"]');
            if (!charIconForm) {
                mod.debug('No character icon selection form found');
                return;
            }

            const charIconSelect = charIconForm.querySelector('select[name="switch"]');
            charIconSelect.hidden = true;

            const showUIbutton = charIconSelect.parentNode.insertBefore(document.createElement('input'), charIconSelect);
            showUIbutton.type = 'button';
            showUIbutton.value = 'Display Avatar List';

            const UIdiv = charIconForm.appendChild(document.createElement('div'));
            UIdiv.hidden = true;
            UIdiv.id = 'char-selectable';
            UIdiv.class = 'selectable';
            showUIbutton.onclick = function() { UIdiv.hidden = !UIdiv.hidden; }

            for (const opt of charIconSelect.options) {
                const img = UIdiv.appendChild(document.createElement('img'));
                img.src = `https://www.nexusclash.com/images/g/YouAreHere/Avatar${opt.value}.gif`;
                img.className = 'ui-widget-content';
            }

            $(function() {
                $("#char-selectable").selectable({
                    selected: function() {
                        $("#char-selectable img").each(function(index) {
                            if ($(this).hasClass("ui-selected")) {
                                charIconSelect.selectedIndex = index;
                                charIconSelect.onchange();
                            }
                        });
                    }
                });
            });
        }

        await mod.registerMethod(
            'sync',
            charIconSelectUI
        );
    }
}
