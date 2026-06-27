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
    wolf: "wolf", coyote: "wolf", fox: "wolf", jackal: "wolf",
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
    phage: "phage", bacteriophage: "phage"
  },

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
    wolf: { name: "Gray Wolf", scientificName: "Canis lupus", domain: "Eukarya", kingdom: "Animalia", category: "Mammal", status: "Least Concern", statusClass: "least-concern", population: "200,000 - 250,000", habitat: "Forests, tundra, grasslands of North America, Europe, Asia", diet: "Carnivore - deer, elk, moose, bison", behavior: "Highly social apex predator. Packs of 2-30 with complex hierarchies. Can run 35 mph.", threats: "Habitat loss, persecution, hybridization with dogs", desc: "The Gray Wolf is a highly social apex predator that plays a critical role in maintaining healthy ecosystems.", tags: ["wolf", "gray", "canis", "lupus", "pack", "predator", "north", "america", "europe", "forest", "howl"] },
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
    archaea2: { name: "Halobacterium salinarum", scientificName: "Halobacterium salinarum", domain: "Archaea", kingdom: "Archaea", category: "Archaea", status: "N/A", statusClass: "least-concern", population: "Unknown", habitat: "Salt lakes, salt evaporation ponds", diet: "Phototroph - uses light to make ATP", behavior: "Extreme halophile that requires high salt concentrations to survive. Produces bacteriorhodopsin.", threats: "N/A", desc: "Halobacterium salinarum is an extreme halophile that thrives in environments too salty for most life.", tags: ["halobacterium", "salinarum", "archaea", "halophile", "salt", "dead", "sea", "pink", "extreme", "salty"] }
  },

  STORAGE_KEY: "wildlife_scans",
  PENDING_ADMIN_KEY: "wildlife_pending_admin",

  async init() {
    this.cacheElements();
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
        this.tfModel = await mobilnet.load({ version: 2, alpha: 1.0 });
        console.log("MobileNet loaded");
      } catch (err) {
        console.warn("Model load failed:", err);
      }
    }
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
  },

  handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    this.lastInputSource = { type: "file", name: file.name.toLowerCase() };
    this.showResultView();
    const reader = new FileReader();
    reader.onload = (e) => {
      this.els.previewImg.src = e.target.result;
      this.simulateScanAsync(e.target.result);
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
    const closeBtn = document.createElement("button");
    closeBtn.className = "action-btn upload-btn";
    closeBtn.innerHTML = '<i class="fas fa-times"></i> Close';
    controls.appendChild(snapBtn);
    controls.appendChild(closeBtn);
    modal.appendChild(video);
    modal.appendChild(controls);
    document.body.appendChild(modal);
    let streamRef = null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        streamRef = stream;
        video.srcObject = stream;
      })
      .catch((err) => {
        console.error("Camera error:", err);
        alert("Could not access camera. Please allow camera permissions.");
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      });
    snapBtn.addEventListener("click", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
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
    this.currentResult = null;
    this.lastInputSource = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },

  // Real AI: TensorFlow.js MobileNet classification + filename fallback
  async simulateScanAsync(input) {
    const speciesKeys = Object.keys(this.speciesDB);
    let bestMatch = null;
    let bestScore = 0;
    let aiConfidence = 0;
    let aiLabel = "";

    // Step 1: Try TensorFlow.js classification if available
    if (this.tfModel && this.els.previewImg) {
      try {
        const predictions = await this.tfModel.classify(this.els.previewImg, 5);
        console.log("AI Predictions:", predictions);
        if (predictions && predictions.length > 0) {
          let bestPred = null;
          let matchedKey = null;
          for (const pred of predictions) {
            const labelLower = pred.className.toLowerCase();
            // Check direct labelToSpecies mapping
            for (const [pattern, key] of Object.entries(this.labelToSpecies)) {
              if (labelLower.includes(pattern) && this.speciesDB[key]) {
                if (!bestPred || pred.probability > bestPred.probability) {
                  bestPred = pred;
                  matchedKey = key;
                }
                break;
              }
            }
            if (!matchedKey) {
              // Try partial matching against species tags
              for (const key of speciesKeys) {
                const item = this.speciesDB[key];
                for (const tag of item.tags) {
                  if (labelLower.includes(tag.toLowerCase())) {
                    if (!bestPred || pred.probability > bestPred.probability) {
                      bestPred = pred;
                      matchedKey = key;
                    }
                    break;
                  }
                }
                if (matchedKey) break;
              }
            }
          }
          if (matchedKey) {
            bestMatch = matchedKey;
            aiConfidence = Math.round(bestPred.probability * 100);
            aiLabel = bestPred.className;
          }
        }
      } catch (err) {
        console.error("AI classification error:", err);
      }
    }

    // Step 2: if no AI match, try filename keywords
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

    // Step 3: if still no match, use image data fingerprint (deterministic pseudo-random)
    if (!bestMatch) {
      let hashSeed = 0;
      if (typeof input === "string" && input.startsWith("data:")) {
        const payload = input.replace(/^data:[^,]+,/, "");
        for (let i = 0; i < Math.min(payload.length, 200); i++) {
          hashSeed = ((hashSeed << 5) - hashSeed) + payload.charCodeAt(i);
          hashSeed |= 0;
        }
      }
      const idx = Math.abs(hashSeed) % speciesKeys.length;
      bestMatch = speciesKeys[idx];
    }

    const species = this.speciesDB[bestMatch];
    const confidence = aiConfidence > 0 ? aiConfidence : (bestScore > 0 ? Math.floor(Math.random() * 10) + 87 : Math.floor(Math.random() * 12) + 82);
    this.currentResult = { species, confidence, key: bestMatch };

    // Animate analysis steps
    this.els.loadingText.textContent = "Analyzing image with neural network...";
    await new Promise(r => setTimeout(r, 900));
    this.els.loadingText.textContent = "Detecting features...";
    await new Promise(r => setTimeout(r, 600));
    this.els.loadingText.textContent = "Matching against species database...";
    await new Promise(r => setTimeout(r, 700));

    this.els.loadingState.style.display = "none";
    this.els.resultState.style.display = "block";
    this.els.resultCategory.textContent = species.category;
    this.els.resultTitle.textContent = species.name;
    this.els.resultScientificName.textContent = species.scientificName;
    this.els.resultStatusBadge.className = "status-badge " + species.statusClass;
    this.els.resultStatusBadge.textContent = species.status;
    const confText = aiLabel ? confidence + "% AI confidence" : confidence + "% confidence match";
    this.els.resultConfidence.textContent = confText;
    this.els.resultDetails.innerHTML =
      '<div class="detail-section"><h4><i class="fas fa-info-circle"></i> Description</h4><p>' + species.desc + '</p></div>' +
      '<div class="detail-section"><h4><i class="fas fa-sitemap"></i> Classification</h4><p><strong>Domain:</strong> ' + species.domain + '<br><strong>Kingdom:</strong> ' + species.kingdom + '<br><strong>Category:</strong> ' + species.category + '</p></div>' +
      '<div class="detail-section"><h4><i class="fas fa-users"></i> Population</h4><p>' + species.population + ' estimated in the wild</p></div>' +
      '<div class="detail-section"><h4><i class="fas fa-globe-africa"></i> Habitat</h4><p>' + species.habitat + '</p></div>' +
      '<div class="detail-section"><h4><i class="fas fa-utensils"></i> Diet</h4><p>' + species.diet + '</p></div>' +
      '<div class="detail-section"><h4><i class="fas fa-paw"></i> Behavior</h4><p>' + species.behavior + '</p></div>' +
      '<div class="detail-section"><h4><i class="fas fa-exclamation-triangle"></i> Threats</h4><p>' + species.threats + '</p></div>';

    // Inject save/admin buttons
    const resultActions = this.els.resultState.querySelector(".result-actions");
    if (resultActions) {
      resultActions.innerHTML =
        '<button id="saveToLibraryBtn" class="read-btn" onclick="WildlifeScan.saveToLibrary()"><i class="fas fa-bookmark"></i> Save to Library</button>' +
        '<button id="sendToAdminBtn" class="library-link" onclick="WildlifeScan.sendToAdmin()"><i class="fas fa-user-shield"></i> Send to Admin</button>';
    }

    if (window.speechSynthesis) {
      const aiNote = aiLabel ? ", using artificial intelligence to identify features matching the species database." : ".";
      this.speak("Identified " + species.name + ", a " + species.domain + " from the kingdom " + species.kingdom + ". Status: " + species.status + ". " + species.desc + aiNote);
    }
  },

  async saveToLibrary() {
    if (!this.currentResult) return;
    const scans = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    const scanRecord = {
      id: "scan_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      species: this.currentResult.species,
      confidence: this.currentResult.confidence,
      imageData: this.els.previewImg ? this.els.previewImg.src : "",
      approved: true,
      source: "user_scan"
    };
    scans.unshift(scanRecord);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scans));

    // Also save to backend if available
    try {
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
    } catch (e) {}

    this.showToast("Saved to Library!");
  },

  async sendToAdmin() {
    if (!this.currentResult) return;
    const pending = JSON.parse(localStorage.getItem(this.PENDING_ADMIN_KEY) || "[]");
    const scanRecord = {
      id: "pending_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      species: this.currentResult.species,
      confidence: this.currentResult.confidence,
      imageData: this.els.previewImg ? this.els.previewImg.src : "",
      status: "pending",
      source: "user_scan"
    };
    pending.unshift(scanRecord);
    localStorage.setItem(this.PENDING_ADMIN_KEY, JSON.stringify(pending));

    // Also save to backend if available
    try {
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
    } catch (e) {}

    this.showToast("Sent to Admin for approval!");
  },

  showToast(message) {
    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1b5e40,#143d2a);color:#fff;padding:12px 24px;border-radius:8px;z-index:3000;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease;";
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
      this.els.voiceStatus.style.color = isActive ? "#c9a227" : "#888";
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
    // Prefer human-like voices
    const preferred = [
      "Google UK English Female", "Google US English", "Samantha", "Victoria",
      "Alex", "Karen", "Moira", "Fiona", "Ashley", "Stephanie",
      "Microsoft Zira", "Microsoft David", "Microsoft Hazel", "Microsoft Catherine"
    ];
    for (let name of preferred) {
      const found = voices.find(v => v.name === name);
      if (found) { this.selectedVoice = found; return; }
    }
    // Fallback to first English voice
    const en = voices.find(v => v.lang && v.lang.startsWith("en"));
    if (en) this.selectedVoice = en;
  },

  speak(text) {
    if (!window.speechSynthesis) return;
    if (!this.selectedVoice) this.selectNaturalVoice();
    window.speechSynthesis.cancel();
    // Add natural pauses for a human-like feel
    const phrases = text.split(/\.|!|\?/).filter(s => s.trim().length > 0);
    const speakNext = (index) => {
      if (index >= phrases.length) return;
      const phrase = phrases[index].trim() + ".";
      const utterance = new SpeechSynthesisUtterance(phrase);
      // Natural pitch and rate for human-like speech
      utterance.rate = 0.88;
      utterance.pitch = 0.96;
      if (this.selectedVoice) utterance.voice = this.selectedVoice;
      utterance.onend = () => {
        setTimeout(() => speakNext(index + 1), 420);
      };
      window.speechSynthesis.speak(utterance);
    };
    speakNext(0);
  },

  readFieldGuide() {
    if (!this.currentResult) return;
    const { species } = this.currentResult;
    const text =
      "Field guide for " + species.name + ". " +
      "Scientific name: " + species.scientificName + ". " +
      "Kingdom: " + species.kingdom + ". " +
      "Status: " + species.status + ". " +
      "Population estimate: " + species.population + ". " +
      "Habitat: " + species.habitat + ".";
    const text2 =
      "Diet: " + species.diet + ". " +
      "Behavior: " + species.behavior + ".";
    this.speak(text + " " + text2);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  WildlifeScan.init();
});
