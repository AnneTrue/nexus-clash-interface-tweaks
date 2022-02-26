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

## Global Description Highlights
A global module that highlights building light status in the description, and displays how many items are available for pickup/target shooting.

## Inventory Tweaks
A local module that improves the inventory interface.

By default, the module adds a contextual use button to the inventory rows.
This button can be used to give an item, store an item in a footlocker, or store in a safe, depending on the selected option at the top of the inventory.

By default, the module also hides weightless items in the inventory and adds a toggle button to the top of the pane to show/hide them.

Items that can be manabitten will be displayed regardless of weight, as will worn clothing items.

## Thin HP/MP Bars
A local module that reduces visual clutter for characters in the area and makes it easier to spot wounded characters.

If a character is at full health (or full magic with Sense Magic), then their resource bar is thinner.

## Character List Tweaks
A local module that reworks the character list section.

### Thalanor's Visual Character List
Replaces the textual character list with a two-column table sorted by allegiance and health.
Shows a proportional health and magic bar when the appropriate skills are available.

Characters taking damage since the last refresh will show a corresponding health bar animation to quickly notice combat actions in the area.
Characters entering or reentering a location will be labeled with a "NEW" status tag to more easily notice them within a highly populated area.

## Badge Classifier
A global module that classifies character badges into a hierarchy on the character info page. The major categories can be collapsed and expanded.
For career and breath achievement badges, it also displays progress.

## Improved Purchase Skills Page
A global module that slightly improves the Buy Skills page.

# Contributing
## Guidelines
Feel free to send pull requests with fixes or new features, open Github issues, comment on the [NexusClash forum thread](https://www.nexusclash.com/viewtopic.php?f=8&t=65) with ideas, contact AnneTrue on discord, and more.

Expect pull requests to be code reviewed, or taken over and adapted to the codebase.

Refer to the checklist for release to understand current practices for committing code.

## Checklist for Release
* Script version bumped (and in sync) between both scaffolding.user.js and nexus-tweaks.user.js

* Major release bumps e.g. 1.x.x -> 2.x.x for scaffolding changes, minor release bumps for new modules/removed modules, point releases for fixes and tweaks within a module

* README.md updated to include feature details (if applicable)

* One standalone commit per feature/fix. Don't make changes that depend on prior commits when it can be avoided

* One pull request per feature/fix, please don't try to combine several different changes into one PR as it makes it more difficult to review

* Pull request against "main" branch

* Short summary on the first line of commit message (<50 characters)

* Commit message describes which module is affected

* Rebase and merge PRs, or squash and merge
