const messageStyle = {
    module: async () => {
        const mod = await nexusTweaks.registerModule(
            'messagestyle',
            'Colour Message History',
            'global',
            'Adds styling to the message history to improve ease of reading. Includes combat actions, searches, speech, and more. Runs in both in-game and the character profile\'s week log',
        );

        const pfx = '^[ ]?- (?:\\(\\d+ times\\) )?'; // message prefix
        const globalMatches = [
            { // Fix the a(n) text based on vowels
                msg: /( a)(\((n)\)( [AEIOUaeiou])|\(n\)( [^AEIOUaeiou]))/g,
                op:'replace', val:'$1$3$4$5'
            },
            { // Underline weapon damaged message
                msg: /(Your weapon was damaged during the attack\. It is now less effective!)/,
                op:'replace', val:'<b><u>$1</u></b>'
            },
            { // Replace '' with ' due to a bug in the game
                msg: /(\'\')/g, op:'replace', val:"'"
            },
        ]
        const messageMatches = [
            {
                msg: new RegExp(`${pfx}You attack .*? with your .*? and hit for .*? damage\\.`),
                op:'pad', val:'libAttackHit'
            },
            {
                msg: new RegExp(`${pfx}You attack the (door|ward|fortifications) with `),
                op:'pad', val:'libFort'
            },
            {
                msg: new RegExp(`${pfx}You attack the barricades to the (North|East|South|West) with`),
                op:'pad', val:'libFort'
            },
            {
                msg: new RegExp(`${pfx}You attack .*? with your .*? and miss\\.`),
                op:'pad', val:'libAttackMiss'
            },
            {
                msg:/You summon (dark forces and attempt to steal.+? You meet with success and drain|the Curse of Blood and touch .+?, inflicting the curse|your inner hatred to inflict the Agony Curse and touch .+?, inflicting the curse)/,
                op:'pad', val:'libAttackHit'
            },
            {
                msg: new RegExp(`${pfx}.*? attacked you with `),
                op:'pad', val:'libAttacked'
            },
            {
                msg:/( Your action causes you to| You| you|The Agony Curse causes you to) take( an additional)? \d+ (point(s)? of( \b[a-z]+\b)? damage|damage)(\.|!)?/,
                op:'pad', val:'libAttackedbyEnvironment'
            },
            {
                msg:/Your pet, .*? has been rejuvenated.\s*You spent \d+ Magic Point/,
                op:'pad', val:'libPetRejuv'
            },
            {
                msg:/ belonging to .*?, (healed you|has funneled life energy)/,
                op:'pad', val:'libPetHealMe'
            },
            {
                msg:/ belonging to .*?, healed .*? for \d+ hit point/,
                op:'pad', val:'libPetHealOthers'
            },
            {
                msg:/Your pet .+? attacked .+? and hit for /,
                op:'pad', val:'libPetHit'
            },
            {
                msg:/<font.*>(((Shambling|Infectious|Rotting) Zombie|.*, belonging to .*,) attacked you and hit for.*)<\/font>/,
                op:'pad&replace', val:['libPetHitMe', '$1']
            },
            {
                msg:/<font.*>(Reforged .* attacked you and hit for.*)<\/font>/,
                op:'pad&replace', val:['libPetHitMe', '$1']
            },
            {
                msg:/(Your pet |[^,].*, belonging to).*, killing them!/,
                op:'pad', val:'libPetKill'
            },
            {
                msg:/(Your pet |[^,].*, belonging to|(Shambling|Infectious|Rotting) Zombie).* and missed/,
                op:'pad', val:'libPetMiss'
            },
            {msg:/attacked your pet,.*?and hit for /, op:'pad', val:'libPetHit'},
            {msg:/attacked your pet,.* killing it!.*/, op:'pad', val:'libPetKill'},
            {msg:/attacked .*? killing it!/, op:'pad', val:'libPetKill'},
            {msg:/attacked your pet.*? and missed/, op:'pad', val:'libPetMiss'},
            {
                msg:/, belonging to .*?, was killed by a defensive aura projected by /,
                op:'pad', val:'libPetKill'
            },
            {
                msg:/(Your pet .*?|.*?, belonging to .*?,|.*?, a .*?) has despawned/,
                op:'pad', val:'libPetDespawn'
            },
            {
                msg:/(.+?)<font color="#DD0000">(<b>.*<\/b>)<\/font>(.+)/,
                op:'replace',
                val:'<div class="libAchievement">$1<span class="libAchievementColour">$2</span>$3</div>'
            },
            {
                msg:/attacked .+? with .+?, killing (him|her|them)/,
                op:'pad', val:'libKill'
            },
            {msg:new RegExp(`${pfx}<a .+?</a> gave you a`), op:'pad', val:'libReceiveItem'},
            {msg:new RegExp(`${pfx}You give your `), op:'pad', val:'libGave'},
            {msg:/You call upon your crafting skills.*/, op:'pad', val:'libCraft'},
            {msg:/You search and find nothing.*/, op:'pad', val:'libSearchNothing'},
            {msg:/You search and find a.*/, op:'pad', val:'libSearchSuccess'},
            {msg:/You step (inside |outside of )/, op:'pad', val:'libGave'},
            {
                msg:/(You heal yourself and|healed you. You) gain \d+ hit point(s)?.*/,
                op:'pad', val:'libHealed'
            },
            {
                msg:/(heal|healed) you for \d+ point(s)? of damage.*/,
                op:'pad', val:'libHealed'
            },
            {
                msg:/(You heal|You use the .*? to heal|your surgeon skills to tend to .*?|place a stygian bone leech) .*? for \d+ point(s)? of damage/,
                op:'pad', val:'libHealed'
            },
            {msg:/You feel the effects of .+? fade\./, op:'pad', val:'libFaded'},
            {
                msg: new RegExp(`${pfx}<a [^<>]+?>[^<>]+</a> summoned a`),
                op:'pad', val:'libSummon'
            },
            {
                msg:/(suddenly appeared out of thin air\.|disappeared from view\.)/,
                op:'pad', val:'libSummon'
            },
            {
                msg:/spoke words of mystic power and traced eldritch shapes into the air. A burst of warmth rushed through the area as they finished the incantation/,
                op:'pad', val:'libSummon'
            },
            {
                msg: new RegExp(`(${pfx}You (?:say|whisper|emote), )(".+)`),
                op: 'replace',
                val:'<div class="libSpeech"><span class="libEmote">$1</span>$2</div>'
            },
            {
                msg: new RegExp(`${pfx}((Someone used a|You use your) bullhorn to say: ')`),
                op:'pad', val:'libEmote'
            },
            { // broad catch-all emote
                msg: new RegExp(`(${pfx}<a [^<>]+>[^<>]+</a> [^<>]+?)(".+")(.+)`),
                op: 'replace',
                val:'<div class="libSpeech"><span class="libEmote">$1</span>$2<span class="libEmote">$3</span></div>'
            },
        ];

        const singleMatcher = (message, mmObj) => {
            if (!message.match(mmObj.msg)) { return null; }
            if (mmObj.op === 'pad') {
                return `<div class="${mmObj.val}">${message}</div>`;
            } else if (mmObj.op === 'replace') {
                return message.replace(mmObj.msg, mmObj.val);
            } else if (mmObj.op === 'pad&replace') {
                return `<div class="${mmObj.val[0]}">${message.replace(mmObj.msg, mmObj.val[1])}</div>`;
            } else {
                mod.error(`Unrecognised message matcher object operation '${mmObj.op}'`);
            }
            return null;
        }

        const singleMessage = async (message) => {
            let finalStr = message;
            let found = false;
            for (const mmObj of messageMatches) {
                const matcherResult = singleMatcher(finalStr, mmObj);
                if (matcherResult) {
                    finalStr = matcherResult;
                    found = true;
                    break;
                }
            }
            if (!found) {
                // Make sure we always return a new div
                finalStr = `<div class="libUnknown">${finalStr}</div>`;
            }
            for (const mmObj of globalMatches) {
                const matcherResult = singleMatcher(finalStr, mmObj);
                if (matcherResult) {
                    finalStr = matcherResult;
                }
            }
            return finalStr;
        }

        const timesCharExist = (x, c) => (x.match(new RegExp(c,'g')) || []).length;
        const messagehistory = async (mod) => {
            const messageElement = document.getElementById('Messages');
            if (!messageElement) { return; }
            const histSib = messageElement.previousElementSibling;
            if (histSib && !histSib.innerHTML.match(/This Week/)) {
                // resize message history box
                if (timesCharExist(messageElement.innerHTML, '<br>') > 10) {
                    messageElement.style.height = '250px';
                }
                messageElement.style.resize = 'vertical';
                messageElement.style.overflow = 'auto';
            }
            const messages = messageElement.innerHTML.split('\n').join('').split('<br>');
            const msgPromises = messages.map(singleMessage);
            await Promise.all(msgPromises);
            const finalMessages = [];
            for (const msgPromise of msgPromises) {
                finalMessages.push(await msgPromise);
            }
            messageElement.innerHTML = finalMessages.join('');
        }

        await mod.registerMethod(
            'async',
            messagehistory
        );
    }
}
