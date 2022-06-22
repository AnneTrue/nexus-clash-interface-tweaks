const improvePetDisplay = {
    module: async (api) => {
        const mod = await api.registerModule(
            'improvePetDisplay',
            'Pet Display Improvement',
            'local',
            'Sort pets by petmaster, and according to faction politics',
        );

        const defaultCollapseAllyPets = async (AlignmentDiv) => {
            if (!await mod.getSetting('collapse-allied-pets')) return;
            AlignmentDiv.click();
        }
        const defaultCollapsePMList = async (PMDiv, petCount) => {
            if (!await mod.getSetting('collapse-long-petlists')) return;
            if (petCount > 15) PMDiv.click();
        }

        const improvePetDisplay = () => {
            const petList = document.querySelector('div.petListArea');
            if (!petList) {
                mod.debug('No pet list found');
                return;
            }

            const classifiedPetList = {
                enemy: {},
                hostile: {},
                neutral: {},
                friendly: {},
                ally: {},
                faction: {}
            };
            const petCount = petList.firstChild.textContent.substr(0, petList.firstChild.length - 2);
            for (const pet of petList.getElementsByTagName('a')) {
                const alignment = pet.className;
                const master = pet.title.split('Master: ')[1] ? pet.title.split('Master: ')[1] : ' ';
                if (!classifiedPetList[alignment][master]) classifiedPetList[alignment][master] = [];
                const HP = pet.nextElementSibling;
                const MP = pet.nextElementSibling.nextElementSibling;
                if (MP && HP.tagName === MP.tagName) {// assume HP is always img tag, check if MP is same
                    classifiedPetList[alignment][master].push([pet, document.createTextNode(' '), HP, MP]);
                } else classifiedPetList[alignment][master].push([pet, document.createTextNode(' '), HP]);
            }

            const newPetList = petList.cloneNode(false);
            newPetList.appendChild(document.createTextNode(petCount));
            const firstUppercase = (str) => str.at(0).toUpperCase() + str.substr(1);
            for (const alignment of Object.keys(classifiedPetList)) {
                if (Object.keys(classifiedPetList[alignment]).length == 0) continue;
                const AlignmentSpan = newPetList.appendChild(document.createElement('span'));
                const AlignmentDiv = AlignmentSpan.appendChild(document.createElement('div'));
                AlignmentDiv.appendChild(document.createElement('b')).textContent = firstUppercase(alignment);
                const collapseIcon = AlignmentDiv.appendChild(document.createElement('img'));
                collapseIcon.src = 'https://www.nexusclash.com/images/g/inf/close.gif';
                collapseIcon.align = 'right';
                const PMspan = AlignmentSpan.appendChild(document.createElement('span'));
                AlignmentDiv.onclick = function() {
                    const setHide = !AlignmentDiv.classList.contains('collapsed-allied-pets');
                    PMspan.hidden = setHide;
                    AlignmentDiv.classList.toggle('collapsed-allied-pets');
                    collapseIcon.src = setHide ? 'https://www.nexusclash.com/images/g/inf/open.gif' : 'https://www.nexusclash.com/images/g/inf/close.gif';
                }

                let alignmentPetCount = 0;
                for (const master of Object.keys(classifiedPetList[alignment]).sort((a,b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1)) {
                    const PMDiv = PMspan.appendChild(document.createElement('div'));
                    // PMDiv.textContent = 'Master: ';
                    const PMName = PMDiv.appendChild(document.createElement('b'));
                    PMName.textContent = master;
                    const PMPetCount = classifiedPetList[alignment][master].length;
                    alignmentPetCount += PMPetCount;
                    const PMPetCountText = PMDiv.appendChild(document.createTextNode(` [${PMPetCount} pets]`));
                    const collapseIcon = PMDiv.appendChild(document.createElement('img'));
                    collapseIcon.src = 'https://www.nexusclash.com/images/g/inf/close.gif';
                    collapseIcon.align = 'right';

                    const PetDiv = PMspan.appendChild(document.createElement('div'));
                    const petCounts = {};
                    const petLinks = {};
                    for (const pet of classifiedPetList[alignment][master]) {
                        const petType = pet[0].textContent.split(', ').slice(-1)[0].split('a(n) ').slice(-1)[0];
                        if (!(petType in petCounts)) {
                            petCounts[petType] = 1;
                            petLinks[petType] = pet[0].href;
                        }
                        else petCounts[petType] += 1;
                        PetDiv.append(...pet);
                        PetDiv.appendChild(document.createTextNode(', '));
                    }
                    PetDiv.removeChild(PetDiv.lastChild);

                    PMDiv.appendChild(document.createTextNode(`: `));
                    for (const petType of Object.keys(petCounts)) {
                        const PMPetCountInfo = PMDiv.appendChild(document.createElement('a'));
                        PMPetCountInfo.className = alignment;
                        PMPetCountInfo.href = petLinks[petType];
                        PMPetCountInfo.textContent = petType;
                        PMDiv.appendChild(document.createTextNode(` x ${petCounts[petType]}, `));
                    }

                    PMDiv.onclick = function() {
                        const setHide = !PMDiv.classList.contains('collapsed-PM-petlist');
                        PetDiv.hidden = setHide;
                        PMDiv.classList.toggle('collapsed-PM-petlist');
                        collapseIcon.src = setHide ? 'https://www.nexusclash.com/images/g/inf/open.gif' : 'https://www.nexusclash.com/images/g/inf/close.gif';
                    }
                    defaultCollapsePMList(PMDiv, PMPetCount);
                }
                AlignmentDiv.appendChild(document.createTextNode(` [${alignmentPetCount} pets]:`));

                if (alignment === 'faction' || alignment === 'ally') defaultCollapseAllyPets(AlignmentDiv);
            }
            petList.parentNode.replaceChild(newPetList, petList);
        }

        await mod.registerSetting(
            'checkbox',
            'collapse-allied-pets',
            'Collapse faction/allied',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'collapse-long-petlists',
            'Collapse long pet lists',
            'Affects PMs with >15 pets'
        );

        await mod.registerMethod(
            'sync',
            improvePetDisplay
        );
    }
}
