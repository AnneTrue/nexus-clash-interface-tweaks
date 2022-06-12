const classifyBadges = {
    module: async () => {
        const mod = await nexusTweaks.registerModule(
            'classifyBadges',
            'Badge Classifier',
            'global',
            'Classifies character badges into a hierarchy on the character info page.',
        );

        const Badges = {
            'Career' : {
                'Alcohol Drunk' : ['Low Tolerance', 'Frat Boy', 'Alcoholic', 'Sinatra', 'Friend of Bill'],
                'Angels Killed' : ['Perverter', 'Ruiner', 'Nightmare Whisperer', 'Voice of Armageddon', 'The End of Hope'],
                'Books Read' : ['Reader', 'Bookworm', 'Librarian', 'Bibliophile', 'Teacher\'s Pet', ...['Teachers Pet']],
                'Deaths' : ['Buried', 'Wormfood', 'Aspect Hunter', 'Lich Pet', 'Coffinmaker\'s Friend', ...['Coffinmakers Friend']],
                'Demons Killed' : ['Cleanser', 'Demonslayer', 'Hammer of Light', 'Justicebringer', 'Blade of the Word'],
                'Doors Destroyed' : ['Opportunity Knocks', 'Big Bad Wolf', 'Here\'s Johnny', 'Landshark', 'Homewrecker', ...['Heres Johnny']],
                'Doors Repaired' : ['Apprentice Carpenter', 'Woodworker', 'Journeyman Carpenter', 'Architect', 'Master Carpenter'],
                'Food Eaten' : ['Taste Tester', 'Gourmand', 'Glutton', 'Masticator', 'Food Critic'],
                'Items Crafted' : ['Sweat Shop Worker', 'Journeyman Blacksmith', 'Factory Foreman', 'Artisan', 'Artifex', ...['Sweatshop Worker']],
                'Items Repaired' : ['Tinker', 'Mender', 'Fixer', 'Handyman', '80s Action Hero'],
                'Kills' : ['Killer', 'Warrior', 'Disciple of Death', 'Master of Death', 'Gravemaker'],
                'Locks Picked' : ['Thief', 'Burglar', 'Second-Story Man', 'Locksmith', 'Master of Tumblers'],
                'Pets Killed' : ['Dogkiller', 'Exterminator', 'Pest Control', 'Trophy Hunter', 'Director of Animal Testing'],
                'Pills Taken' : ['I Have a Headache', 'Pill-popper', 'Living the High Life', 'Monster Addict', 'Slave to the Habit'],
                'Power Removed' : ['Wiresnipper', 'Fusebreaker', 'Circuitbreaker', 'Blackout', 'Degenerate'],
                'Power Restored' : ['Apprentice Electrician', 'Fusemaker', 'Journeyman Electrician', 'Circuitmaker', 'Master Electrician'],
                'Targets Shot' : ['Barn Assassin', 'Sharpshooter', 'Deadeye', 'Gunslinger', 'Hickok'],
                'Damage Dealt' : ['Crusher', 'Smasher', 'Bloodletter', 'Assassin', 'Surgeon\'s Lament', 'Widowmaker', ...['Surgeons Lament']],
                'Damage Taken' : ['Punching Bag', 'Bruised', 'Crushed', 'All Stitched Up', 'Keeping Healers in Business', 'Constantly in Traction'],
                'HP Healed' : ['Medic', 'Doctor', 'Surgeon', 'Healer', 'Bodyweaver', 'Lifesaver']
            },
            'Breath 5' : {
                'Alcohol Drunk': [],
                'Angels Killed': [],
                'Books Read': [],
                'Damage Dealt': [],
                'Damage Taken': [],
                'Deaths': [],
                'Demons Killed': [],
                'Doors Destroyed': [],
                'Doors Repaired': [],
                'Food Eaten': [],
                'HP Healed': [],
                'Items Crafted': [],
                'Items Repaired': [],
                'Kills': [],
                'Locks Picked': [],
                'Pets Killed': [],
                'Pills Taken': [],
                'Power Removed': [],
                'Power Restored': [],
                'Targets Shot': []
            },
            'Breath 4' : {
                'Alcohol Drunk': ['Pink Elephant Rider', 'Trapped in a Bottle'],
                'Angels Killed': ['Darkness Visible', 'Abomination of Desolation'],
                'Books Read': ['Researcher', 'Overeducated'],
                'Damage Dealt': ['Bruiser', 'Apex Predator'],
                'Damage Taken': ['Traumatized', 'Impervious to Pain'],
                'Deaths': ['Cemetery Monopolist', 'Deader than Dead'],
                'Demons Killed': ['Avenger of Blood', 'Hand of Namm'],
                'Doors Destroyed': ['Barrier Free', 'Uninvited'],
                'Doors Repaired': ['Security Expert', 'Siege Warrior'],
                'Food Eaten': ['Gastronomist', 'Great Devourer'],
                'HP Healed': ['First Responder', 'Panacea'],
                'Items Crafted': ['Forgemaster', 'Titan of Industry'],
                'Items Repaired': ['Jerry Rigger', 'Master Mechanic'],
                'Kills': ['Executioner', 'Chooser of the Slain'],
                'Locks Picked': ['Plunderer', 'Five Finger Bargain Hunter'],
                'Pets Killed': ['Varmint Hunter', 'Harbinger of Extinction'],
                'Pills Taken': ['High Roller', 'Everlasting Rehab'],
                'Power Removed': ['Luddite', 'Brings the Night'],
                'Power Restored': ['Illuminati', 'Lights up the World'],
                'Targets Shot': ['Eagle Eyed', 'Gunshepherd']
            },
            'Breath 3' : {
                'Alcohol Drunk': ['Lush', 'Inebriate'],
                'Angels Killed': ['Author of Despair', 'Shroudbringer'],
                'Books Read': ['Critic', 'Proofreader'],
                'Damage Dealt': ['Mauler', 'State of Contusion'],
                'Damage Taken': ['Hemophiliac', 'Uninsurable'],
                'Deaths': ['Rory Williams', 'Disciple of Kenny'],
                'Demons Killed': ['Demonsbane', 'Dawnbringer'],
                'Doors Destroyed': ['Gatecrasher', 'Urban Lumberjack'],
                'Doors Repaired': ['Framer', 'Master Framer'],
                'Food Eaten': ['Gorger', 'Competetive [sic] Eater'],
                'HP Healed': ['Sawbones', 'Hippocrat'],
                'Items Crafted': ['Manufacturer', 'Assembly Line'],
                'Items Repaired': ['Refurbisher', 'Restoration Artist'],
                'Kills': ['Slayer', 'Hand of Death'],
                'Locks Picked': ['Pilferer', 'Midnighter'],
                'Pets Killed': ['Big Game Hunter', 'Taxidermist'],
                'Pills Taken': ['Junkie', 'Cabinet Raider'],
                'Power Removed': ['Pitchman', 'Black Knight'],
                'Power Restored': ['Linesman', 'Head Linesman'],
                'Targets Shot': ['Crack Shot', 'Sniper']
            },
            'Exploration' : {
                'Breath 5' : [
                    'A Colder War', 'A Heaven of Hell', 'According to Their Works', 'Bloodbreaker', 'Book of Martyrs', 'Cassandras Truth', 'Club Feral',
                    'Cognitive Dissonance', 'Convenient', 'Divine Comedy', 'Dunes of Dust', 'Earth Was Like a Marble', 'Eternal I Endure', 'Every Mountain Made Low',
                    'Family Fun', 'Flushed!', 'Forget All That', 'Going Up', 'Grandest of Slams', 'Hear Ye!', 'Hell is Other People', 'I Stab at Thee', 'In Memoriam',
                    'Iron Juggernaut', 'Kenopsia', 'Love Eternal', 'Made to Last', 'No Longer Boarding', 'Not Safe', 'Not a Drill', 'Perseverence of the Saints',
                    'Receded Waters', 'Rising Tide', 'Shape of Things to Come', 'Skipping Stones', 'Taste of Dried Leaves', 'The Nether Millstone', 'They Shall Not Pass',
                    'This Place is Not a Place of Honor', 'Those Lost', 'Trading Places', 'True Blue', 'Two Guns', 'Wellspring', 'Whole Dome', 'Wild in the Woods',
                    'With Great Power', 'While The Iron Is Hot'
                ],
                'Breath 4' : [
                    'A New Chapter', 'Academic Probation', 'All In The Family', 'And I Must Scream', 'At All Costs', 'Baraas Ascends', 'Birthing Pool', 'Broken Alliance',
                    'Broken Promises', 'Circumnavigation', 'Citadel', 'Clinging to Life', 'Cloudwatching', 'Cops and Robbers', 'Dedicated Few', 'Enthroned', 'Explosive Yield',
                    'Fall of the Watcher', 'Four Corners', 'Fragmented Return', 'Halls of the Scholar', 'Halls of Wrath', 'Idle Hands', 'In The Name Of Science', 'Institute of Arts',
                    'Into the Dark', 'Last Confession', 'Reasons to Live', 'Remorse', 'Stolen Victory', 'Tapestry of Time', 'The Earth Shudders', 'The Legend', 'The Little King',
                    'The Rise of Kafa-El', 'The Voice', 'Under The Boot', 'Untouched Wilderness', 'Well of Truth', 'What Once Was Lost'
                ],
                'Breath 3' : [
                    'Bloodlines', 'Common Touch', 'Cromahl-Hult', 'Deluge', 'Effervescence', 'Eresius Rest', 'Fatigued', 'Favored of Baraas', 'Fire and Ice', 'Flakes of Delight',
                    'Fought the Law', 'Four Winds', 'Harmonious Joining', 'Hole in None', 'Immutable Law', 'Landfall', 'Netherland', 'Paradise Lost', 'Riptide', 'Shades of Black',
                    'Shades of Grey', 'Sincerest Flattery', 'Tainted Fruit', 'The Crypt of Maeval', 'View from the Top'
                ],
                'Breath 2' : [
                    'A Whole New World', 'All Ye All Ye Outs In Free', 'Beginning of the End', 'Blinded by Lust', 'Bloodlust', 'Bridge Magic Built', 'Captain Bloodbeards Folly',
                    'Crystal Farm', 'Deck of Cards', 'Goldlust', 'Ground Zero', 'Impassable Dream', 'Last Ship Leaving', 'Mene Mene Tekel Upharsin', 'Smiles All Around', 'Snicker-Snack',
                    'Time Sink', 'Tree Hugger', 'Viva La Revolucion', 'Walking Home', 'Watery Grave', 'When The Walls Came Tumbling Down'
                ],
                'Breath 1' : [
                    'Altar of the Ancients', 'Big Bang', 'Confluence', 'Founding Father', 'Great Bowl', 'Hermits Repose', 'Iron Barracks', 'Lord Mayor', 'Shrine of the Wound', 'Slowpoke'
                ]
            },
            'Monster Hunting' : {
                'Crystal Guardian' : ['Shardbreaker', 'Crystal Smasher', 'Entropy Incarnate'],
                'Great Wyrm' : ['Wyrm Hunter', 'Wyrm Slayer', 'Wyrmsbane'],
                'Maeval' : ['Stalker of Death', 'Hunter of Death', 'Foe of Death']
            }
        };

        const classifyBadges = (badgesText) => {
            const badgeTexts = badgesText.trim().split(',').map(str => str.trim());
            const classifiedBadges = {};

            for (let bT of badgeTexts) {
                let found = false;
                for (let mainCategory in Badges) {
                    for (let subCategory in Badges[mainCategory]) {
                        if (Badges[mainCategory][subCategory].includes(bT)) {
                            if (!(mainCategory in classifiedBadges)) classifiedBadges[mainCategory] = {};
                            if (!(subCategory in classifiedBadges[mainCategory])) classifiedBadges[mainCategory][subCategory] = [];
                            classifiedBadges[mainCategory][subCategory].push(bT);
                            found = true;
                            continue;
                        }
                    }
                    if (found) continue;
                }
                if (!found) {
                    if (!classifiedBadges.Others) classifiedBadges.Others = [];
                    classifiedBadges.Others.push(bT);
                }
            }

            return classifiedBadges;
        }

        const printClassifiedBadges = (classifiedBadges, badgesNode) => {
            const MainBadgeCategory = (text, parent) => {
                const categoryNode = parent.appendChild(document.createElement('div'));
                categoryNode.className = 'classify-badges-MBcategory';
                const titleNode = categoryNode.appendChild(document.createElement('div'));
                const contentNode = categoryNode.appendChild(document.createElement('div'));
                titleNode.className = 'classify-badges-MBtitle';
                titleNode.textContent = text;
                titleNode.title = 'Click to expand/collapse';
                titleNode.onclick = () => { contentNode.classList.toggle('hidden'); }
                return contentNode;
            }
            const SecondaryBadgeCategory = (text, parent) => {
                const newNode = document.createElement('div');
                newNode.className = 'classify-badges-SBcategory';
                newNode.textContent = text;
                return parent.appendChild(newNode);
            }
            const BadgeList = (text, parent) => {
                const newNode = document.createElement('div');
                newNode.className = 'classify-badges-BLcategory';
                newNode.textContent = text;
                return parent.appendChild(newNode);
            }

            // unordered: object with unordered keys
            // ordering: a properly ordered object
            // returns: an object with the same keys as "unordered", with the keys holding the same relative order than in "ordering"
            const orderObject = (unordered, ordering) => {
                return Object.keys(unordered).sort(
                    (a,b) => (Object.keys(ordering).indexOf(a) < Object.keys(ordering).indexOf(b) ? -1 : 1)
                ).reduce(
                    (obj, key) => { obj[key] = unordered[key]; return obj },
                    {}
                );
            }

            const EM_SPACE = '\u2003'; // &emsp;
            if (classifiedBadges.Career) {
                const nodeL1 = MainBadgeCategory('Career:', badgesNode);
                Object.entries(orderObject(classifiedBadges.Career, Badges.Career)).forEach(e => {
                    const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                    const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/${badge6.includes(e[0]) ? '6':'5'}]`, nodeL1);
                    BadgeList(e[1].join(', '), nodeL2);
                });
            }
            if (classifiedBadges['Breath 5']) {
                const nodeL1 = MainBadgeCategory('Breath 5:', badgesNode);
                Object.entries(orderObject(classifiedBadges['Breath 5'], Badges['Breath 5'])).forEach(e => {
                    const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                    const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/2]`, nodeL1);
                    BadgeList(e[1].join(', '), nodeL2);
                });
            }
            if (classifiedBadges['Breath 4']) {
                const nodeL1 = MainBadgeCategory('Breath 4:', badgesNode);
                Object.entries(orderObject(classifiedBadges['Breath 4'], Badges['Breath 4'])).forEach(e => {
                    const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                    const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/2]`, nodeL1);
                    BadgeList(e[1].join(', '), nodeL2);
                });
            }
            if (classifiedBadges['Breath 3']) {
                const nodeL1 = MainBadgeCategory('Breath 3:', badgesNode);
                Object.entries(orderObject(classifiedBadges['Breath 3'], Badges['Breath 3'])).forEach(e => {
                    const badge6 = ['Damage Dealt', 'Damage Taken', 'HP Healed'];
                    const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/2]`, nodeL1);
                    BadgeList(e[1].join(', '), nodeL2);
                });
            }
            if (classifiedBadges.Exploration) {
                const nodeL1 = MainBadgeCategory('Exploration:', badgesNode);
                Object.entries(orderObject(classifiedBadges.Exploration, Badges.Exploration)).forEach(e => {
                    const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}]`, nodeL1);
                    BadgeList(e[1].join(', '), nodeL2);
                });
            }
            if (classifiedBadges['Monster Hunting']) {
                const nodeL1 = MainBadgeCategory('Monster Hunting:', badgesNode);
                Object.entries(orderObject(classifiedBadges['Monster Hunting'], Badges['Monster Hunting'])).forEach(e => {
                    const nodeL2 = SecondaryBadgeCategory(`${EM_SPACE}${e[0]} [${e[1].length}/3]`, nodeL1);
                    BadgeList(e[1].join(', '), nodeL2);
                });
            }
            if (classifiedBadges.Others) {
                const nodeL1 = MainBadgeCategory('Others:', badgesNode);
                BadgeList(classifiedBadges.Others.join(', '), nodeL1);
            }
        }

        const classify = (mod) => {
            const badgesTitle = [...document.querySelectorAll('div.panetitle')].find(div => div.textContent === 'Badges Earned:');
            if (!badgesTitle) {
                mod.debug('Could not find badges pane');
                return;
            }
            const oldBadgesNode = badgesTitle.nextSibling;
            const classifiedBadges = classifyBadges(oldBadgesNode.textContent);
            const newBadgesNode = document.createElement('div');
            oldBadgesNode.parentNode.replaceChild(newBadgesNode, oldBadgesNode);
            printClassifiedBadges(classifiedBadges, newBadgesNode);
        }

        await mod.registerMethod(
            'sync',
            classify
        );
    }
}
