export type MetaRating = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';

export interface CatalogItem {
  name: string;
  rating: MetaRating;
  price: number;
  imageUrl?: string;
}

// Image URLs using YGOPRODECK card images API
// For archetypes, we use a representative monster from that archetype
// For staples, we use the actual card image
const CARD_IMAGE_BASE = "https://images.ygoprodeck.com/images/cards_small";

// Helper to create image URL from card ID
export function getCardImageUrl(cardId: number): string {
  return `${CARD_IMAGE_BASE}/${cardId}.jpg`;
}

export const META_RATING_PRICES: Record<MetaRating, number> = {
  'F': 0,
  'D': 10,
  'C': 25,
  'B': 50,
  'A': 100,
  'S': 200,
  'S+': 400,
};

export function getPriceFromRating(rating: MetaRating): number {
  return META_RATING_PRICES[rating];
}

// Archetype Decks with Meta Ratings
// Card IDs are from YGOPRODECK database - representative monsters for each archetype
export const ARCHETYPE_DECKS: CatalogItem[] = [
  { name: "Branded", rating: "S", price: 200, imageUrl: getCardImageUrl(68468459) }, // Fallen of Albaz
  { name: "Abyss Actor", rating: "C", price: 25, imageUrl: getCardImageUrl(19474136) }, // Abyss Actor - Superstar
  { name: "Adamancipator", rating: "B", price: 50, imageUrl: getCardImageUrl(11302671) }, // Adamancipator Risen - Dragite
  { name: "Adventurer Token", rating: "A", price: 100, imageUrl: getCardImageUrl(57304293) }, // Wandering Gryphon Rider
  { name: "Aesir", rating: "D", price: 10, imageUrl: getCardImageUrl(63767246) }, // Odin, Father of the Aesir
  { name: "The Agent", rating: "B", price: 50, imageUrl: getCardImageUrl(91188343) }, // The Agent of Creation - Venus
  { name: "Alien", rating: "D", price: 10, imageUrl: getCardImageUrl(652362) }, // Alien Soldier M/Frame
  { name: "Ally of Justice", rating: "F", price: 0, imageUrl: getCardImageUrl(26593852) }, // Ally of Justice Decisive Armor
  { name: "Altergeist", rating: "A", price: 100, imageUrl: getCardImageUrl(1984618) }, // Altergeist Multifaker
  { name: "Amazement", rating: "C", price: 25, imageUrl: getCardImageUrl(94821366) }, // Amazement Administrator Arlekino
  { name: "Amazoness", rating: "D", price: 10, imageUrl: getCardImageUrl(67987611) }, // Amazoness Queen
  { name: "Amorphage", rating: "D", price: 10, imageUrl: getCardImageUrl(33300669) }, // Amorphage Sloth
  { name: "Ancient Gear", rating: "C", price: 25, imageUrl: getCardImageUrl(10509340) }, // Ancient Gear Golem
  { name: "Ancient Warriors", rating: "B", price: 50, imageUrl: getCardImageUrl(33545259) }, // Ancient Warriors - Loyal Guan Yun
  { name: "Appliancer", rating: "F", price: 0, imageUrl: getCardImageUrl(5846183) }, // Appliancer Electrilyrical World
  { name: "Aquaactress", rating: "F", price: 0, imageUrl: getCardImageUrl(92053608) }, // Aquaactress Guppy
  { name: "Arcana Force", rating: "F", price: 0, imageUrl: getCardImageUrl(6150044) }, // Arcana Force XXI - The World
  { name: "Archfiend", rating: "D", price: 10, imageUrl: getCardImageUrl(58551308) }, // Summoned Skull
  { name: "Armed Dragon", rating: "C", price: 25, imageUrl: getCardImageUrl(59464593) }, // Armed Dragon LV10
  { name: "Aroma", rating: "C", price: 25, imageUrl: getCardImageUrl(92266279) }, // Aromage Jasmine
  { name: "Artifact", rating: "B", price: 50, imageUrl: getCardImageUrl(53639887) }, // Artifact Scythe
  { name: "Artmage", rating: "C", price: 25, imageUrl: getCardImageUrl(27184601) }, // Artmage Diactorus
  { name: "Ashened", rating: "B", price: 50, imageUrl: getCardImageUrl(59019082) }, // Ashened for Eternity
  { name: "Assault Mode", rating: "D", price: 10, imageUrl: getCardImageUrl(61257789) }, // Stardust Dragon/Assault Mode
  { name: "Atlantean", rating: "A", price: 100, imageUrl: getCardImageUrl(29802344) }, // Atlantean Dragoons
  { name: "Batteryman", rating: "D", price: 10, imageUrl: getCardImageUrl(52584282) }, // Batteryman AA
  { name: "Battlewasp", rating: "D", price: 10, imageUrl: getCardImageUrl(94380860) }, // Battlewasp - Hama the Conquering Bow
  { name: "Battlin' Boxer", rating: "C", price: 25, imageUrl: getCardImageUrl(86325573) }, // Number 105: Battlin' Boxer Star Cestus
  { name: "Beetrooper", rating: "B", price: 50, imageUrl: getCardImageUrl(2834264) }, // Giant Beetrooper Invincible Atlas
  { name: "Blackwing", rating: "A", price: 100, imageUrl: getCardImageUrl(14785765) }, // Blackwing - Simoon the Poison Wind
  { name: "Blue-Eyes", rating: "C", price: 25, imageUrl: getCardImageUrl(89631139) }, // Blue-Eyes White Dragon
  { name: "Bounzer", rating: "D", price: 10, imageUrl: getCardImageUrl(70194827) }, // Number 61: Volcasaurus
  { name: "Bujin", rating: "D", price: 10, imageUrl: getCardImageUrl(37742478) }, // Bujinki Ahashima
  { name: "Burning Abyss", rating: "B", price: 50, imageUrl: getCardImageUrl(15341821) }, // Dante, Traveler of the Burning Abyss
  { name: "Butterspy", rating: "F", price: 0, imageUrl: getCardImageUrl(54582424) }, // Morpho Butterspy
  { name: "Bystial", rating: "S", price: 200, imageUrl: getCardImageUrl(92107604) }, // Bystial Druiswurm
  { name: "Centur-Ion", rating: "S", price: 200, imageUrl: getCardImageUrl(62325062) }, // Centur-Ion Primera
  { name: "Charmer", rating: "C", price: 25, imageUrl: getCardImageUrl(81983656) }, // Hiita the Fire Charmer, Ablaze
  { name: "Chaos", rating: "B", price: 50, imageUrl: getCardImageUrl(72426662) }, // Black Luster Soldier - Envoy of the Beginning
  { name: "Chemicritter", rating: "F", price: 0, imageUrl: getCardImageUrl(81599449) }, // Chemicritter Carbo Crab
  { name: "Chronomaly", rating: "D", price: 10, imageUrl: getCardImageUrl(63125616) }, // Number 33: Chronomaly Machu Mech
  { name: "Chrysalis", rating: "F", price: 0, imageUrl: getCardImageUrl(17363041) }, // Chrysalis Dolphin
  { name: "Cipher", rating: "D", price: 10, imageUrl: getCardImageUrl(29092121) }, // Galaxy-Eyes Cipher Dragon
  { name: "Cloudian", rating: "F", price: 0, imageUrl: getCardImageUrl(17810268) }, // Cloudian - Nimbusman
  { name: "Code Talker", rating: "A", price: 100, imageUrl: getCardImageUrl(1861629) }, // Accesscode Talker
  { name: "Constellar", rating: "C", price: 25, imageUrl: getCardImageUrl(43513897) }, // Constellar Pleiades
  { name: "Crusadia", rating: "B", price: 50, imageUrl: getCardImageUrl(91646304) }, // Crusadia Equimax
  { name: "Crystal Beast", rating: "B", price: 50, imageUrl: getCardImageUrl(18847598) }, // Rainbow Dragon
  { name: "Crystron", rating: "A", price: 100, imageUrl: getCardImageUrl(50588353) }, // Crystron Halqifibrax
  { name: "Cubic", rating: "D", price: 10, imageUrl: getCardImageUrl(30270176) }, // Crimson Nova the Dark Cubic Lord
  { name: "Cyber", rating: "B", price: 50, imageUrl: getCardImageUrl(70095154) }, // Cyber Dragon Infinity
  { name: "Cyberdark", rating: "C", price: 25, imageUrl: getCardImageUrl(45078193) }, // Cyberdark End Dragon
  { name: "Cyber Dragon", rating: "B", price: 50, imageUrl: getCardImageUrl(70095154) }, // Cyber Dragon Infinity
  { name: "D.D.", rating: "D", price: 10, imageUrl: getCardImageUrl(15939229) }, // D.D. Warrior Lady
  { name: "D/D", rating: "B", price: 50, imageUrl: getCardImageUrl(36614113) }, // D/D/D Flame King Genghis
  { name: "Danger!", rating: "B", price: 50, imageUrl: getCardImageUrl(43316238) }, // Danger!? Jackalope?
  { name: "Darklord", rating: "C", price: 25, imageUrl: getCardImageUrl(87112784) }, // Darklord Ixchel
  { name: "Dark Magician", rating: "C", price: 25, imageUrl: getCardImageUrl(46986414) }, // Dark Magician
  { name: "Dark Scorpion", rating: "F", price: 0, imageUrl: getCardImageUrl(61587183) }, // Don Zaloog
  { name: "Dark World", rating: "A", price: 100, imageUrl: getCardImageUrl(33731070) }, // Grapha, Dragon Lord of Dark World
  { name: "Deep Sea", rating: "B", price: 50, imageUrl: getCardImageUrl(43096270) }, // Deep Sea Diva
  { name: "Deskbot", rating: "D", price: 10, imageUrl: getCardImageUrl(94693857) }, // Deskbot 003
  { name: "Despia", rating: "S", price: 200, imageUrl: getCardImageUrl(33909817) }, // Despian Quaeritis
  { name: "Destiny Hero", rating: "A", price: 100, imageUrl: getCardImageUrl(60461804) }, // Destiny HERO - Destroyer Phoenix Enforcer
  { name: "Digital Bug", rating: "F", price: 0, imageUrl: getCardImageUrl(68950538) }, // Digital Bug Corebage
  { name: "Dinomist", rating: "D", price: 10, imageUrl: getCardImageUrl(32134638) }, // Dinomist Rex
  { name: "Dinomorphia", rating: "A", price: 100, imageUrl: getCardImageUrl(92798873) }, // Dinomorphia Therizia
  { name: "Dinowrestler", rating: "F", price: 0, imageUrl: getCardImageUrl(93507434) }, // Dinowrestler Pankratops
  { name: "Dododo", rating: "D", price: 10, imageUrl: getCardImageUrl(70946699) }, // Dododo Warrior
  { name: "Dogmatika", rating: "A", price: 100, imageUrl: getCardImageUrl(95679145) }, // Dogmatika Ecclesia, the Virtuous
  { name: "Doodle Beast", rating: "F", price: 0, imageUrl: getCardImageUrl(31230289) }, // Doodle Beast - Stego
  { name: "DoomZ", rating: "C", price: 25, imageUrl: getCardImageUrl(95626382) }, // DoomZ XII End - Drastrius
  { name: "Dracoslayer", rating: "A", price: 100, imageUrl: getCardImageUrl(65711558) }, // Luster Pendulum, the Dracoslayer
  { name: "Dracotail", rating: "S", price: 200, imageUrl: getCardImageUrl(33760966) }, // Dracotail Arthalion
  { name: "Dragon Ruler", rating: "A", price: 100, imageUrl: getCardImageUrl(69610924) }, // Blaster, Dragon Ruler of Infernos
  { name: "Dragonmaid", rating: "A", price: 100, imageUrl: getCardImageUrl(32600024) }, // Dragonmaid Sheou
  { name: "Dragunity", rating: "B", price: 50, imageUrl: getCardImageUrl(36870345) }, // Dragunity Knight - Gae Dearg
  { name: "Dream Mirror", rating: "D", price: 10, imageUrl: getCardImageUrl(37444964) }, // Dream Mirror of Joy
  { name: "Drytron", rating: "A", price: 100, imageUrl: getCardImageUrl(22398665) }, // Drytron Mu Beta Fafnir
  { name: "Dual Avatar", rating: "D", price: 10, imageUrl: getCardImageUrl(33026283) }, // Dual Avatar - Empowered Kon-Gyo
  { name: "Duston", rating: "F", price: 0, imageUrl: getCardImageUrl(40217358) }, // House Duston
  { name: "Earthbound", rating: "D", price: 10, imageUrl: getCardImageUrl(91712985) }, // Earthbound Immortal Ccapac Apu
  { name: "Edge Imp", rating: "C", price: 25, imageUrl: getCardImageUrl(61173621) }, // Edge Imp Sabres
  { name: "Eldlich", rating: "A", price: 100, imageUrl: getCardImageUrl(2530830) }, // Eldlich the Golden Lord
  { name: "Elemental Hero", rating: "B", price: 50, imageUrl: getCardImageUrl(35809262) }, // Elemental HERO Neos
  { name: "Elementsaber", rating: "D", price: 10, imageUrl: getCardImageUrl(83032858) }, // Elementsaber Molehu
  { name: "Empowered Warrior", rating: "F", price: 0, imageUrl: getCardImageUrl(29687169) }, // Empowered Warrior - Arnis
  { name: "Endymion", rating: "A", price: 100, imageUrl: getCardImageUrl(40732515) }, // Endymion, the Mighty Master of Magic
  { name: "Enneacraft", rating: "A", price: 100, imageUrl: getCardImageUrl(54842941) }, // Enneacraft - Atori.MAR
  { name: "Evil Eye", rating: "B", price: 50, imageUrl: getCardImageUrl(81344637) }, // Serziel, Watcher of the Evil Eye
  { name: "Evil Hero", rating: "B", price: 50, imageUrl: getCardImageUrl(13650422) }, // Evil HERO Malicious Bane
  { name: "Live☆Twin", rating: "A", price: 100, imageUrl: getCardImageUrl(79965360) }, // Evil★Twin Ki-sikil
  { name: "lswarm", rating: "D", price: 10, imageUrl: getCardImageUrl(42679662) }, // Evilswarm Ophion
  { name: "Evoltile", rating: "F", price: 0, imageUrl: getCardImageUrl(14391920) }, // Evolzar Dolkka
  { name: "Exosister", rating: "A", price: 100, imageUrl: getCardImageUrl(4408198) }, // Exosister Elis
  { name: "Eyes Restrict", rating: "C", price: 25, imageUrl: getCardImageUrl(41578483) }, // Millennium-Eyes Restrict
  { name: "Fabled", rating: "D", price: 10, imageUrl: getCardImageUrl(99188141) }, // The Fabled Unicore
  { name: "Face Cards", rating: "D", price: 10, imageUrl: getCardImageUrl(14816857) }, // King's Knight
  { name: "F.A.", rating: "C", price: 25, imageUrl: getCardImageUrl(23950192) }, // F.A. Motorhome Transport
  { name: "Fairy Tail", rating: "C", price: 25, imageUrl: getCardImageUrl(86937530) }, // Fairy Tail - Snow
  { name: "Charmer", rating: "C", price: 25, imageUrl: getCardImageUrl(31887905) }, // Familiar-Possessed - Hiita
  { name: "Fiendsmith", rating: "S", price: 200, imageUrl: getCardImageUrl(2463794) }, // Fiendsmith's Requiem
  { name: "Fire Fist", rating: "B", price: 50, imageUrl: getCardImageUrl(6353603) }, // Brotherhood of the Fire Fist - Tiger King
  { name: "Fire King", rating: "S", price: 200, imageUrl: getCardImageUrl(59388357) }, // Fire King High Avatar Garunix
  { name: "Flamvell", rating: "F", price: 0, imageUrl: getCardImageUrl(26304459) }, // Flamvell Firedog
  { name: "Fleur", rating: "B", price: 50, imageUrl: getCardImageUrl(84815190) }, // Sorciere de Fleur
  { name: "Floowandereeze", rating: "A", price: 100, imageUrl: getCardImageUrl(54334420) }, // Floowandereeze & Robina
  { name: "Flower Cardian", rating: "F", price: 0, imageUrl: getCardImageUrl(3966653) }, // Flower Cardian Lightshower
  { name: "Fluffal", rating: "B", price: 50, imageUrl: getCardImageUrl(18144507) }, // Fluffal Bear
  { name: "Forbidden One (Exodia)", rating: "D", price: 10, imageUrl: getCardImageUrl(33396948) }, // Exodia the Forbidden One
  { name: "Fortune Fairy", rating: "D", price: 10, imageUrl: getCardImageUrl(31683874) }, // Fortune Fairy Ann
  { name: "Fortune Lady", rating: "C", price: 25, imageUrl: getCardImageUrl(27895597) }, // Fortune Lady Every
  { name: "Fossil", rating: "C", price: 25, imageUrl: getCardImageUrl(59419719) }, // Fossil Dragon Skullgar
  { name: "Frightfur", rating: "B", price: 50, imageUrl: getCardImageUrl(34124316) }, // Frightfur Tiger
  { name: "Frog", rating: "B", price: 50, imageUrl: getCardImageUrl(99916754) }, // Toadally Awesome
  { name: "Fur Hire", rating: "C", price: 25, imageUrl: getCardImageUrl(93850652) }, // Folgo, Justice Fur Hire
  { name: "G Golem", rating: "D", price: 10, imageUrl: getCardImageUrl(61668670) }, // G Golem Crystal Heart
  { name: "Gadget", rating: "D", price: 10, imageUrl: getCardImageUrl(86445415) }, // Red Gadget
  { name: "Gagaga", rating: "D", price: 10, imageUrl: getCardImageUrl(12014404) }, // Gagaga Magician
  { name: "Gaia", rating: "C", price: 25, imageUrl: getCardImageUrl(6368038) }, // Gaia the Fierce Knight
  { name: "Galaxy", rating: "B", price: 50, imageUrl: getCardImageUrl(82162616) }, // Galaxy-Eyes Photon Dragon
  { name: "Ganbara", rating: "F", price: 0, imageUrl: getCardImageUrl(9491461) }, // Ganbara Knight
  { name: "Gate Guardian", rating: "C", price: 25, imageUrl: getCardImageUrl(25833572) }, // Gate Guardian
  { name: "Gearfried", rating: "D", price: 10, imageUrl: getCardImageUrl(423705) }, // Gearfried the Iron Knight
  { name: "Geargia", rating: "C", price: 25, imageUrl: getCardImageUrl(29087919) }, // Gear Gigant X
  { name: "Gem-", rating: "B", price: 50, imageUrl: getCardImageUrl(27004302) }, // Gem-Knight Master Diamond
  { name: "Generaider", rating: "A", price: 100, imageUrl: getCardImageUrl(76382116) }, // Harr, Generaider Boss of Storms
  { name: "Genex", rating: "F", price: 0, imageUrl: getCardImageUrl(61775475) }, // Genex Ally Birdman
  { name: "Ghostrick", rating: "C", price: 25, imageUrl: getCardImageUrl(4939890) }, // Ghostrick Alucard
  { name: "Ghoti", rating: "A", price: 100, imageUrl: getCardImageUrl(65910922) }, // Ghoti of the Deep Beyond
  { name: "Gimmick Puppet", rating: "C", price: 25, imageUrl: getCardImageUrl(52653092) }, // Number 15: Gimmick Puppet Giant Grinder
  { name: "Gishki", rating: "B", price: 50, imageUrl: getCardImageUrl(45222299) }, // Evigishki Merrowgeist
  { name: "Glacial Beast", rating: "F", price: 0, imageUrl: getCardImageUrl(43175027) }, // Glacial Beast Blizzard Wolf
  { name: "Gladiator Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(17412721) }, // Gladiator Beast Heraklinos
  { name: "Goblin", rating: "D", price: 10, imageUrl: getCardImageUrl(45894482) }, // Goblin Attack Force
  { name: "Goblin Biker", rating: "B", price: 50, imageUrl: getCardImageUrl(34001672) }, // Goblin Biker Big Gabonga
  { name: "Gogogo", rating: "D", price: 10, imageUrl: getCardImageUrl(59724555) }, // Gogogo Golem
  { name: "Gold Pride", rating: "A", price: 100, imageUrl: getCardImageUrl(54670997) }, // Gold Pride - Captain Carrie
  { name: "Gorgonic", rating: "F", price: 0, imageUrl: getCardImageUrl(37168514) }, // Gorgonic Gargoyle
  { name: "Gouki", rating: "B", price: 50, imageUrl: getCardImageUrl(40636712) }, // Gouki The Great Ogre
  { name: "Goyo", rating: "D", price: 10, imageUrl: getCardImageUrl(84224627) }, // Goyo Guardian
  { name: "Gravekeeper's", rating: "C", price: 25, imageUrl: getCardImageUrl(45894482) }, // Gravekeeper's Commandant
  { name: "Graydle", rating: "D", price: 10, imageUrl: getCardImageUrl(66451379) }, // Graydle Dragon
  { name: "Gunkan", rating: "B", price: 50, imageUrl: getCardImageUrl(83008724) }, // Placeholder
  { name: "Gusto", rating: "D", price: 10, imageUrl: getCardImageUrl(82422049) }, // Daigusto Sphreez
  { name: "Harpie", rating: "B", price: 50, imageUrl: getCardImageUrl(80316585) }, // Harpie's Feather Duster
  { name: "Hazy Flame", rating: "F", price: 0, imageUrl: getCardImageUrl(23776077) }, // Hazy Flame Basiltrice
  { name: "Hecahands", rating: "C", price: 25, imageUrl: getCardImageUrl(95365081) }, // Hecahands Ibtel
  { name: "Heraldic", rating: "D", price: 10, imageUrl: getCardImageUrl(60316373) }, // Number 18: Heraldry Patriarch
  { name: "Heroic", rating: "C", price: 25, imageUrl: getCardImageUrl(22404675) }, // Heroic Champion - Excalibur
  { name: "Hieratic", rating: "C", price: 25, imageUrl: getCardImageUrl(88177324) }, // Hieratic Dragon King of Atum
  { name: "Horus", rating: "B", price: 50, imageUrl: getCardImageUrl(95132338) }, // Horus the Black Flame Dragon LV8
  { name: "Ice Barrier", rating: "B", price: 50, imageUrl: getCardImageUrl(50321796) }, // Brionac, Dragon of the Ice Barrier
  { name: "Icejade", rating: "B", price: 50, imageUrl: getCardImageUrl(82777208) }, // Icejade Gymir Aegirine
  { name: "Igknight", rating: "D", price: 10, imageUrl: getCardImageUrl(65872270) }, // Igknight Crusader
  { name: "@Ignister", rating: "A", price: 100, imageUrl: getCardImageUrl(15808381) }, // The Arrival Cyberse @Ignister
  { name: "Impcantation", rating: "C", price: 25, imageUrl: getCardImageUrl(64631466) }, // Impcantation Talismandra
  { name: "Infernity", rating: "C", price: 25, imageUrl: getCardImageUrl(10802915) }, // Infernity Archfiend
  { name: "Infernoble Knight", rating: "A", price: 100, imageUrl: getCardImageUrl(4423206) }, // Infernoble Knight - Renaud
  { name: "Infernoid", rating: "B", price: 50, imageUrl: getCardImageUrl(26034577) }, // Infernoid Tierra
  { name: "Infinitrack", rating: "B", price: 50, imageUrl: getCardImageUrl(23935886) }, // Infinitrack Fortress Megaclops
  { name: "Invoked", rating: "A", price: 100, imageUrl: getCardImageUrl(86120751) }, // Aleister the Invoker
  { name: "Inzektor", rating: "C", price: 25, imageUrl: getCardImageUrl(27381364) }, // Inzektor Hornet
  { name: "Iron Chain", rating: "F", price: 0, imageUrl: getCardImageUrl(26157485) }, // Iron Chain Dragon
  { name: "Junk", rating: "B", price: 50, imageUrl: getCardImageUrl(63977008) }, // Junk Warrior
  { name: "Jurrac", rating: "F", price: 0, imageUrl: getCardImageUrl(21263083) }, // Jurrac Meteor
  { name: "Kaiju", rating: "A", price: 100, imageUrl: getCardImageUrl(10389142) }, // Gameciel, the Sea Turtle Kaiju
  { name: "Karakuri", rating: "C", price: 25, imageUrl: getCardImageUrl(85541675) }, // Karakuri Steel Shogun mdl 00X "Bureido"
  { name: "Kashtira", rating: "S", price: 200, imageUrl: getCardImageUrl(9272381) }, // Kashtira Fenrir
  { name: "Kewl Tune", rating: "A", price: 100, imageUrl: getCardImageUrl(16387555) }, // Kewl Tune Cue
  { name: "Knightmare", rating: "A", price: 100, imageUrl: getCardImageUrl(68304193) }, // Knightmare Unicorn
  { name: "Koa'ki Meiru", rating: "D", price: 10, imageUrl: getCardImageUrl(81994591) }, // Koa'ki Meiru Maximus
  { name: "Kozmo", rating: "C", price: 25, imageUrl: getCardImageUrl(24550676) }, // Kozmo Dark Destroyer
  { name: "Krawler", rating: "D", price: 10, imageUrl: getCardImageUrl(56649609) }, // Krawler Soma
  { name: "Kuriboh", rating: "F", price: 0, imageUrl: getCardImageUrl(40640057) }, // Kuriboh
  { name: "Labrynth", rating: "S", price: 200, imageUrl: getCardImageUrl(71490127) }, // Lady Labrynth of the Silver Castle
  { name: "Laval", rating: "D", price: 10, imageUrl: getCardImageUrl(30303854) }, // Laval the Greater
  { name: "Libromancer", rating: "B", price: 50, imageUrl: getCardImageUrl(19516687) }, // Libromancer First Appearance
  { name: "Lightsworn", rating: "B", price: 50, imageUrl: getCardImageUrl(22624373) }, // Judgment Dragon
  { name: "lswarm", rating: "D", price: 10, imageUrl: getCardImageUrl(42679662) }, // Evilswarm Ophion
  { name: "Lunalight", rating: "B", price: 50, imageUrl: getCardImageUrl(11317977) }, // Lunalight Sabre Dancer
  { name: "Lyrilusc", rating: "A", price: 100, imageUrl: getCardImageUrl(8491961) }, // Lyrilusc - Assembled Nightingale
  { name: "Machina", rating: "B", price: 50, imageUrl: getCardImageUrl(23469398) }, // Machina Fortress
  { name: "Madolche", rating: "A", price: 100, imageUrl: getCardImageUrl(34680482) }, // Madolche Queen Tiaramisu
  { name: "Magical Musket", rating: "B", price: 50, imageUrl: getCardImageUrl(47810543) }, // Magical Musketeer Max
  { name: "Magician", rating: "C", price: 25, imageUrl: getCardImageUrl(46986414) }, // Dark Magician
  { name: "Magikey", rating: "B", price: 50, imageUrl: getCardImageUrl(98234196) }, // Magikey Fiend - Transfurlmine
  { name: "Magistus", rating: "C", price: 25, imageUrl: getCardImageUrl(35877582) }, // Zoroa, the Magistus of Flame
  { name: "Majespecter", rating: "B", price: 50, imageUrl: getCardImageUrl(5506791) }, // Majespecter Unicorn - Kirin
  { name: "Malefic", rating: "D", price: 10, imageUrl: getCardImageUrl(52558805) }, // Malefic Stardust Dragon
  { name: "Maliss", rating: "S", price: 200, imageUrl: getCardImageUrl(69272449) }, // Maliss White Rabbit
  { name: "Mannadium", rating: "S", price: 200, imageUrl: getCardImageUrl(45065541) }, // Mannadium Meek
  { name: "Marincess", rating: "A", price: 100, imageUrl: getCardImageUrl(20934852) }, // Marincess Coral Anemone
  { name: "Masked HERO", rating: "B", price: 50, imageUrl: getCardImageUrl(58481572) }, // Masked HERO Dark Law
  { name: "Materiactor", rating: "D", price: 10, imageUrl: getCardImageUrl(70597485) }, // Materiactor Gigaboros
  { name: "Mathmech", rating: "S", price: 200, imageUrl: getCardImageUrl(42632209) }, // Mathmech Circular
  { name: "Mayakashi", rating: "C", price: 25, imageUrl: getCardImageUrl(42542842) }, // Yuki-Onna, the Absolute Zero Mayakashi
  { name: "Mecha Phantom Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(16943770) }, // Mecha Phantom Beast Dracossack
  { name: "Megalith", rating: "C", price: 25, imageUrl: getCardImageUrl(29876299) }, // Megalith Phul
  { name: "Mekk-Knight", rating: "B", price: 50, imageUrl: getCardImageUrl(74820316) }, // Mekk-Knight Blue Sky
  { name: "Meklord", rating: "D", price: 10, imageUrl: getCardImageUrl(99365553) }, // Meklord Emperor Wisel
  { name: "Melffy", rating: "B", price: 50, imageUrl: getCardImageUrl(53054164) }, // Melffy Mommy
  { name: "Melodious", rating: "B", price: 50, imageUrl: getCardImageUrl(64880894) }, // Bloom Diva the Melodious Choir
  { name: "Memento", rating: "A", price: 100, imageUrl: getCardImageUrl(54550967) }, // Mementotlan Angwitch
  { name: "Mermail", rating: "A", price: 100, imageUrl: getCardImageUrl(74371660) }, // Mermail Abyssmegalo
  { name: "Metalfoes", rating: "B", price: 50, imageUrl: getCardImageUrl(27279764) }, // Metalfoes Mithrilium
  { name: "Metalmorph", rating: "C", price: 25, imageUrl: getCardImageUrl(89812483) }, // Max Metalmorph
  { name: "Metaphys", rating: "D", price: 10, imageUrl: getCardImageUrl(66719533) }, // Metaphys Horus
  { name: "Mikanko", rating: "A", price: 100, imageUrl: getCardImageUrl(75771170) }, // Ohime the Manifested Mikanko
  { name: "Millennium", rating: "C", price: 25, imageUrl: getCardImageUrl(37613663) }, // Millennium Ankh
  { name: "Mimighoul", rating: "B", price: 50, imageUrl: getCardImageUrl(55537983) }, // Mimighoul Master
  { name: "Mist Valley", rating: "D", price: 10, imageUrl: getCardImageUrl(15854426) }, // Mist Valley Apex Avian
  { name: "Mitsurugi", rating: "S", price: 200, imageUrl: getCardImageUrl(19899073) }, // Ame no Murakumo no Mitsurugi
  { name: "Monarch", rating: "C", price: 25, imageUrl: getCardImageUrl(65612386) }, // Erebus the Underworld Monarch
  { name: "Morphtronic", rating: "C", price: 25, imageUrl: getCardImageUrl(44424095) }, // Power Tool Dragon
  { name: "Mystical Beast", rating: "D", price: 10, imageUrl: getCardImageUrl(97317530) }, // Kalantosa, Mystical Beast of the Forest
  { name: "Mythical Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(4796100) }, // Mythical Beast Master Cerberus
  { name: "Myutant", rating: "B", price: 50, imageUrl: getCardImageUrl(7574904) }, // Myutant Beast
  { name: "Naturia", rating: "A", price: 100, imageUrl: getCardImageUrl(33198837) }, // Naturia Beast
  { name: "Nekroz", rating: "B", price: 50, imageUrl: getCardImageUrl(90307498) }, // Nekroz of Brionac
  { name: "Nemleria", rating: "C", price: 25, imageUrl: getCardImageUrl(70155677) }, // Dreaming Nemleria
  { name: "Neo-Spacian", rating: "D", price: 10, imageUrl: getCardImageUrl(58932615) }, // Neo-Spacian Glow Moss
  { name: "Neos", rating: "B", price: 50, imageUrl: getCardImageUrl(89943723) }, // Elemental HERO Neos
  { name: "Nemeses", rating: "C", price: 25, imageUrl: getCardImageUrl(33212663) }, // Nemeses Keystone
  { name: "Nephthys", rating: "D", price: 10, imageUrl: getCardImageUrl(61441708) }, // Sacred Phoenix of Nephthys
  { name: "Nimble", rating: "D", price: 10, imageUrl: getCardImageUrl(88686573) }, // Nimble Momonga
  { name: "Ninja", rating: "B", price: 50, imageUrl: getCardImageUrl(69023354) }, // Ninja Grandmaster Hanzo
  { name: "Noble Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(21223277) }, // Noble Knight Brothers
  { name: "Nordic", rating: "D", price: 10, imageUrl: getCardImageUrl(63767246) }, // Odin, Father of the Aesir
  { name: "Nouvelles", rating: "B", price: 50, imageUrl: getCardImageUrl(88890658) }, // Baelgrill de Nouvelles
  { name: "Number", rating: "C", price: 25, imageUrl: getCardImageUrl(39512984) }, // Number 39: Utopia
  { name: "Numeron", rating: "B", price: 50, imageUrl: getCardImageUrl(88177324) }, // Number 1: Numeron Gate Ekam
  { name: "Odd-Eyes", rating: "B", price: 50, imageUrl: getCardImageUrl(16178681) }, // Odd-Eyes Pendulum Dragon
  { name: "Ogdoadic", rating: "C", price: 25, imageUrl: getCardImageUrl(98787535) }, // Ogdoabyss, the Ogdoadic Overlord
  { name: "Orcust", rating: "A", price: 100, imageUrl: getCardImageUrl(30741503) }, // Galatea, the Orcust Automaton
  { name: "Ojama", rating: "D", price: 10, imageUrl: getCardImageUrl(64163367) }, // Ojama King
  { name: "P.U.N.K.", rating: "B", price: 50, imageUrl: getCardImageUrl(17691568) }, // Noh-P.U.N.K. Ze Amin
  { name: "Paleozoic", rating: "B", price: 50, imageUrl: getCardImageUrl(61307542) }, // Paleozoic Anomalocaris
  { name: "Parshath", rating: "C", price: 25, imageUrl: getCardImageUrl(18036057) }, // Airknight Parshath
  { name: "Penguin", rating: "B", price: 50, imageUrl: getCardImageUrl(93920745) }, // Penguin Soldier
  { name: "Performage", rating: "C", price: 25, imageUrl: getCardImageUrl(92530005) }, // Performage Damage Juggler
  { name: "Performapal", rating: "B", price: 50, imageUrl: getCardImageUrl(66768175) }, // Performapal Skullcrobat Joker
  { name: "Phantasm Spiral", rating: "C", price: 25, imageUrl: getCardImageUrl(42625254) }, // Phantasm Spiral Dragon
  { name: "Phantom Beast", rating: "D", price: 10, imageUrl: getCardImageUrl(6007213) }, // Phantom Beast Rock-Lizard
  { name: "Photon", rating: "B", price: 50, imageUrl: getCardImageUrl(85747929) }, // Galaxy-Eyes Photon Dragon
  { name: "Plunder Patroll", rating: "A", price: 100, imageUrl: getCardImageUrl(67647362) }, // Plunder Patrollship Brann
  { name: "Prank-Kids", rating: "B", price: 50, imageUrl: getCardImageUrl(81997228) }, // Prank-Kids Meow-Meow-Mu
  { name: "Predaplant", rating: "B", price: 50, imageUrl: getCardImageUrl(66309175) }, // Predaplant Verte Anaconda
  { name: "Prediction Princess", rating: "D", price: 10, imageUrl: getCardImageUrl(31118030) }, // Prediction Princess Tarotrei
  { name: "Purrely", rating: "S", price: 200, imageUrl: getCardImageUrl(98049934) }, // Purrely
  { name: "PSY-Frame", rating: "B", price: 50, imageUrl: getCardImageUrl(75425043) }, // PSY-Framelord Omega
  { name: "Qli", rating: "C", price: 25, imageUrl: getCardImageUrl(90885155) }, // Qliphort Scout
  { name: "R.B.", rating: "B", price: 50, imageUrl: getCardImageUrl(32216688) }, // R.B. The Brute Blues
  { name: "Ragnaraika", rating: "B", price: 50, imageUrl: getCardImageUrl(99153051) }, // Ragnaraika the Evil Seed
  { name: "Raidraptor", rating: "A", price: 100, imageUrl: getCardImageUrl(96157835) }, // Raidraptor - Ultimate Falcon
  { name: "Red-Eyes", rating: "C", price: 25, imageUrl: getCardImageUrl(74677422) }, // Red-Eyes Black Dragon
  { name: "Regenesis", rating: "B", price: 50, imageUrl: getCardImageUrl(22812963) }, // Regenesis Lord
  { name: "Reptilianne", rating: "C", price: 25, imageUrl: getCardImageUrl(89594399) }, // Reptilianne Coatl
  { name: "Rescue-ACE", rating: "S", price: 200, imageUrl: getCardImageUrl(65734501) }, // Rescue-ACE Turbulence
  { name: "Resonator", rating: "B", price: 50, imageUrl: getCardImageUrl(89127526) }, // Red Rising Dragon
  { name: "Rikka", rating: "A", price: 100, imageUrl: getCardImageUrl(34614910) }, // Rikka Queen Strenna
  { name: "Risebell", rating: "D", price: 10, imageUrl: getCardImageUrl(45103815) }, // Risebell the Summoner
  { name: "Ritual Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(57815601) }, // Ritual Beast Ulti-Cannahawk
  { name: "Roid", rating: "D", price: 10, imageUrl: getCardImageUrl(65957473) }, // Jumbo Drill
  { name: "Rokket", rating: "A", price: 100, imageUrl: getCardImageUrl(62873545) }, // Borreload Dragon
  { name: "Rose", rating: "C", price: 25, imageUrl: getCardImageUrl(73580471) }, // Black Rose Dragon
  { name: "Runick", rating: "A", price: 100, imageUrl: getCardImageUrl(47219274) }, // Hugin the Runick Wings
  { name: "Ryu-Ge", rating: "B", price: 50, imageUrl: getCardImageUrl(92487128) }, // Sosei Ryu-Ge Mistva
  { name: "Ryzeal", rating: "B", price: 50, imageUrl: getCardImageUrl(34909328) }, // Ryzeal Detonator
  { name: "Sangen", rating: "F", price: 0, imageUrl: getCardImageUrl(18969888) }, // Sangenpai Transcendent Dragion
  { name: "S-Force", rating: "C", price: 25, imageUrl: getCardImageUrl(37629703) }, // S-Force Chase
  { name: "Salamangreat", rating: "A", price: 100, imageUrl: getCardImageUrl(38784726) }, // Salamangreat Balelynx
  { name: "Scareclaw", rating: "A", price: 100, imageUrl: getCardImageUrl(46877100) }, // Scareclaw Tri-Heart
  { name: "Scrap", rating: "C", price: 25, imageUrl: getCardImageUrl(92361635) }, // Scrap Dragon
  { name: "Shaddoll", rating: "A", price: 100, imageUrl: getCardImageUrl(74822425) }, // El Shaddoll Construct
  { name: "Shark", rating: "B", price: 50, imageUrl: getCardImageUrl(61496006) }, // Number 101: Silent Honor ARK
  { name: "Shining Sarcophagus", rating: "B", price: 50, imageUrl: getCardImageUrl(79791878) }, // Shining Sarcophagus
  { name: "Shinobird", rating: "D", price: 10, imageUrl: getCardImageUrl(66815913) }, // Shinobaroness Peacock
  { name: "Shiranui", rating: "C", price: 25, imageUrl: getCardImageUrl(65681983) }, // Shiranui Sunsaga
  { name: "Silent Magician", rating: "C", price: 25, imageUrl: getCardImageUrl(72443568) }, // Silent Magician
  { name: "Silent Swordsman", rating: "C", price: 25, imageUrl: getCardImageUrl(43722862) }, // Silent Swordsman
  { name: "Simorgh", rating: "D", price: 10, imageUrl: getCardImageUrl(14989021) }, // Simorgh, Bird of Sovereignty
  { name: "Sinful Spoils", rating: "S", price: 200, imageUrl: getCardImageUrl(80845034) }, // WANTED: Seeker of Sinful Spoils
  { name: "Six Samurai", rating: "C", price: 25, imageUrl: getCardImageUrl(2511717) }, // Legendary Six Samurai - Shi En
  { name: "Skull Servant", rating: "C", price: 25, imageUrl: getCardImageUrl(32274490) }, // King of the Skull Servants
  { name: "Sky Striker", rating: "A", price: 100, imageUrl: getCardImageUrl(63288573) }, // Sky Striker Ace - Raye
  { name: "Snake-Eye", rating: "S", price: 200, imageUrl: getCardImageUrl(53639887) }, // Snake-Eye Ash
  { name: "Solfachord", rating: "C", price: 25, imageUrl: getCardImageUrl(80776622) }, // DoReMi Solfachord Coolia
  { name: "Speedroid", rating: "B", price: 50, imageUrl: getCardImageUrl(85852291) }, // Crystal Wing Synchro Dragon
  { name: "Spellbook", rating: "B", price: 50, imageUrl: getCardImageUrl(89631139) }, // Spellbook of Secrets
  { name: "Sphinx", rating: "D", price: 10, imageUrl: getCardImageUrl(4931562) }, // Theinen the Great Sphinx
  { name: "Springans", rating: "B", price: 50, imageUrl: getCardImageUrl(21887175) }, // Springans Ship - Exblowrer
  { name: "Spyral", rating: "B", price: 50, imageUrl: getCardImageUrl(88124568) }, // SPYRAL Super Agent
  { name: "Spright", rating: "S", price: 200, imageUrl: getCardImageUrl(72656408) }, // Spright Blue
  { name: "Star Seraph", rating: "D", price: 10, imageUrl: getCardImageUrl(38331564) }, // Star Seraph Scepter
  { name: "Starry Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(21985407) }, // Starry Night, Starry Dragon
  { name: "Steelswarm", rating: "D", price: 10, imageUrl: getCardImageUrl(53116300) }, // Steelswarm Hercules
  { name: "Subterror", rating: "B", price: 50, imageUrl: getCardImageUrl(28369508) }, // Subterror Guru
  { name: "Sunavalon", rating: "A", price: 100, imageUrl: getCardImageUrl(54340229) }, // Sunavalon Dryas
  { name: "Superheavy Samurai", rating: "A", price: 100, imageUrl: getCardImageUrl(9402966) }, // Superheavy Samurai Big Benkei
  { name: "Supreme King", rating: "B", price: 50, imageUrl: getCardImageUrl(44186624) }, // Supreme King Dragon Darkwurm
  { name: "Swordsoul", rating: "A", price: 100, imageUrl: getCardImageUrl(4810828) }, // Swordsoul Grandmaster - Chixiao
  { name: "Sylvan", rating: "D", price: 10, imageUrl: getCardImageUrl(10530913) }, // Sylvan Sagequoia
  { name: "Symphonic Warrior", rating: "D", price: 10, imageUrl: getCardImageUrl(68933343) }, // Symphonic Warrior Guitaar
  { name: "Synchron", rating: "B", price: 50, imageUrl: getCardImageUrl(63977008) }, // Junk Warrior
  { name: "Tearlaments", rating: "S", price: 200, imageUrl: getCardImageUrl(1329620) }, // Tearlaments Kitkallos
  { name: "Tellarknight", rating: "C", price: 25, imageUrl: getCardImageUrl(10125011) }, // Stellarknight Delteros
  { name: "Tenyi", rating: "A", price: 100, imageUrl: getCardImageUrl(87052196) }, // Tenyi Spirit - Vishuda
  { name: "T.G.", rating: "B", price: 50, imageUrl: getCardImageUrl(63180841) }, // T.G. Hyper Librarian
  { name: "The Agent", rating: "B", price: 50, imageUrl: getCardImageUrl(91188343) }, // The Agent of Creation - Venus
  { name: "Phantom Knights", rating: "A", price: 100, imageUrl: getCardImageUrl(2857636) }, // The Phantom Knights of Break Sword
  { name: "The Weather", rating: "B", price: 50, imageUrl: getCardImageUrl(52834429) }, // The Weather Painter Rainbow
  { name: "Therion", rating: "A", price: 100, imageUrl: getCardImageUrl(71832012) }, // Therion "King" Regulus
  { name: "Thunder Dragon", rating: "B", price: 50, imageUrl: getCardImageUrl(31786629) }, // Thunder Dragon Colossus
  { name: "Time Thief", rating: "B", price: 50, imageUrl: getCardImageUrl(55285840) }, // Time Thief Redoer
  { name: "Timelord", rating: "C", price: 25, imageUrl: getCardImageUrl(6616912) }, // Lazion, the Timelord
  { name: "Tindangle", rating: "D", price: 10, imageUrl: getCardImageUrl(59438930) }, // Tindangle Acute Cerberus
  { name: "Tistina", rating: "C", price: 25, imageUrl: getCardImageUrl(86999951) }, // Crystal God Tistina
  { name: "Toon", rating: "C", price: 25, imageUrl: getCardImageUrl(15259703) }, // Toon Dark Magician
  { name: "Toy", rating: "C", price: 25, imageUrl: getCardImageUrl(65504487) }, // Toy Soldier
  { name: "Traptrix", rating: "A", price: 100, imageUrl: getCardImageUrl(2956282) }, // Traptrix Sera
  { name: "Triamid", rating: "C", price: 25, imageUrl: getCardImageUrl(45383307) }, // Triamid Sphinx
  { name: "Tri-Brigade", rating: "A", price: 100, imageUrl: getCardImageUrl(51097887) }, // Tri-Brigade Shuraig the Ominous Omen
  { name: "Trickstar", rating: "B", price: 50, imageUrl: getCardImageUrl(37405032) }, // Trickstar Holly Angel
  { name: "Lightsworn", rating: "C", price: 25, imageUrl: getCardImageUrl(45425051) }, // Lumina, Twilightsworn Shaman
  { name: "U.A.", rating: "C", price: 25, imageUrl: getCardImageUrl(34614289) }, // U.A. Mighty Slugger
  { name: "Unchained", rating: "S", price: 200, imageUrl: getCardImageUrl(80801743) }, // Unchained Abomination
  { name: "Ursarctic", rating: "C", price: 25, imageUrl: getCardImageUrl(89264428) }, // Ursarctic Septentrion
  { name: "Utopia", rating: "B", price: 50, imageUrl: getCardImageUrl(39512984) }, // Number 39: Utopia
  { name: "Vaalmonica", rating: "B", price: 50, imageUrl: getCardImageUrl(3048768) }, // Angello Vaalmonica
  { name: "Vampire", rating: "C", price: 25, imageUrl: getCardImageUrl(38250531) }, // Vampire Lord
  { name: "Vanquish Soul", rating: "S", price: 200, imageUrl: getCardImageUrl(27345070) }, // Vanquish Soul Razen
  { name: "Vassal", rating: "D", price: 10, imageUrl: getCardImageUrl(59808784) }, // Berlineth the Firestorm Vassal
  { name: "Vaylantz", rating: "A", price: 100, imageUrl: getCardImageUrl(50687050) }, // Vaylantz World - Shinra Bansho
  { name: "Vendread", rating: "C", price: 25, imageUrl: getCardImageUrl(91420202) }, // Vendread Battlelord
  { name: "Venom", rating: "D", price: 10, imageUrl: getCardImageUrl(28563545) }, // Vennominaga the Deity of Poisonous Snakes
  { name: "Virtual World", rating: "B", price: 50, imageUrl: getCardImageUrl(11510448) }, // Virtual World Gate - Qinglong
  { name: "Visas", rating: "A", price: 100, imageUrl: getCardImageUrl(56099748) }, // Visas Starfrost
  { name: "Vision HERO", rating: "B", price: 50, imageUrl: getCardImageUrl(45170821) }, // Vision HERO Faris
  { name: "Voiceless Voice", rating: "S", price: 200, imageUrl: getCardImageUrl(98477480) }, // Lo, the Prayers of the Voiceless Voice
  { name: "Volcanic", rating: "A", price: 100, imageUrl: getCardImageUrl(81020140) }, // Volcanic Doomfire
  { name: "Vylon", rating: "D", price: 10, imageUrl: getCardImageUrl(56768355) }, // Vylon Omega
  { name: "War Rock", rating: "D", price: 10, imageUrl: getCardImageUrl(18558867) }, // War Rock Fortia
  { name: "Watt", rating: "D", price: 10, imageUrl: getCardImageUrl(87151205) }, // Wattgiraffe
  { name: "White Forest", rating: "B", price: 50, imageUrl: getCardImageUrl(14307929) }, // Diabell, Queen of the White Forest
  { name: "Wind-up", rating: "C", price: 25, imageUrl: getCardImageUrl(48739166) }, // Wind-Up Rabbit
  { name: "Windwitch", rating: "B", price: 50, imageUrl: getCardImageUrl(84851250) }, // Windwitch - Ice Bell
  { name: "Witchcrafter", rating: "B", price: 50, imageUrl: getCardImageUrl(83289866) }, // Witchcrafter Madame Verre
  { name: "World Chalice", rating: "C", price: 25, imageUrl: getCardImageUrl(4709881) }, // Imduk the World Chalice Dragon
  { name: "World Legacy", rating: "B", price: 50, imageUrl: getCardImageUrl(92562411) }, // World Legacy Guardragon Mardark
  { name: "Worm", rating: "D", price: 10, imageUrl: getCardImageUrl(75081613) }, // Worm Zero
  { name: "Xyz", rating: "C", price: 25, imageUrl: getCardImageUrl(39512984) }, // Number 39: Utopia
  { name: "X-Saber", rating: "C", price: 25, imageUrl: getCardImageUrl(45206713) }, // XX-Saber Gottoms
  { name: "Yang Zing", rating: "C", price: 25, imageUrl: getCardImageUrl(83755611) }, // Baxia, Brightness of the Yang Zing
  { name: "Yosenju", rating: "C", price: 25, imageUrl: getCardImageUrl(65247798) }, // Mayosenju Daibak
  { name: "Yubel", rating: "A", price: 100, imageUrl: getCardImageUrl(78371393) }, // Yubel
  { name: "Yummy", rating: "S", price: 200, imageUrl: getCardImageUrl(30581601) }, // Yummy★Snatchy
  { name: "Zefra", rating: "B", price: 50, imageUrl: getCardImageUrl(98076754) }, // Zefraath
  { name: "Zoodiac", rating: "B", price: 50, imageUrl: getCardImageUrl(48905153) }, // Zoodiac Drident
  { name: "Zubaba", rating: "D", price: 10, imageUrl: getCardImageUrl(57036718) }, // Zubaba Knight
  { name: "ZW", rating: "D", price: 10, imageUrl: getCardImageUrl(6330307) }, // ZW - Unicorn Spear
  { name: "Gaia The Fierce Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(6368038) }, // Gaia The Fierce Knight
  { name: "Celtic Guardian", rating: "D", price: 10, imageUrl: getCardImageUrl(39507162) }, // Celtic Guardian
  { name: "Umi", rating: "C", price: 25, imageUrl: getCardImageUrl(22702055) }, // Umi
  { name: "Trap Hole", rating: "B", price: 50, imageUrl: getCardImageUrl(4206964) }, // Trap Hole
  { name: "Fusion", rating: "C", price: 25, imageUrl: getCardImageUrl(24094653) }, // Polymerization
  { name: "Battleguard", rating: "D", price: 10, imageUrl: getCardImageUrl(5577149) }, // Swamp Battleguard
  { name: "Jinzo", rating: "C", price: 25, imageUrl: getCardImageUrl(77585513) }, // Jinzo
  { name: "Solemn Cards", rating: "S", price: 200, imageUrl: getCardImageUrl(41420027) }, // Solemn Judgment
  { name: "Mirror Force", rating: "B", price: 50, imageUrl: getCardImageUrl(44095762) }, // Mirror Force
  { name: "Relinquished", rating: "C", price: 25, imageUrl: getCardImageUrl(64631466) }, // Relinquished
  { name: "Jar", rating: "D", price: 10, imageUrl: getCardImageUrl(3900605) }, // Morphing Jar
  { name: "The Legendary Fisherman", rating: "C", price: 25, imageUrl: getCardImageUrl(3643300) }, // The Legendary Fisherman
  { name: "Slime", rating: "C", price: 25, imageUrl: getCardImageUrl(41392891) }, // Jam Breeding Machine
  { name: "Magician Girl", rating: "C", price: 25, imageUrl: getCardImageUrl(38033121) }, // Dark Magician Girl
  { name: "Koala", rating: "D", price: 10, imageUrl: getCardImageUrl(42129512) }, // Big Koala
  { name: "Maju", rating: "C", price: 25, imageUrl: getCardImageUrl(33022867) }, // Maju Garzett
  { name: "Zera", rating: "D", price: 10, imageUrl: getCardImageUrl(69123138) }, // Zera the Mant
  { name: "B.E.S.", rating: "C", price: 25, imageUrl: getCardImageUrl(44330098) }, // B.E.S. Big Core
  { name: "Mokey Mokey", rating: "F", price: 0, imageUrl: getCardImageUrl(27288416) }, // Mokey Mokey
  { name: "End of the World", rating: "C", price: 25, imageUrl: getCardImageUrl(91949988) }, // End of the World
  { name: "Counter Trap Fairies", rating: "B", price: 50, imageUrl: getCardImageUrl(76407432) }, // Counter Gate
  { name: "Bamboo Sword", rating: "D", price: 10, imageUrl: getCardImageUrl(41587307) }, // Broken Bamboo Sword
  { name: "Felgrand", rating: "C", price: 25, imageUrl: getCardImageUrl(25533642) }, // Divine Dragon Lord Felgrand
  { name: "Magnet Warrior", rating: "C", price: 25, imageUrl: getCardImageUrl(89399912) }, // Valkyrion the Magna Warrior
  { name: "Puppet", rating: "D", price: 10, imageUrl: getCardImageUrl(15001619) }, // Puppet Queen
  { name: "Jester", rating: "D", price: 10, imageUrl: getCardImageUrl(62962630) }, // Jester Confit
  { name: "Spider", rating: "D", price: 10, imageUrl: getCardImageUrl(17494901) }, // Spider Web
  { name: "Temple of the Kings", rating: "C", price: 25, imageUrl: getCardImageUrl(29762407) }, // Temple of the Kings
  { name: "Wicked Gods", rating: "C", price: 25, imageUrl: getCardImageUrl(86377375) }, // The Wicked Avatar
  { name: "Egyptian Gods", rating: "C", price: 25, imageUrl: getCardImageUrl(89631139) }, // Obelisk the Tormentor
  { name: "Hunder", rating: "D", price: 10, imageUrl: getCardImageUrl(41420027) }, // Vylon Disigma
  { name: "Train", rating: "A", price: 100, imageUrl: getCardImageUrl(35094006) }, // Superdreadnought Rail Cannon Gustav Max
  // { name: "Sparrow Family", rating: "F", price: 0, imageUrl: getCardImageUrl(46986414) }, // OCG Only - No TCG Release
  { name: "Malicevorous", rating: "D", price: 10, imageUrl: getCardImageUrl(61791132) }, // Malicevorous Fork
  { name: "Legendary Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(85800949) }, // Legendary Knight Timaeus
  { name: "Super Quant", rating: "B", price: 50, imageUrl: getCardImageUrl(20366274) }, // Super Quantal Mech King Great Magnus
  { name: "Dracoverlord", rating: "B", price: 50, imageUrl: getCardImageUrl(81439173) }, // Amorphage Goliath
  { name: "Aether", rating: "C", price: 25, imageUrl: getCardImageUrl(80344569) }, // Aether, the Evil Empowering Dragon
  { name: "Borrel", rating: "A", price: 100, imageUrl: getCardImageUrl(62873545) }, // Borreload Dragon
  // { name: "Martial Arts Spirits", rating: "D", price: 10, imageUrl: getCardImageUrl(46986414) }, // OCG Only - No TCG Release
  { name: "Topologic", rating: "A", price: 100, imageUrl: getCardImageUrl(23935886) }, // Topologic Bomber Dragon
  { name: "Cataclysmic", rating: "D", price: 10, imageUrl: getCardImageUrl(62850093) }, // Cataclysmic Circumpolar Chilblainia
  { name: "Vernusylph", rating: "A", price: 100, imageUrl: getCardImageUrl(55125728) }, // Vernusylph of the Flourishing Hills
  { name: "Ancient Treasure", rating: "D", price: 10, imageUrl: getCardImageUrl(7903368) }, // Crystal Skull
  { name: "Transcendosaurus", rating: "C", price: 25, imageUrl: getCardImageUrl(31241087) }, // Transcendosaurus Meteorus
  { name: "Illusion", rating: "B", price: 50, imageUrl: getCardImageUrl(38264974) }, // Chimera the Illusion Beast
  { name: "Earthbound Servant", rating: "C", price: 25, imageUrl: getCardImageUrl(71101678) }, // Earthbound Servant Geo Grasha
  { name: "Veda", rating: "C", price: 25, imageUrl: getCardImageUrl(40785230) }, // Veda Kalarcanum
  { name: "Tenpai Dragon", rating: "S", price: 200, imageUrl: getCardImageUrl(39931513) }, // Tenpai Dragon Paidra
  { name: "Primite", rating: "B", price: 50, imageUrl: getCardImageUrl(81418467) }, // Primite Imperial Dragon
  { name: "Azamina", rating: "B", price: 50, imageUrl: getCardImageUrl(73391962) }, // Azamina Mu Rcielago
  { name: "Mulcharmy", rating: "S+", price: 400, imageUrl: getCardImageUrl(84192580) }, // Mulcharmy Purulia
  { name: "Argostars", rating: "B", price: 50, imageUrl: getCardImageUrl(40706444) }, // Argostars - Adventurous Arion
  { name: "Dominus", rating: "B", price: 50, imageUrl: getCardImageUrl(42091632) }, // Dominus Spiral
  { name: "Power Patron", rating: "C", price: 25, imageUrl: getCardImageUrl(68231287) }, // Jupiter the Power Patron of Destruction
  { name: "WAKE CUP!", rating: "D", price: 10, imageUrl: getCardImageUrl(85586937) }, // WAKE CUP! Erl
  { name: "CXyz", rating: "B", price: 50, imageUrl: getCardImageUrl(6165656) }, // Number C88: Gimmick Puppet Disaster Leo
  { name: "\"C\"", rating: "S", price: 200, imageUrl: getCardImageUrl(23434538) }, // Maxx "C"
];

// Generic Staple Cards with Meta Ratings
// These use the actual card images from YGOPRODECK
export const STAPLE_CARDS: CatalogItem[] = [
  { name: "Ash Blossom & Joyous Spring", rating: "S", price: 200, imageUrl: getCardImageUrl(14558127) },
  { name: "Effect Veiler", rating: "A", price: 100, imageUrl: getCardImageUrl(97268402) },
  { name: "Infinite Impermanence", rating: "S", price: 200, imageUrl: getCardImageUrl(10045474) },
  { name: "Nibiru, the Primal Being", rating: "S", price: 200, imageUrl: getCardImageUrl(27204311) },
  { name: "Droll & Lock Bird", rating: "S", price: 200, imageUrl: getCardImageUrl(94145021) },
  { name: "Ghost Ogre & Snow Rabbit", rating: "A", price: 100, imageUrl: getCardImageUrl(59438930) },
  { name: "Ghost Belle & Haunted Mansion", rating: "S", price: 200, imageUrl: getCardImageUrl(73642296) },
  { name: "Ghost Mourner & Moonlit Chill", rating: "S", price: 200, imageUrl: getCardImageUrl(52038441) },
  { name: "D.D. Crow", rating: "B", price: 50, imageUrl: getCardImageUrl(24508238) },
  { name: "Dimension Shifter", rating: "S", price: 200, imageUrl: getCardImageUrl(91800273) },
  { name: "Artifact Lancea", rating: "S", price: 200, imageUrl: getCardImageUrl(34267821) },
  { name: "Skull Meister", rating: "S", price: 200, imageUrl: getCardImageUrl(97268402) },
  { name: "Lightning Storm", rating: "S", price: 200, imageUrl: getCardImageUrl(14532163) },
  { name: "Raigeki", rating: "B", price: 50, imageUrl: getCardImageUrl(12580477) },
  { name: "Dark Hole", rating: "B", price: 50, imageUrl: getCardImageUrl(53129443) },
  { name: "Harpie's Feather Duster", rating: "S", price: 200, imageUrl: getCardImageUrl(18144506) },
  { name: "Evenly Matched", rating: "S", price: 200, imageUrl: getCardImageUrl(15693423) },
  { name: "Dark Ruler No More", rating: "S", price: 200, imageUrl: getCardImageUrl(54693926) },
  { name: "Forbidden Droplet", rating: "S", price: 200, imageUrl: getCardImageUrl(24299458) },
  { name: "Book of Eclipse", rating: "B", price: 50, imageUrl: getCardImageUrl(35480699) },
  { name: "Book of Moon", rating: "B", price: 50, imageUrl: getCardImageUrl(14087893) },
  { name: "Super Polymerization", rating: "S", price: 200, imageUrl: getCardImageUrl(48130397) },
  { name: "Called by the Grave", rating: "S", price: 200, imageUrl: getCardImageUrl(24224830) },
  { name: "Crossout Designator", rating: "S", price: 200, imageUrl: getCardImageUrl(65681983) },
  { name: "Pot of Prosperity", rating: "A", price: 100, imageUrl: getCardImageUrl(84211599) },
  { name: "Pot of Desires", rating: "A", price: 100, imageUrl: getCardImageUrl(35261759) },
  { name: "Small World", rating: "C", price: 25, imageUrl: getCardImageUrl(42110604) },
  { name: "Terraforming", rating: "B", price: 50, imageUrl: getCardImageUrl(73628505) },
  { name: "Foolish Burial", rating: "S", price: 200, imageUrl: getCardImageUrl(81439173) },
  { name: "Monster Reborn", rating: "S", price: 200, imageUrl: getCardImageUrl(83764718) },
  { name: "One for One", rating: "S", price: 200, imageUrl: getCardImageUrl(2295440) },
  { name: "Cosmic Cyclone", rating: "B", price: 50, imageUrl: getCardImageUrl(8267140) },
  { name: "Twin Twisters", rating: "B", price: 50, imageUrl: getCardImageUrl(43898403) },
  { name: "Forbidden Chalice", rating: "B", price: 50, imageUrl: getCardImageUrl(25789292) },
  { name: "Forbidden Lance", rating: "B", price: 50, imageUrl: getCardImageUrl(27243130) },
  { name: "Solemn Judgment", rating: "A", price: 100, imageUrl: getCardImageUrl(41420027) },
  { name: "Solemn Strike", rating: "A", price: 100, imageUrl: getCardImageUrl(40605147) },
  { name: "Solemn Warning", rating: "A", price: 100, imageUrl: getCardImageUrl(84749824) },
  { name: "Red Reboot", rating: "S", price: 200, imageUrl: getCardImageUrl(51447164) },
  { name: "Dimensional Barrier", rating: "S", price: 200, imageUrl: getCardImageUrl(83326048) },
  { name: "Anti-Spell Fragrance", rating: "S", price: 200, imageUrl: getCardImageUrl(58921041) },
  { name: "There Can Be Only One", rating: "S", price: 200, imageUrl: getCardImageUrl(24207889) },
  { name: "Rivalry of Warlords", rating: "S", price: 200, imageUrl: getCardImageUrl(90846359) },
  { name: "Gozen Match", rating: "S", price: 200, imageUrl: getCardImageUrl(53334471) },
  { name: "Skill Drain", rating: "S", price: 200, imageUrl: getCardImageUrl(82732705) },
];
