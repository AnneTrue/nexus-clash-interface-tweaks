# Nexus Clash Interface Tweaks
A userscript that tweaks the Nexus Clash user interface to be bearable

# Usage
Install the userscript via GreaseMonkey or TamperMonkey.

Then navigate to your character's "Pad" tab in the multifunction pane.

There are two types of modules: "local" for character-specific settings, and "global" for all characters (for instance, Global Message History).

You can enable modules by clicking the checkbox beneath the character pad for the relevant module.

Each module may also have optional settings associated with it, which will be displayed alongside the enable/disable checkbox.


# Features
## Global Message History
A global module that stylises the message log (both in-game and in the week log).

This massively improves readability of the game, but is not tested to be colour-blind friendly.

## Global Safe Speech Buttons
A global module that prevents you from accidentally sending empty messages via bullhorn/speech.

It disables the Say/Bullhorn buttons if the associated input field is empty.

## Inventory Tweaks
A local module that improves the inventory interface.

By default, it hides weightless items in the inventory and adds a toggle button to the top of the pane to show/hide them.

Items that can be manabitten will be displayed regardless of weight, as will worn clothing items.

## Thin HP/MP Bars
A local module that reduces visual clutter for characters in the area and makes it easier to spot wounded characters.

If a character is at full health (or full magic with Sense Magic), then their resource bar is thinner.

# Contributing
## Guidelines
Feel free to send pull requests with fixes or new features, open Github issues, comment on the Nexus forum thread with ideas, contact AnneTrue on discord, and more.

Expect pull requests to be code reviewed or taken over and adapated to the codebase.

## Checklist for Release
* Script version bumped (and in sync) between both scaffolding.user.js and nexus-tweaks.user.js
* Major release bumps e.g. 1.x.x -> 2.x.x for scaffolding changes, minor release bumps for new modules/removed modules, point releases for fixes and tweaks within a module
* README.md updated to include feature details (if applicable)
* One standalone commit per feature/fix
