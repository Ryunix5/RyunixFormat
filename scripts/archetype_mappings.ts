// Mapping from current catalog names to correct YGOPRODECK API archetype names
export const ARCHETYPE_NAME_MAPPING: Record<string, string> = {
  // Main mismatches
  "Albaz": "Branded",
  "Amazemment": "Amazement",
  "Battlin Boxer": "Battlin' Boxer",
  "Brotherhood of the Fire Fist": "Fire Fist",
  "Edlich": "Eldlich",
  "Evil Twin / Live Twin": "Evil★Twin",
  "Evilswarm": "lswarm",
  "Evoltile": "Evoltile",
  "Exosister": "Exosister",
  "Eyes Restrict": "Eyes Restrict",
  "Fiendsmith": "Fiendsmith",
  "Floowandereeze": "Floowandereeze",
  "Gem-": "Gem-",
  "Ghoti": "Ghoti",
  "Gold Pride": "Gold Pride",
  "Gunkan": "Gunkan Suship",
  "Kewl Tune": "Kewl Tune",
  "Lswarm": "lswarm",
  "Maliss": "Maliss",
  "Mitsurugi": "Mitsurugi",
  "P.U.N.K.": "P.U.N.K.",
  "Purrely": "Purrely",
  "Ryzeal": "Ryzeal",
  "Sangen": "Sangen",
  "Snake-Eye": "Snake-Eye",
  "Spright": "Spright",
  "Starry Knight": "Starry Knight",
  "Tenpai": "Tenpai Dragon",
  "Yummy": "Yummy",
  
  // Additional corrections from population results
  "Gravekeeper": "Gravekeeper's",
  "Infernoble": "Infernoble Knight",
  "Ignister": "@Ignister",
  "Springan": "Springans",
  "PSY-Framegear": "PSY-Frame",
  "Phantom Knights": "Phantom Knights",
  "Visas Starfrost": "Visas",
  
  // Final round of corrections
  "Familiar-Possessed": "Charmer",
  "Fossil Fusion": "Fossil",
  "Gem-Knight": "Gem-",
  "Gunkan Suship": "Gunkan",
  "Heraldic Beast": "Heraldic",
  "The Phantom Knights": "Phantom Knights",
  "Trains": "Train",
  "Celtic Guardian": "Celtic Guard",
  
  // Duplicates to remove (keep the simpler name)
  "Blue-Eyes White Dragon": "Blue-Eyes",
  "Red-Eyes Black Dragon": "Red-Eyes",
  "Gaia The Fierce Knight": "Gaia The Fierce Knight",
  "Celtic Guard": "Celtic Guardian",
  
  // Other corrections
  "Agent": "The Agent",
  "Weather": "The Weather",
  "Legendary Fisherman": "The Legendary Fisherman",
  "Railway / Trains": "Train",
  "ZW -": "ZW",
  "Gun Dragons - Barrel Dragon": "Barrel Dragon",
  "Gradius - Spaceships": "Gradius",
  "X-Y-Z Union": "XYZ",
  "Dinossaur": "Dinosaur",
  "Twilightsworn": "Lightsworn",
};

// Archetypes to remove (duplicates, non-archetypes, or card types)
export const ARCHETYPES_TO_REMOVE = [
  // Duplicates
  "Blue-Eyes White Dragon",
  "Red-Eyes Black Dragon",
  "Black Rose Dragon",
  "Black Luster",
  "Buster Blader",
  "Flame Swordsman",
  "Summoned Skull",
  "Pot of Greed",
  "Gun Dragons - Barrel Dragon",
  "Gradius - Spaceships",
  "X-Y-Z Union",
  "Dinossaur",
  
  // Generic card types (not archetypes)
  "Spellcaster",
  "Psychic",
  "Zombie",
  "Ritual",
  "Spirit",
  "Gemini",
  "Fire Warrior",
  
  // Single cards (not archetypes)
  "Mystical Space Typhoon",
  "Dark Necrofear",
  "Destiny Board",
  "Clear World",
  "Masked Beast",
  "King's Sarcophagus",
  
  // Non-existent or merged archetypes
  "K.C.C.",
  "Lightray",
  "True King",
  "Xtra HERO",
  "Attribute Knight",
  "Inca",
  "Crashbug",
  "Bolt Star",
  "Max Metalmorph",
  "Fossil Warrior",
  "White Aura",
  "Electromagnet Warrior",
  "Legendary Planet",
  "Twilight Ninja",
  "Steel Cavalry",
  "Elder Entity",
  "Clear Wing Dragon",
  "Dragoons of Draconia",
  "Hand",
  "Legendary Dragon",
  "Baboons",
  "Reactor",
  "Majestic Mech",
  "Chthonian",
  "Guardians",
];

// Non-archetype card packages (series/staples)
export const STAPLE_PACKAGES = [
  {
    name: "Mirror Force",
    searchTerm: "Mirror Force",
    description: "Mirror Force trap card series"
  },
  {
    name: "Solemn",
    searchTerm: "Solemn",
    description: "Solemn counter trap series"
  },
  {
    name: "Egyptian Gods",
    searchTerm: "Egyptian God",
    description: "The three Egyptian God cards"
  },
  {
    name: "Wicked Gods",
    searchTerm: "Wicked",
    description: "The three Wicked God cards"
  },
  {
    name: "Forbidden One",
    searchTerm: "Forbidden One",
    description: "Exodia pieces"
  },
  {
    name: "Counter Fairies",
    searchTerm: "counter trap fairy",
    description: "Counter trap fairy monsters"
  },
  {
    name: "Illusion Monsters",
    searchTerm: "Illusion",
    description: "Illusion-type monsters without archetype"
  },
  {
    name: "Face Cards",
    searchTerm: "King's Knight|Queen's Knight|Jack's Knight",
    description: "Face card knight series"
  },
];
