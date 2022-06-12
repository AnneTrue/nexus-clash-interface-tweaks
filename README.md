# Nexus Clash Interface Tweaks
A userscript that tweaks the Nexus Clash user interface to be bearable
<div align="center">
  <a href="https://github.com/Argavyon/nexus-clash-interface-tweaks/issues">
    <img src="https://img.shields.io/github/issues/Argavyon/nexus-clash-interface-tweaks" />
  </a>
  <a href="https://github.com/Argavyon/nexus-clash-interface-tweaks/pulls">
    <img src="https://img.shields.io/github/issues-pr/Argavyon/nexus-clash-interface-tweaks" />
  </a>
</div>

# Usage
Install the userscript via GreaseMonkey or TamperMonkey.

Then navigate to "Nexus Tweaks" tab in the multifunction pane.

There are two types of modules: "local" for character-specific settings, and "global" for all characters (global modules are marked with \[G\]).

You can enable modules by clicking the checkbox beneath the character pad for the relevant module.

Each module may also have optional settings associated with it, which will be displayed alongside the enable/disable checkbox.


# Features

## Anne True's Nexus Tweaks
The original Nexus Tweaks.

### Character Interface
A local module that reworks the character list in the description section.

#### Thalanor's Visual Character Interface
Replaces the textual character list with a two-column table sorted by allegiance and health.
Shows a proportional health and magic bar when the appropriate skills are available.

Characters taking damage since the last refresh will show a corresponding health bar animation to quickly notice combat actions in the area.
Characters entering or reentering a location will be labeled with a "NEW" status tag to more easily notice them within a highly populated area.

### Classify Badges
A global module that classifies character badges into a hierarchy on the character info page. The major categories can be collapsed and expanded.
For career and breath achievement badges, it also displays progress.

### [G] Description Highlights
A global module that highlights building light status in the description, and displays how many items are available for pickup/target shooting.

### Inventory Tweaks
A local module that improves the inventory interface.

By default, the module adds a contextual use button to the inventory rows.
This button can be used to give an item, store an item in a footlocker, or store in a safe, depending on the selected option at the top of the inventory.

By default, the module also hides weightless items in the inventory and adds a toggle button to the top of the pane to show/hide them.

Items that can be manabitten will be displayed regardless of weight, as will worn clothing items.

### [G] Message Style
A global module that stilyzes the message log (both in-game and in the week log).

This massively improves readability of the game, but is not tested to be colour-blind friendly.

### [G] Safe Speech Buttons
A global module that prevents you from accidentally sending empty messages via bullhorn/speech.

It disables the Say/Bullhorn buttons if the associated input field is empty.

### Thin HP/MP Bars
A local module that reduces visual clutter for characters in the area and makes it easier to spot wounded characters.


## Argavyon's misc tweaks

### Class-specific Tweaks
A module that contains various class-specific tweaks.

#### Shepherd - Energize defaults to Max 
Energize's dropdown selects the maximum amount by default.

#### Archon - Word of Sorting
Sorts Archons' Word powers.

#### Lich - Pet Summon fix 
Fixes the UI for summoning lich pets. Should make the pet list more eye-friendly.

### Message Log Saver
Enables saving NC message log into a text file with a single press of a button.

You'll need to reload before seeing the dowload button."


## Argavyon's minor UI 
These tweaks won't change how you play, but will polish and bugfix the UI here and there.

### Collapsible Bloodhound Pane
Makes Bloodhound pane properly collapse.

### [G] Character Icon Selection
Enables selecting your character icon from a visual dropdown.

### [G] Collapse Released Characters
Collapse released characters on the character select page.

### Default Set-All Pet Stance
Allows the user to set the default stance for Set All pets, instead of defaulting to "Passive". Doesn't affect default summoning stance.

### [G] Improved Purchase Skills Page 
Fixes formatting of the Purchase Skills page.

### [G] Enter/Exit button on Map 
Adds an Enter/Exit button on the Map layout.

### [G] Message Pane Resize 
Enables custom resizing of the message pane.

### [G] Improved Purchase Skills Page 
Displays items' enchantments to mobile users (provided they can see them).

### [G] Display Spell Affinity 
Display Spell Affinity bonus for known spells in the character page. Currently only adds aura duration.


## Argavyon's major UI revamp
These are major changes to how the UI operates. From rearranging dropdowns, to changing how data is presented, and to creating new panes.

### Enhanced Alchemy Pane
A local module that adds the following buttons to each recipe in the alchemy pane, so that you don't need to select which potion you want to work with on the potion dropdown:
* Brew Potion: If the recipe is fully researched.
* Research Component: If the recipe isn't fully researched.
* Forget Recipe: If the recipe has at least one component researched.
* Transmute Component: If the recipe is fully researched and there's components missing from the inventory.

### Colored Status Effects 
Status effects display colored.

### Easy Use Pane 
Creates a left-side pane with trigger-able spellgems and consumables from inventory.

### Pet Display Improvement 
Sort pets by petmaster, and according to faction politics. Allows collapsing pet lists by default and manually.

### [G] How Hurt Am I? 
Changes background color based on missing HP.

### Inventory Sorter
Sort and Categorize Inventory Items. Filters and categories can be very finely adjusted on the Inventory Sorter tab.

### No Targeting Allies 
Allows disabling targeting based on politics stance on the attack selection box. Allows the same treatment for the healing box.

### Safe Spellgem Sorter 
Sort Spellgem display in the Faction Safe.


## Argavyon's Extra Flavor Tweaks
*Extra flair is never bad. Unless you activate the HELL module.*

### [G] HELL 
HELL

### Potato Stance 
Replaces the Passive pet stance by a functionally-equivalent Potato stance. It's pretty useless. Absolutely useless.

### [G] Stigya Ambiance 
Makes Stygia feel like Stygia by adding music and flair.

### Zalgo Speech 
Z A L G O   S P E E C H


# Contributing
### Guidelines
Feel free to send pull requests with fixes or new features, open Github issues, comment on the [NexusClash forum thread](https://www.nexusclash.com/viewtopic.php?f=8&t=2081) with ideas, contact Argavyon#1468 on discord, and more.

Expect pull requests to be code reviewed, or taken over and adapted to the codebase.

Refer to the checklist for release to understand current practices for committing code.

### Checklist for Release
* Script version bumped for nexus-tweaks.user.js

* Major release bumps e.g. 1.x.x -> 2.x.x for API (scaffolding.js) changes, minor release bumps for new modules/removed modules, point releases for fixes and tweaks within a module

* README.md updated to include feature details (if applicable)

* One standalone commit per feature/fix. Don't make changes that depend on prior commits when it can be avoided

* One pull request per feature/fix, please don't try to combine several different changes into one PR as it makes it more difficult to review

* Pull request against "main" branch

* Short summary on the first line of commit message (<50 characters)

* Commit message describes which module is affected

* Rebase and merge PRs, or squash and merge
