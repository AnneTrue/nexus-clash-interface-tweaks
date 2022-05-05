// ==UserScript==
// @name        Argavyon's NC Forum Tweaks
// @version     0.alpha.0
// @description Tweaks for Nexus Clash's Forum
// @namespace   https://github.com/Argavyon/
// @author      Argavyon
// @match       *://www.nexusclash.com/index.php*
// @match       *://www.nexusclash.com/viewforum.php*
// @match       *://www.nexusclash.com/viewtopic.php*
// @match       *://www.nexusclash.com/posting.php*
// @match       *://nexusclash.com/index.php*
// @match       *://nexusclash.com/viewforum.php*
// @match       *://nexusclash.com/viewtopic.php*
// @match       *://nexusclash.com/posting.php*
// @icon         https://nexusclash.com/favicon.ico
// ==/UserScript==

'use strict';

function main() {
    if (!document.querySelector('span.crumb[data-forum-id="14"]')) {
        console.log('Wrong subforum.');
        return;
    }
    if (window.location.pathname !== '/posting.php') {
        console.log('Not on posting mode.');
        return;
    }
    if (!document.querySelector('#poll-panel')) {
        console.log('No poll panel available.');
        return;
    }

    document.querySelector('#poll_title').value = 'Do you like this feature/change?';
    document.querySelector('#poll_option_text').textContent = 'Yes (as is)\nYes (with significant change)\nNo';
    document.querySelector('#poll_vote_change').checked = true;
}

main();