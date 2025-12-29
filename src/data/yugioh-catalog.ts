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
  { name: "Albaz", rating: "S", price: 200, imageUrl: getCardImageUrl(59977691) }, // Fallen of Albaz
  { name: "Abyss Actor", rating: "C", price: 25, imageUrl: getCardImageUrl(19474136) }, // Abyss Actor - Superstar
  { name: "Adamancipator", rating: "B", price: 50, imageUrl: getCardImageUrl(25174609) }, // Adamancipator Risen - Dragite
  { name: "Adventurer Token", rating: "A", price: 100, imageUrl: getCardImageUrl(57304293) }, // Wandering Gryphon Rider
  { name: "Aesir", rating: "D", price: 10, imageUrl: getCardImageUrl(63767246) }, // Odin, Father of the Aesir
  { name: "Agent", rating: "B", price: 50, imageUrl: getCardImageUrl(91188343) }, // The Agent of Creation - Venus
  { name: "Alien", rating: "D", price: 10, imageUrl: getCardImageUrl(23064373) }, // Alien Soldier M/Frame
  { name: "Ally of Justice", rating: "F", price: 0, imageUrl: getCardImageUrl(6051314) }, // Ally of Justice Decisive Armor
  { name: "Altergeist", rating: "A", price: 100, imageUrl: getCardImageUrl(1984618) }, // Altergeist Multifaker
  { name: "Amazemment", rating: "C", price: 25, imageUrl: getCardImageUrl(90582792) }, // Amazement Administrator Arlekino
  { name: "Amazoness", rating: "D", price: 10, imageUrl: getCardImageUrl(67987611) }, // Amazoness Queen
  { name: "Amorphage", rating: "D", price: 10, imageUrl: getCardImageUrl(7545997) }, // Amorphage Sloth
  { name: "Ancient Gear", rating: "C", price: 25, imageUrl: getCardImageUrl(10509340) }, // Ancient Gear Golem
  { name: "Ancient Warriors", rating: "B", price: 50, imageUrl: getCardImageUrl(13734034) }, // Ancient Warriors - Loyal Guan Yun
  { name: "Appliancer", rating: "F", price: 0, imageUrl: getCardImageUrl(72475938) }, // Appliancer Electrilyrical World
  { name: "Aquaactress", rating: "F", price: 0, imageUrl: getCardImageUrl(62329294) }, // Aquaactress Guppy
  { name: "Arcana Force", rating: "F", price: 0, imageUrl: getCardImageUrl(6150044) }, // Arcana Force XXI - The World
  { name: "Archfiend", rating: "D", price: 10, imageUrl: getCardImageUrl(58551308) }, // Summoned Skull
  { name: "Armed Dragon", rating: "C", price: 25, imageUrl: getCardImageUrl(87706553) }, // Armed Dragon LV10
  { name: "Aroma", rating: "C", price: 25, imageUrl: getCardImageUrl(92266279) }, // Aromage Jasmine
  { name: "Artifact", rating: "B", price: 50, imageUrl: getCardImageUrl(53639887) }, // Artifact Scythe
  { name: "Artmage", rating: "C", price: 25, imageUrl: getCardImageUrl(27184601) }, // Artmage Diactorus
  { name: "Ashened", rating: "B", price: 50, imageUrl: getCardImageUrl(59019082) }, // Ashened for Eternity
  { name: "Assault Mode", rating: "D", price: 10, imageUrl: getCardImageUrl(61257789) }, // Stardust Dragon/Assault Mode
  { name: "Atlantean", rating: "A", price: 100, imageUrl: getCardImageUrl(29802344) }, // Atlantean Dragoons
  { name: "Batteryman", rating: "D", price: 10, imageUrl: getCardImageUrl(52584282) }, // Batteryman AA
  { name: "Battlewasp", rating: "D", price: 10, imageUrl: getCardImageUrl(94380860) }, // Battlewasp - Hama the Conquering Bow
  { name: "Battlin Boxer", rating: "C", price: 25, imageUrl: getCardImageUrl(21352426) }, // Number 105: Battlin' Boxer Star Cestus
  { name: "Beetrooper", rating: "B", price: 50, imageUrl: getCardImageUrl(51068233) }, // Giant Beetrooper Invincible Atlas
  { name: "Black Luster", rating: "C", price: 25, imageUrl: getCardImageUrl(5405694) }, // Black Luster Soldier
  { name: "Black Rose Dragon", rating: "B", price: 50, imageUrl: getCardImageUrl(73580471) }, // Black Rose Dragon
  { name: "Blackwing", rating: "A", price: 100, imageUrl: getCardImageUrl(14785765) }, // Blackwing - Simoon the Poison Wind
  { name: "Blue-Eyes", rating: "C", price: 25, imageUrl: getCardImageUrl(89631139) }, // Blue-Eyes White Dragon
  { name: "Bounzer", rating: "D", price: 10, imageUrl: getCardImageUrl(26585525) }, // Number 61: Volcasaurus
  { name: "Bujin", rating: "D", price: 10, imageUrl: getCardImageUrl(37742478) }, // Bujinki Ahashima
  { name: "Burning Abyss", rating: "B", price: 50, imageUrl: getCardImageUrl(15341821) }, // Dante, Traveler of the Burning Abyss
  { name: "Buster Blader", rating: "C", price: 25, imageUrl: getCardImageUrl(78193831) }, // Buster Blader
  { name: "Butterspy", rating: "F", price: 0, imageUrl: getCardImageUrl(88580318) }, // Morpho Butterspy
  { name: "Bystial", rating: "S", price: 200, imageUrl: getCardImageUrl(92107604) }, // Bystial Druiswurm
  { name: "Centur-Ion", rating: "S", price: 200, imageUrl: getCardImageUrl(62325062) }, // Centur-Ion Primera
  { name: "Charmer", rating: "C", price: 25, imageUrl: getCardImageUrl(81983656) }, // Hiita the Fire Charmer, Ablaze
  { name: "Chaos", rating: "B", price: 50, imageUrl: getCardImageUrl(72426662) }, // Black Luster Soldier - Envoy of the Beginning
  { name: "Chemicritter", rating: "F", price: 0, imageUrl: getCardImageUrl(79108553) }, // Chemicritter Carbo Crab
  { name: "Chronomaly", rating: "D", price: 10, imageUrl: getCardImageUrl(63125616) }, // Number 33: Chronomaly Machu Mech
  { name: "Chrysalis", rating: "F", price: 0, imageUrl: getCardImageUrl(98189471) }, // Chrysalis Dolphin
  { name: "Cipher", rating: "D", price: 10, imageUrl: getCardImageUrl(24418328) }, // Galaxy-Eyes Cipher Dragon
  { name: "Cloudian", rating: "F", price: 0, imageUrl: getCardImageUrl(89142907) }, // Cloudian - Nimbusman
  { name: "Code Talker", rating: "A", price: 100, imageUrl: getCardImageUrl(1861629) }, // Accesscode Talker
  { name: "Constellar", rating: "C", price: 25, imageUrl: getCardImageUrl(86510128) }, // Constellar Pleiades
  { name: "Crusadia", rating: "B", price: 50, imageUrl: getCardImageUrl(45935582) }, // Crusadia Equimax
  { name: "Crystal Beast", rating: "B", price: 50, imageUrl: getCardImageUrl(52953359) }, // Rainbow Dragon
  { name: "Crystron", rating: "A", price: 100, imageUrl: getCardImageUrl(50588353) }, // Crystron Halqifibrax
  { name: "Cubic", rating: "D", price: 10, imageUrl: getCardImageUrl(30270176) }, // Crimson Nova the Dark Cubic Lord
  { name: "Cyber", rating: "B", price: 50, imageUrl: getCardImageUrl(70095154) }, // Cyber Dragon Infinity
  { name: "Cyberdark", rating: "C", price: 25, imageUrl: getCardImageUrl(32409892) }, // Cyberdark End Dragon
  { name: "Cyber Dragon", rating: "B", price: 50, imageUrl: getCardImageUrl(70095154) }, // Cyber Dragon Infinity
  { name: "D.D.", rating: "D", price: 10, imageUrl: getCardImageUrl(15939229) }, // D.D. Warrior Lady
  { name: "D/D", rating: "B", price: 50, imageUrl: getCardImageUrl(56665521) }, // D/D/D Flame King Genghis
  { name: "Danger!", rating: "B", price: 50, imageUrl: getCardImageUrl(45513819) }, // Danger!? Jackalope?
  { name: "Darklord", rating: "C", price: 25, imageUrl: getCardImageUrl(76901856) }, // Darklord Ixchel
  { name: "Dark Magician", rating: "C", price: 25, imageUrl: getCardImageUrl(46986414) }, // Dark Magician
  { name: "Dark Scorpion", rating: "F", price: 0, imageUrl: getCardImageUrl(68871309) }, // Don Zaloog
  { name: "Dark World", rating: "A", price: 100, imageUrl: getCardImageUrl(26883643) }, // Grapha, Dragon Lord of Dark World
  { name: "Deep Sea", rating: "B", price: 50, imageUrl: getCardImageUrl(43096270) }, // Deep Sea Diva
  { name: "Deskbot", rating: "D", price: 10, imageUrl: getCardImageUrl(44749927) }, // Deskbot 003
  { name: "Despia", rating: "S", price: 200, imageUrl: getCardImageUrl(33909817) }, // Despian Quaeritis
  { name: "Destiny Hero", rating: "A", price: 100, imageUrl: getCardImageUrl(60461804) }, // Destiny HERO - Destroyer Phoenix Enforcer
  { name: "Digital Bug", rating: "F", price: 0, imageUrl: getCardImageUrl(21286575) }, // Digital Bug Corebage
  { name: "Dinomist", rating: "D", price: 10, imageUrl: getCardImageUrl(52544156) }, // Dinomist Rex
  { name: "Dinomorphia", rating: "A", price: 100, imageUrl: getCardImageUrl(92798873) }, // Dinomorphia Therizia
  { name: "Dinowrestler", rating: "F", price: 0, imageUrl: getCardImageUrl(40546238) }, // Dinowrestler Pankratops
  { name: "Dododo", rating: "D", price: 10, imageUrl: getCardImageUrl(70946699) }, // Dododo Warrior
  { name: "Dogmatika", rating: "A", price: 100, imageUrl: getCardImageUrl(95679145) }, // Dogmatika Ecclesia, the Virtuous
  { name: "Doodle Beast", rating: "F", price: 0, imageUrl: getCardImageUrl(31230289) }, // Doodle Beast - Stego
  { name: "DoomZ", rating: "C", price: 25, imageUrl: getCardImageUrl(95626382) }, // DoomZ XII End - Drastrius
  { name: "Dracoslayer", rating: "A", price: 100, imageUrl: getCardImageUrl(65711558) }, // Luster Pendulum, the Dracoslayer
  { name: "Dracotail", rating: "B", price: 50, imageUrl: getCardImageUrl(33760966) }, // Dracotail Arthalion
  { name: "Dragon Ruler", rating: "C", price: 25, imageUrl: getCardImageUrl(69610924) }, // Blaster, Dragon Ruler of Infernos
  { name: "Dragonmaid", rating: "B", price: 50, imageUrl: getCardImageUrl(36905639) }, // Dragonmaid Sheou
  { name: "Dragunity", rating: "B", price: 50, imageUrl: getCardImageUrl(22456768) }, // Dragunity Knight - Gae Dearg
  { name: "Dream Mirror", rating: "D", price: 10, imageUrl: getCardImageUrl(78662923) }, // Dream Mirror of Joy
  { name: "Drytron", rating: "A", price: 100, imageUrl: getCardImageUrl(22398665) }, // Drytron Mu Beta Fafnir
  { name: "Dual Avatar", rating: "D", price: 10, imageUrl: getCardImageUrl(74801968) }, // Dual Avatar - Empowered Kon-Gyo
  { name: "Duston", rating: "F", price: 0, imageUrl: getCardImageUrl(2947913) }, // House Duston
  { name: "Earthbound", rating: "D", price: 10, imageUrl: getCardImageUrl(91712985) }, // Earthbound Immortal Ccapac Apu
  { name: "Edge Imp", rating: "C", price: 25, imageUrl: getCardImageUrl(59203905) }, // Edge Imp Sabres
  { name: "Edlich", rating: "A", price: 100, imageUrl: getCardImageUrl(2530830) }, // Eldlich the Golden Lord
  { name: "Elemental Hero", rating: "B", price: 50, imageUrl: getCardImageUrl(35809262) }, // Elemental HERO Neos
  { name: "Elementsaber", rating: "D", price: 10, imageUrl: getCardImageUrl(55102269) }, // Elementsaber Molehu
  { name: "Empowered Warrior", rating: "F", price: 0, imageUrl: getCardImageUrl(58649699) }, // Empowered Warrior - Arnis
  { name: "Endymion", rating: "A", price: 100, imageUrl: getCardImageUrl(40732515) }, // Endymion, the Mighty Master of Magic
  { name: "Enneacraft", rating: "C", price: 25, imageUrl: getCardImageUrl(54842941) }, // Enneacraft - Atori.MAR
  { name: "Evil Eye", rating: "B", price: 50, imageUrl: getCardImageUrl(83389291) }, // Serziel, Watcher of the Evil Eye
  { name: "Evil Hero", rating: "B", price: 50, imageUrl: getCardImageUrl(87132491) }, // Evil HERO Malicious Bane
  { name: "Evil Twin / Live Twin", rating: "A", price: 100, imageUrl: getCardImageUrl(79965360) }, // Evil★Twin Ki-sikil
  { name: "Evilswarm", rating: "D", price: 10, imageUrl: getCardImageUrl(72107190) }, // Evilswarm Ophion
  { name: "Evoltile", rating: "F", price: 0, imageUrl: getCardImageUrl(14391920) }, // Evolzar Dolkka
  { name: "Exosister", rating: "A", price: 100, imageUrl: getCardImageUrl(39084753) }, // Exosister Elis
  { name: "Eyes Restrict", rating: "C", price: 25, imageUrl: getCardImageUrl(4551290) }, // Millennium-Eyes Restrict
  { name: "Fabled", rating: "D", price: 10, imageUrl: getCardImageUrl(99188141) }, // The Fabled Unicore
  { name: "Face Cards", rating: "D", price: 10, imageUrl: getCardImageUrl(14816857) }, // King's Knight
  { name: "F.A.", rating: "D", price: 10, imageUrl: getCardImageUrl(23950192) }, // F.A. Motorhome Transport
  { name: "Fairy Tail", rating: "C", price: 25, imageUrl: getCardImageUrl(17499454) }, // Fairy Tail - Snow
  { name: "Familiar-Possessed", rating: "C", price: 25, imageUrl: getCardImageUrl(48788985) }, // Familiar-Possessed - Hiita
  { name: "Fiendsmith", rating: "B", price: 50, imageUrl: getCardImageUrl(2463794) }, // Fiendsmith's Requiem
  { name: "Brotherhood of the Fire Fist", rating: "C", price: 25, imageUrl: getCardImageUrl(25974644) }, // Brotherhood of the Fire Fist - Tiger King
  { name: "Fire King", rating: "S", price: 200, imageUrl: getCardImageUrl(12375043) }, // Fire King High Avatar Garunix
  { name: "Fire Warrior", rating: "D", price: 10, imageUrl: getCardImageUrl(66766616) }, // Flame Swordsman
  { name: "Flame Swordsman", rating: "D", price: 10, imageUrl: getCardImageUrl(66766616) }, // Flame Swordsman
  { name: "Flamvell", rating: "F", price: 0, imageUrl: getCardImageUrl(52335694) }, // Flamvell Firedog
  { name: "Fleur", rating: "B", price: 50, imageUrl: getCardImageUrl(80223393) }, // Sorciere de Fleur
  { name: "Floowandereeze", rating: "A", price: 100, imageUrl: getCardImageUrl(52015072) }, // Floowandereeze & Robina
  { name: "Flower Cardian", rating: "F", price: 0, imageUrl: getCardImageUrl(67952296) }, // Flower Cardian Lightshower
  { name: "Fluffal", rating: "B", price: 50, imageUrl: getCardImageUrl(18144507) }, // Fluffal Bear
  { name: "Forbidden One (Exodia)", rating: "D", price: 10, imageUrl: getCardImageUrl(33396948) }, // Exodia the Forbidden One
  { name: "Fortune Fairy", rating: "D", price: 10, imageUrl: getCardImageUrl(43877193) }, // Fortune Fairy Ann
  { name: "Fortune Lady", rating: "C", price: 25, imageUrl: getCardImageUrl(31791910) }, // Fortune Lady Every
  { name: "Fossil Fusion", rating: "C", price: 25, imageUrl: getCardImageUrl(12829629) }, // Fossil Dragon Skullgar
  { name: "Frightfur", rating: "B", price: 50, imageUrl: getCardImageUrl(34124316) }, // Frightfur Tiger
  { name: "Frog", rating: "B", price: 50, imageUrl: getCardImageUrl(99916754) }, // Toadally Awesome
  { name: "Fur Hire", rating: "C", price: 25, imageUrl: getCardImageUrl(55790359) }, // Folgo, Justice Fur Hire
  { name: "G Golem", rating: "D", price: 10, imageUrl: getCardImageUrl(61668670) }, // G Golem Crystal Heart
  { name: "Gadget", rating: "D", price: 10, imageUrl: getCardImageUrl(86445415) }, // Red Gadget
  { name: "Gagaga", rating: "D", price: 10, imageUrl: getCardImageUrl(12014404) }, // Gagaga Magician
  { name: "Gaia", rating: "C", price: 25, imageUrl: getCardImageUrl(6368038) }, // Gaia the Fierce Knight
  { name: "Galaxy", rating: "B", price: 50, imageUrl: getCardImageUrl(28352947) }, // Galaxy-Eyes Photon Dragon
  { name: "Ganbara", rating: "F", price: 0, imageUrl: getCardImageUrl(3797274) }, // Ganbara Knight
  { name: "Gate Guardian", rating: "C", price: 25, imageUrl: getCardImageUrl(25833572) }, // Gate Guardian
  { name: "Gearfried", rating: "D", price: 10, imageUrl: getCardImageUrl(423705) }, // Gearfried the Iron Knight
  { name: "Geargia", rating: "C", price: 25, imageUrl: getCardImageUrl(36952911) }, // Gear Gigant X
  { name: "Gem-", rating: "B", price: 50, imageUrl: getCardImageUrl(37849889) }, // Gem-Knight Master Diamond
  { name: "Generaider", rating: "A", price: 100, imageUrl: getCardImageUrl(3981282) }, // Harr, Generaider Boss of Storms
  { name: "Genex", rating: "F", price: 0, imageUrl: getCardImageUrl(53701621) }, // Genex Ally Birdman
  { name: "Ghostrick", rating: "C", price: 25, imageUrl: getCardImageUrl(4939890) }, // Ghostrick Alucard
  { name: "Ghoti", rating: "A", price: 100, imageUrl: getCardImageUrl(99901451) }, // Ghoti of the Deep Beyond
  { name: "Gimmick Puppet", rating: "C", price: 25, imageUrl: getCardImageUrl(52653092) }, // Number 15: Gimmick Puppet Giant Grinder
  { name: "Gishki", rating: "B", price: 50, imageUrl: getCardImageUrl(31782758) }, // Evigishki Merrowgeist
  { name: "Glacial Beast", rating: "F", price: 0, imageUrl: getCardImageUrl(43175027) }, // Glacial Beast Blizzard Wolf
  { name: "Gladiator Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(17412721) }, // Gladiator Beast Heraklinos
  { name: "Goblin", rating: "D", price: 10, imageUrl: getCardImageUrl(45894482) }, // Goblin Attack Force
  { name: "Goblin Biker", rating: "B", price: 50, imageUrl: getCardImageUrl(34001672) }, // Goblin Biker Big Gabonga
  { name: "Gogogo", rating: "D", price: 10, imageUrl: getCardImageUrl(41337090) }, // Gogogo Golem
  { name: "Gold Pride", rating: "A", price: 100, imageUrl: getCardImageUrl(17711092) }, // Gold Pride - Captain Carrie
  { name: "Gorgonic", rating: "F", price: 0, imageUrl: getCardImageUrl(59116088) }, // Gorgonic Gargoyle
  { name: "Gouki", rating: "B", price: 50, imageUrl: getCardImageUrl(40636712) }, // Gouki The Great Ogre
  { name: "Goyo", rating: "D", price: 10, imageUrl: getCardImageUrl(84224627) }, // Goyo Guardian
  { name: "Gravekeeper", rating: "C", price: 25, imageUrl: getCardImageUrl(45894482) }, // Gravekeeper's Commandant
  { name: "Graydle", rating: "D", price: 10, imageUrl: getCardImageUrl(26676809) }, // Graydle Dragon
  { name: "Gunkan", rating: "B", price: 50, imageUrl: getCardImageUrl(45513819) }, // Placeholder
  { name: "Gusto", rating: "D", price: 10, imageUrl: getCardImageUrl(25159454) }, // Daigusto Sphreez
  { name: "Harpie", rating: "B", price: 50, imageUrl: getCardImageUrl(80316585) }, // Harpie's Feather Duster
  { name: "Hazy Flame", rating: "F", price: 0, imageUrl: getCardImageUrl(11467854) }, // Hazy Flame Basiltrice
  { name: "Hecahands", rating: "C", price: 25, imageUrl: getCardImageUrl(95365081) }, // Hecahands Ibtel
  { name: "Heraldic Beast", rating: "D", price: 10, imageUrl: getCardImageUrl(8310412) }, // Number 18: Heraldry Patriarch
  { name: "Heroic", rating: "C", price: 25, imageUrl: getCardImageUrl(22404675) }, // Heroic Champion - Excalibur
  { name: "Hieratic", rating: "C", price: 25, imageUrl: getCardImageUrl(88177324) }, // Hieratic Dragon King of Atum
  { name: "Horus", rating: "B", price: 50, imageUrl: getCardImageUrl(89430469) }, // Horus the Black Flame Dragon LV8
  { name: "Ice Barrier", rating: "B", price: 50, imageUrl: getCardImageUrl(50321796) }, // Brionac, Dragon of the Ice Barrier
  { name: "Icejade", rating: "B", price: 50, imageUrl: getCardImageUrl(21652754) }, // Icejade Gymir Aegirine
  { name: "Igknight", rating: "D", price: 10, imageUrl: getCardImageUrl(11665426) }, // Igknight Crusader
  { name: "Ignister", rating: "A", price: 100, imageUrl: getCardImageUrl(45286100) }, // The Arrival Cyberse @Ignister
  { name: "Impcantation", rating: "C", price: 25, imageUrl: getCardImageUrl(64631466) }, // Impcantation Talismandra
  { name: "Infernity", rating: "C", price: 25, imageUrl: getCardImageUrl(10802915) }, // Infernity Archfiend
  { name: "Infernoble", rating: "A", price: 100, imageUrl: getCardImageUrl(4423206) }, // Infernoble Knight - Renaud
  { name: "Infernoid", rating: "B", price: 50, imageUrl: getCardImageUrl(81262671) }, // Infernoid Tierra
  { name: "Infinitrack", rating: "B", price: 50, imageUrl: getCardImageUrl(23935886) }, // Infinitrack Fortress Megaclops
  { name: "Invoked", rating: "A", price: 100, imageUrl: getCardImageUrl(86120751) }, // Aleister the Invoker
  { name: "Inzektor", rating: "C", price: 25, imageUrl: getCardImageUrl(27381364) }, // Inzektor Hornet
  { name: "Iron Chain", rating: "F", price: 0, imageUrl: getCardImageUrl(98612011) }, // Iron Chain Dragon
  { name: "Junk", rating: "B", price: 50, imageUrl: getCardImageUrl(63977008) }, // Junk Warrior
  { name: "Jurrac", rating: "F", price: 0, imageUrl: getCardImageUrl(21263083) }, // Jurrac Meteor
  { name: "K9", rating: "B", price: 50, imageUrl: getCardImageUrl(92248362) }, // K9-17 Izuna
  { name: "Kaiju", rating: "A", price: 100, imageUrl: getCardImageUrl(10389142) }, // Gameciel, the Sea Turtle Kaiju
  { name: "Karakuri", rating: "C", price: 25, imageUrl: getCardImageUrl(23280399) }, // Karakuri Steel Shogun mdl 00X "Bureido"
  { name: "Kashtira", rating: "S", price: 200, imageUrl: getCardImageUrl(9272381) }, // Kashtira Fenrir
  { name: "Kewl Tune", rating: "C", price: 25, imageUrl: getCardImageUrl(16387555) }, // Kewl Tune Cue
  { name: "Knightmare", rating: "A", price: 100, imageUrl: getCardImageUrl(68304193) }, // Knightmare Unicorn
  { name: "Koa'ki Meiru", rating: "D", price: 10, imageUrl: getCardImageUrl(24430813) }, // Koa'ki Meiru Maximus
  { name: "Kozmo", rating: "C", price: 25, imageUrl: getCardImageUrl(24550676) }, // Kozmo Dark Destroyer
  { name: "Krawler", rating: "D", price: 10, imageUrl: getCardImageUrl(56649609) }, // Krawler Soma
  { name: "Kuriboh", rating: "F", price: 0, imageUrl: getCardImageUrl(40640057) }, // Kuriboh
  { name: "Labrynth", rating: "S", price: 200, imageUrl: getCardImageUrl(71490127) }, // Lady Labrynth of the Silver Castle
  { name: "Laval", rating: "D", price: 10, imageUrl: getCardImageUrl(6093970) }, // Laval the Greater
  { name: "Libromancer", rating: "B", price: 50, imageUrl: getCardImageUrl(23211961) }, // Libromancer First Appearance
  { name: "Lightray", rating: "F", price: 0, imageUrl: getCardImageUrl(49904606) }, // Lightray Sorcerer
  { name: "Lightsworn", rating: "B", price: 50, imageUrl: getCardImageUrl(22624373) }, // Judgment Dragon
  { name: "Lswarm", rating: "D", price: 10, imageUrl: getCardImageUrl(72107190) }, // Evilswarm Ophion
  { name: "Lunalight", rating: "B", price: 50, imageUrl: getCardImageUrl(45426429) }, // Lunalight Sabre Dancer
  { name: "Lyrilusc", rating: "A", price: 100, imageUrl: getCardImageUrl(8491961) }, // Lyrilusc - Assembled Nightingale
  { name: "Machina", rating: "B", price: 50, imageUrl: getCardImageUrl(58110717) }, // Machina Fortress
  { name: "Madolche", rating: "A", price: 100, imageUrl: getCardImageUrl(84624099) }, // Madolche Queen Tiaramisu
  { name: "Magical Musket", rating: "B", price: 50, imageUrl: getCardImageUrl(31421177) }, // Magical Musketeer Max
  { name: "Magician", rating: "C", price: 25, imageUrl: getCardImageUrl(46986414) }, // Dark Magician
  { name: "Magikey", rating: "B", price: 50, imageUrl: getCardImageUrl(2637162) }, // Magikey Fiend - Transfurlmine
  { name: "Magistus", rating: "C", price: 25, imageUrl: getCardImageUrl(51608596) }, // Zoroa, the Magistus of Flame
  { name: "Majespecter", rating: "B", price: 50, imageUrl: getCardImageUrl(94664194) }, // Majespecter Unicorn - Kirin
  { name: "Malefic", rating: "D", price: 10, imageUrl: getCardImageUrl(52558805) }, // Malefic Stardust Dragon
  { name: "Maliss", rating: "B", price: 50, imageUrl: getCardImageUrl(69272449) }, // Maliss White Rabbit
  { name: "Mannadium", rating: "S", price: 200, imageUrl: getCardImageUrl(60215682) }, // Mannadium Meek
  { name: "Marincess", rating: "A", price: 100, imageUrl: getCardImageUrl(3199870) }, // Marincess Coral Anemone
  { name: "Masked HERO", rating: "B", price: 50, imageUrl: getCardImageUrl(58481572) }, // Masked HERO Dark Law
  { name: "Materiactor", rating: "D", price: 10, imageUrl: getCardImageUrl(70597485) }, // Materiactor Gigaboros
  { name: "Mathmech", rating: "S", price: 200, imageUrl: getCardImageUrl(14804304) }, // Mathmech Circular
  { name: "Mayakashi", rating: "C", price: 25, imageUrl: getCardImageUrl(4932642) }, // Yuki-Onna, the Absolute Zero Mayakashi
  { name: "Mecha Phantom Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(85318156) }, // Mecha Phantom Beast Dracossack
  { name: "Megalith", rating: "C", price: 25, imageUrl: getCardImageUrl(33334941) }, // Megalith Phul
  { name: "Mekk-Knight", rating: "B", price: 50, imageUrl: getCardImageUrl(70594470) }, // Mekk-Knight Blue Sky
  { name: "Meklord", rating: "D", price: 10, imageUrl: getCardImageUrl(99365553) }, // Meklord Emperor Wisel
  { name: "Melffy", rating: "B", price: 50, imageUrl: getCardImageUrl(31129579) }, // Melffy Mommy
  { name: "Melodious", rating: "B", price: 50, imageUrl: getCardImageUrl(64880894) }, // Bloom Diva the Melodious Choir
  { name: "Memento", rating: "A", price: 100, imageUrl: getCardImageUrl(54550967) }, // Mementotlan Angwitch
  { name: "Mermail", rating: "A", price: 100, imageUrl: getCardImageUrl(74371660) }, // Mermail Abyssmegalo
  { name: "Metalfoes", rating: "B", price: 50, imageUrl: getCardImageUrl(27279764) }, // Metalfoes Mithrilium
  { name: "Metalmorph", rating: "C", price: 25, imageUrl: getCardImageUrl(89812483) }, // Max Metalmorph
  { name: "Metaphys", rating: "D", price: 10, imageUrl: getCardImageUrl(98351855) }, // Metaphys Horus
  { name: "Mikanko", rating: "A", price: 100, imageUrl: getCardImageUrl(76339638) }, // Ohime the Manifested Mikanko
  { name: "Millennium", rating: "C", price: 25, imageUrl: getCardImageUrl(37613663) }, // Millennium Ankh
  { name: "Mimighoul", rating: "B", price: 50, imageUrl: getCardImageUrl(55537983) }, // Mimighoul Master
  { name: "Mist Valley", rating: "D", price: 10, imageUrl: getCardImageUrl(10308470) }, // Mist Valley Apex Avian
  { name: "Mitsurugi", rating: "B", price: 50, imageUrl: getCardImageUrl(19899073) }, // Ame no Murakumo no Mitsurugi
  { name: "Monarch", rating: "C", price: 25, imageUrl: getCardImageUrl(25010609) }, // Erebus the Underworld Monarch
  { name: "Morphtronic", rating: "C", price: 25, imageUrl: getCardImageUrl(45587643) }, // Power Tool Dragon
  { name: "Mystical Beast", rating: "D", price: 10, imageUrl: getCardImageUrl(97317530) }, // Kalantosa, Mystical Beast of the Forest
  { name: "Mystical Space Typhoon", rating: "C", price: 25, imageUrl: getCardImageUrl(5318639) }, // Mystical Space Typhoon
  { name: "Mythical Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(78428103) }, // Mythical Beast Master Cerberus
  { name: "Myutant", rating: "B", price: 50, imageUrl: getCardImageUrl(56805528) }, // Myutant Beast
  { name: "Naturia", rating: "A", price: 100, imageUrl: getCardImageUrl(33198837) }, // Naturia Beast
  { name: "Nekroz", rating: "B", price: 50, imageUrl: getCardImageUrl(90307498) }, // Nekroz of Brionac
  { name: "Nemleria", rating: "C", price: 25, imageUrl: getCardImageUrl(70155677) }, // Dreaming Nemleria
  { name: "Neo-Spacian", rating: "D", price: 10, imageUrl: getCardImageUrl(58932615) }, // Neo-Spacian Glow Moss
  { name: "Neos", rating: "B", price: 50, imageUrl: getCardImageUrl(89943723) }, // Elemental HERO Neos
  { name: "Nemeses", rating: "C", price: 25, imageUrl: getCardImageUrl(78966799) }, // Nemeses Keystone
  { name: "Nephthys", rating: "D", price: 10, imageUrl: getCardImageUrl(61441708) }, // Sacred Phoenix of Nephthys
  { name: "Nimble", rating: "D", price: 10, imageUrl: getCardImageUrl(48919900) }, // Nimble Momonga
  { name: "Ninja", rating: "B", price: 50, imageUrl: getCardImageUrl(88256900) }, // Ninja Grandmaster Hanzo
  { name: "Noble Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(75016135) }, // Noble Knight Brothers
  { name: "Nordic", rating: "D", price: 10, imageUrl: getCardImageUrl(63767246) }, // Odin, Father of the Aesir
  { name: "Nouvelles", rating: "B", price: 50, imageUrl: getCardImageUrl(88890658) }, // Baelgrill de Nouvelles
  { name: "Number", rating: "C", price: 25, imageUrl: getCardImageUrl(39512984) }, // Number 39: Utopia
  { name: "Numeron", rating: "B", price: 50, imageUrl: getCardImageUrl(88177324) }, // Number 1: Numeron Gate Ekam
  { name: "Odd-Eyes", rating: "B", price: 50, imageUrl: getCardImageUrl(16178681) }, // Odd-Eyes Pendulum Dragon
  { name: "Ogdoadic", rating: "C", price: 25, imageUrl: getCardImageUrl(37640707) }, // Ogdoabyss, the Ogdoadic Overlord
  { name: "Orcust", rating: "A", price: 100, imageUrl: getCardImageUrl(30741503) }, // Galatea, the Orcust Automaton
  { name: "Ojama", rating: "D", price: 10, imageUrl: getCardImageUrl(64163367) }, // Ojama King
  { name: "P.U.N.K.", rating: "A", price: 100, imageUrl: getCardImageUrl(56536933) }, // Noh-P.U.N.K. Ze Amin
  { name: "Paleozoic", rating: "B", price: 50, imageUrl: getCardImageUrl(41041015) }, // Paleozoic Anomalocaris
  { name: "Parshath", rating: "C", price: 25, imageUrl: getCardImageUrl(11026303) }, // Airknight Parshath
  { name: "Penguin", rating: "B", price: 50, imageUrl: getCardImageUrl(93920745) }, // Penguin Soldier
  { name: "Performage", rating: "C", price: 25, imageUrl: getCardImageUrl(68319013) }, // Performage Damage Juggler
  { name: "Performapal", rating: "B", price: 50, imageUrl: getCardImageUrl(35929350) }, // Performapal Skullcrobat Joker
  { name: "Phantasm Spiral", rating: "C", price: 25, imageUrl: getCardImageUrl(42625254) }, // Phantasm Spiral Dragon
  { name: "Phantom Beast", rating: "D", price: 10, imageUrl: getCardImageUrl(6007213) }, // Phantom Beast Rock-Lizard
  { name: "Photon", rating: "B", price: 50, imageUrl: getCardImageUrl(28352947) }, // Galaxy-Eyes Photon Dragon
  { name: "Plunder Patroll", rating: "A", price: 100, imageUrl: getCardImageUrl(62858086) }, // Plunder Patrollship Brann
  { name: "Prank-Kids", rating: "B", price: 50, imageUrl: getCardImageUrl(8591267) }, // Prank-Kids Meow-Meow-Mu
  { name: "Predaplant", rating: "B", price: 50, imageUrl: getCardImageUrl(92405064) }, // Predaplant Verte Anaconda
  { name: "Prediction Princess", rating: "D", price: 10, imageUrl: getCardImageUrl(70583269) }, // Prediction Princess Tarotrei
  { name: "Purrely", rating: "S", price: 200, imageUrl: getCardImageUrl(86289965) }, // Purrely
  { name: "PSY-Framegear", rating: "B", price: 50, imageUrl: getCardImageUrl(38517810) }, // PSY-Framelord Omega
  { name: "Psychic", rating: "C", price: 25, imageUrl: getCardImageUrl(97604505) }, // Hyper Psychic Riser
  { name: "Qli", rating: "C", price: 25, imageUrl: getCardImageUrl(90885155) }, // Qliphort Scout
  { name: "R.B.", rating: "B", price: 50, imageUrl: getCardImageUrl(32216688) }, // R.B. The Brute Blues
  { name: "Ragnaraika", rating: "B", price: 50, imageUrl: getCardImageUrl(99153051) }, // Ragnaraika the Evil Seed
  { name: "Raidraptor", rating: "A", price: 100, imageUrl: getCardImageUrl(67805911) }, // Raidraptor - Ultimate Falcon
  { name: "Red-Eyes", rating: "C", price: 25, imageUrl: getCardImageUrl(74677422) }, // Red-Eyes Black Dragon
  { name: "Regenesis", rating: "B", price: 50, imageUrl: getCardImageUrl(22812963) }, // Regenesis Lord
  { name: "Reptilianne", rating: "C", price: 25, imageUrl: getCardImageUrl(29119130) }, // Reptilianne Coatl
  { name: "Rescue-ACE", rating: "S", price: 200, imageUrl: getCardImageUrl(39149096) }, // Rescue-ACE Turbulence
  { name: "Resonator", rating: "B", price: 50, imageUrl: getCardImageUrl(28039460) }, // Red Rising Dragon
  { name: "Rikka", rating: "A", price: 100, imageUrl: getCardImageUrl(39370594) }, // Rikka Queen Strenna
  { name: "Risebell", rating: "D", price: 10, imageUrl: getCardImageUrl(45103815) }, // Risebell the Summoner
  { name: "Ritual Beast", rating: "C", price: 25, imageUrl: getCardImageUrl(77538911) }, // Ritual Beast Ulti-Cannahawk
  { name: "Roid", rating: "D", price: 10, imageUrl: getCardImageUrl(65957473) }, // Jumbo Drill
  { name: "Rokket", rating: "A", price: 100, imageUrl: getCardImageUrl(62873545) }, // Borreload Dragon
  { name: "Rose", rating: "C", price: 25, imageUrl: getCardImageUrl(73580471) }, // Black Rose Dragon
  { name: "Runick", rating: "A", price: 100, imageUrl: getCardImageUrl(87999632) }, // Hugin the Runick Wings
  { name: "Ryu-Ge", rating: "B", price: 50, imageUrl: getCardImageUrl(92487128) }, // Sosei Ryu-Ge Mistva
  { name: "Ryzeal", rating: "B", price: 50, imageUrl: getCardImageUrl(34909328) }, // Ryzeal Detonator
  { name: "Sangen", rating: "C", price: 25, imageUrl: getCardImageUrl(18969888) }, // Sangenpai Transcendent Dragion
  { name: "S-Force", rating: "C", price: 25, imageUrl: getCardImageUrl(37629703) }, // S-Force Chase
  { name: "Salamangreat", rating: "A", price: 100, imageUrl: getCardImageUrl(55622560) }, // Salamangreat Balelynx
  { name: "Scareclaw", rating: "A", price: 100, imageUrl: getCardImageUrl(55124257) }, // Scareclaw Tri-Heart
  { name: "Scrap", rating: "C", price: 25, imageUrl: getCardImageUrl(93537012) }, // Scrap Dragon
  { name: "Shaddoll", rating: "A", price: 100, imageUrl: getCardImageUrl(74822425) }, // El Shaddoll Construct
  { name: "Shark", rating: "B", price: 50, imageUrl: getCardImageUrl(87511638) }, // Number 101: Silent Honor ARK
  { name: "Shining Sarcophagus", rating: "B", price: 50, imageUrl: getCardImageUrl(79791878) }, // Shining Sarcophagus
  { name: "Shinobird", rating: "D", price: 10, imageUrl: getCardImageUrl(13510476) }, // Shinobaroness Peacock
  { name: "Shiranui", rating: "C", price: 25, imageUrl: getCardImageUrl(65681983) }, // Shiranui Sunsaga
  { name: "Silent Magician", rating: "C", price: 25, imageUrl: getCardImageUrl(72443568) }, // Silent Magician
  { name: "Silent Swordsman", rating: "C", price: 25, imageUrl: getCardImageUrl(43722862) }, // Silent Swordsman
  { name: "Simorgh", rating: "D", price: 10, imageUrl: getCardImageUrl(14989021) }, // Simorgh, Bird of Sovereignty
  { name: "Sinful Spoils", rating: "S", price: 200, imageUrl: getCardImageUrl(80845034) }, // WANTED: Seeker of Sinful Spoils
  { name: "Six Samurai", rating: "C", price: 25, imageUrl: getCardImageUrl(2511717) }, // Legendary Six Samurai - Shi En
  { name: "Skull Servant", rating: "C", price: 25, imageUrl: getCardImageUrl(32274490) }, // King of the Skull Servants
  { name: "Sky Striker", rating: "A", price: 100, imageUrl: getCardImageUrl(63288573) }, // Sky Striker Ace - Raye
  { name: "Snake-Eye", rating: "S", price: 200, imageUrl: getCardImageUrl(59460374) }, // Snake-Eye Ash
  { name: "Solfachord", rating: "C", price: 25, imageUrl: getCardImageUrl(52212128) }, // DoReMi Solfachord Coolia
  { name: "Speedroid", rating: "B", price: 50, imageUrl: getCardImageUrl(85852291) }, // Crystal Wing Synchro Dragon
  { name: "Spellbook", rating: "C", price: 25, imageUrl: getCardImageUrl(89631139) }, // Spellbook of Secrets
  { name: "Spellcaster", rating: "C", price: 25, imageUrl: getCardImageUrl(46986414) }, // Dark Magician
  { name: "Sphinx", rating: "D", price: 10, imageUrl: getCardImageUrl(4931562) }, // Theinen the Great Sphinx
  { name: "Springan", rating: "B", price: 50, imageUrl: getCardImageUrl(21887175) }, // Springans Ship - Exblowrer
  { name: "Spyral", rating: "B", price: 50, imageUrl: getCardImageUrl(17692067) }, // SPYRAL Super Agent
  { name: "Spright", rating: "S", price: 200, imageUrl: getCardImageUrl(72656408) }, // Spright Blue
  { name: "Star Seraph", rating: "D", price: 10, imageUrl: getCardImageUrl(38331564) }, // Star Seraph Scepter
  { name: "Starry Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(95816359) }, // Starry Night, Starry Dragon
  { name: "Steelswarm", rating: "D", price: 10, imageUrl: getCardImageUrl(30495779) }, // Steelswarm Hercules
  { name: "Subterror", rating: "B", price: 50, imageUrl: getCardImageUrl(41909653) }, // Subterror Guru
  { name: "Sunavalon", rating: "A", price: 100, imageUrl: getCardImageUrl(61649111) }, // Sunavalon Dryas
  { name: "Superheavy Samurai", rating: "A", price: 100, imageUrl: getCardImageUrl(93189170) }, // Superheavy Samurai Big Benkei
  { name: "Supreme King", rating: "B", price: 50, imageUrl: getCardImageUrl(23064373) }, // Supreme King Dragon Darkwurm
  { name: "Swordsoul", rating: "A", price: 100, imageUrl: getCardImageUrl(4810828) }, // Swordsoul Grandmaster - Chixiao
  { name: "Sylvan", rating: "D", price: 10, imageUrl: getCardImageUrl(10530913) }, // Sylvan Sagequoia
  { name: "Symphonic Warrior", rating: "D", price: 10, imageUrl: getCardImageUrl(85663174) }, // Symphonic Warrior Guitaar
  { name: "Synchron", rating: "B", price: 50, imageUrl: getCardImageUrl(63977008) }, // Junk Warrior
  { name: "Tearlaments", rating: "S", price: 200, imageUrl: getCardImageUrl(81733838) }, // Tearlaments Kitkallos
  { name: "Tellarknight", rating: "C", price: 25, imageUrl: getCardImageUrl(22171189) }, // Stellarknight Delteros
  { name: "Tenyi", rating: "A", price: 100, imageUrl: getCardImageUrl(87052196) }, // Tenyi Spirit - Vishuda
  { name: "T.G.", rating: "B", price: 50, imageUrl: getCardImageUrl(72012029) }, // T.G. Hyper Librarian
  { name: "The Agent", rating: "B", price: 50, imageUrl: getCardImageUrl(91188343) }, // The Agent of Creation - Venus
  { name: "The Phantom Knights", rating: "A", price: 100, imageUrl: getCardImageUrl(2857636) }, // The Phantom Knights of Break Sword
  { name: "The Weather", rating: "B", price: 50, imageUrl: getCardImageUrl(51892507) }, // The Weather Painter Rainbow
  { name: "Therion", rating: "A", price: 100, imageUrl: getCardImageUrl(71832012) }, // Therion "King" Regulus
  { name: "Thunder Dragon", rating: "B", price: 50, imageUrl: getCardImageUrl(21214648) }, // Thunder Dragon Colossus
  { name: "Time Thief", rating: "B", price: 50, imageUrl: getCardImageUrl(55285840) }, // Time Thief Redoer
  { name: "Timelord", rating: "C", price: 25, imageUrl: getCardImageUrl(67493622) }, // Lazion, the Timelord
  { name: "Tindangle", rating: "D", price: 10, imageUrl: getCardImageUrl(59438930) }, // Tindangle Acute Cerberus
  { name: "Tistina", rating: "C", price: 25, imageUrl: getCardImageUrl(86999951) }, // Crystal God Tistina
  { name: "Toon", rating: "C", price: 25, imageUrl: getCardImageUrl(15259703) }, // Toon Dark Magician
  { name: "Toy", rating: "C", price: 25, imageUrl: getCardImageUrl(65504487) }, // Toy Soldier
  { name: "Traptrix", rating: "A", price: 100, imageUrl: getCardImageUrl(2956282) }, // Traptrix Sera
  { name: "Triamid", rating: "C", price: 25, imageUrl: getCardImageUrl(98283955) }, // Triamid Sphinx
  { name: "Tri-Brigade", rating: "A", price: 100, imageUrl: getCardImageUrl(92326786) }, // Tri-Brigade Shuraig the Ominous Omen
  { name: "Trickstar", rating: "B", price: 50, imageUrl: getCardImageUrl(18440051) }, // Trickstar Holly Angel
  { name: "True King", rating: "C", price: 25, imageUrl: getCardImageUrl(52340444) }, // True King of All Calamities
  { name: "Twilightsworn", rating: "C", price: 25, imageUrl: getCardImageUrl(45425051) }, // Lumina, Twilightsworn Shaman
  { name: "U.A.", rating: "C", price: 25, imageUrl: getCardImageUrl(97445262) }, // U.A. Mighty Slugger
  { name: "Unchained", rating: "S", price: 200, imageUrl: getCardImageUrl(13494) }, // Unchained Abomination
  { name: "Ursarctic", rating: "C", price: 25, imageUrl: getCardImageUrl(93872921) }, // Ursarctic Septentrion
  { name: "Utopia", rating: "B", price: 50, imageUrl: getCardImageUrl(39512984) }, // Number 39: Utopia
  { name: "Vaalmonica", rating: "B", price: 50, imageUrl: getCardImageUrl(3048768) }, // Angello Vaalmonica
  { name: "Vampire", rating: "C", price: 25, imageUrl: getCardImageUrl(59575939) }, // Vampire Lord
  { name: "Vanquish Soul", rating: "S", price: 200, imageUrl: getCardImageUrl(38352607) }, // Vanquish Soul Razen
  { name: "Vassal", rating: "D", price: 10, imageUrl: getCardImageUrl(59808784) }, // Berlineth the Firestorm Vassal
  { name: "Vaylantz", rating: "A", price: 100, imageUrl: getCardImageUrl(41875100) }, // Vaylantz World - Shinra Bansho
  { name: "Vendread", rating: "C", price: 25, imageUrl: getCardImageUrl(78316831) }, // Vendread Battlelord
  { name: "Venom", rating: "D", price: 10, imageUrl: getCardImageUrl(28563545) }, // Vennominaga the Deity of Poisonous Snakes
  { name: "Virtual World", rating: "B", price: 50, imageUrl: getCardImageUrl(11510448) }, // Virtual World Gate - Qinglong
  { name: "Visas Starfrost", rating: "A", price: 100, imageUrl: getCardImageUrl(5665661) }, // Visas Starfrost
  { name: "Vision HERO", rating: "B", price: 50, imageUrl: getCardImageUrl(47732619) }, // Vision HERO Faris
  { name: "Voiceless Voice", rating: "S", price: 200, imageUrl: getCardImageUrl(3232684) }, // Lo, the Prayers of the Voiceless Voice
  { name: "Volcanic", rating: "A", price: 100, imageUrl: getCardImageUrl(54991569) }, // Volcanic Doomfire
  { name: "Vylon", rating: "D", price: 10, imageUrl: getCardImageUrl(17403969) }, // Vylon Omega
  { name: "War Rock", rating: "D", price: 10, imageUrl: getCardImageUrl(87630389) }, // War Rock Fortia
  { name: "Watt", rating: "D", price: 10, imageUrl: getCardImageUrl(81605604) }, // Wattgiraffe
  { name: "White Forest", rating: "B", price: 50, imageUrl: getCardImageUrl(14307929) }, // Diabell, Queen of the White Forest
  { name: "Wind-up", rating: "C", price: 25, imageUrl: getCardImageUrl(48739166) }, // Wind-Up Rabbit
  { name: "Windwitch", rating: "B", price: 50, imageUrl: getCardImageUrl(14471899) }, // Windwitch - Ice Bell
  { name: "Witchcrafter", rating: "B", price: 50, imageUrl: getCardImageUrl(80560969) }, // Witchcrafter Madame Verre
  { name: "World Chalice", rating: "C", price: 25, imageUrl: getCardImageUrl(19950507) }, // Imduk the World Chalice Dragon
  { name: "World Legacy", rating: "B", price: 50, imageUrl: getCardImageUrl(42201154) }, // World Legacy Guardragon Mardark
  { name: "Worm", rating: "D", price: 10, imageUrl: getCardImageUrl(54866514) }, // Worm Zero
  { name: "Xtra HERO", rating: "B", price: 50, imageUrl: getCardImageUrl(50076009) }, // Xtra HERO Cross Crusader
  { name: "Xyz", rating: "C", price: 25, imageUrl: getCardImageUrl(39512984) }, // Number 39: Utopia
  { name: "X-Saber", rating: "C", price: 25, imageUrl: getCardImageUrl(45206713) }, // XX-Saber Gottoms
  { name: "Yang Zing", rating: "C", price: 25, imageUrl: getCardImageUrl(66498018) }, // Baxia, Brightness of the Yang Zing
  { name: "Yosenju", rating: "C", price: 25, imageUrl: getCardImageUrl(65247798) }, // Mayosenju Daibak
  { name: "Yubel", rating: "A", price: 100, imageUrl: getCardImageUrl(78371393) }, // Yubel
  { name: "Yummy", rating: "C", price: 25, imageUrl: getCardImageUrl(30581601) }, // Yummy★Snatchy
  { name: "Zefra", rating: "B", price: 50, imageUrl: getCardImageUrl(19260656) }, // Zefraath
  { name: "Zombie", rating: "A", price: 100, imageUrl: getCardImageUrl(51570882) }, // Doomking Balerdroch
  { name: "Zoodiac", rating: "B", price: 50, imageUrl: getCardImageUrl(48905153) }, // Zoodiac Drident
  { name: "Zubaba", rating: "D", price: 10, imageUrl: getCardImageUrl(43129306) }, // Zubaba Knight
  { name: "ZW -", rating: "D", price: 10, imageUrl: getCardImageUrl(49705790) }, // ZW - Unicorn Spear
  { name: "Blue-Eyes White Dragon", rating: "C", price: 25, imageUrl: getCardImageUrl(89631139) }, // Blue-Eyes White Dragon
  { name: "Gaia The Fierce Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(6368038) }, // Gaia The Fierce Knight
  { name: "Celtic Guard", rating: "D", price: 10, imageUrl: getCardImageUrl(39507162) }, // Celtic Guardian
  { name: "Umi", rating: "C", price: 25, imageUrl: getCardImageUrl(22702055) }, // Umi
  { name: "Trap Hole", rating: "B", price: 50, imageUrl: getCardImageUrl(4206964) }, // Trap Hole
  { name: "Fusion", rating: "C", price: 25, imageUrl: getCardImageUrl(24094653) }, // Polymerization
  { name: "Red-Eyes Black Dragon", rating: "C", price: 25, imageUrl: getCardImageUrl(74677422) }, // Red-Eyes Black Dragon
  { name: "Pot of Greed", rating: "F", price: 0, imageUrl: getCardImageUrl(55144522) }, // Pot of Greed
  { name: "Battleguard", rating: "D", price: 10, imageUrl: getCardImageUrl(47303359) }, // Swamp Battleguard
  { name: "Summoned Skull", rating: "C", price: 25, imageUrl: getCardImageUrl(70781052) }, // Summoned Skull
  { name: "Jinzo", rating: "C", price: 25, imageUrl: getCardImageUrl(77585513) }, // Jinzo
  { name: "Gun Dragons - Barrel Dragon", rating: "C", price: 25, imageUrl: getCardImageUrl(81480460) }, // Barrel Dragon
  { name: "Solemn Cards", rating: "S", price: 200, imageUrl: getCardImageUrl(41420027) }, // Solemn Judgment
  { name: "Mirror Force", rating: "B", price: 50, imageUrl: getCardImageUrl(44095762) }, // Mirror Force
  { name: "Ritual", rating: "C", price: 25, imageUrl: getCardImageUrl(64631466) }, // Placeholder
  { name: "Relinquished", rating: "C", price: 25, imageUrl: getCardImageUrl(64631466) }, // Relinquished
  { name: "Jar", rating: "D", price: 10, imageUrl: getCardImageUrl(34469589) }, // Morphing Jar
  { name: "The Legendary Fisherman", rating: "C", price: 25, imageUrl: getCardImageUrl(3643300) }, // The Legendary Fisherman
  { name: "Gradius - Spaceships", rating: "D", price: 10, imageUrl: getCardImageUrl(10992251) }, // Gradius
  { name: "Slime", rating: "C", price: 25, imageUrl: getCardImageUrl(41392891) }, // Jam Breeding Machine
  { name: "Masked Beast", rating: "D", price: 10, imageUrl: getCardImageUrl(49064413) }, // The Masked Beast
  { name: "Dark Necrofear", rating: "C", price: 25, imageUrl: getCardImageUrl(31829185) }, // Dark Necrofear
  { name: "Destiny Board", rating: "D", price: 10, imageUrl: getCardImageUrl(94212438) }, // Destiny Board
  { name: "Spirit", rating: "D", price: 10, imageUrl: getCardImageUrl(30316964) }, // Yata-Garasu
  { name: "Magician Girl", rating: "C", price: 25, imageUrl: getCardImageUrl(38033121) }, // Dark Magician Girl
  { name: "X-Y-Z Union", rating: "C", price: 25, imageUrl: getCardImageUrl(65622692) }, // XYZ-Dragon Cannon
  { name: "Koala", rating: "D", price: 10, imageUrl: getCardImageUrl(42129512) }, // Big Koala
  { name: "Guardians", rating: "D", price: 10, imageUrl: getCardImageUrl(89272878) }, // Guardian Eatos
  { name: "Maju", rating: "C", price: 25, imageUrl: getCardImageUrl(98094467) }, // Maju Garzett
  { name: "Zera", rating: "D", price: 10, imageUrl: getCardImageUrl(69123138) }, // Zera the Mant
  { name: "B.E.S.", rating: "C", price: 25, imageUrl: getCardImageUrl(44330098) }, // B.E.S. Big Core
  { name: "Mokey Mokey", rating: "F", price: 0, imageUrl: getCardImageUrl(27288416) }, // Mokey Mokey
  { name: "Chthonian", rating: "D", price: 10, imageUrl: getCardImageUrl(39618779) }, // Chthonian Soldier
  { name: "End of the World", rating: "C", price: 25, imageUrl: getCardImageUrl(91949988) }, // End of the World
  { name: "Majestic Mech", rating: "D", price: 10, imageUrl: getCardImageUrl(39012891) }, // Majestic Mech - Goryu
  { name: "Counter Trap Fairies", rating: "B", price: 50, imageUrl: getCardImageUrl(51408546) }, // Counter Gate
  { name: "Gemini", rating: "D", price: 10, imageUrl: getCardImageUrl(97392604) }, // Gigaplant
  { name: "Bamboo Sword", rating: "D", price: 10, imageUrl: getCardImageUrl(23456620) }, // Broken Bamboo Sword
  { name: "Felgrand", rating: "C", price: 25, imageUrl: getCardImageUrl(25533642) }, // Divine Dragon Lord Felgrand
  { name: "Attribute Knight", rating: "D", price: 10, imageUrl: getCardImageUrl(54478211) }, // Armageddon Knight
  { name: "Magnet Warrior", rating: "C", price: 25, imageUrl: getCardImageUrl(89399912) }, // Valkyrion the Magna Warrior
  { name: "Reactor", rating: "D", price: 10, imageUrl: getCardImageUrl(49587034) }, // Flying Fortress SKY FIRE
  { name: "Puppet", rating: "D", price: 10, imageUrl: getCardImageUrl(15001619) }, // Puppet Queen
  { name: "Jester", rating: "D", price: 10, imageUrl: getCardImageUrl(62503101) }, // Jester Confit
  { name: "Dinossaur", rating: "C", price: 25, imageUrl: getCardImageUrl(52038441) }, // Ultimate Conductor Tyranno
  { name: "Spider", rating: "D", price: 10, imageUrl: getCardImageUrl(17494901) }, // Spider Web
  { name: "Baboons", rating: "D", price: 10, imageUrl: getCardImageUrl(46801932) }, // Green Baboon, Defender of the Forest
  { name: "Clear World", rating: "D", price: 10, imageUrl: getCardImageUrl(68996298) }, // Clear World
  { name: "Inca", rating: "D", price: 10, imageUrl: getCardImageUrl(25397377) }, // Sun Dragon Inti
  { name: "Temple of the Kings", rating: "C", price: 25, imageUrl: getCardImageUrl(29762407) }, // Temple of the Kings
  { name: "Wicked Gods", rating: "C", price: 25, imageUrl: getCardImageUrl(82219645) }, // The Wicked Avatar
  { name: "Egyptian Gods", rating: "C", price: 25, imageUrl: getCardImageUrl(89631139) }, // Obelisk the Tormentor
  { name: "Crashbug", rating: "F", price: 0, imageUrl: getCardImageUrl(86804246) }, // Super Crashbug
  { name: "Hunder", rating: "D", price: 10, imageUrl: getCardImageUrl(41420027) }, // Vylon Disigma
  { name: "Railway / Trains", rating: "A", price: 100, imageUrl: getCardImageUrl(35094006) }, // Superdreadnought Rail Cannon Gustav Max
  // { name: "Sparrow Family", rating: "F", price: 0, imageUrl: getCardImageUrl(46986414) }, // OCG Only - No TCG Release
  { name: "Malicevorous", rating: "D", price: 10, imageUrl: getCardImageUrl(5911493) }, // Malicevorous Fork
  { name: "Legendary Knight", rating: "C", price: 25, imageUrl: getCardImageUrl(68796350) }, // Legendary Knight Timaeus
  { name: "Legendary Dragon", rating: "C", price: 25, imageUrl: getCardImageUrl(46232525) }, // The Claw of Hermos
  { name: "Hand", rating: "B", price: 50, imageUrl: getCardImageUrl(55256016) }, // Fire Hand
  { name: "Dragoons of Draconia", rating: "D", price: 10, imageUrl: getCardImageUrl(78015762) }, // Dragoons of Draconia
  { name: "Clear Wing Dragon", rating: "B", price: 50, imageUrl: getCardImageUrl(82044279) }, // Clear Wing Synchro Dragon
  { name: "Elder Entity", rating: "C", price: 25, imageUrl: getCardImageUrl(20590513) }, // Elder Entity N'tss
  { name: "Steel Cavalry", rating: "D", price: 10, imageUrl: getCardImageUrl(2396042) }, // Steel Cavalry of Dinon
  { name: "Twilight Ninja", rating: "C", price: 25, imageUrl: getCardImageUrl(21375642) }, // Twilight Ninja Getsuga, the Shogun
  { name: "Super Quant", rating: "B", price: 50, imageUrl: getCardImageUrl(20366274) }, // Super Quantal Mech King Great Magnus
  { name: "Dracoverlord", rating: "B", price: 50, imageUrl: getCardImageUrl(81439173) }, // Amorphage Goliath
  { name: "Aether", rating: "C", price: 25, imageUrl: getCardImageUrl(80344569) }, // Aether, the Evil Empowering Dragon
  { name: "Legendary Planet", rating: "D", price: 10, imageUrl: getCardImageUrl(52605700) }, // The Tyrant Neptune
  { name: "Electromagnet Warrior", rating: "C", price: 25, imageUrl: getCardImageUrl(15006126) }, // Berserkion the Electromagna Warrior
  { name: "White Aura", rating: "C", price: 25, imageUrl: getCardImageUrl(72413000) }, // White Aura Whale
  { name: "Borrel", rating: "A", price: 100, imageUrl: getCardImageUrl(62873545) }, // Borreload Dragon
  // { name: "Martial Arts Spirits", rating: "D", price: 10, imageUrl: getCardImageUrl(46986414) }, // OCG Only - No TCG Release
  { name: "Topologic", rating: "A", price: 100, imageUrl: getCardImageUrl(23935886) }, // Topologic Bomber Dragon
  { name: "Cataclysmic", rating: "D", price: 10, imageUrl: getCardImageUrl(62850093) }, // Cataclysmic Circumpolar Chilblainia
  { name: "Fossil Warrior", rating: "C", price: 25, imageUrl: getCardImageUrl(12829629) }, // Fossil Dragon Skullgar
  { name: "Vernusylph", rating: "A", price: 100, imageUrl: getCardImageUrl(37897148) }, // Vernusylph of the Flourishing Hills
  { name: "Ancient Treasure", rating: "D", price: 10, imageUrl: getCardImageUrl(7903368) }, // Crystal Skull
  { name: "Bolt Star", rating: "D", price: 10, imageUrl: getCardImageUrl(99991455) }, // Raijin the Breakbolt Star
  { name: "Transcendosaurus", rating: "C", price: 25, imageUrl: getCardImageUrl(31241087) }, // Transcendosaurus Meteorus
  { name: "Illusion", rating: "B", price: 50, imageUrl: getCardImageUrl(38264974) }, // Chimera the Illusion Beast
  { name: "King's Sarcophagus", rating: "A", price: 100, imageUrl: getCardImageUrl(16528181) }, // King's Sarcophagus
  { name: "Earthbound Servant", rating: "C", price: 25, imageUrl: getCardImageUrl(71101678) }, // Earthbound Servant Geo Grasha
  { name: "Veda", rating: "C", price: 25, imageUrl: getCardImageUrl(40785230) }, // Veda Kalarcanum
  { name: "Tenpai", rating: "S", price: 200, imageUrl: getCardImageUrl(39931513) }, // Tenpai Dragon Paidra
  { name: "Max Metalmorph", rating: "C", price: 25, imageUrl: getCardImageUrl(29157292) }, // Metal Illusionist
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
