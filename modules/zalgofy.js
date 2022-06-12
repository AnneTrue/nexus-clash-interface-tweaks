const zalgofy = {
    module: async () => {
        const mod = await argavyonExTweaks.registerModule(
            'zalgofy',
            'Zalgo Speech',
            'local',
            'Z A L G O   S P E E C H',
        );

        const randIndex = (length) => Math.floor(Math.random() * length);

        // Based off https://github.com/casieber/zalgo-js
        const zalgo = {
            up : [
                768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783,
                784, 785, 786, 787, 788, 789, 794, 795, 829, 830, 831, 832, 833, 834, 835, 836,
                838, 842, 843, 844, 848, 849, 850, 855, 856, 859, 861, 862, 864, 865, 867, 868,
                869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879
            ],
            middle : [
                820, 821, 822, 823, 824
            ],
            down : [
                790, 791, 792, 793, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807,
                808, 809, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 825, 826, 827, 828,
                837, 839, 840, 841, 845, 846, 851, 852, 853, 854, 857, 858, 860, 863, 866
            ]
        };

        const zalgofyString = (string, settings) => {
            if (!settings) settings = {};
            const defaultSettings = {
                up: true, middle: true, down: true, intensity: 3
            };
            for (const key of Object.keys(defaultSettings)) if (!settings[key]) settings[key] = defaultSettings[key];

            const directions = Object.keys(zalgo).reduce((acc, value) => (settings[value] ? [...acc, value] : acc), []);
            if (directions.length === 0) return string;

            let HECOMES = '';
            for (const char of Array.from(string)) {
                HECOMES += char;
                for (let i = 0; i < settings.intensity; i++) {
                    const direction = directions[randIndex(directions.length)];
                    HECOMES += String.fromCharCode(zalgo[direction][randIndex(zalgo[direction].length)]);
                }
            }

            return HECOMES;
        }

        const zalgofyForm = (form, settings) => {
            const textInput = form.querySelector('input[type="text"]');
            const speechButton = form.querySelector('input[type="submit"]');
            const newSpeechButton = speechButton.cloneNode();
            newSpeechButton.disabled = false;
            speechButton.type = 'button';
            speechButton.classList.add('hidden');
            form.insertBefore(newSpeechButton, speechButton);
            const emoteRE = new RegExp(String.raw`^/(?<code>\w+)(?<tail>.*?)$`);
            newSpeechButton.onclick = function() {
                const emoteMatch = textInput.value.match(emoteRE);
                if (!emoteMatch) textInput.value = zalgofyString(textInput.value, settings);
                else {
                    const code = emoteMatch.groups.code.toLowerCase();
                    const tail = emoteMatch.groups.tail;

                    if (code === 'em' || code === 'me') textInput.value = '/em' + tail;
                    else if (code === 'plain') textInput.value = tail;
                    else if (code === 'zalgo') textInput.value = zalgofyString(tail, settings);
                    else ;
                }
                speechButton.click();
            }
        }

        const zalgofy = async (mod) => {
            'use strict';

            const settings = {
                up: await mod.getSetting('zalgo-up'),
                middle: await mod.getSetting('zalgo-middle'),
                down: await mod.getSetting('zalgo-down'),
                intensity: Number(await mod.getSetting('zalgo-intensity'))
            };

            const speakForm = document.querySelector('form[name="speak"]');
            const bullForm = document.querySelector('form[name="bullhorn"]');
            const writeForm = document.querySelector('form[name="writing"]');

            if (speakForm) zalgofyForm(speakForm, settings);
            if (bullForm) zalgofyForm(bullForm, settings);
            if (writeForm) zalgofyForm(writeForm, settings);
        }

        await mod.registerSetting(
            'checkbox',
            'zalgo-up',
            'Zalgo up',
            ''
        );

        await mod.registerSetting(
            'checkbox',
            'zalgo-middle',
            'Zalgo middle',
            ''
        );

        await mod.registerSetting(
            'checkbox',
            'zalgo-down',
            'Zalgo down',
            ''
        );

        await mod.registerSetting(
            'select',
            'zalgo-intensity',
            'Zalgo Intensity',
            'Choose how Zalgo you want to Zalgo',
            [{'value' : '1', 'text' : '1'},
             {'value' : '2', 'text' : '2'},
             {'value' : '3', 'text' : '3'},
             {'value' : '4', 'text' : '4'},
             {'value' : '5', 'text' : '5'},
            ]
        );

        await mod.registerMethod(
            'async',
            zalgofy
        );
    }
}
