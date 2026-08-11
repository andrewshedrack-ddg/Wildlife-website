// scan.js - Wildlife Scan with Voice, AI Simulation, and Read-Aloud
// Camera-fixed, comprehensive DB, localStorage flow, smart filename matching

const WildlifeScan = {
  els: {},
  recognition: null,
  isListening: false,
  currentResult: null,
  lastInputSource: null,
  tfModel: null,
  labelToSpecies: {
    elephant: "elephant", "african elephant": "elephant", "indian elephant": "elephant", tusker: "elephant",
    lion: "lion", "lioness": "lion", "african lion": "lion", "mountain lion": "lion",
    cheetah: "cheetah",
    leopard: "leopard", jaguar: "leopard", "snow leopard": "leopard",
    zebra: "zebra", "plains zebra": "zebra",
    giraffe: "giraffe",
    rhino: "rhino", rhinoceros: "rhino",
    wolf: "wolf", coyote: "wolf", jackal: "wolf",
    fox: "fox", "red fox": "fox", "arctic fox": "fox", "fennec fox": "fox",
    "polar bear": "polarbear", bear: "polarbear", grizzly: "polarbear",
    "blue whale": "bluewh", whale: "bluewh",
    shark: "shark", "great white shark": "shark",
    eagle: "eagle", "bald eagle": "eagle",
    falcon: "falcon", "peregrine falcon": "falcon",
    penguin: "penguin", "emperor penguin": "penguin",
    crocodile: "crocodile", alligator: "crocodile", caiman: "crocodile",
    tortoise: "tortoise", turtle: "tortoise", terrapin: "tortoise",
    axolotl: "axolotl", salamander: "axolotl",
    frog: "poisonfrog", toad: "poisonfrog", "tree frog": "poisonfrog",
    octopus: "octopus", squid: "octopus",
    jellyfish: "jellyfish", "box jellyfish": "jellyfish",
    coral: "coral", "brain coral": "coral",
    bee: "bee", "honey bee": "bee", wasp: "bee",
    butterfly: "monarch", monarch: "monarch",
    ant: "ant",
    dragonfly: "dragonfly",
    spider: "spider", tarantula: "spider",
    scorpion: "scorpion",
    oak: "oak", "english oak": "oak", tree: "sequoia",
    rose: "rose", "damask rose": "rose",
    bamboo: "bamboo",
    cactus: "cactus", "saguaro cactus": "cactus", "saguaro": "cactus",
    "venus flytrap": "flytrap",
    sequoia: "sequoia", redwood: "sequoia", "coast redwood": "sequoia",
    penicillium: "penicillium", mold: "penicillium",
    yeast: "yeast",
    mushroom: "mushroom", "button mushroom": "mushroom",
    amoeba: "amoeba",
    paramecium: "paramecium",
    ecoli: "ecoli", "escherichia": "ecoli",
    staph: "staph", staphylococcus: "staph",
    strep: "strep", streptomyces: "strep",
    tuberculosis: "myco", "mycobacterium": "myco",
    influenza: "flu",
    covid: "covid", coronavirus: "covid", "sars-cov-2": "covid",
    hiv: "hiv", aids: "hiv",
    phage: "phage", bacteriophage: "phage",

    // --- Expanded wildlife coverage for common MobileNet labels ---
    tiger: "tiger_mammal", bengal: "tiger_mammal", "siberian tiger": "tiger_mammal",
    hyena: "hyena_mammal", spotted: "hyena_mammal",
    hippo: "hippo", hippopotamus: "hippo",
    buffalo: "buffalo_mammal", "african buffalo": "buffalo_mammal", cape: "buffalo_mammal",
    wildebeest: "wildebeest", gnu: "wildebeest",
    gorilla: "mountain_gorilla", "silverback": "mountain_gorilla", ape: "mountain_gorilla",
    chimpanzee: "chimpanzee", chimp: "chimpanzee",
    baboon: "monkey", monkey: "monkey", macaque: "monkey", "rhesus monkey": "monkey",
    kangaroo: "kangaroo", wallaby: "kangaroo",
    koala: "koala",
    panda: "panda_mammal", "giant panda": "panda_mammal",
    "polar": "polar_bear", "ice bear": "polar_bear",
    otter: "otter_mammal", "sea otter": "otter_mammal",
    seal: "seal_mammal", "fur seal": "seal_mammal", "sea lion": "sea_lion_mammal",
    dolphin: "dolphin_mammal", porpoise: "dolphin_mammal",
    "killer whale": "bluewh", orca: "bluewh",
    "beluga": "bluewh", "narwhal": "bluewh", "humpback": "bluewh", "sperm whale": "bluewh",
    "walrus": "walrus_mammal",
    raccoon: "raccoon_mammal",
    skunk: "skunk_mammal",
    badger: "badger_mammal",
    squirrel: "squirrel_mammal", chipmunk: "squirrel_mammal",
    rabbit: "rabbit_mammal", hare: "hare_mammal", "cottontail": "rabbit_mammal",
    deer: "deer_mammal", "white-tailed deer": "deer_mammal", "red deer": "deer_mammal",
    moose: "moose_mammal", elk: "elk_mammal", "wapiti": "elk_mammal",
    camel: "camel_mammal", dromedary: "camel_mammal",
    horse: "horse_mammal", zebra: "zebra", pony: "horse_mammal",
    sheep: "sheep_mammal", ram: "sheep_mammal", goat: "goat_mammal",
    cow: "cow_mammal", cattle: "cow_mammal", ox: "cow_mammal", "bison": "bison_mammal",
    pig: "pig_mammal", hog: "pig_mammal", boar: "boar_mammal", warthog: "warthog_mammal",
    sloth: "sloth_mammal", "three-toed": "sloth_mammal",
    anteater: "anteater_mammal", pangolin: "pangolin_mammal", armadillo: "armadillo_mammal",
    porcupine: "porcupine_mammal", hedgehog: "hedgehog_mammal",
    lemur: "lemur", meerkat: "meerkat_mammal", mongoose: "mongoose_mammal",
    "owl": "owl_bird", "horned owl": "owl_bird", "barn owl": "owl_bird",
    hawk: "hawk_bird", "red-tailed hawk": "hawk_bird", buzzard: "hawk_bird",
    vulture: "vulture_bird", condor: "vulture_bird",
    flamingo: "flamingo_bird",
    swan: "swan_bird", goose: "goose_bird", duck: "duck_bird", mallard: "mallard_bird",
    heron: "heron_bird", egret: "heron_bird", crane: "heron_bird", stork: "stork_bird",
    pelican: "pelican_bird", "albatross": "albatross_bird",
    seagull: "gull_bird", gull: "gull_bird",
    crow: "crow", raven: "crow", magpie: "crow", jay: "crow",
    robin: "robin", sparrow: "sparrow", finch: "sparrow", cardinal: "sparrow",
    "woodpecker": "woodpecker", parrot: "parrot", macaw: "parrot", cockatoo: "parrot",
    toucan: "toucan", hummingbird: "hummingbird",
    ostrich: "ostrich", emu: "ostrich", "rhea": "ostrich",
    turkey: "turkey", chicken: "chicken", rooster: "chicken", hen: "chicken",
    peacock: "peacock", peahen: "peacock",
    "snake": "snake_reptile", python: "python_reptile", "boa": "boa_reptile",
    cobra: "cobra_reptile", mamba: "mamba_reptile", viper: "viper_reptile", rattlesnake: "rattlesnake_reptile",
    iguana: "iguana_reptile", chameleon: "chameleon_reptile", gecko: "gecko_reptile",
    lizard: "lizard_reptile", monitor: "monitor_reptile",
    "sea turtle": "tortoise", "loggerhead": "tortoise", "leatherback": "tortoise",
    "shark": "shark", "hammerhead": "shark", "whale shark": "shark", "white shark": "shark",
    "ray": "shark", "manta": "shark", "stingray": "shark",
    "salmon": "salmon_fish", "trout": "salmon_fish", "tuna": "tuna_fish", "swordfish": "swordfish_fish",
    "clownfish": "clownfish_fish", "seahorse": "seahorse_fish", "puffer": "pufferfish_fish",
    "catfish": "catfish_fish", "eel": "eel_fish", "moray": "eel_fish",
    "piranha": "piranha_fish", "goldfish": "goldfish",
    "crab": "crab", "lobster": "lobster", "shrimp": "shrimp", "prawn": "shrimp",
    "snail": "snail", "slug": "snail", "starfish": "starfish", "sea urchin": "starfish",
    "worm": "common_earthworm", "earthworm": "common_earthworm",
    "grasshopper": "grasshopper_insect", "cricket": "cricket_insect", "katydid": "grasshopper_insect",
    "beetle": "beetle_insect", "ladybug": "beetle_insect", "ladybird": "beetle_insect",
    "moth": "moth_insect", "firefly": "firefly_insect", "praying mantis": "praying_mantis_insect",
    "dragonfly": "dragonfly", "damselfly": "dragonfly", "mosquito": "mosquito", "fly": "fly",
    "cockroach": "cockroach_insect", "termite": "termite_insect",
    "pine": "pine_plant", "oak": "oak", "maple": "maple_plant", "birch": "birch_plant",
    "fern": "fern_plant", "moss": "moss_plant", "lichen": "lichen_plant",
    "sunflower": "sunflower_plant", "daisy": "daisy_plant", "tulip": "tulip_plant", "lily": "lily_plant",
    "orchid": "orchid_plant", "dandelion": "dandelion_plant", "lotus": "lotus",
    "palm": "palm", "banana": "palm", "coconut": "palm", "mangrove": "mangrove"
  },

  NON_LIVING_KEYWORDS: [
    'laptop', 'computer', 'monitor', 'keyboard', 'mouse', 'phone', 'smartphone', 'tablet', 'camera',
    'television', 'tv', 'screen', 'headphone', 'speaker', 'charger', 'cable', 'watch', 'clock',
    'remote', 'drone', 'remote control', 'game controller', 'console', 'router', 'modem',
    'chair', 'sofa', 'couch', 'table', 'desk', 'bed', 'shelf', 'cabinet', 'drawer', 'door', 'window',
    'bookshelf', 'dresser', 'tv stand', 'ottoman', 'stool', 'lamp', 'light', 'cushion', 'pillow',
    'mattress', 'wardrobe', 'closet', 'bench', 'counter', 'bathtub', 'sink', 'mirror', 'curtain',
    'car', 'automobile', 'truck', 'bus', 'van', 'bicycle', 'bike', 'motorcycle', 'motorbike',
    'airplane', 'aircraft', 'plane', 'helicopter', 'boat', 'ship', 'train', 'locomotive',
    'carriage', 'submarine', 'hovercraft', 'yacht', 'canoe', 'kayak', 'skateboard', 'roller',
    'wheelchair', 'stroller', 'crane', 'bulldozer',
    'house', 'building', 'skyscraper', 'tower', 'apartment', 'condo', 'hut', 'cabin', 'castle',
    'church', 'mosque', 'temple', 'stadium', 'arena', 'hotel', 'hospital', 'school',
    'bridge', 'tunnel', 'dam', 'shed', 'garage',
    'book', 'notebook', 'journal', 'pen', 'pencil', 'eraser', 'ruler', 'scissors', 'knife', 'spoon',
    'fork', 'plate', 'bowl', 'cup', 'mug', 'glass', 'bottle', 'jar', 'vase', 'container', 'box',
    'bag', 'backpack', 'pillow', 'blanket', 'towel', 'tissue', 'toy', 'doll', 'ball', 'glove',
    'shoe', 'boot', 'sandals', 'hat', 'cap', 'helmet', 'coat', 'jacket', 'sweater', 'shirt',
    'pants', 'dress', 'skirt', 'belt', 'tie', 'scarf', 'necklace', 'bracelet', 'ring', 'earring',
    'pizza', 'burger', 'sandwich', 'cake', 'cookie', 'bread', 'pastry', 'donut', 'ice cream',
    'fruit', 'vegetable', 'salad', 'pasta', 'rice', 'noodle', 'soup', 'stew', 'dessert', 'candy',
    'chocolate', 'coffee', 'tea', 'juice', 'soda', 'water bottle', 'milk', 'cheese', 'meat', 'fish food',
    'plastic', 'metal', 'concrete', 'wood', 'paper', 'cardboard', 'rubber', 'leather', 'glass',
    'ceramic', 'porcelain', 'stone', 'rock', 'dirt', 'soil', 'sand', 'mud', 'cement', 'asphalt',
    'wire', 'barrel', 'bucket', 'dustbin', 'trash', 'bin', 'toilet', 'brush', 'broom', 'saw',
    'toothbrush', 'comb', 'soap', 'bag', 'umbrella', 'toy', 'mask', 'wallet',
    'credit card', 'money', 'coin', 'paper', 'document', 'magazine', 'newspaper',
    'banner', 'sign', 'poster', 'whiteboard', 'blackboard', 'chalkboard', 'candle', 'firework',
    'battery', 'flag', 'balloon', 'kite', 'net', 'rack', 'stand', 'pole', 'railing', 'fence',
    'slide', 'seesaw', 'seating', 'holder', 'hanger', 'frame', 'picture',
    'painting', 'art', 'sculpture', 'statue', 'figurine', 'ornament', 'pot', 'planter', 'urn',
    'trophy', 'medal', 'ribbon', 'bow', 'pin', 'badge', 'sticker',
    'package', 'parcel', 'gift', 'present'
  ],

  speciesDB: {
    elephant: { name: "African Bush Elephant", scientificName: "Loxodonta africana", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Vulnerable", statusClass: "vulnerable", population: "415,000", habitat: "Savannas, forests, grasslands", diet: "Herbivore - grasses, bark, fruits, leaves", behavior: "Lives in matriarchal herds of 10-100 individuals. Uses infrasound for communication. Drinks up to 190 liters of water daily.", threats: "Habitat loss, human-wildlife conflict, illegal ivory trade", desc: "The African Bush Elephant is the largest land animal on Earth, playing a vital role in shaping its ecosystem.", tags: ["elephant", "trunk", "tusk", "african", "bush", "loxodonta", "savanna", "big"] },
    lion: { name: "African Lion", scientificName: "Panthera leo", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Vulnerable", statusClass: "vulnerable", population: "23,000 - 39,000", habitat: "Savannas, grasslands, open woodlands", diet: "Carnivore - wildebeest, zebra, buffalo, warthog", behavior: "The only truly social cat. Lives in prides of 2-40. Females do most hunting while males defend territory.", threats: "Habitat loss, retaliatory killings, prey depletion, trophy hunting", desc: "The African Lion, often called the King of Beasts, is an apex predator that regulates prey populations.", tags: ["lion", "panthera", "pride", "savanna", "predator", "leo", "africa", "big", "cat"] },
    giraffe: { name: "Masai Giraffe", scientificName: "Giraffa tippelskirchi", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Endangered", statusClass: "endangered", population: "35,000", habitat: "Savannas, open woodlands", diet: "Herbivore - acacia leaves, twigs, bark", behavior: "Sleeps only 30 minutes per day in short bursts. Uses its 45cm tongue to grab leaves.", threats: "Habitat fragmentation, poaching for bushmeat and tails", desc: "The tallest terrestrial animal, the Masai Giraffe towers over the savanna, using its incredible height to spot predators.", tags: ["giraffe", "giraffa", "tall", "neck", "acacia", "masai", "tippelskirchi", "savanna"] },
    zebra: { name: "Plains Zebra", scientificName: "Equus quagga", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Near Threatened", statusClass: "near-threatened", population: "500,000", habitat: "Grasslands, savannas, open woodlands", diet: "Herbivore - primarily grasses", behavior: "Lives in harems or mixed herds up to 1,000. Each zebra has unique stripe patterns.", threats: "Habitat loss, hunting for skins, competition with livestock", desc: "The Plains Zebra is famous for its distinctive black-and-white stripes, which may help confuse predators.", tags: ["zebra", "equus", "stripes", "quagga", "plains", "africa", "savanna", "herbivore"] },
    cheetah: { name: "Cheetah", scientificName: "Acinonyx jubatus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Vulnerable", statusClass: "vulnerable", population: "7,100", habitat: "Savannas, grasslands, semi-arid areas", diet: "Carnivore - Thomson's gazelle, impala, hare", behavior: "Accelerates from 0-100 km/h in 3 seconds. Cannot retract claws fully.", threats: "Habitat loss, human-wildlife conflict, low genetic diversity", desc: "The Cheetah is the fastest land animal, capable of breathtaking acceleration.", tags: ["cheetah", "acinonyx", "jubatus", "speed", "fast", "spotted", "savanna", "africa"] },
    leopard: { name: "Leopard", scientificName: "Panthera pardus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Vulnerable", statusClass: "vulnerable", population: "Unknown", habitat: "Forests, grasslands, mountains, savannas", diet: "Carnivore - antelope, warthog, birds, fish", behavior: "Incredibly stealthy. Can drag prey 3x its body weight up trees. Solitary and nocturnal.", threats: "Habitat loss, prey depletion, poaching for skins", desc: "The Leopard is a master of stealth and power, capable of adapting to almost any habitat.", tags: ["leopard", "panthera", "pardus", "spotted", "climb", "tree", "predator", "africa", "asia"] },
    wildebeest: { name: "Wildebeest", scientificName: "Connochaetes taurinus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Least Concern", statusClass: "least-concern", population: "1.5 million", habitat: "Open grasslands, savannas", diet: "Herbivore - short grasses", behavior: "Participates in the largest mammal migration on Earth. Can run at 80 km/h.", threats: "Habitat fragmentation, human encroachment, disease from livestock", desc: "The Wildebeest is a keystone species of the Serengeti famous for its epic annual migration.", tags: ["wildebeest", "gnu", "connochaetes", "migration", "serengeti", "masai", "africa", "herbivore"] },
    rhino: { name: "Black Rhinoceros", scientificName: "Diceros bicornis", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Critically Endangered", statusClass: "endangered", population: "5,600", habitat: "Savannas, grasslands, scrublands", diet: "Herbivore - leaves, branches, shoots", behavior: "Solitary and territorial. Excellent hearing and smell. Can run up to 55 km/h.", threats: "Illegal poaching for horns, habitat loss", desc: "The Black Rhinoceros is a critically endangered browser with a prehensile upper lip.", tags: ["rhino", "rhinoceros", "diceros", "horn", "bicornis", "endangered", "africa", "savanna"] },
    chimpanzee: { name: "Common Chimpanzee", scientificName: "Pan troglodytes", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Endangered", statusClass: "endangered", population: "172,700 - 299,700", habitat: "Tropical forests, savannas of Central and West Africa", diet: "Omnivore - fruits, leaves, insects, meat", behavior: "Shares 98.7% DNA with humans. Uses tools and has complex social structures.", threats: "Habitat loss, bushmeat trade, disease", desc: "The Common Chimpanzee is our closest living relative and exhibits remarkable intelligence.", tags: ["chimpanzee", "chimp", "pan", "troglodytes", "ape", "primate", "africa", "forest", "intelligent"] },
    gorilla: { name: "Mountain Gorilla", scientificName: "Gorilla beringei beringei", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Endangered", statusClass: "endangered", population: "1,063", habitat: "Mountain forests of Rwanda, Uganda, DRC", diet: "Herbivore - leaves, stems, fruit, bamboo", behavior: "Largest primate, males weigh up to 220 kg. Gentle giants that live in troops led by a silverback.", threats: "Habitat loss, poaching, disease, civil unrest", desc: "The Mountain Gorilla is one of the most endangered great apes, with fewer than 1,100 individuals remaining.", tags: ["gorilla", "gorila", "silverback", "mountain", "beringei", "primate", "rwanda", "uganda", "drc", "ape"] },
    fox: { name: "Red Fox", scientificName: "Vulpes vulpes", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Least Concern", statusClass: "least-concern", population: "Unknown (widespread)", habitat: "Forests, grasslands, mountains, deserts, urban areas across North America, Europe, Asia, Australia", diet: "Omnivore - small mammals, birds, insects, fruits, berries, carrion", behavior: "Solitary hunter with excellent hearing. Can hear mice squeaking from 100 feet away. Highly adaptable and can live in urban environments.", threats: "Habitat loss, hunting, road accidents, disease", soil: "Forest loam, sandy soils, grassland chernozem, urban garden soils, desert alluvial soils", desc: "The Red Fox is the most widespread and adaptable wild carnivore on Earth, found across the entire Northern Hemisphere including urban environments.", tags: ["fox", "red", "vulpes", "vulpes", "canid", "carnivore", "adaptive", "urban", "forest", "clever", "bushy", "tail"] },
    wolf: { name: "Gray Wolf", scientificName: "Canis lupus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Least Concern", statusClass: "least-concern", population: "200,000 - 250,000", habitat: "Forests, tundra, grasslands of North America, Europe, Asia", diet: "Carnivore - deer, elk, moose, bison", behavior: "Highly social apex predator. Packs of 2-30 with complex hierarchies. Can run 35 mph.", threats: "Habitat loss, persecution, hybridization with dogs", soil: "Forest loam, tundra permafrost, grassland chernozem", desc: "The Gray Wolf is a highly social apex predator that plays a critical role in maintaining healthy ecosystems.", tags: ["wolf", "gray", "canis", "lupus", "pack", "predator", "north", "america", "europe", "forest", "howl"] },
    polarbear: { name: "Polar Bear", scientificName: "Ursus maritimus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Vulnerable", statusClass: "vulnerable", population: "22,000 - 31,000", habitat: "Arctic sea ice, coastlines, islands", diet: "Carnivore - seals, fish, walrus", behavior: "Largest land carnivore. Swims up to 100 km at a time. Can smell prey 32 km away.", threats: "Climate change, sea ice loss, pollution", desc: "The Polar Bear is the largest land carnivore and is uniquely adapted to life on Arctic sea ice.", tags: ["polar", "bear", "ursus", "maritimus", "arctic", "ice", "seal", "predator", "white", "north"] },
    bluewh: { name: "Blue Whale", scientificName: "Balaenoptera musculus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Endangered", statusClass: "endangered", population: "10,000 - 25,000", habitat: "Open ocean worldwide", diet: "Carnivore - krill", behavior: "Largest animal ever known, reaching 30 meters and 180 tonnes. Heart the size of a small car.", threats: "Ship strikes, climate change, noise pollution", desc: "The Blue Whale is the largest animal known to have ever lived.", tags: ["blue", "whale", "balaenoptera", "musculus", "ocean", "marine", "giant", "baleen"] },
    eagle: { name: "Bald Eagle", scientificName: "Haliaeetus leucocephalus", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "316,700", habitat: "Lakes, rivers, coasts of North America", diet: "Carnivore - fish, waterfowl, small mammals", behavior: "National bird of the USA. Wingspan of 2.3 meters. Can see prey from 3 km away.", threats: "Lead poisoning, habitat loss", desc: "The Bald Eagle is a symbol of freedom with remarkable visual acuity.", tags: ["eagle", "bald", "haliaeetus", "leucocephalus", "bird", "raptor", "america", "predator", "flight"] },
    falcon: { name: "Peregrine Falcon", scientificName: "Falco peregrinus", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "140,000", habitat: "Worldwide except Antarctica", diet: "Carnivore - pigeons, ducks, songbirds", behavior: "Fastest animal on Earth, reaching 390 km/h in a dive. Recovered from near-extinction due to DDT.", threats: "Pesticides, habitat loss", desc: "The Peregrine Falcon is the fastest animal on Earth, capable of reaching speeds over 240 mph.", tags: ["falcon", "peregrine", "falco", "peregrinus", "bird", "raptor", "fast", "dive", "speed"] },
    penguin: { name: "Emperor Penguin", scientificName: "Aptenodytes forsteri", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Near Threatened", statusClass: "near-threatened", population: "595,000", habitat: "Antarctic ice", diet: "Carnivore - krill, fish, squid", behavior: "Largest penguin species. Males incubate eggs for 64 days in -60 temperatures. Can dive to 565 meters.", threats: "Climate change, sea ice loss", desc: "The Emperor Penguin is the tallest and heaviest of all living penguin species.", tags: ["penguin", "emperor", "aptenodytes", "antarctic", "ice", "cold", "dive", "bird", "waddle"] },
    crocodile: { name: "Saltwater Crocodile", scientificName: "Crocodylus porosus", domain: "Eukarya", kingdom: "Animalia", category: "Reptile", status: "Least Concern", statusClass: "least-concern", population: "200,000-300,000", habitat: "Coastal waterways, estuaries, Southeast Asia, Australia", diet: "Carnivore - fish, mammals, birds", behavior: "Largest living reptile, reaching 6 meters. Strongest bite force of any animal at 16,000 newtons.", threats: "Habitat loss, human conflict", desc: "The Saltwater Crocodile is the largest living reptile with the strongest bite force ever recorded.", tags: ["crocodile", "croc", "crocodylus", "porosus", "reptile", "saltwater", "estuary", "predator", "big"] },
    tortoise: { name: "Galapagos Tortoise", scientificName: "Chelonoidis niger", domain: "Eukarya", kingdom: "Animalia", category: "Reptile", status: "Vulnerable", statusClass: "vulnerable", population: "Unknown", habitat: "Galapagos Islands", diet: "Herbivore - grasses, leaves, cactus", behavior: "Largest living tortoise species, weighing over 400 kg. Can live for over 150 years.", threats: "Invasive species, habitat loss, historical exploitation", desc: "The Galapagos Tortoise is the largest living tortoise species and a symbol of evolutionary biology.", tags: ["tortoise", "galapagos", "chelonoidis", "niger", "reptile", "shell", "slow", "island", "giant", "old"] },
    axolotl: { name: "Axolotl", scientificName: "Ambystoma mexicanum", domain: "Eukarya", kingdom: "Animalia", category: "Amphibian", status: "Critically Endangered", statusClass: "endangered", population: "Unknown", habitat: "Lake Xochimilco, Mexico City", diet: "Carnivore - worms, insects, small fish", behavior: "Neotenic salamander that retains its larval form for life. Can regenerate entire limbs and organs.", threats: "Habitat destruction, pollution, invasive species", desc: "The Axolotl has an extraordinary ability to regenerate lost limbs and organs.", tags: ["axolotl", "ambystoma", "mexicanum", "salamander", "mexico", "neotenic", "regenerate", "aquatic"] },
    poisonfrog: { name: "Strawberry Poison Dart Frog", scientificName: "Oophaga pumilio", domain: "Eukarya", kingdom: "Animalia", category: "Amphibian", status: "Least Concern", statusClass: "least-concern", population: "Unknown", habitat: "Rainforests of Central America", diet: "Insectivore - ants, mites", behavior: "Tiny frog, only 20mm long. Bright colors warn of toxicity. Indigenous people use toxin for hunting darts.", threats: "Habitat loss, pet trade", desc: "Strawberry Poison Dart Frogs are tiny, brilliantly colored amphibians known for their potent skin toxins.", tags: ["frog", "poison", "dart", "oophaga", "pumilio", "red", "blue", "colorful", "central", "america", "tiny"] },
    shark: { name: "Great White Shark", scientificName: "Carcharodon carcharias", domain: "Eukarya", kingdom: "Animalia", category: "Fish", status: "Vulnerable", statusClass: "vulnerable", population: "Unknown", habitat: "Coastal and open ocean waters worldwide", diet: "Carnivore - seals, fish, seabirds", behavior: "Apex predator with excellent sense of smell. Can detect blood from 3 miles away.", threats: "Overfishing, bycatch, shark finning", desc: "The Great White Shark is an apex predator feared and respected since ancient times.", tags: ["shark", "great", "white", "carcharodon", "carcharias", "ocean", "predator", "teeth", "marine", "fear"] },
    octopus: { name: "Common Octopus", scientificName: "Octopus vulgaris", domain: "Eukarya", kingdom: "Animalia", category: "Mollusk", status: "Least Concern", statusClass: "least-concern", population: "Unknown", habitat: "Coastal marine waters worldwide", diet: "Carnivore - crabs, lobsters, fish", behavior: "Highly intelligent with three hearts and blue blood. Can change color and texture in 0.2 seconds.", threats: "Overfishing, habitat destruction", desc: "The Common Octopus is remarkably intelligent and known for its ability to solve complex problems.", tags: ["octopus", "octopod", "vulgaris", "ocean", "marine", "tentacle", "ink", "camouflage", "smart", "blue"] },
    jellyfish: { name: "Box Jellyfish", scientificName: "Chironex fleckeri", domain: "Eukarya", kingdom: "Animalia", category: "Cnidarian", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Coastal waters of Northern Australia", diet: "Carnivore - fish, shrimp", behavior: "Has 24 eyes including image-forming eyes. Venom can kill a human in minutes.", threats: "N/A", desc: "The Box Jellyfish is one of the most venomous marine creatures, with a sting that can be fatal.", tags: ["jellyfish", "box", "chironex", "fleckeri", "venom", "tentacle", "marine", "australia", "dangerous"] },
    coral: { name: "Elkhorn Coral", scientificName: "Acropora palmata", domain: "Eukarya", kingdom: "Animalia", category: "Cnidarian", status: "Critically Endangered", statusClass: "endangered", population: "Rapidly declining", habitat: "Caribbean Sea, Florida, Bahamas", diet: "Mixotroph - photosynthesis + plankton capture", behavior: "Colonial coral that can grow up to 13 cm per year. Forms critical reef habitat.", threats: "Ocean acidification, warming, disease", desc: "Elkhorn Coral is one of the most important reef-building corals, providing structure for entire marine ecosystems.", tags: ["coral", "elkhorn", "acropora", "palmata", "reef", "ocean", "marine", "caribbean"] },
    bee: { name: "Western Honey Bee", scientificName: "Apis mellifera", domain: "Eukarya", kingdom: "Animalia", category: "Insect", status: "Vulnerable", statusClass: "vulnerable", population: "Declining", habitat: "Worldwide in cultivated and wild landscapes", diet: "Herbivore - nectar, pollen", behavior: "Social insect living in colonies of up to 60,000. Essential pollinator for 75% of flowering plants.", threats: "Colony collapse disorder, pesticides, habitat loss", desc: "The Western Honey Bee is vital for global agriculture, pollinating crops and producing honey.", tags: ["bee", "honey", "apis", "mellifera", "pollinator", "hive", "queen", "worker", "yellow", "black", "insect", "buzz"] },
    monarch: { name: "Monarch Butterfly", scientificName: "Danaus plexippus", domain: "Eukarya", kingdom: "Animalia", category: "Insect", status: "Endangered", statusClass: "endangered", population: "Rapidly declining", habitat: "North, Central, and South America", diet: "Herbivore - milkweed nectar", behavior: "Famous for its 3,000-mile migration from Canada to Mexico. Toxic to predators.", threats: "Habitat loss, pesticides, climate change", desc: "The Monarch Butterfly is famous for its spectacular multi-generational migration across North America.", tags: ["butterfly", "monarch", "danaus", "plexippus", "orange", "black", "migration", "mexico", "canada", "insect", "wings"] },
    ant: { name: "Leafcutter Ant", scientificName: "Atta cephalotes", domain: "Eukarya", kingdom: "Animalia", category: "Insect", status: "Least Concern", statusClass: "least-concern", population: "Unknown", habitat: "Tropical rainforests of Central and South America", diet: "Fungivore - farms fungus on leaf substrate", behavior: "Cuts and carries leaf pieces up to 50 times its body weight to farm fungus.", threats: "Deforestation", desc: "Leafcutter Ants are remarkable fungus farmers, carrying leaf pieces back to their nests to cultivate food.", tags: ["ant", "leafcutter", "atta", "cephalotes", "fungus", "farm", "tropical", "america", "insect", "colony"] },
    dragonfly: { name: "Common Green Darner", scientificName: "Anax junius", domain: "Eukarya", kingdom: "Animalia", category: "Insect", status: "Least Concern", statusClass: "least-concern", population: "Unknown", habitat: "Wetlands,ponds lakes worldwide", diet: "Carnivore - mosquitoes, flies, other insects", behavior: "One of the fastest flying insects, reaching 35 mph. Migrates up to 400 miles.", threats: "Habitat loss, water pollution", desc: "The Common Green Darner is a large dragonfly known for its speed, agility, and long-distance migration.", tags: ["dragonfly", "darner", "anax", "junius", "green", "insect", "wing", "wetland", "fast", "mosquito"] },
    spider: { name: "Goliath Birdeater", scientificName: "Theraphosa blondi", domain: "Eukarya", kingdom: "Animalia", category: "Arachnid", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Amazon rainforest", diet: "Carnivore - insects, small vertebrates", behavior: "Largest spider by mass and size. Leg span of 30 cm and fangs up to 2.5 cm.", threats: "Habitat loss", desc: "The Goliath Birdeater is the largest spider in the world by mass and leg span.", tags: ["spider", "goliath", "birdeater", "theraphosa", "blondi", "tarantula", "amazon", "big", "hairy"] },
    scorpion: { name: "Deathstalker Scorpion", scientificName: "Leiurus quinquestriatus", domain: "Eukarya", kingdom: "Animalia", category: "Arachnid", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Deserts and scrublands of North Africa and Middle East", diet: "Carnivore - insects, spiders, other scorpions", behavior: "Highly venomous scorpion. Venom is being studied for medical applications.", threats: "N/A", desc: "The Deathstalker Scorpion has potent venom that is being researched for its potential use in cancer treatment.", tags: ["scorpion", "deathstalker", "leiurus", "quinquestriatus", "venom", "desert", "yellow", "stinger", "dangerous"] },
    earthworm: { name: "Common Earthworm", scientificName: "Lumbricus terrestris", domain: "Eukarya", kingdom: "Animalia", category: "Annelid", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Soil worldwide", diet: "Detritivore - decaying organic matter", behavior: "Essential for soil health. Can regenerate segments. Has five hearts.", threats: "Soil degradation, pesticides", desc: "The Common Earthworm is vital for soil health and nutrient cycling.", tags: ["earthworm", "lumbricus", "terrestris", "soil", "worm", "garden", "annelid", "dirt"] },
    oak: { name: "English Oak", scientificName: "Quercus robur", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Least Concern", statusClass: "least-concern", population: "Unknown", habitat: "Temperate woodlands, forests", diet: "Autotroph - photosynthesis", behavior: "Deciduous tree living over 1,000 years. Produces acorns that feed wildlife.", threats: "Climate change, deforestation, oak processionary moth", desc: "The English Oak is a symbol of strength and longevity that supports unparalleled biodiversity.", tags: ["oak", "quercus", "robur", "tree", "english", "british", "acorn", "forest", "woodland", "majestic", "ancient", "deciduous"] },
    rose: { name: "Damask Rose", scientificName: "Rosa damascena", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Cultivated worldwide, native to the Middle East", diet: "Autotroph - photosynthesis", behavior: "Deciduous shrub with fragrant flowers. Used in perfumery and medicine.", threats: "N/A", desc: "Rosa damascena is prized for its fragrance and is the primary source of rose oil used in perfumery.", tags: ["rose", "rosa", "damascena", "flower", "pink", "red", "garden", "perfume", "shrub", "beautiful", "fragrant"] },
    bamboo: { name: "Giant Bamboo", scientificName: "Dendrocalamus asper", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Least Concern", statusClass: "least-concern", population: "Unknown", habitat: "Tropical and subtropical forests", diet: "Autotroph - photosynthesis", behavior: "Fastest-growing plant on Earth, growing up to 91 cm per day.", threats: "Habitat loss, overharvesting", desc: "Giant Bamboo is one of the fastest-growing plants with a wide range of uses from construction to culinary arts.", tags: ["bamboo", "giant", "dendrocalamus", "asper", "grass", "tall", "green", "asian", "fast", "plant"] },
    flytrap: { name: "Venus Flytrap", scientificName: "Dionaea muscipula", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Vulnerable", statusClass: "vulnerable", population: "Unknown", habitat: "Wet pine savannas of the Carolinas, USA", diet: "Carnivorous - insects, spiders", behavior: "Snap traps close in milliseconds when trigger hairs are touched twice.", threats: "Habitat destruction, overcollection, poaching", desc: "The Venus Flytrap has a rapid snap-trap mechanism that is one of the fastest movements in the plant kingdom.", tags: ["flytrap", "venus", "dionaea", "muscipula", "carnivorous", "carolina", "trap", "insect", "plant", "predator"] },
    cactus: { name: "Saguaro Cactus", scientificName: "Carnegiea gigantea", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Least Concern", statusClass: "least-concern", population: "Unknown", habitat: "Sonoran Desert, Arizona, Mexico", diet: "Autotroph - photosynthesis", behavior: "Giant cactus that can live for 200+ years. Stores up to 200 gallons of water.", threats: "Climate change, illegal harvesting", desc: "The Saguaro Cactus is an iconic symbol of the American Southwest.", tags: ["cactus", "saguaro", "carnegiea", "gigantea", "desert", "arizona", "mexico", "succulent", "spine", "arm"] },
    sequoia: { name: "Coast Redwood", scientificName: "Sequoia sempervirens", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Endangered", statusClass: "endangered", population: "Unknown", habitat: "Coastal California, USA", diet: "Autotroph - photosynthesis", behavior: "Tallest tree species on Earth, reaching over 380 feet. Lives for 1,000-2,000 years.", threats: "Logging, climate change, habitat fragmentation", desc: "The Coast Redwood is the tallest tree species on Earth and can live for over 2,000 years.", tags: ["redwood", "sequoia", "sempervirens", "coast", "tallest", "california", "tree", "ancient", "massive", "green", "californian", "forest", "old", "giant", "tall"] },
    penicillium: { name: "Penicillium chrysogenum", scientificName: "Penicillium chrysogenum", domain: "Eukarya", kingdom: "Fungi", category: "Fungi", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Soil, decaying organic matter, indoor environments", diet: "Saprotroph - decomposes organic matter", behavior: "Produces penicillin, the first antibiotic discovered by Alexander Fleming in 1928.", threats: "N/A", desc: "Penicillium chrysogenum is the industrial source of penicillin, one of the most important medical discoveries in history.", tags: ["penicillium", "chrysogenum", "mold", "fungi", "antibiotic", "penicillin", "medical", "green", "white", "aspergillus"] },
    yeast: { name: "Baker's Yeast", scientificName: "Saccharomyces cerevisiae", domain: "Eukarya", kingdom: "Fungi", category: "Fungi", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Grape skins, soils, worldwide in human food", diet: "Chemoorganotroph - fermentation of sugars", behavior: "Unicellular fungus used in baking, brewing, and winemaking. Model organism.", threats: "N/A", desc: "Saccharomyces cerevisiae is arguably the most important industrial microorganism and a key model organism in genetics.", tags: ["yeast", "saccharomyces", "cerevisiae", "baking", "brewing", "wine", "fermentation", "fungi", "microbe", "baker"] },
    mushroom: { name: "Button Mushroom", scientificName: "Agaricus bisporus", domain: "Eukarya", kingdom: "Fungi", category: "Fungi", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Cultivated worldwide in compost", diet: "Saprotroph - decomposes organic matter", behavior: "The most commonly cultivated mushroom in the world. Fruiting body with gills.", threats: "N/A", desc: "Agaricus bisporus is the most widely cultivated and consumed mushroom globally.", tags: ["mushroom", "button", "agaricus", "bisporus", "fungi", "food", "white", "edible", "cultivated"] },
    amoeba: { name: "Amoeba proteus", scientificName: "Amoeba proteus", domain: "Eukarya", kingdom: "Protista", category: "Protist", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Freshwater ponds, lakes, streams", diet: "Phagotroph - engulfs prey with pseudopodia", behavior: "Single-celled organism. Changes shape constantly. Reproduces by binary fission.", threats: "N/A", desc: "Amoeba proteus is a classic model organism for studying cell biology, motility, and phagocytosis.", tags: ["amoeba", "proteus", "protist", "pond", "microscope", "single", "cell", "shapeless", "blob"] },
    paramecium: { name: "Paramecium caudatum", scientificName: "Paramecium caudatum", domain: "Eukarya", kingdom: "Protista", category: "Protist", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Freshwater ponds, lakes", diet: "Bacterivore - feeds on bacteria", behavior: "Covered in cilia for movement and feeding. Has two nuclei.", threats: "N/A", desc: "Paramecium is one of the most studied protozoa, used extensively in biology education.", tags: ["paramecium", "caudatum", "protist", "ciliate", "pond", "microscope", "single", "cell", "cilia"] },
    plasmodium: { name: "Plasmodium falciparum", scientificName: "Plasmodium falciparum", domain: "Eukarya", kingdom: "Protista", category: "Protist", status: "N/A", statusClass: "vulnerable", population: "Unknown", habitat: "Human red blood cells, Anopheles mosquitoes", diet: "Parasitic - digests hemoglobin", behavior: "Apicomplexan parasite responsible for the most severe form of malaria.", threats: "Drug resistance, insecticide resistance", desc: "Plasmodium falciparum is the deadliest species of Plasmodium that causes malaria in humans.", tags: ["plasmodium", "falciparum", "malaria", "parasite", "mosquito", "disease", "blood", "tropical", "killer"] },
    ecoli: { name: "Escherichia coli", scientificName: "Escherichia coli", domain: "Bacteria", kingdom: "Bacteria", category: "Bacteria", status: "N/A", statusClass: "least-concern", population: "Unknown (ubiquitous)", habitat: "Intestines of warm-blooded animals, soil, water", diet: "Chemoheterotroph - organic compounds", behavior: "Gram-negative, facultatively anaerobic, rod-shaped bacterium. Most strains are harmless.", threats: "Antibiotic resistance (ESBL, CRE)", desc: "E. coli is a model organism for molecular biology and biotechnology. It is the most studied prokaryotic organism.", tags: ["ecoli", "escherichia", "coli", "bacteria", "gut", "microbe", "rod", "laboratory", "model"] },
    staph: { name: "Staphylococcus aureus", scientificName: "Staphylococcus aureus", domain: "Bacteria", kingdom: "Bacteria", category: "Bacteria", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Human skin, mucous membranes, soil, food", diet: "Chemoheterotroph - organic compounds", behavior: "Gram-positive coccus. Can survive on dry surfaces for weeks. About 30% of humans are carriers.", threats: "Antibiotic resistance (MRSA, VRSA)", desc: "S. aureus is a common cause of skin infections, pneumonia, and sepsis. The MRSA strain is a major hospital-acquired pathogen.", tags: ["staphylococcus", "aureus", "staph", "bacteria", "microbe", "coccus", "skin", "mrsa", "infection"] },
    strep: { name: "Streptomyces coelicolor", scientificName: "Streptomyces coelicolor", domain: "Bacteria", kingdom: "Bacteria", category: "Bacteria", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Soil, decaying organic matter", diet: "Saprotroph - decomposes organic matter", behavior: "Filamentous bacterium. Produces over two-thirds of clinically useful antibiotics.", threats: "N/A", desc: "Streptomyces are the most abundant soil bacteria and the primary producers of clinically used antibiotics.", tags: ["streptomyces", "coelicolor", "bacteria", "soil", "antibiotic", "filamentous", "actinomycete"] },
    myco: { name: "Mycobacterium tuberculosis", scientificName: "Mycobacterium tuberculosis", domain: "Bacteria", kingdom: "Bacteria", category: "Bacteria", status: "N/A", statusClass: "endangered", population: "Unknown", habitat: "Human lungs, lymphatic system", diet: "Obligate aerobe - lipids and carbohydrates", behavior: "Acid-fast bacillus with a waxy cell wall. Can remain latent for decades.", threats: "Multidrug resistance (MDR-TB, XDR-TB)", desc: "M. tuberculosis is the causative agent of tuberculosis, one of the leading causes of death from a single infectious agent.", tags: ["mycobacterium", "tuberculosis", "tb", "bacteria", "lung", "disease", "infection", "bacillus", "killer"] },
    flu: { name: "Influenza A", scientificName: "Influenza A virus", domain: "Viruses", kingdom: "Viruses", category: "Virus", status: "N/A", statusClass: "vulnerable", population: "Unknown", habitat: "Respiratory tract of birds, mammals", diet: "Host-dependent - hijacks cellular machinery", behavior: "Enveloped RNA virus with 8 segmented genes. Constantly mutates via antigenic drift and shift.", threats: "Pandemic potential (H1N1, H5N1, H7N9)", desc: "Influenza A causes seasonal flu epidemics and occasional pandemics.", tags: ["influenza", "flu", "virus", "h1n1", "h5n1", "respiratory", "pandemic", "seasonal", "rna"] },
    covid: { name: "SARS-CoV-2", scientificName: "SARS-CoV-2", domain: "Viruses", kingdom: "Viruses", category: "Virus", status: "N/A", statusClass: "endangered", population: "Unknown", habitat: "Human respiratory tract", diet: "Host-dependent - hijacks cellular machinery", behavior: "Enveloped RNA virus. Spikes bind to ACE2 receptors. Highly transmissible.", threats: "New variants, long COVID", desc: "SARS-CoV-2 caused the COVID-19 pandemic, infecting over 700 million people.", tags: ["sars", "covid", "coronavirus", "virus", "respiratory", "pandemic", "rna", "spike"] },
    hiv: { name: "HIV", scientificName: "Human Immunodeficiency Virus", domain: "Viruses", kingdom: "Viruses", category: "Virus", status: "N/A", statusClass: "endangered", population: "39 million infected", habitat: "Human immune cells (CD4+ T cells)", diet: "Host-dependent - reverse transcribes RNA into DNA", behavior: "Retrovirus that integrates its genome into host DNA. Destroys CD4+ T cells.", threats: "Drug resistance, stigma, access to treatment", desc: "HIV has caused over 40 million deaths. Antiretroviral therapy can control but not cure the infection.", tags: ["hiv", "aids", "virus", "immune", "retrovirus", "sexual", "blood", "pandemic", "treatment"] },
    phage: { name: "T4 Bacteriophage", scientificName: "Enterobacteria phage T4", domain: "Viruses", kingdom: "Viruses", category: "Virus", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Bacterial hosts (E. coli)", diet: "Host-dependent", behavior: "Double-stranded DNA virus. Infects E. coli only. Lytic lifecycle completes in about 30 minutes.", threats: "N/A", desc: "T4 is a model organism for virus research and a potential alternative to antibiotics (phage therapy).", tags: ["bacteriophage", "phage", "t4", "virus", "bacteria", "lytic", "dna", "therapy", "model"] },
    archaea1: { name: "Methanopyrus kandleri", scientificName: "Methanopyrus kandleri", domain: "Archaea", kingdom: "Archaea", category: "Archaea", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Hydrothermal vents, extremely hot environments", diet: "Chemolithoautotroph - produces methane", behavior: "Hyperthermophile that thrives at 110C. One of the most heat-resistant organisms known.", threats: "N/A", desc: "Methanopyrus kandleri is a hyperthermophilic archaeon that lives in extreme heat near hydrothermal vents.", tags: ["methanopyrus", "kandleri", "archaea", "hyperthermophile", "heat", "vent", "deep", "sea", "extreme", "hot"] },
    archaea2: { name: "Halobacterium salinarum", scientificName: "Halobacterium salinarum", domain: "Archaea", kingdom: "Archaea", category: "Archaea", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Salt lakes, salt evaporation ponds", diet: "Phototroph - uses light to make ATP", behavior: "Extreme halophile that requires high salt concentrations to survive. Produces bacteriorhodopsin.", threats: "N/A", desc: "Halobacterium salinarum is an extreme halophile that thrives in environments too salty for most life.", tags: ["halobacterium", "salinarum", "archaea", "halophile", "salt", "dead", "sea", "pink", "extreme", "salty"] },

    // --- Compact entries for common species referenced by the expanded label map ---
    hippo: { name: "Hippopotamus", scientificName: "Hippopotamus amphibius", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Vulnerable", statusClass: "vulnerable", population: "115,000–130,000", habitat: "Rivers, lakes and swamps of sub-Saharan Africa", diet: "Herbivore - grasses", behavior: "Semi-aquatic, spends most of the day in water and grazes at night.", threats: "Habitat loss, poaching for meat and ivory", desc: "The hippopotamus is a large, mostly herbivorous semiaquatic mammal native to sub-Saharan Africa.", tags: ["hippo", "hippopotamus", "mammal", "river", "africa", "herbivore"] },
    monkey: { name: "Monkey", scientificName: "Cercopithecidae (family)", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Varies by species", statusClass: "vulnerable", population: "Unknown", habitat: "Tropical forests, savannas, mountains worldwide", diet: "Omnivore - fruits, leaves, insects", behavior: "Highly social primates living in troops with complex hierarchies.", threats: "Deforestation, bushmeat trade, habitat fragmentation", desc: "Monkeys are intelligent, social primates found across Africa, Asia and the Americas.", tags: ["monkey", "primate", "mammal", "social", "forest"] },
    kangaroo: { name: "Kangaroo", scientificName: "Macropus giganteus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Least Concern", statusClass: "least-concern", population: "Millions", habitat: "Grasslands and open woodlands of Australia", diet: "Herbivore - grasses and shrubs", behavior: "Marsupial that moves by hopping with powerful hind legs.", threats: "Drought, bushfires, road accidents", desc: "Kangaroos are iconic Australian marsupials known for their powerful hopping locomotion.", tags: ["kangaroo", "marsupial", "australia", "mammal", "hop"] },
    koala: { name: "Koala", scientificName: "Phascolarctos cinereus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Vulnerable", statusClass: "vulnerable", population: "Unknown", habitat: "Eucalyptus forests of eastern Australia", diet: "Herbivore - eucalyptus leaves", behavior: "Arboreal marsupial that sleeps up to 20 hours a day.", threats: "Habitat loss, bushfires, chlamydia", desc: "The koala is an arboreal herbivorous marsupial native to Australia, feeding almost exclusively on eucalyptus leaves.", tags: ["koala", "marsupial", "australia", "eucalyptus", "mammal"] },
    lemur: { name: "Ring-tailed Lemur", scientificName: "Lemur catta", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Endangered", statusClass: "endangered", population: "2,000", habitat: "Forests of Madagascar", diet: "Omnivore - fruit, leaves, insects", behavior: "Arboreal primates that sunbathe in troops and communicate with scents.", threats: "Deforestation, hunting", desc: "Lemurs are primates endemic to Madagascar and represent a remarkable radiation of isolated evolution.", tags: ["lemur", "primate", "madagascar", "mammal", "ring-tailed"] },
    crow: { name: "Crow", scientificName: "Corvus brachyrhynchos", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "Common", habitat: "Cities, farms, forests across the Northern Hemisphere", diet: "Omnivore - insects, seeds, carrion", behavior: "Highly intelligent corvids known for tool use and problem-solving.", threats: "None significant", desc: "Crows are highly intelligent, adaptable birds in the corvid family.", tags: ["crow", "raven", "bird", "corvid", "intelligent"] },
    robin: { name: "Robin", scientificName: "Erithacus rubecula", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "Common", habitat: "Woodlands, gardens across Europe", diet: "Omnivore - insects, worms, berries", behavior: "Territorial songbird famous for its bright orange breast.", threats: "None significant", desc: "The robin is a small insectivorous passerine bird with a distinctive red-orange breast.", tags: ["robin", "bird", "songbird", "europe", "passerine"] },
    sparrow: { name: "Sparrow", scientificName: "Passer domesticus", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "Very common", habitat: "Cities, farmlands, towns worldwide", diet: "Omnivore - seeds, insects", behavior: "Sociable, ground-feeding birds that thrive alongside humans.", threats: "Habitat loss in some regions", desc: "The house sparrow is one of the most widespread and adaptable birds on Earth.", tags: ["sparrow", "finch", "bird", "passerine", "common"] },
    woodpecker: { name: "Woodpecker", scientificName: "Picidae (family)", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Varies by species", statusClass: "least-concern", population: "Unknown", habitat: "Forests and woodlands worldwide", diet: "Insectivore - insects from bark", behavior: "Pecks trees with its chisel-like bill to find insects and drill nest cavities.", threats: "Deforestation", desc: "Woodpeckers are birds adapted to drilling into tree bark in search of insects.", tags: ["woodpecker", "bird", "forest", "insectivore", "peck"] },
    parrot: { name: "Parrot", scientificName: "Psittaciformes (order)", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Varies by species", statusClass: "vulnerable", population: "Unknown", habitat: "Tropical and subtropical regions worldwide", diet: "Herbivore - seeds, fruits, nuts", behavior: "Highly social birds famous for vocal mimicry and intelligence.", threats: "Pet trade, habitat loss", desc: "Parrots are colorful, intelligent birds known for their ability to mimic sounds and speech.", tags: ["parrot", "macaw", "bird", "tropical", "intelligent"] },
    toucan: { name: "Toucan", scientificName: "Ramphastidae (family)", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Varies by species", statusClass: "vulnerable", population: "Unknown", habitat: "Rainforests of Central and South America", diet: "Omnivore - fruit, insects, small vertebrates", behavior: "Colorful canopy birds with large, vivid bills used for feeding and display.", threats: "Deforestation, pet trade", desc: "Toucans are brightly colored birds of the neotropics famous for their oversized, colorful bills.", tags: ["toucan", "bird", "rainforest", "tropical", "beak"] },
    hummingbird: { name: "Hummingbird", scientificName: "Trochilidae (family)", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Varies by species", statusClass: "least-concern", population: "Unknown", habitat: "Americas, from Alaska to Tierra del Fuego", diet: "Nectarivore - flower nectar, small insects", behavior: "The only birds that can hover and fly backwards, with extremely rapid wingbeats.", threats: "Habitat loss, climate change", desc: "Hummingbirds are tiny birds capable of hovering flight, feeding on nectar with their long bills.", tags: ["hummingbird", "bird", "nectar", "hover", "americas"] },
    ostrich: { name: "Ostrich", scientificName: "Struthio camelus", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "Common", habitat: "Savannas and deserts of Africa", diet: "Omnivore - plants, seeds, insects", behavior: "The largest and fastest-running bird; flightless with powerful legs.", threats: "Habitat loss, farming", desc: "The ostrich is the largest living bird, a flightless species famous for its speed.", tags: ["ostrich", "bird", "africa", "flightless", "fast"] },
    turkey: { name: "Turkey", scientificName: "Meleagris gallopavo", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "Common", habitat: "Woodlands of North America", diet: "Omnivore - seeds, insects, small reptiles", behavior: "Large ground bird with distinctive fan-shaped tail display during courtship.", threats: "None significant", desc: "The wild turkey is a large game bird native to North America.", tags: ["turkey", "bird", "game", "north america", "poultry"] },
    chicken: { name: "Chicken", scientificName: "Gallus gallus domesticus", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Domesticated", statusClass: "least-concern", population: "Very common", habitat: "Domesticated worldwide", diet: "Omnivore - grains, seeds, insects", behavior: "Domesticated fowl descended from the red junglefowl.", threats: "N/A", desc: "The chicken is the most common domesticated bird, raised worldwide for meat and eggs.", tags: ["chicken", "rooster", "hen", "bird", "poultry"] },
    peacock: { name: "Peacock", scientificName: "Pavo cristatus", domain: "Eukarya", kingdom: "Animalia", category: "Bird", status: "Least Concern", statusClass: "least-concern", population: "Common", habitat: "Forests and farmlands of South Asia", diet: "Omnivore - seeds, insects, reptiles", behavior: "Male peafowl displays a spectacular iridescent train during courtship.", threats: "Habitat loss", desc: "The peacock is renowned for its brilliant iridescent tail feathers.", tags: ["peacock", "peafowl", "bird", "display", "india"] },
    crab: { name: "Crab", scientificName: "Brachyura (infraorder)", domain: "Eukarya", kingdom: "Animalia", category: "Invertebrate", status: "Varies by species", statusClass: "least-concern", population: "Common", habitat: "Oceans, freshwater, and land worldwide", diet: "Omnivore - algae, small animals, detritus", behavior: "Decapod crustaceans with a short tail and sideways-walking gait.", threats: "Overharvesting, pollution", desc: "Crabs are decapod crustaceans found in virtually all aquatic habitats and on land.", tags: ["crab", "crustacean", "invertebrate", "ocean", "claws"] },
    lobster: { name: "Lobster", scientificName: "Homarus americanus", domain: "Eukarya", kingdom: "Animalia", category: "Invertebrate", status: "Least Concern", statusClass: "least-concern", population: "Common", habitat: "Rocky ocean floors of the Atlantic", diet: "Omnivore - fish, mollusks, algae", behavior: "Large marine crustacean with powerful claws, living up to 50 years.", threats: "Overfishing, ocean warming", desc: "Lobsters are large marine crustaceans prized commercially worldwide.", tags: ["lobster", "crustacean", "ocean", "claws", "seafood"] },
    shrimp: { name: "Shrimp", scientificName: "Caridea (infraorder)", domain: "Eukarya", kingdom: "Animalia", category: "Invertebrate", status: "Least Concern", statusClass: "least-concern", population: "Very common", habitat: "Oceans, freshwater worldwide", diet: "Omnivore - plankton, detritus", behavior: "Small decapod crustaceans forming a vital link in marine food webs.", threats: "Overfishing, habitat loss", desc: "Shrimp are small, abundant decapod crustaceans found in nearly every aquatic environment.", tags: ["shrimp", "prawn", "crustacean", "marine", "plankton"] },
    snail: { name: "Snail", scientificName: "Gastropoda (class)", domain: "Eukarya", kingdom: "Animalia", category: "Invertebrate", status: "Least Concern", statusClass: "least-concern", population: "Very common", habitat: "Gardens, forests, freshwater, oceans worldwide", diet: "Herbivore - plants, algae", behavior: "Gastropod mollusks that move on a single muscular foot, often bearing a spiral shell.", threats: "Habitat loss", desc: "Snails are gastropod mollusks found in virtually every habitat on Earth.", tags: ["snail", "gastropod", "mollusk", "shell", "slow"] },
    starfish: { name: "Starfish", scientificName: "Asteroidea (class)", domain: "Eukarya", kingdom: "Animalia", category: "Invertebrate", status: "Varies by species", statusClass: "least-concern", population: "Common", habitat: "Ocean floors worldwide", diet: "Carnivore - mollusks, small invertebrates", behavior: "Echinoderms with radial symmetry able to regenerate lost arms.", threats: "Climate change, sea star wasting disease", desc: "Starfish are marine echinoderms with five-point radial symmetry and remarkable regenerative ability.", tags: ["starfish", "sea star", "echinoderm", "ocean", "marine"] },
    mosquito: { name: "Mosquito", scientificName: "Culicidae (family)", domain: "Eukarya", kingdom: "Animalia", category: "Insect", status: "N/A", statusClass: "least-concern", population: "Very common", habitat: "Standing water habitats worldwide", diet: "Nectar (adults); blood (females for eggs)", behavior: "Flies that lay eggs in water; females of many species feed on blood.", threats: "N/A", desc: "Mosquitoes are small flies that transmit diseases like malaria and dengue.", tags: ["mosquito", "fly", "insect", "disease", "malaria"] },
    fly: { name: "House Fly", scientificName: "Musca domestica", domain: "Eukarya", kingdom: "Animalia", category: "Insect", status: "N/A", statusClass: "least-concern", population: "Very common", habitat: "Worldwide, associated with humans", diet: "Omnivore - decaying organic matter", behavior: "Fast-flying insects that breed in decaying organic material.", threats: "N/A", desc: "The house fly is a common fly found wherever humans live.", tags: ["fly", "housefly", "insect", "common"] },
    palm: { name: "Palm Tree", scientificName: "Arecaceae (family)", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Varies by species", statusClass: "least-concern", population: "Common", habitat: "Tropical and subtropical regions worldwide", diet: "Photosynthetic - sunlight and water", behavior: "Evergreen trees with a single unbranched trunk and fan or feather leaves.", threats: "Palm oil deforestation, disease", desc: "Palms are a family of evergreen tropical plants including coconuts and date palms.", tags: ["palm", "tree", "tropical", "coconut", "plant"] },
    lotus: { name: "Lotus", scientificName: "Nelumbo nucifera", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Least Concern", statusClass: "least-concern", population: "Common", habitat: "Warm shallow waters of Asia", diet: "Photosynthetic - sunlight and water", behavior: "Aquatic plant with large fragrant flowers that rise above the water surface.", threats: "Habitat loss", desc: "The lotus is a sacred aquatic plant with striking pink or white flowers.", tags: ["lotus", "water lily", "plant", "aquatic", "sacred"] },
    mangrove: { name: "Mangrove", scientificName: "Rhizophora mangle", domain: "Eukarya", kingdom: "Plantae", category: "Plant", status: "Vulnerable", statusClass: "vulnerable", population: "Declining", habitat: "Coastal intertidal zones of the tropics", diet: "Photosynthetic - sunlight and water", behavior: "Salt-tolerant trees with aerial roots forming vital coastal ecosystems.", threats: "Coastal development, shrimp farming, climate change", desc: "Mangroves are salt-tolerant coastal trees that protect shorelines and shelter juvenile fish.", tags: ["mangrove", "tree", "coastal", "wetland", "salt"] },
    goldfish: { name: "Goldfish", scientificName: "Carassius auratus", domain: "Eukarya", kingdom: "Animalia", category: "Fish", status: "N/A", statusClass: "least-concern", population: "Very common", habitat: "Freshwater ponds and aquariums worldwide", diet: "Omnivore - plants, insects, crustaceans", behavior: "Domesticated freshwater carp, one of the most kept aquarium fish.", threats: "N/A", desc: "The goldfish is a domesticated freshwater fish, a member of the carp family.", tags: ["goldfish", "fish", "aquarium", "carp", "freshwater"] }
  },

  STORAGE_KEY: "wildlife_scans",
  PENDING_ADMIN_KEY: "wildlife_pending_admin",

  async init() {
    this.cacheElements();
    await this.loadExternalData();
    this.initSpeechRecognition();
    this.bindEvents();
    this.initStorage();
    // Load voices for natural-sounding TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this.selectNaturalVoice();
      this.selectNaturalVoice();
    }
    // Load AI model
    if (typeof mobilenet !== "undefined") {
      try {
        this.els.loadingText.textContent = "Loading AI model...";
        this.tfModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        console.log("MobileNet loaded");
        // On-device transfer-learning wildlife classifier (WildGuardAI):
        // loads the cached trained model, or trains in the background on real
        // Wikipedia/Wikimedia wildlife photos.
        if (typeof WildGuardAI !== "undefined") {
          WildGuardAI.init(this.tfModel);
          if (WildGuardAI.isReady()) {
            this.setModelStatus("model");
          } else {
            this.setModelStatus("training");
            WildGuardAI.train(this.speciesDB, (pct) => {
              this.updateModelStatus(pct);
            }).then(() => {
              if (WildGuardAI.isReady()) this.setModelStatus("model");
            });
          }
        }
      } catch (err) {
        console.warn("Model load failed:", err);
      }
    }
  },

  // Small status pill shown next to the model while the on-device classifier
  // trains or after it's ready. Pure UX — never breaks the scan.
  setModelStatus(state) {
    const pill = document.getElementById("aiModelStatus");
    if (!pill) return;
    if (state === "model") {
      pill.className = "ai-model-status ready";
      pill.innerHTML = '<i class="fas fa-brain"></i> Trained wildlife AI ready';
      pill.style.display = "inline-flex";
    } else if (state === "training") {
      pill.className = "ai-model-status";
      pill.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Training wildlife AI&hellip;';
      pill.style.display = "inline-flex";
    } else {
      pill.style.display = "none";
    }
  },

  updateModelStatus(pct) {
    const pill = document.getElementById("aiModelStatus");
    if (pill && pill.className.indexOf("ready") === -1) {
      pill.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Training wildlife AI&hellip; ' + pct + '%';
    }
  },

  async loadExternalData() {
    try {
      const response = await fetch("js/wildlife-data.json");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      // Merge external labelToSpecies and speciesDB with existing ones
      if (data.labelToSpecies) {
        this.labelToSpecies = { ...this.labelToSpecies, ...data.labelToSpecies };
      }
      if (data.speciesDB) {
        this.speciesDB = { ...this.speciesDB, ...data.speciesDB };
      }
      // Apply admin-edited entries from the centralized species DB (if loaded)
      if (window.WildGuardSpeciesDB && window.WildGuardSpeciesDB.isReady()) {
        const adminDB = window.WildGuardSpeciesDB.getAll();
        for (const k in adminDB) {
          if (adminDB.hasOwnProperty(k)) {
            this.speciesDB[k] = Object.assign({}, this.speciesDB[k] || {}, adminDB[k]);
          }
        }
      }
      // If the species DB is still seeding asynchronously, apply once it's ready
      if (window.WildGuardSpeciesDB && !window.WildGuardSpeciesDB.isReady()) {
        window.WildGuardSpeciesDB.onReady(() => {
          const adminDB = window.WildGuardSpeciesDB.getAll();
          for (const k in adminDB) {
            if (adminDB.hasOwnProperty(k)) {
              this.speciesDB[k] = Object.assign({}, this.speciesDB[k] || {}, adminDB[k]);
            }
          }
        });
      }
      console.log(`Loaded ${Object.keys(data.speciesDB || {}).length} species from external JSON`);
    } catch (err) {
      console.warn("Could not load external data:", err);
    }
  },

  // Real-world enrichment via the free iNaturalist taxa search API.
  // No API key required for search. Returns authoritative species data or null.
  async enrichWithINaturalist(query) {
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    if (!query) return null;
    try {
      const url = "https://api.inaturalist.org/v1/taxa?q=" + encodeURIComponent(query) +
        "&per_page=5";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!resp.ok) return null;
      const data = await resp.json();
      if (!data || !data.results || !data.results.length) return null;

      // Prefer a taxon whose name matches the query as a whole word,
      // to avoid substring false-positives (e.g. "lion" matching "dandelion").
      const qNorm = String(query).toLowerCase().trim();
      const words = qNorm.split(/\s+/).filter(Boolean);
      let pick = null;
      for (const t of data.results) {
        if (!t || !t.name) continue;
        const name = String(t.name).toLowerCase();
        const common = String(t.preferred_common_name || "").toLowerCase();
        const hasWord = words.every(function(w) {
          if (name === w) return true;
          const re = new RegExp("(^|[\\s-])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([\\s-]|$)");
          return re.test(name) || re.test(common);
        });
        if (hasWord) { pick = t; break; }
      }
      if (!pick) return null; // No reliable word match - keep the local database entry

      const t = pick;
      const enriched = {
        commonName: t.preferred_common_name || "",
        scientificName: t.name || "",
        wikiUrl: t.wikipedia_url || "",
        photoUrl: (t.default_photo && t.default_photo.medium_url) || (t.default_photo && t.default_photo.url) || "",
        rank: t.rank || "",
        inaturalistId: t.id || ""
      };
      // Conservation status if provided
      const cs = t.conservation_status;
      if (cs) {
        const raw = (cs.status_name || cs.status || "").toString();
        enriched.statusLabel = cs.status_name || cs.status || "";
        enriched.statusRank = cs.place_type_code || "";
        if (/critically/i.test(raw)) enriched.iucn = "Critically Endangered";
        else if (/endangered|threatened/i.test(raw)) enriched.iucn = "Endangered";
        else if (/vulnerable/i.test(raw)) enriched.iucn = "Vulnerable";
        else if (/near/i.test(raw)) enriched.iucn = "Near Threatened";
        else if (/least/i.test(raw)) enriched.iucn = "Least Concern";
      }
      return enriched;
    } catch (e) {
      return null;
    }
  },

  // Map a species DB category to the library's canonical category slug
  // so scans are saved and grouped systematically (animal/plant/bacteria/etc.).
  categorySlug(category) {
    const map = {
      "Mammal": "mammals",
      "Bird": "birds",
      "Reptile": "reptiles",
      "Amphibian": "amphibians",
      "Fish": "aquatic",
      "Mollusk": "aquatic",
      "Cnidarian": "aquatic",
      "Annelid": "aquatic",
      "Insect": "insects",
      "Arachnid": "arachnids",
      "Plant": "plants",
      "Fungi": "fungi",
      "Protist": "protists",
      "Bacteria": "bacteria",
      "Virus": "viruses",
      "Viral": "viruses",
      "Archaea": "archaea"
    };
    return map[category] || "other";
  },

  // Assess whether a species is harmful to humans based on its biological
  // profile. Returns a badge descriptor used in the Adaptations & Safety section.
  assessHarm(species) {
    const hay = ((species.diet || "") + " " + (species.behavior || "") + " " + (species.desc || "") + " " +
      (species.category || "") + " " + ((species.tags || []).join(" "))).toLowerCase();
    const dangerWords = ["venom", "poison", "deadly", "dangerous", "aggressive", "sting", "fangs", "bite",
      "predator", "carnivor", "attack", "harmful", "toxic", "man-eat", "ferocious", "claws", "horns", "charge"];
    let score = 0;
    for (const w of dangerWords) {
      if (hay.includes(w)) score++;
    }
    if (/carnivor|predator/.test(hay)) score += 2;
    if (/venom|poison|toxic/.test(hay)) score += 2;
    if (/bacteri|virus/.test((species.category || "").toLowerCase())) score += 1;

    if (score >= 3) {
      return { harmful: true, label: "Can be harmful to humans — keep a safe distance", icon: "fa-triangle-exclamation", cls: "harmful" };
    }
    if (score >= 1) {
      return { harmful: false, label: "Generally safe — observe with caution", icon: "fa-shield-halved", cls: "cautious" };
    }
    return { harmful: false, label: "Harmless to humans — enjoy watching it", icon: "fa-circle-check", cls: "harmless" };
  },

  // Try to resolve the scan's surroundings from the browser's location:
  //  1. Reverse geocode via free OpenStreetMap Nominatim (place name / country / biome)
  //  2. Nearby geographic + historic features via free Wikipedia geosearch
  //  3. Nearby places (parks, protected areas) via the free iNaturalist places API
  // Returns a descriptive object or null. Never throws.
  async enrichWithGeography() {
    if (typeof navigator === "undefined" || !navigator.geolocation || !navigator.onLine) return null;
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 9000);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          clearTimeout(timer);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const geo = { lat: lat.toFixed(5), lng: lng.toFixed(5), place: "", country: "", region: "", features: [], places: [] };
          try {
            const nom = await fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=12");
            if (nom.ok) {
              const j = await nom.json();
              const a = j.address || {};
              geo.place = a.village || a.town || a.city || a.place || a.hamlet || "";
              geo.region = a.state || a.county || a.region || "";
              geo.country = a.country || "";
            }
          } catch (e) {}
          try {
            const wk = await fetch("https://en.wikipedia.org/w/api.php?action=geosearch&format=json&origin=*&list=geosearch&gscoord=" + lat + "|" + lng + "&gsradius=20000&gslimit=6");
            if (wk.ok) {
              const j = await wk.json();
              if (j.query && j.query.geosearch) {
                geo.features = j.query.geosearch.map(function(g) { return { title: g.title, distance: Math.round(g.dist), lat: g.lat, lon: g.lon }; });
              }
            }
          } catch (e) {}
          try {
            const inat = await fetch("https://api.inaturalist.org/v1/places/nearby?lat=" + lat + "&lng=" + lng + "&nelat=" + (lat + 0.2) + "&nelng=" + (lng + 0.2) + "&swlat=" + (lat - 0.2) + "&swlng=" + (lng - 0.2));
            if (inat.ok) {
              const j = await inat.json();
              if (j.results && j.results.length) {
                geo.places = j.results.slice(0, 5).map(function(p) { return { name: p.name, category: p.category || "" }; });
              }
            }
          } catch (e) {}
          resolve(geo);
        },
        () => { clearTimeout(timer); resolve(null); },
        { timeout: 8000, maximumAge: 600000 }
      );
    });
  },

  // Real-time conditions at the scan location via the free Open-Meteo API
  // (no key required). Returns temperature, wind, daylight and local time,
  // or null when unavailable. Never throws.
  async enrichWithWeather(lat, lng) {
    if (typeof navigator === "undefined" || !navigator.onLine || !lat || !lng) return null;
    try {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng +
        "&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=auto";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!resp.ok) return null;
      const j = await resp.json();
      const cur = j && j.current;
      if (!cur) return null;
      return {
        temperature: cur.temperature_2m,
        weatherCode: cur.weather_code,
        windKmh: cur.wind_speed_10m,
        isDay: cur.is_day === 1,
        localTime: (j && j.timezone) ? this.localTimeNow(j.timezone) : ""
      };
    } catch (e) {
      return null;
    }
  },

  // Local wall-clock time for an IANA timezone, e.g. "14:32".
  localTimeNow(ianaZone) {
    try {
      const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: ianaZone, hour12: false });
      return fmt.format(new Date());
    } catch (e) {
      return "";
    }
  },

  // Human-readable label for an Open-Meteo weather code (WMO).
  weatherLabel(code) {
    const map = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Depositing rime fog",
      51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
      56: "Freezing drizzle", 57: "Dense freezing drizzle",
      61: "Slight rain", 63: "Rain", 65: "Heavy rain",
      66: "Freezing rain", 67: "Heavy freezing rain",
      71: "Slight snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
      80: "Slight showers", 81: "Showers", 82: "Violent showers",
      85: "Slight snow showers", 86: "Heavy snow showers",
      95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail"
    };
    return map[code] || "Variable conditions";
  },

  // Recent real-world observations of this species near the scan location via
  // the free iNaturalist observations API (no key). Returns recent sighting
  // summaries with dates and photos, or null. Never throws.
  async enrichWithSightings(taxonId, lat, lng) {
    if (typeof navigator === "undefined" || !navigator.onLine || !taxonId || !lat || !lng) return null;
    try {
      const radius = 50;
      const url = "https://api.inaturalist.org/v1/observations?taxon_id=" + taxonId +
        "&lat=" + lat + "&lng=" + lng + "&radius=" + radius +
        "&order=desc&order_by=observed_on&per_page=4&photo_quality=research";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!resp.ok) return null;
      const j = await resp.json();
      if (!j || !j.results || !j.results.length) return { total: 0, recent: [] };
      const recent = j.results.slice(0, 4).map(function(o) {
        return {
          date: (o.observed_on_details && o.observed_on_details.date) || o.observed_on || "",
          place: o.place_guess || "",
          photoUrl: (o.photos && o.photos[0] && (o.photos[0].medium_url || o.photos[0].url)) || ""
        };
      });
      return { total: j.total_results || j.results.length, recent };
    } catch (e) {
      return null;
    }
  },

  // Historic / cultural background on a species via the free Wikipedia REST
  // summary API (no key). Returns a short plain-text extract + page link.
  async enrichWithWikipediaExtract(query) {
    if (typeof navigator === "undefined" || !navigator.onLine || !query) return null;
    // Try the query as-is; fall back to its first token (genus) for plants/short names.
    const candidates = [query, String(query).split(/\s+/)[0]];
    for (const c of candidates) {
      if (!c) continue;
      try {
        const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(c);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!resp.ok) continue;
        const j = await resp.json();
        if (j && j.extract && !j.type) {
          return {
            title: j.title || c,
            extract: String(j.extract).slice(0, 600),
            pageUrl: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || "",
            thumbnail: (j.thumbnail && j.thumbnail.source) || ""
          };
        }
      } catch (e) {}
    }
    return null;
  },

  // Authoritative range / occurrence data from the free GBIF species API
  // (no key). Returns matching scientific names, common names and occurrence
  // counts for the species. Never throws.
  async enrichWithGBIF(query) {
    if (typeof navigator === "undefined" || !navigator.onLine || !query) return null;
    try {
      const url = "https://api.gbif.org/v1/species/match?name=" + encodeURIComponent(query);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!resp.ok) return null;
      const j = await resp.json();
      if (!j || !j.speciesKey) return null;
      return {
        usageKey: j.speciesKey,
        scientificName: j.scientificName || query,
        matchType: j.matchType || "",
        confidence: j.confidence || 0,
        status: j.status || ""
      };
    } catch (e) {
      return null;
    }
  },

  // Detect the backend API base when one is deployed (Flask on :5000 locally
  // or /api behind a reverse proxy). Returns "" when no backend is reachable,
  // so the scan falls through to the on-device model.
  backendApiBase() {
    try {
      if (window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")) {
        return "http://localhost:5000";
      }
      if (window.location.origin.includes("github.io") || window.location.protocol === "file:") {
        return "";
      }
      return "/api";
    } catch (e) {
      return "";
    }
  },

  // Tier 1: real cloud vision AI via the Flask backend /api/scan endpoint.
  // The backend forwards the image to Azure AI Vision (key server-side). When
  // the endpoint is unavailable or unconfigured it returns gracefully and the
  // scan falls through to the on-device trained model.
  async cloudScan(imageDataUrl) {
    const base = this.backendApiBase();
    // Track why cloud scan was skipped for honest messaging
    if (!base) {
      return { available: false, reason: 'no_backend', message: 'Cloud AI not available (static hosting)' };
    }
    if (!navigator.onLine) {
      return { available: false, reason: 'offline', message: 'Cloud AI unavailable (offline)' };
    }
    if (!imageDataUrl) return { available: false, reason: 'no_image', message: 'No image provided' };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const resp = await fetch(base + "/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) return { available: false, reason: 'http_error', message: 'Cloud AI returned error' };
      const data = await resp.json();
      if (!data || data.available === false || !data.tags) {
        return { available: false, reason: 'unconfigured', message: data?.error || 'Cloud AI not configured' };
      }
      return { available: true, ...data }; // { tags:[...], caption, source }
    } catch (e) {
      return { available: false, reason: 'network_error', message: 'Cloud AI request failed' };
    }
  },

  // Map a cloud-vision tag/description to a species key via the species DB
  // tags and label map (whole-word match).
  matchTagToSpecies(text) {
    if (!text) return null;
    const low = String(text).toLowerCase();
    return this.matchSpeciesKey(low) || null;
  },

  // Turn cloud vision tags into a weighted detection-like list. Returns an
  // array of { key, confidence } for species whose tags matched, sorted.
  tagsToSpecies(tags) {
    const out = [];
    const seen = {};
    const all = (tags || []).slice();
    if (!all.length) return out;
    for (const t of all) {
      const key = this.matchTagToSpecies(t);
      if (key && !seen[key]) {
        seen[key] = true;
        // Use a fixed confidence for cloud vision tag matches (no per-tag confidence from API)
        out.push({ key: key, confidence: 75 });
      }
    }
    out.sort((a, b) => b.confidence - a.confidence);
    return out;
  },

  // Perceptual hash (dHash) of the scanned image so the same subject can be
  // recognized across repeated scans, even from a different angle. Returns a
  // Promise resolving to a 64-char binary hash, or null when unavailable.
  computeImageHash(imageData) {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        const size = 8;
        const canvas = document.createElement("canvas");
        canvas.width = size + 1;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        img.crossOrigin = "anonymous";
        const failTimer = setTimeout(() => resolve(null), 3000);
        img.onload = function() {
          try {
            ctx.drawImage(img, 0, 0, size + 1, size);
            const data = ctx.getImageData(0, 0, size + 1, size).data;
            let hash = "";
            for (let y = 0; y < size; y++) {
              for (let x = 0; x < size; x++) {
                const idx = (y * (size + 1) + x) * 4;
                const next = (y * (size + 1) + x + 1) * 4;
                const lumA = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
                const lumB = (data[next] * 0.299 + data[next + 1] * 0.587 + data[next + 2] * 0.114);
                hash += lumA > lumB ? "1" : "0";
              }
            }
            clearTimeout(failTimer);
            resolve(hash);
          } catch (e) {
            clearTimeout(failTimer);
            resolve(null);
          }
        };
        img.onerror = function() { clearTimeout(failTimer); resolve(null); };
        img.src = imageData;
      } catch (e) {
        resolve(null);
      }
    });
  },

  // Hamming distance between two 64-char binary hashes.
  hammingDistance(a, b) {
    if (!a || !b || a.length !== b.length) return 64;
    let d = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) d++;
    }
    return d;
  },

  // Search past scans (approved + pending) for the same species or a very close
  // perceptual match — even if the new photo is from a different angle.
  findPastScans(speciesKey, hash) {
    const past = [];
    const all = [];
    try {
      const approved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
      const pending = JSON.parse(localStorage.getItem(this.PENDING_ADMIN_KEY) || "[]");
      all.push.apply(all, approved.map(function(s) { return Object.assign({}, s, { approved: true }); }));
      all.push.apply(all, pending.map(function(s) { return Object.assign({}, s, { approved: false }); }));
    } catch (e) {}
    for (const scan of all) {
      const match = {
        timestamp: scan.timestamp,
        approved: !!scan.approved,
        species: scan.species && scan.species.name ? scan.species.name : "",
        key: scan.species && scan.species.key ? scan.species.key : "",
        imageData: scan.imageData || "",
        confidence: scan.confidence || ""
      };
      if (speciesKey && scan.species && (scan.species.key === speciesKey || (scan.species.name && this.currentResult && this.currentResult.species && scan.species.name === this.currentResult.species.name))) {
        match.reason = "same-species";
        past.push(match);
        continue;
      }
      if (hash && scan.hash && this.hammingDistance(scan.hash, hash) <= 12) {
        match.reason = "perceptual";
        past.push(match);
      }
    }
    past.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    return past.slice(0, 3);
  },

  initStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.PENDING_ADMIN_KEY)) {
      localStorage.setItem(this.PENDING_ADMIN_KEY, JSON.stringify([]));
    }
  },

  cacheElements() {
    this.els.scanInputView = document.getElementById("scanInputView");
    this.els.scanResultView = document.getElementById("scanResultView");
    this.els.uploadBtn = document.getElementById("uploadBtn");
    this.els.cameraBtn = document.getElementById("cameraBtn");
    this.els.fileInput = document.getElementById("fileInput");
    this.els.previewImg = document.getElementById("previewImg");
    this.els.retakeBtn = document.getElementById("retakeBtn");
    this.els.loadingState = document.getElementById("loadingState");
    this.els.loadingText = document.getElementById("loadingText");
    this.els.resultState = document.getElementById("resultState");
    this.els.resultCategory = document.getElementById("resultCategory");
    this.els.resultTitle = document.getElementById("resultTitle");
    this.els.resultScientificName = document.getElementById("resultScientificName");
    this.els.resultStatusBadge = document.getElementById("resultStatusBadge");
    this.els.resultConfidence = document.getElementById("resultConfidence");
    this.els.resultDetails = document.getElementById("resultDetails");
    this.els.sceneAnalysis = document.getElementById("sceneAnalysis");
    this.els.pastScanMatch = document.getElementById("pastScanMatch");
    this.els.surroundings = document.getElementById("surroundings");
    this.els.readAloudBtn = document.getElementById("readAloudBtn");
    this.els.voiceBtn = document.getElementById("voiceBtn");
    this.els.voiceBtnText = document.getElementById("voiceBtnText");
    this.els.voiceStatus = document.getElementById("voiceStatus");
  },

  bindEvents() {
    if (this.els.uploadBtn) {
      this.els.uploadBtn.addEventListener("click", () => this.els.fileInput.click());
    }
    if (this.els.fileInput) {
      this.els.fileInput.addEventListener("change", (e) => this.handleFile(e));
    }
    if (this.els.cameraBtn) {
      this.els.cameraBtn.addEventListener("click", () => this.openCamera());
    }
    if (this.els.retakeBtn) {
      this.els.retakeBtn.addEventListener("click", () => this.resetScan());
    }
    if (this.els.readAloudBtn) {
      this.els.readAloudBtn.addEventListener("click", () => this.readFieldGuide());
    }
    if (this.els.voiceBtn) {
      this.els.voiceBtn.addEventListener("click", () => this.toggleVoiceListening());
    }
    // Keyboard shortcut: press 'v' to toggle voice
    document.addEventListener("keydown", (e) => {
      if (e.key === "v" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        this.toggleVoiceListening();
      }
    });
  },

  handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    this.lastInputSource = { type: "file", name: file.name.toLowerCase() };
    this.showResultView();
    const reader = new FileReader();
    reader.onload = (e) => {
      this.els.previewImg.onload = () => this.simulateScanAsync(e.target.result);
      this.els.previewImg.onerror = () => { this.els.loadingText.textContent = "Failed to load image for analysis."; };
      this.els.previewImg.src = e.target.result;
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      this.resetScan();
    };
    reader.readAsDataURL(file);
  },

  openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported on this browser.");
      return;
    }
    const modal = document.createElement("div");
    modal.id = "cameraModal";
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.className = "camera-video";
    const controls = document.createElement("div");
    controls.className = "camera-controls";
    const snapBtn = document.createElement("button");
    snapBtn.className = "action-btn camera-btn";
    snapBtn.innerHTML = '<i class="fas fa-camera"></i> Capture';
    const flipBtn = document.createElement("button");
    flipBtn.className = "action-btn flip-btn";
    flipBtn.title = "Flip camera";
    flipBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Flip';
    const closeBtn = document.createElement("button");
    closeBtn.className = "action-btn upload-btn";
    closeBtn.innerHTML = '<i class="fas fa-times"></i> Close';
    controls.appendChild(snapBtn);
    controls.appendChild(flipBtn);
    controls.appendChild(closeBtn);
    modal.appendChild(video);
    modal.appendChild(controls);
    document.body.appendChild(modal);
    let streamRef = null;
    let facing = "environment";

    // Mirror the front/user camera so the preview behaves like a normal
    // selfie camera — move your hand right and it moves right. The rear
    // camera stays unmirrored. The captured photo is mirrored the same way
    // the preview is, so the saved image always matches what you saw.
    const applyMirror = () => {
      video.classList.toggle("camera-mirrored", facing === "user");
    };
    applyMirror();

    const startCamera = (mode) => {
      if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
      streamRef = null;
      video.srcObject = null;
      const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent || "");
      const constraint = {
        video: {
          facingMode: isMobile ? { ideal: mode } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      navigator.mediaDevices.getUserMedia(constraint)
        .then((stream) => {
          streamRef = stream;
          video.srcObject = stream;
          const track = stream.getVideoTracks && stream.getVideoTracks()[0];
          if (track) {
            try {
              const settings = track.getSettings();
              if (settings && settings.facingMode) {
                facing = settings.facingMode;
                flipBtn.style.display = facing === "environment" || facing === "user" ? "inline-flex" : "none";
              }
            } catch (e) {}
            applyMirror();
            if (typeof track.addEventListener === "function") {
              track.addEventListener("ended", () => {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
              });
            }
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          if (!streamRef) {
            alert("Could not access camera. Please allow camera permissions.");
            if (modal.parentNode) modal.parentNode.removeChild(modal);
          }
        });
    };

    flipBtn.addEventListener("click", () => {
      facing = facing === "environment" ? "user" : "environment";
      startCamera(facing);
    });

    startCamera(facing);

    snapBtn.addEventListener("click", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (facing === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        this.els.previewImg.src = dataUrl;
        if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
        if (modal.parentNode) modal.parentNode.removeChild(modal);
        this.showResultView();
        this.lastInputSource = { type: "camera", name: "camera_capture.png" };
        this.simulateScanAsync(dataUrl);
      } catch (err) {
        console.error("Capture error:", err);
        alert("Error capturing image.");
      }
    });
    closeBtn.addEventListener("click", () => {
      if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    });
  },

  showResultView() {
    if (this.els.scanInputView) this.els.scanInputView.style.display = "none";
    if (this.els.scanResultView) {
      this.els.scanResultView.style.display = "block";
      this.els.loadingState.style.display = "flex";
      this.els.resultState.style.display = "none";
    }
  },

  resetScan() {
    if (this.els.scanInputView) this.els.scanInputView.style.display = "block";
    if (this.els.scanResultView) this.els.scanResultView.style.display = "none";
    this.els.fileInput.value = "";
    if (this.els.sceneAnalysis) {
      this.els.sceneAnalysis.style.display = "none";
      this.els.sceneAnalysis.innerHTML = "";
    }
    if (this.els.pastScanMatch) {
      this.els.pastScanMatch.style.display = "none";
      this.els.pastScanMatch.innerHTML = "";
    }
    if (this.els.surroundings) {
      this.els.surroundings.style.display = "none";
      this.els.surroundings.innerHTML = "";
    }
    this.currentResult = null;
    this.lastInputSource = null;
    this._sentToAdmin = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },

  detectNonLiving(label) {
    const lower = " " + label.toLowerCase().replace(/,/g, " ") + " ";
    for (const keyword of this.NON_LIVING_KEYWORDS) {
      const kw = keyword.toLowerCase();
      // Whole-word match so scientific names like "melampus" (contains "lamp")
      // or "panthera" (contains "ant") are never mistaken for non-living objects.
      if (this.wordMatch(lower, kw)) return true;
    }
    return false;
  },

  showNonLivingResult(detectedLabel, confidence) {
    // Use provided confidence (from MobileNet) or a fixed base for non-living detection
    const confidencePercent = confidence || 75;
    this.currentResult = { nonLiving: true, label: detectedLabel, confidence: confidencePercent };

    this.els.loadingState.style.display = "none";
    this.els.resultState.style.display = "block";
    this.els.resultCategory.textContent = "Non-Living / Scene";
    this.els.resultTitle.textContent = "Non-Living Object or Scene Detected";
    this.els.resultScientificName.textContent = detectedLabel.charAt(0).toUpperCase() + detectedLabel.slice(1);
    this.els.resultStatusBadge.className = "status-badge not-living";
    this.els.resultStatusBadge.textContent = "Non-Living";
    this.els.resultConfidence.innerHTML = "<span class=\"liveness-indicator non-living\"><i class=\"fas fa-times-circle\"></i> Not a living organism</span> <br><br><span class=\"confidence-bar-container\"><span class=\"confidence-bar\" style=\"width: " + confidencePercent + "%; background: linear-gradient(90deg, #e74c3c, #f39c12);\"></span></span> " + confidencePercent + "% confidence";
    this.els.resultDetails.innerHTML = "<div class=\"detail-section\"><h4><i class=\"fas fa-exclamation-triangle\"></i> Not a Living Organism</h4><p>WildGuard Scan is designed to identify <strong>living organisms</strong> such as animals, plants, and microbes. The image appears to focus on a <strong>non-living object or natural scene</strong>: <em>" + detectedLabel + "</em>. You can still save it as a landscape / habitat record for your library.</p></div><div class=\"detail-section\"><h4><i class=\"fas fa-lightbulb\"></i> Tips for Better Results</h4><ul><li>Ensure the subject is clearly visible and in focus</li><li>Use natural lighting when possible</li><li>Try different angles if the subject is partially obscured</li><li>Make sure the animal or plant is the main focus of the image</li></ul></div>";

    // Render surroundings context for natural scenes
    if (window.navigator && window.navigator.onLine) {
      var scan = this;
      this.enrichWithGeography().then(function(geo) {
        scan.currentResult.geo = geo;
        scan.renderSurroundings();
      });
    }

    const resultActions = this.els.resultState.querySelector(".result-actions");
    if (resultActions) {
      resultActions.innerHTML =
        '<button id="saveSceneBtn" class="read-btn" onclick="WildlifeScan.saveScene()"><i class="fas fa-map"></i> Save as Scene</button>' +
        '<button id="retakeSceneBtn" class="library-link" onclick="WildlifeScan.resetScan()"><i class="fas fa-redo"></i> Scan another</button>';
    }

    if (window.speechSynthesis) {
      this.speak("This appears to be a non-living object: " + detectedLabel + ". Please scan a living organism such as an animal, plant, or microbe.");
    }
  },

  // Honest "couldn't confidently identify" state — never fabricates a species.
  showUnidentifiedResult(detections) {
    this.currentResult = { unidentified: true, confidence: 0, detections: detections || [] };

    this.els.loadingState.style.display = "none";
    this.els.resultState.style.display = "block";
    this.els.resultCategory.textContent = "Identification";
    this.els.resultTitle.textContent = "Couldn't confidently identify a species";
    this.els.resultScientificName.textContent = "";
    this.els.resultStatusBadge.className = "status-badge unidentified";
    this.els.resultStatusBadge.textContent = "Low confidence";
    this.els.resultConfidence.innerHTML = '<span class="liveness-indicator unknown"><i class="fas fa-question-circle"></i> No confident match</span>';
    this.els.resultDetails.innerHTML =
      '<div class="detail-section"><h4><i class="fas fa-exclamation-triangle"></i> No Reliable Match</h4><p>WildGuard could not confidently match this image to a species in the database. This can happen with blurry, distant, or heavily cropped photos, or when the subject is very common non-wildlife.</p></div>' +
      '<div class="detail-section"><h4><i class="fas fa-lightbulb"></i> Tips for Better Results</h4><ul><li>Move closer to the subject</li><li>Ensure the subject fills the frame</li><li>Use good natural lighting</li><li>Try a clearer, still photo</li></ul></div>';

    const resultActions = this.els.resultState.querySelector(".result-actions");
    if (resultActions) {
      resultActions.innerHTML = "";
    }

    this.renderSceneAnalysis(detections || [], null);

    if (window.speechSynthesis) {
      this.speak("I couldn't confidently identify a species from this image. Please try a clearer photo.");
    }
  },

  // Field-guide book: renders the result as fixed-height pages the user flips
  // through with prev/next and page dots. No page ever scrolls — each piece of
  // the guide gets its own page. Works as a compact rectangle on desktop and
  // a tidy card on phones.
  renderBook(pages) {
    const container = this.els.resultDetails;
    if (!container) return;
    if (!pages || !pages.length) {
      container.innerHTML = "";
      return;
    }

    let dotsHtml = "";
    for (let i = 0; i < pages.length; i++) {
      dotsHtml += '<button type="button" class="book-dot" data-page="' + i + '" aria-label="Go to page ' + (i + 1) + '"></button>';
    }

    container.innerHTML =
      '<div class="field-book" role="group" aria-label="Species field guide">' +
      '<div class="book-viewport">' +
      pages.join('') +
      '</div>' +
      '<div class="book-nav">' +
      '<button type="button" class="book-nav-btn book-prev" aria-label="Previous page"><i class="fas fa-chevron-left"></i></button>' +
      '<div class="book-dots" role="tablist" aria-label="Pages">' + dotsHtml + '</div>' +
      '<span class="book-counter">1 / ' + pages.length + '</span>' +
      '<button type="button" class="book-nav-btn book-next" aria-label="Next page"><i class="fas fa-chevron-right"></i></button>' +
      '</div>' +
      '</div>';

    const viewport = container.querySelector(".book-viewport");
    const pagesEl = container.querySelectorAll(".book-page");
    const dotsEl = container.querySelectorAll(".book-dot");
    const counterEl = container.querySelector(".book-counter");
    const prevBtn = container.querySelector(".book-prev");
    const nextBtn = container.querySelector(".book-next");
    let current = 0;

    const show = (index) => {
      current = Math.max(0, Math.min(index, pagesEl.length - 1));
      for (let i = 0; i < pagesEl.length; i++) {
        pagesEl[i].classList.toggle("active", i === current);
      }
      for (let i = 0; i < dotsEl.length; i++) {
        dotsEl[i].classList.toggle("active", i === current);
      }
      counterEl.textContent = (current + 1) + " / " + pagesEl.length;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === pagesEl.length - 1;
      viewport.scrollTop = 0;
    };

    prevBtn.addEventListener("click", () => show(current - 1));
    nextBtn.addEventListener("click", () => show(current + 1));
    for (const dot of dotsEl) {
      dot.addEventListener("click", () => show(parseInt(dot.dataset.page, 10)));
    }
    show(0);
  },

  // Scene analysis: reports EVERYTHING the AI detected in the image, living
  // or non-living, each with its own details. Returns the inner list HTML so
  // it can live on a book page or as a standalone panel.
  sceneListHtml(detections, primaryKey) {
    if (!detections || detections.length < 2) return "";
    let html = '<div class="scene-list">';
    for (const d of detections) {
      const isPrimary = d.kind === "living" && d.key === primaryKey;
      if (d.kind === "living" && d.species) {
        const s = d.species;
        html += '<div class="scene-item living' + (isPrimary ? ' primary' : '') + '">' +
          '<div class="scene-item-head"><span class="scene-badge living">LIVING</span>' +
          (isPrimary ? '<span class="scene-primary-tag">Primary match</span>' : '') +
          '<strong>' + s.name + '</strong><span class="scene-conf">' + d.confidence + '%</span></div>' +
          '<div class="scene-item-sci">' + s.scientificName + ' &middot; ' + s.category + '</div>' +
          '<p class="scene-item-desc">' + s.desc + '</p>' +
          '<div class="scene-item-meta"><span><i class="fas fa-globe-africa"></i> ' + s.habitat + '</span>' +
          '<span><i class="fas fa-utensils"></i> ' + s.diet + '</span>' +
          '<span><i class="fas fa-paw"></i> ' + s.behavior + '</span>' +
          '<span><i class="fas fa-exclamation-triangle"></i> ' + s.threats + '</span></div>' +
          '</div>';
      } else if (d.kind === "non-living") {
        html += '<div class="scene-item nonliving">' +
          '<div class="scene-item-head"><span class="scene-badge nonliving">NON-LIVING</span>' +
          '<strong>' + d.label + '</strong><span class="scene-conf">' + d.confidence + '%</span></div>' +
          '<p class="scene-item-desc">This detected object is not a living organism. WildGuard identifies animals, plants and microbes — a photo focused on this object won\'t produce a species match.</p>' +
          '</div>';
      } else {
        html += '<div class="scene-item unidentified">' +
          '<div class="scene-item-head"><span class="scene-badge unidentified">UNIDENTIFIED</span>' +
          '<strong>' + d.label + '</strong><span class="scene-conf">' + d.confidence + '%</span></div>' +
          '<p class="scene-item-desc">Visual features detected but no confident match to a known species.</p>' +
          '</div>';
      }
    }
    html += '</div>';
    return html;
  },

  renderSceneAnalysis(detections, primaryKey) {
    const container = this.els.sceneAnalysis;
    if (!container) return;
    const list = this.sceneListHtml(detections, primaryKey);
    if (!list) {
      container.style.display = "none";
      container.innerHTML = "";
      return;
    }
    container.innerHTML = '<details class="scene-analysis"><summary class="scene-analysis-title"><i class="fas fa-shapes"></i> Scene Analysis — Everything Detected</summary>' + list + '</details>';
    container.style.display = "block";
  },

  // Past-scan match content: links this scan to past scans of the same species
  // or the same subject photographed from a different angle.
  pastScanListHtml() {
    const past = (this.currentResult && this.currentResult.pastScans) || [];
    if (!past.length) return "";
    const isSame = past.some(function(p) { return p.reason === "same-species"; });
    let html = '<p class="past-scan-note">WildGuard compared this image with your previous scans — ' +
      (isSame ? 'the same species was identified on an earlier visit.' : 'a near-identical subject was detected before.') +
      ' That means it can still be recognized even from another angle.</p>';
    html += '<div class="past-scan-list">';
    for (const p of past) {
      const d = new Date(p.timestamp);
      const when = isNaN(d) ? "earlier" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      const img = (p.imageData && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(p.imageData)) ? p.imageData : "";
      html += '<div class="past-scan-item">' +
        (img ? '<img src="' + img + '" alt="Previous scan" class="past-scan-thumb">' : '<div class="past-scan-thumb empty"><i class="fas fa-camera"></i></div>') +
        '<div class="past-scan-info"><strong>' + this.escapeHtml(p.species || "Identified subject") + '</strong>' +
        '<span>' + when + (p.approved ? '' : ' &middot; awaiting admin review') + '</span>' +
        (p.confidence ? '<span>Confidence: ' + this.escapeHtml(p.confidence) + '%</span>' : '') +
        '</div></div>';
    }
    html += '</div>';
    return html;
  },

  renderPastScanMatch() {
    const container = this.els.pastScanMatch;
    if (!container) return;
    const body = this.pastScanListHtml();
    if (!body) {
      container.style.display = "none";
      container.innerHTML = "";
      return;
    }
    const past = (this.currentResult && this.currentResult.pastScans) || [];
    const isSame = past.some(function(p) { return p.reason === "same-species"; });
    container.innerHTML = '<details class="past-scan-match"><summary class="past-scan-title"><i class="fas fa-clock"></i> ' +
      (isSame ? 'You\'ve scanned this before' : 'Similar to a previous scan') + '</summary>' + body + '</details>';
    container.style.display = "block";
  },

  // Surroundings & General Area — geography, historic features and nearby
  // biological places around the scan, using the browser's location. Falls
  // back to the species habitat when location isn't available.
  surroundingsBodyHtml() {
    const geo = (this.currentResult && this.currentResult.geo) || null;
    const species = this.currentResult && this.currentResult.species;
    let html = "";

    if (geo && (geo.place || geo.features.length || geo.places.length)) {
      const locationParts = [];
      if (geo.place) locationParts.push('<strong>' + this.escapeHtml(geo.place) + '</strong>');
      if (geo.region) locationParts.push(this.escapeHtml(geo.region));
      if (geo.country) locationParts.push(this.escapeHtml(geo.country));
      html += '<p class="surroundings-loc">' + (locationParts.length ? locationParts.join(", ") : "Near your current location") + '</p>';
      if (geo.places.length) {
        html += '<p class="surroundings-sub"><i class="fas fa-seedling"></i> Nearby protected / natural places:</p><ul class="surroundings-list">';
        for (const pl of geo.places) {
          html += '<li>' + this.escapeHtml(pl.name) + (pl.category ? ' <span class="surroundings-tag">' + this.escapeHtml(pl.category) + '</span>' : '') + '</li>';
        }
        html += '</ul>';
      }
      if (geo.features.length) {
        html += '<p class="surroundings-sub"><i class="fas fa-landmark"></i> Geography &amp; historic landmarks nearby:</p><ul class="surroundings-list">';
        for (const f of geo.features) {
          html += '<li>' + this.escapeHtml(f.title) + (f.distance ? ' <span class="surroundings-dist">~' + f.distance + ' m away</span>' : '') + '</li>';
        }
        html += '</ul>';
      }
      if (species && species.habitat) {
        html += '<p class="surroundings-bio"><i class="fas fa-leaf"></i> <strong>' + this.escapeHtml(species.name) + '</strong> fits the <em>' + this.escapeHtml(species.habitat) + '</em> — a ' + this.escapeHtml(species.category || "living") + ' characteristic of this type of terrain.</p>';
      }
    } else if (species) {
      // No geolocation permission / offline: describe the expected surroundings from the species data.
      html += '<p class="surroundings-loc">Your location isn\'t shared — showing the expected surroundings from the species profile instead.</p>';
      html += '<p class="surroundings-bio"><i class="fas fa-leaf"></i> <strong>' + this.escapeHtml(species.name) + '</strong> is a ' + this.escapeHtml(species.category || "living") + ' found in the <em>' + this.escapeHtml(species.habitat) + '</em>.' +
        (species.soil ? ' It thrives in ' + this.escapeHtml(species.soil) + ' terrain.' : '') + '</p>';
      if (species.diet || species.behavior) {
        html += '<p class="surroundings-sub"><i class="fas fa-paw"></i> What to expect around it:</p><ul class="surroundings-list">';
        if (species.diet) html += '<li>Diet &amp; foraging: ' + this.escapeHtml(species.diet) + '</li>';
        if (species.behavior) html += '<li>Behaviour: ' + this.escapeHtml(species.behavior) + '</li>';
        html += '</ul>';
      }
    } else {
      html += '<p class="surroundings-loc">Surrounding landscape details aren\'t available for this result.</p>';
    }
    return html;
  },

  renderSurroundings() {
    const container = this.els.surroundings;
    if (!container) return;
    const body = this.surroundingsBodyHtml();
    container.innerHTML = '<details class="surroundings"><summary class="surroundings-title"><i class="fas fa-map-marked-alt"></i> Surroundings &amp; General Area</summary>' + body + '</details>';
    container.style.display = "block";
  },

  // Live conditions page: real-time weather, local time and recent local
  // sightings of the identified species (free, keyless APIs).
  liveConditionsHtml() {
    const w = (this.currentResult && this.currentResult.weather) || null;
    const s = (this.currentResult && this.currentResult.sightings) || null;
    if (!w && !s) return "";
    let html = "";
    if (w) {
      html += '<div class="live-weather"><span class="live-weather-chip"><i class="fas fa-temperature-half"></i> ' +
        Math.round(w.temperature) + '&deg;C</span>' +
        '<span class="live-weather-chip"><i class="fas fa-wind"></i> ' + Math.round(w.windKmh) + ' km/h</span>' +
        '<span class="live-weather-chip"><i class="fas ' + (w.isDay ? 'fa-sun' : 'fa-moon') + '"></i> ' + this.escapeHtml(this.weatherLabel(w.weatherCode)) + '</span>' +
        (w.localTime ? '<span class="live-weather-chip"><i class="fas fa-clock"></i> Local time ' + w.localTime + '</span>' : '') +
        '</div>';
      html += '<p class="book-text">Live conditions right now at the scan location.</p>';
    }
    if (s) {
      if (s.total > 0) {
        html += '<p class="book-text"><i class="fas fa-binoculars"></i> <strong>' + s.total + '</strong> recent observation' + (s.total === 1 ? '' : 's') +
          ' of this species recorded nearby on iNaturalist.</p>';
        if (s.recent && s.recent.length) {
          html += '<ul class="sighting-list">';
          for (const r of s.recent) {
            html += '<li class="sighting-item">' +
              (r.photoUrl ? '<img src="' + r.photoUrl + '" alt="Sighting photo" class="sighting-thumb">' : '<span class="sighting-thumb empty"><i class="fas fa-paw"></i></span>') +
              '<div class="sighting-info"><strong>' + this.escapeHtml(r.place || "Nearby location") + '</strong>' +
              (r.date ? '<span>' + this.escapeHtml(r.date) + '</span>' : '') + '</div></li>';
          }
          html += '</ul>';
        }
      } else {
        html += '<p class="book-text"><i class="fas fa-binoculars"></i> No recent sightings of this species are recorded within 50 km of your location.</p>';
      }
    }
    return html;
  },

  // History & cultural context page: Wikipedia summary + GBIF authority data.
  historyHtml() {
    const h = (this.currentResult && this.currentResult.history) || null;
    const g = (this.currentResult && this.currentResult.gbif) || null;
    if (!h && !g) return "";
    let html = "";
    if (h) {
      html += '<p class="book-text">' + this.escapeHtml(h.extract) + '</p>';
      if (h.pageUrl) {
        html += '<p class="book-text"><a class="ai-source-link" href="' + h.pageUrl + '" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Read more on Wikipedia</a></p>';
      }
    }
    if (g) {
      html += '<p class="book-text"><i class="fas fa-database"></i> <strong>GBIF</strong> — Global Biodiversity Information Facility confirms the accepted scientific name <em>' +
        this.escapeHtml(g.scientificName) + '</em>' +
        (g.status ? ' (status: ' + this.escapeHtml(g.status) + ')' : '') +
        '.</p>';
    }
    return html;
  },

  escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  },

  // Whole-word/phrase boundary matcher (case-insensitive) to avoid substring
  // false positives like "ant" matching inside "panthera" or "lamp" in "melampus".
  wordMatch(haystack, needle) {
    if (!haystack || !needle) return false;
    const n = String(needle).toLowerCase();
    const re = new RegExp("(^|[^a-z0-9])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9])");
    return re.test(String(haystack).toLowerCase());
  },

  // Match a MobileNet label to a species key using labelToSpecies + tags.
  // Uses whole-word matching and prefers the longest matching pattern so that
  // generic words (e.g. "ant") never steal matches from specific ones (e.g. "tiger").
  matchSpeciesKey(labelLower) {
    let best = null;
    let bestLen = 0;
    for (const [pattern, key] of Object.entries(this.labelToSpecies)) {
      if (this.wordMatch(labelLower, pattern) && this.speciesDB[key]) {
        if (pattern.length > bestLen) { best = key; bestLen = pattern.length; }
      }
    }
    if (best) return best;
    best = null;
    bestLen = 0;
    for (const key of Object.keys(this.speciesDB)) {
      const item = this.speciesDB[key];
      for (const tag of item.tags) {
        if (tag && this.wordMatch(labelLower, tag) && tag.length > bestLen) {
          best = key;
          bestLen = tag.length;
        }
      }
    }
    return best;
  },

  // Turn MobileNet predictions into a deduplicated detection list.
  // Every detected object is reported: living, non-living, or unidentified.
  // Species are matched FIRST so a living organism is never hidden behind a
  // non-living keyword that merely shares a substring with its name.
  buildDetections(predictions) {
    const detections = [];
    if (!predictions || !predictions.length) return detections;
    const seenKeys = {};
    const seenLabels = {};
    for (const pred of predictions) {
      if (!pred || !pred.className) continue;
      const labelLower = pred.className.toLowerCase();
      const confidence = Math.round(pred.probability * 100);
      const key = this.matchSpeciesKey(labelLower);
      if (key && this.speciesDB[key]) {
        if (!seenKeys[key]) {
          seenKeys[key] = true;
          detections.push({ kind: "living", label: pred.className, confidence, key, species: this.speciesDB[key] });
        }
        continue;
      }
      if (this.detectNonLiving(labelLower)) {
        if (!seenLabels[labelLower]) {
          seenLabels[labelLower] = true;
          detections.push({ kind: "non-living", label: pred.className, confidence });
        }
        continue;
      }
      if (!seenLabels[labelLower]) {
        seenLabels[labelLower] = true;
        detections.push({ kind: "unidentified", label: pred.className, confidence });
      }
    }
    detections.sort((a, b) => b.confidence - a.confidence);
    return detections;
  },

  // Real AI: TensorFlow.js MobileNet classification + filename fallback.
  // Reports EVERYTHING detected in the scene (living + non-living), with details.
  async simulateScanAsync(input) {
    const speciesKeys = Object.keys(this.speciesDB);
    let bestMatch = null;
    let bestScore = 0;
    let aiConfidence = 0;
    let aiLabel = "";
    let predictions = [];
    let cloudAttempted = false;
    let cloudFallbackReason = null;

    // Step 1: Tier-1 real cloud vision AI via the Flask backend (if deployed).
    // Tier-2: on-device transfer-learning wildlife classifier (WildGuardAI).
    // Tier-3: generic MobileNet ImageNet labels + filename keywords.
    this.els.loadingText.textContent = "Running AI vision on the image...";
    let cloudResult = null;
    let trainedPick = null;
    if (this.els.previewImg && this.els.previewImg.src) {
      cloudResult = await this.cloudScan(this.els.previewImg.src);
      cloudAttempted = true;
      if (cloudResult && cloudResult.available && cloudResult.tags && cloudResult.tags.length) {
        const cloudMatches = this.tagsToSpecies(cloudResult.tags);
        if (cloudMatches.length) {
          bestMatch = cloudMatches[0].key;
          aiConfidence = cloudMatches[0].confidence;
          aiLabel = cloudResult.caption || "";
        }
      } else if (cloudResult && !cloudResult.available) {
        // Cloud AI unavailable — honest fallback messaging
        cloudFallbackReason = cloudResult.message || cloudResult.reason;
        this.els.loadingText.textContent = "Cloud AI unavailable — using on-device model...";
        await new Promise(r => setTimeout(r, 400));
      }
      // If the cloud tier is unconfigured/unreachable, fall to the on-device
      // trained model for a real wildlife identification.
      if (!bestMatch && typeof WildGuardAI !== "undefined" && WildGuardAI.isReady()) {
        try {
          trainedPick = await WildGuardAI.topPick(this.els.previewImg);
        } catch (e) {}
        if (trainedPick && this.speciesDB[trainedPick.key]) {
          bestMatch = trainedPick.key;
          aiConfidence = Math.round(trainedPick.score * 100);
          aiLabel = trainedPick.name;
        }
      }
    }

    // Step 2: TensorFlow.js classification if the trained tiers produced nothing.
    if (!bestMatch && this.tfModel && this.els.previewImg) {
      try {
        predictions = await this.tfModel.classify(this.els.previewImg, 5);
        console.log("AI Predictions:", predictions);
      } catch (err) {
        console.error("AI classification error:", err);
      }
    }

    // Build the full detection list (living + non-living + unidentified)
    const detections = this.buildDetections(predictions);
    const livingDetections = detections.filter(d => d.kind === "living");
    const primary = livingDetections[0] || null;

    if (primary && !bestMatch) {
      bestMatch = primary.key;
      aiConfidence = primary.confidence;
      aiLabel = primary.label;
    }

    // Step 3: if no AI living match, try filename keywords
    if (!bestMatch) {
      let searchText = "";
      if (this.lastInputSource && this.lastInputSource.name) {
        const raw = this.lastInputSource.name.toLowerCase().replace(/\.[^.]+$/, "");
        searchText = raw.replace(/[_\-\\s.]+/g, " ");
      }
      speciesKeys.forEach(key => {
        const item = this.speciesDB[key];
        let score = 0;
        const allWords = [key, ...item.tags];
        allWords.forEach(word => {
          if (!word) return;
          const w = word.toLowerCase();
          if (searchText.includes(" " + w + " ") || searchText.startsWith(w + " ") || searchText.endsWith(" " + w) || searchText === w) {
            score += w === key.toLowerCase() ? 50 : 10;
          } else if (searchText.includes(w)) {
            score += w === key.toLowerCase() ? 30 : 5;
          }
        });
        if (score > bestScore) { bestScore = score; bestMatch = key; }
      });
    }

    // Step 4: no confident species match.
    // Show an honest non-living scene when only objects were detected,
    // otherwise an honest "couldn't confidently identify" state.
    if (!bestMatch) {
      const nonLiving = detections.filter(d => d.kind === "non-living");
      if (nonLiving.length) {
        this.showNonLivingResult(nonLiving[0].label, nonLiving[0].confidence);
        this.renderSceneAnalysis(detections, null);
      } else {
        this.showUnidentifiedResult(detections);
      }
      return;
    }

    const species = this.speciesDB[bestMatch];
    // Honest confidence: use actual model scores, not fabricated randomness.
    let confidence;
    if (aiConfidence > 0) {
      // Cloud vision or trained model provided a real confidence
      confidence = aiConfidence;
    } else if (primary && primary.confidence) {
      // MobileNet prediction confidence (0-100)
      confidence = primary.confidence;
    } else if (bestScore > 0) {
      // Filename keyword match - weak signal, fixed base
      confidence = 70;
    } else {
      // Should not reach here (handled above), but fallback
      confidence = 60;
    }

    // Determine the AI source used for this identification
    let aiSource;
    if (cloudResult && cloudResult.available) {
      aiSource = "Azure AI Vision cloud";
    } else if (trainedPick) {
      aiSource = "Trained wildlife AI (on-device)";
      if (cloudFallbackReason) aiSource += " — cloud unavailable: " + cloudFallbackReason;
    } else if (primary && primary.confidence) {
      aiSource = "MobileNet neural network";
      if (cloudFallbackReason) aiSource += " — cloud unavailable: " + cloudFallbackReason;
    } else if (bestScore > 0) {
      aiSource = "Smart keyword match (filename)";
      if (cloudFallbackReason) aiSource += " — cloud unavailable: " + cloudFallbackReason;
    } else {
      aiSource = "Local species database";
    }
    let iNat = null;

    // Enrich with real-world data from the free iNaturalist API when online.
    // Prefer the scientific name (binomial) for precise iNaturalist matching.
    this.els.loadingText.textContent = "Consulting global biodiversity database...";
    const sciQuery = (species.scientificName && species.scientificName.split(" ").length >= 2)
      ? species.scientificName
      : (aiLabel || species.name || bestMatch);
    iNat = await this.enrichWithINaturalist(sciQuery);
    if (iNat) {
      aiSource = "MobileNet + iNaturalist";
      if (iNat.scientificName) {
        const cur = species.scientificName || "";
        // Prefer iNaturalist's scientific name when it looks real (contains a space / genus epithet)
        if (iNat.scientificName.split(" ").length >= 2 && cur.split(" ").length < 2) {
          species.scientificName = iNat.scientificName;
        }
      }
    }

    this.currentResult = { species, confidence, key: bestMatch, aiSource, iNat, detections };

    // Real-world surroundings enrichment: location, geography, historic features,
    // and nearby biological places (uses free, keyless APIs when online).
    this.els.loadingText.textContent = "Reading the surrounding landscape...";
    const geo = await this.enrichWithGeography();
    this.currentResult.geo = geo;

    // Parallel real-time + wildlife-library enrichment: live weather at the
    // scan location, recent local sightings, historic background, and GBIF
    // authority data. All free, keyless APIs that never throw.
    this.els.loadingText.textContent = "Checking live conditions & global records...";
    const liveJobs = [];
    if (geo && geo.lat && geo.lng) {
      liveJobs.push(
        this.enrichWithWeather(geo.lat, geo.lng).then(function(w) { if (w) this.currentResult.weather = w; }.bind(this)).catch(() => {}),
        this.enrichWithSightings(iNat && iNat.inaturalistId, geo.lat, geo.lng).then(function(s) { if (s) this.currentResult.sightings = s; }.bind(this)).catch(() => {})
      );
    }
    liveJobs.push(
      this.enrichWithWikipediaExtract(species.scientificName || species.name).then(function(h) { if (h) this.currentResult.history = h; }.bind(this)).catch(() => {}),
      this.enrichWithGBIF(species.scientificName || species.name).then(function(g) { if (g) this.currentResult.gbif = g; }.bind(this)).catch(() => {})
    );
    await Promise.all(liveJobs);

    // Reflect the multi-source live enrichment in the AI source badge.
    const liveParts = [];
    if (this.currentResult.weather) liveParts.push("weather");
    if (this.currentResult.sightings) liveParts.push("sightings");
    if (this.currentResult.history) liveParts.push("Wikipedia");
    if (this.currentResult.gbif) liveParts.push("GBIF");
    if (liveParts.length) {
      this.currentResult.aiSource = aiSource + " + " + liveParts.join(", ");
    }

    // Perceptual fingerprint so repeat scans (even from another angle) are linked.
    const hash = (this.els.previewImg && this.els.previewImg.src) ? await this.computeImageHash(this.els.previewImg.src) : null;
    if (hash) this.currentResult.hash = hash;
    this.currentResult.pastScans = this.findPastScans(bestMatch, hash);

    // Real work is complete (AI inference, enrichment APIs). Just finalize.
    this.els.loadingText.textContent = "Finalizing results...";
    // Small yield to let UI update
    await new Promise(r => setTimeout(r, 50));

    this.els.loadingState.style.display = "none";
    this.els.resultState.style.display = "block";
    this.els.resultCategory.textContent = species.category;
    this.els.resultTitle.textContent = species.name;
    this.els.resultScientificName.textContent = species.scientificName;
    this.els.resultStatusBadge.className = "status-badge " + species.statusClass;
    this.els.resultStatusBadge.textContent = species.status;
    const confText = aiLabel ? confidence + "% AI confidence" : confidence + "% confidence match";

    // AI source badge
    let aiSourceHtml = '<div class="ai-source-badge"><i class="fas fa-microchip"></i> ' + this.currentResult.aiSource +
      (this.currentResult.iNat && this.currentResult.iNat.commonName ? ' &middot; ' + this.currentResult.iNat.commonName : '') +
      '</div>';
    if (this.currentResult.iNat && this.currentResult.iNat.wikiUrl) {
      aiSourceHtml += ' <a class="ai-source-link" href="' + this.currentResult.iNat.wikiUrl + '" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> View on Wikipedia</a>';
    }

    // Liveness indicator and confidence bar
    this.els.resultConfidence.innerHTML =
      aiSourceHtml +
      '<span class="liveness-indicator living"><i class="fas fa-heartbeat"></i> LIVING ORGANISM</span>' +
      '<div class="confidence-wrapper">' +
      '<span class="confidence-bar-container"><span class="confidence-bar" style="width: ' + confidence + '%; background: linear-gradient(90deg, #2d6a4f, #4caf50);"></span></span>' +
      '<span class="confidence-text">' + confText + '</span>' +
      '</div>';

    const harm = this.assessHarm(species);

    // Field-guide book: fixed-height pages you flip through (no scrolling).
    // Page 1 opens on the cover of the guide with the key facts.
    const pages = [];

    // Page 1 — Cover & quick facts
    pages.push(
      '<div class="book-page" data-page="0">' +
      '<div class="book-page-label"><i class="fas fa-book-open"></i> Species Card</div>' +
      '<div class="bio-grid">' +
      '<div class="bio-tile"><span class="bio-label">Kingdom</span><span class="bio-value">' + species.kingdom + '</span></div>' +
      '<div class="bio-tile"><span class="bio-label">Domain</span><span class="bio-value">' + species.domain + '</span></div>' +
      '<div class="bio-tile"><span class="bio-label">Category</span><span class="bio-value">' + species.category + '</span></div>' +
      '<div class="bio-tile"><span class="bio-label">Population</span><span class="bio-value">' + species.population + '</span></div>' +
      '</div>' +
      '<div class="safety-badge ' + harm.cls + '"><i class="fas ' + harm.icon + '"></i> ' + harm.label + '</div>' +
      '</div>'
    );

    // Page 2 — Feeding habit
    pages.push(
      '<div class="book-page" data-page="1">' +
      '<div class="book-page-label"><i class="fas fa-utensils"></i> Feeding Habit</div>' +
      '<p class="book-text">' + species.diet + '</p>' +
      '</div>'
    );

    // Page 3 — Adaptations & safety
    pages.push(
      '<div class="book-page" data-page="2">' +
      '<div class="book-page-label"><i class="fas fa-shield-halved"></i> Adaptations &amp; Safety</div>' +
      '<p class="book-text">' + species.behavior + '</p>' +
      '<div class="safety-badge ' + harm.cls + '"><i class="fas ' + harm.icon + '"></i> ' + harm.label + '</div>' +
      '</div>'
    );

    // Page 4 — Habitat & geography
    pages.push(
      '<div class="book-page" data-page="3">' +
      '<div class="book-page-label"><i class="fas fa-globe-africa"></i> Habitat &amp; Geography</div>' +
      '<p class="book-text">' + species.habitat +
      (species.soil ? '<br><span class="detail-dim"><i class="fas fa-layer-group"></i> Soil: ' + species.soil + '</span>' : '') +
      '</p>' +
      '</div>'
    );

    // Page 5 — Threats & conservation
    pages.push(
      '<div class="book-page" data-page="4">' +
      '<div class="book-page-label"><i class="fas fa-exclamation-triangle"></i> Threats &amp; Conservation</div>' +
      '<p class="book-text">' + species.threats + '</p>' +
      '</div>'
    );

    // Page 6 — About
    pages.push(
      '<div class="book-page" data-page="5">' +
      '<div class="book-page-label"><i class="fas fa-info-circle"></i> About</div>' +
      '<p class="book-text">' + species.desc + '</p>' +
      '</div>'
    );

    // Page 7 — Live conditions (real-time weather, local time, local sightings)
    const liveHtml = this.liveConditionsHtml();
    if (liveHtml) {
      pages.push(
        '<div class="book-page" data-page="' + pages.length + '">' +
        '<div class="book-page-label"><i class="fas fa-cloud-sun"></i> Live Conditions</div>' +
        liveHtml +
        '</div>'
      );
    }

    // Page 8 — History & cultural context (Wikipedia extract + GBIF authority)
    const historyHtml = this.historyHtml();
    if (historyHtml) {
      pages.push(
        '<div class="book-page" data-page="' + pages.length + '">' +
        '<div class="book-page-label"><i class="fas fa-landmark"></i> History &amp; Cultural Context</div>' +
        historyHtml +
        '</div>'
      );
    }

    // Page 7 — Everything detected in the scene (if more than one)
    const sceneList = this.sceneListHtml(detections, bestMatch);
    if (sceneList) {
      pages.push(
        '<div class="book-page" data-page="' + pages.length + '">' +
        '<div class="book-page-label"><i class="fas fa-shapes"></i> Scene Analysis — Everything Detected</div>' +
        sceneList +
        '</div>'
      );
    }

    // Page 8 — Past scans (if any)
    const pastList = this.pastScanListHtml();
    if (pastList) {
      pages.push(
        '<div class="book-page" data-page="' + pages.length + '">' +
        '<div class="book-page-label"><i class="fas fa-clock"></i> Past Scans</div>' +
        pastList +
        '</div>'
      );
    }

    // Page 9 — Surroundings & general area
    const surrBody = this.surroundingsBodyHtml();
    if (surrBody) {
      pages.push(
        '<div class="book-page" data-page="' + pages.length + '">' +
        '<div class="book-page-label"><i class="fas fa-map-marked-alt"></i> Surroundings &amp; General Area</div>' +
        surrBody +
        '</div>'
      );
    }

    this.renderBook(pages);

    // Inject save/admin buttons and auto-send to admin
    const resultActions = this.els.resultState.querySelector(".result-actions");
    if (resultActions) {
      const isFav = (typeof window.isFavourite === "function") && window.isFavourite(bestMatch);
      resultActions.innerHTML =
        '<button id="saveToLibraryBtn" class="read-btn" onclick="WildlifeScan.saveToLibrary()"><i class="fas fa-bookmark"></i> Save to Library</button>' +
        '<button id="favouriteBtn" class="library-link" onclick="WildlifeScan.toggleFavourite()"><i class="fas fa-' + (isFav ? 'heart' : 'heart') + '"></i> <span id="favouriteBtnLabel">' + (isFav ? 'Remove from Favourites' : 'Add to Favourites') + '</span></button>';
      this._favouriteKey = bestMatch;
      this._favouriteSpecies = { name: species.name, scientificName: species.scientificName, status: species.status, image: "" };
    }
    
    // Auto-send result to admin after a brief delay so user can see it first
    setTimeout(() => {
      if (!this._sentToAdmin && this.currentResult && !this.currentResult.nonLiving) {
        this.sendToAdmin();
        this.showToast("Result automatically sent to admin for review.");
      }
    }, 3500);

    if (window.speechSynthesis) {
      const aiNote = aiLabel ? ", using artificial intelligence to identify features matching the species database." : ".";
      const harmNote = harm.harmful
        ? " Caution: this " + species.category + " can be harmful to humans, so keep a safe distance."
        : " This " + species.category + " is not harmful to humans.";
      const geoNote = (this.currentResult.geo && (this.currentResult.geo.place || this.currentResult.geo.region || this.currentResult.geo.country))
        ? " It was scanned around " + this.currentResult.geo.place + ", " + this.currentResult.geo.region + ", " + this.currentResult.geo.country + "."
        : "";
      let liveNote = "";
      const weather = this.currentResult.weather;
      const sightings = this.currentResult.sightings;
      if (weather && typeof weather.temperature === "number") {
        liveNote += " Right now it is " + Math.round(weather.temperature) + " degrees celsius and " +
          (this.weatherLabel(weather.weatherCode).toLowerCase()) + (weather.isDay ? " during the day" : " at night") + " here.";
      }
      if (sightings && sightings.total > 0) {
        liveNote += " This species has " + sightings.total + " recent recorded observation" + (sightings.total === 1 ? "" : "s") + " near this location.";
      }
      let sceneNote = "";
      const others = (detections || []).filter(d => d.kind === "living" && d.key !== bestMatch);
      if (others.length) {
        sceneNote = " I also detected " + others.length + " other living thing" + (others.length > 1 ? "s" : "") + " in this scene, including " + others.map(d => d.species.name).join(" and ") + ".";
      }
      this.speak(species.name + ", " + species.scientificName + ". Biological data: a " + species.domain + " from the kingdom " + species.kingdom +
        ", a " + species.category + " with a wild population of about " + species.population + ". Feeding habit: " + species.diet + ". Adaptations: " + species.behavior +
        "." + harmNote + " Habitat: " + species.habitat + (species.soil ? ", soil " + species.soil + "." : ".") + " Conservation status: " + species.status + "." + geoNote + liveNote + sceneNote + aiNote);
    }
  },

  async saveToLibrary() {
    if (!this.currentResult) return;
    const scans = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    const currentUser = (typeof window.getCurrentUser === "function") ? window.getCurrentUser() : null;
    const species = this.currentResult.species;
    const scanRecord = {
      id: "scan_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      species: species,
      scanType: "wildlife",
      category: this.categorySlug(species.category),
      confidence: this.currentResult.confidence,
      imageData: this.els.previewImg ? this.els.previewImg.src : "",
      hash: this.currentResult.hash || "",
      geo: this.currentResult.geo || null,
      pastScans: (this.currentResult.pastScans || []).length,
      approved: true,
      source: "user_scan",
      user: currentUser && currentUser.email ? currentUser.email : ""
    };
    scans.unshift(scanRecord);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scans));

    // Also save to backend if available
    try {
      if (window.UserAPI) {
        await window.UserAPI.addScan({
          species_name: this.currentResult.species.name,
          confidence: this.currentResult.confidence,
          image_data: this.els.previewImg ? this.els.previewImg.src : ""
        });
      } else {
        const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:5000' : '';
        if (API_BASE) {
          await fetch(API_BASE + '/api/user/scans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              species_name: this.currentResult.species.name,
              confidence: this.currentResult.confidence,
              image_data: this.els.previewImg ? this.els.previewImg.src : ""
            })
          });
        }
      }
    } catch (e) {}

    this.showToast("Saved to Library!");
  },

  // Save a non-living nature scene / landscape as a systematic library record.
  saveScene() {
    if (!this.currentResult || !this.currentResult.nonLiving) return;
    const scans = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    const currentUser = (typeof window.getCurrentUser === "function") ? window.getCurrentUser() : null;
    const label = this.currentResult.label || "Natural scene";
    const scanRecord = {
      id: "scene_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      scanType: "nature-scene",
      category: "landscapes",
      species: { name: "Natural Scene: " + label, category: "Landscape / Habitat", habitat: "", status: "Scene", statusClass: "scene" },
      label: label,
      confidence: this.currentResult.confidence,
      imageData: this.els.previewImg ? this.els.previewImg.src : "",
      hash: this.currentResult.hash || "",
      geo: this.currentResult.geo || null,
      approved: true,
      source: "user_scan",
      user: currentUser && currentUser.email ? currentUser.email : ""
    };
    scans.unshift(scanRecord);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scans));
    this.showToast("Scene saved to Library!");
  },

  toggleFavourite() {
    if (!this.currentResult || !this._favouriteKey) return;
    const key = this._favouriteKey;
    const species = this._favouriteSpecies || { name: this.currentResult.species.name, scientificName: this.currentResult.species.scientificName, status: this.currentResult.species.status, image: "" };
    if (typeof window.toggleFavourite === "function") {
      const result = window.toggleFavourite(key, species);
      const label = document.getElementById("favouriteBtnLabel");
      if (result.favourited) {
        this.showToast("Added to Favourites");
        if (label) label.textContent = "Remove from Favourites";
      } else if (result.success) {
        this.showToast("Removed from Favourites");
        if (label) label.textContent = "Add to Favourites";
      } else {
        this.showToast(result.message || "Please sign in to save favourites");
        setTimeout(() => { window.location.href = "login.html"; }, 1200);
      }
    }
  },

  _sentToAdmin: false,

  sendToAdmin() {
    if (!this.currentResult || this._sentToAdmin) return;
    const pending = JSON.parse(localStorage.getItem(this.PENDING_ADMIN_KEY) || "[]");
    // Prevent duplicate based on species + timestamp in last 30 seconds
    const now = Date.now();
    const isDuplicate = pending.some(p => p.species && p.species.name === this.currentResult.species.name && (now - new Date(p.timestamp).getTime()) < 30000);
    if (isDuplicate) return;
    const scanRecord = {
      id: "pending_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      species: this.currentResult.species,
      scanType: "wildlife",
      category: this.categorySlug(this.currentResult.species.category),
      confidence: this.currentResult.confidence,
      imageData: this.els.previewImg ? this.els.previewImg.src : "",
      hash: this.currentResult.hash || "",
      geo: this.currentResult.geo || null,
      status: "pending",
      source: "user_scan",
      user: (typeof window.getCurrentUser === "function" && window.getCurrentUser() && window.getCurrentUser().email) || ""
    };
    pending.unshift(scanRecord);
    localStorage.setItem(this.PENDING_ADMIN_KEY, JSON.stringify(pending));
    this._sentToAdmin = true;
    // Offline support: queue the scan so it reaches admin when back online
    if (window.Connectivity && !window.Connectivity.isOnline()) {
      window.Connectivity.registerHandler('scan_pending', function(payload) {
        var pendingScans = JSON.parse(localStorage.getItem("wildlife_pending_admin") || "[]");
        if (!pendingScans.some(function(p) { return p.id === payload.id; })) {
          pendingScans.unshift(payload);
          localStorage.setItem("wildlife_pending_admin", JSON.stringify(pendingScans));
        }
      });
      window.Connectivity.queueOfflineAction({ type: 'scan_pending', payload: scanRecord });
      this.showToast("Offline — scan queued. It will sync when you reconnect.");
      return;
    }
    // Notify admins so the portal bell lights up
    try {
      const speciesName = (this.currentResult.species && this.currentResult.species.name) || 'an animal';
      const scannerName = (typeof window.getCurrentUser === "function" && window.getCurrentUser() && window.getCurrentUser().name) || (typeof window.getCurrentUser === "function" && window.getCurrentUser() && window.getCurrentUser().email) || 'Someone';
      if (typeof window.addAdminNotification === "function") {
        window.addAdminNotification({ type: 'scan_pending', title: 'New Scan Pending', message: scannerName + ' scanned ' + speciesName + ' — awaiting approval.', species: speciesName });
      } else {
        const notifs = JSON.parse(localStorage.getItem("wildguard_admin_notifications") || "[]");
        notifs.unshift({ id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), read: false, type: "scan_pending", title: "New Scan Pending", message: scannerName + " scanned " + speciesName + " — awaiting approval." });
        if (notifs.length > 100) notifs.splice(100);
        localStorage.setItem("wildguard_admin_notifications", JSON.stringify(notifs));
      }
    } catch (nErr) {}
    this.showToast("Sent to Admin for approval!");
  },

  showToast(message) {
    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#2d6a4f,#1e3a2b);color:#fff;padding:12px 24px;border-radius:8px;z-index:3000;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease;";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  },

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      this.processVoiceCommand(transcript);
    };
    this.recognition.onerror = () => {
      this.updateVoiceStatus("Error. Try again.", false);
    };
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.els.voiceBtn) this.els.voiceBtn.classList.remove("listening");
      this.updateVoiceStatus("", false);
    };
  },

  toggleVoiceListening() {
    if (!this.recognition) {
      alert("Voice commands not supported. Try Chrome.");
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.isListening = true;
      if (this.els.voiceBtn) this.els.voiceBtn.classList.add("listening");
      this.updateVoiceStatus("Listening...", true);
      this.recognition.start();
    }
  },

  updateVoiceStatus(text, isActive) {
    if (this.els.voiceStatus) {
      this.els.voiceStatus.textContent = text;
      this.els.voiceStatus.style.color = isActive ? "#F4A261" : "#888";
    }
  },

  processVoiceCommand(command) {
    this.updateVoiceStatus('Heard: "' + command + '"', false);
    if (command.includes("scan") || command.includes("identify")) {
      this.speak("Please upload an image or take a photo to scan.");
    } else if (command.includes("photo") || command.includes("camera") || command.includes("picture")) {
      this.speak("Opening camera.");
      this.openCamera();
    } else if (command.includes("upload") || command.includes("image")) {
      this.speak("Please select an image to upload.");
      this.els.fileInput.click();
    } else if (command.includes("clear") || command.includes("reset")) {
      this.speak("Clearing results.");
      this.resetScan();
    } else if (command.includes("read") || command.includes("aloud")) {
      this.readFieldGuide();
    } else {
      this.speak("Command not recognized. Try: scan, take photo, upload image, or clear.");
    }
  },

  // Select a natural-sounding voice once voices are loaded
  selectNaturalVoice() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    // Prefer expressive, human-like voices (native & neural when available)
    const preferred = [
      "Google UK English Female", "Google US English", "Google UK English Male",
      "Samantha", "Victoria", "Karen", "Moira", "Fiona", "Tessa", "Zira",
      "Microsoft Aria", "Microsoft Jenny", "Microsoft Guy", "Microsoft Hazel",
      "Microsoft Zira", "Microsoft David", "Microsoft Catherine",
      "Alex", "Daniel", "Serena"
    ];
    for (let name of preferred) {
      const found = voices.find(v => v.name === name);
      if (found) { this.selectedVoice = found; return; }
    }
    // Fallback: prefer a female English voice (usually clearer), else any English
    const en = voices.filter(v => v.lang && v.lang.startsWith("en"));
    const female = en.find(v => /female|woman/i.test(v.name)) || en.find(v => /samantha|zira|aria|jenny|hazel/i.test(v.name));
    if (female) { this.selectedVoice = female; return; }
    if (en[0]) this.selectedVoice = en[0];
  },

  // Human-like narration: the pitch and rate rise and fall phrase by phrase,
  // important facts slow down for emphasis, numbers are enunciated, and the
  // pauses between clauses follow a natural breathing rhythm. Safety warnings
  // are delivered in a lower, slower tone.
  speak(text) {
    if (!window.speechSynthesis) return;
    if (!this.selectedVoice) this.selectNaturalVoice();
    window.speechSynthesis.cancel();

    // Split into sentences, then each sentence into shorter clauses so the
    // voice can vary its tone more naturally (like a person speaking).
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const segments = [];
    sentences.forEach((sentence, si) => {
      const trimmed = sentence.trim();
      const hasQuestion = /\?/.test(trimmed);
      const hasExclaim = /!/.test(trimmed);
      const clauses = trimmed.replace(/\s*[.!?]+\s*$/, "").split(/(?<=[,:;])\s+/);
      clauses.forEach((clause, ci) => {
        segments.push({ text: clause.trim(), si, ci, total: clauses.length, hasQuestion, hasExclaim });
      });
    });

    const speakNext = (index) => {
      if (index >= segments.length) return;
      const seg = segments[index];
      const lower = seg.text.toLowerCase();
      const utterance = new SpeechSynthesisUtterance(seg.text);

      // Base: warm conversational pace
      let rate = 0.92, pitch = 1.0, volume = 1.0;

      // Enunciate numbers and scientific figures (slow + a touch of clarity)
      if (/\d|population|percent|kilogram|meter|kilometer/.test(lower)) { rate -= 0.06; pitch += 0.03; }

      // Emphasize the subject name (usually the first segment)
      if (seg.si === 0 && seg.ci === 0) { pitch += 0.05; rate -= 0.02; }

      // Scientific names (Latin two-word) spoken deliberately
      if (/[A-Z][a-z]+ [a-z]+ [a-z]+/.test(seg.text) && /\b[A-Z][a-z]{2,}\b/.test(seg.text)) { rate -= 0.05; }

      // Safety warnings: lower, slower, more serious
      if (/harmful|dangerous|safe distance|venom|toxic|poison|caution|aggressive/.test(lower)) {
        rate -= 0.1; pitch -= 0.09; volume = 1.05;
      }

      // Positive/cheerful facts warm up
      if (/help|protect|thrive|remarkable|unique|play(s|ing)? a vital/.test(lower)) { pitch += 0.05; rate += 0.02; }

      // Mid-sentence clauses keep moving; clause boundaries breathe briefly
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      if (this.selectedVoice) utterance.voice = this.selectedVoice;
      utterance.onend = () => {
        // Pause rhythm: short breath at a comma, longer between sentences,
        // a beat of reflection after questions or warnings.
        let pause = 180;
        if (seg.ci < seg.total - 1) pause = 220;
        else if (seg.hasExclaim) pause = 520;
        else if (seg.hasQuestion) pause = 580;
        else if (/\b(safe distance|harmful|conservation status)\b/i.test(seg.text)) pause = 560;
        else pause = 380;
        setTimeout(() => speakNext(index + 1), pause);
      };
      window.speechSynthesis.speak(utterance);
    };
    speakNext(0);
  },

  readFieldGuide() {
    if (!this.currentResult || !this.currentResult.species) return;
    const { species } = this.currentResult;
    const harm = this.assessHarm(species);
    const harmNote = harm.harmful
      ? " This " + species.category + " can be harmful to humans, so keep a safe distance."
      : " This " + species.category + " is not harmful to humans.";
    const geoNote = (this.currentResult.geo && (this.currentResult.geo.place || this.currentResult.geo.region || this.currentResult.geo.country))
      ? " It was scanned around " + this.currentResult.geo.place + ", " + this.currentResult.geo.region + ", " + this.currentResult.geo.country + "."
      : "";
    const text =
      species.name + ", " + species.scientificName + ". " +
      "Biological data: " + species.domain + ", kingdom " + species.kingdom + ", category " + species.category + ", population about " + species.population + ". " +
      "Feeding habit: " + species.diet + ". " +
      "Adaptations: " + species.behavior + "." + harmNote +
      " Habitat: " + species.habitat + (species.soil ? ", soil " + species.soil + "." : ".") +
      " Conservation status: " + species.status + "." + geoNote;
    let sceneNote = "";
    const detections = this.currentResult.detections || [];
    const others = detections.filter(d => d.kind === "living" && d.key !== this.currentResult.key);
    if (others.length) {
      sceneNote = " Scene analysis: I also detected " + others.length + " other living thing" + (others.length > 1 ? "s" : "") + ", including " + others.map(d => d.species.name).join(" and ") + ". ";
    }
    this.speak(text + " " + sceneNote);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  WildlifeScan.init();
});
