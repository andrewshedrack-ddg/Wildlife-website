// scan.js - Wildlife Scan with Voice, AI Simulation, and Read-Aloud
// Inspired by nature-seer-ai.lovable.app/scan

const WildlifeScan = {
  els: {},
  recognition: null,
  isListening: false,
  currentResult: null,

  speciesDB: {
    elephant: {
      name: "African Bush Elephant",
      scientificName: "Loxodonta africana",
      category: "Mammal",
      status: "Vulnerable",
      statusClass: "vulnerable",
      population: "415,000",
      habitat: "Savannas, forests, grasslands",
      diet: "Herbivore - grasses, bark, fruits, leaves",
      behavior: "Highly social; lives in matriarchal herds of 10-100 individuals. Uses infrasound for communication over long distances. Drinks up to 190 liters of water daily.",
      threats: "Habitat loss, human-wildlife conflict, illegal ivory trade",
      desc: "The African Bush Elephant is the largest land animal on Earth, playing a vital role in shaping its ecosystem by clearing paths and dispersing seeds."
    },
    lion: {
      name: "African Lion",
      scientificName: "Panthera leo",
      category: "Mammal",
      status: "Vulnerable",
      statusClass: "vulnerable",
      population: "23,000 - 39,000",
      habitat: "Savannas, grasslands, open woodlands",
      diet: "Carnivore - wildebeest, zebra, buffalo, warthog",
      behavior: "The only truly social cat. Lions live in prides of 2-40 individuals. Females do most of the hunting while males defend territory. Roars can be heard up to 8 km away.",
      threats: "Habitat loss, retaliatory killings, prey depletion, trophy hunting",
      desc: "The African Lion, often called the King of Beasts, is an apex predator that regulates prey populations and maintains ecological balance."
    },
    giraffe: {
      name: "Masai Giraffe",
      scientificName: "Giraffa tippelskirchi",
      category: "Mammal",
      status: "Endangered",
      statusClass: "endangered",
      population: "35,000",
      habitat: "Savannas, open woodlands",
      diet: "Herbivore - acacia leaves, twigs, bark",
      behavior: "Sleeps only 30 minutes per day in short bursts. Uses its 45cm tongue to grab leaves. Known as silent giants, they communicate with infrasound below human hearing.",
      threats: "Habitat fragmentation, poaching for bushmeat and tails",
      desc: "The tallest terrestrial animal, the Masai Giraffe towers over the savanna, using its incredible height to spot predators from miles away."
    },
    zebra: {
      name: "Plains Zebra",
      scientificName: "Equus quagga",
      category: "Mammal",
      status: "Near Threatened",
      statusClass: "near-threatened",
      population: "500,000",
      habitat: "Grasslands, savannas, open woodlands",
      diet: "Herbivore - primarily grasses",
      behavior: "Lives in harems or mixed herds up to 1,000. Each zebra has unique stripe patterns like human fingerprints. Excellent swimmers that cross rivers during migration.",
      threats: "Habitat loss, hunting for skins, competition with livestock",
      desc: "The Plains Zebra is famous for its distinctive black-and-white stripes, which may help confuse predators and biting insects."
    },
    cheetah: {
      name: "Cheetah",
      scientificName: "Acinonyx jubatus",
      category: "Mammal",
      status: "Vulnerable",
      statusClass: "vulnerable",
      population: "7,100",
      habitat: "Savannas, grasslands, semi-arid areas",
      diet: "Carnivore - Thomson's gazelle, impala, hare",
      behavior: "Accelerates from 0-100 km/h in 3 seconds. Cannot retract claws fully. After a sprint, needs 20-30 minutes to cool down, making it vulnerable to scavengers.",
      threats: "Habitat loss, human-wildlife conflict, low genetic diversity",
      desc: "The Cheetah is the fastest land animal, capable of breathtaking acceleration speeds in pursuit of prey across the open plains."
    },
    leopard: {
      name: "Leopard",
      scientificName: "Panthera pardus",
      category: "Mammal",
      status: "Vulnerable",
      statusClass: "vulnerable",
      population: "Unknown",
      habitat: "Forests, grasslands, mountains, savannas",
      diet: "Carnivore - antelope, warthog, birds, fish",
      behavior: "Incredibly adaptable and stealthy. Can drag prey 3x its body weight up trees. Solitary and primarily nocturnal. Incredible climbing ability.",
      threats: "Habitat loss, prey depletion, poaching for skins",
      desc: "The Leopard is a master of stealth and power, capable of adapting to almost any habitat from rainforests to deserts."
    },
    wildebeest: {
      name: "Wildebeest",
      scientificName: "Connochaetes taurinus",
      category: "Mammal",
      status: "Least Concern",
      statusClass: "least-concern",
      population: "1.5 million",
      habitat: "Open grasslands, savannas",
      diet: "Herbivore - short grasses",
      behavior: "Participates in the largest mammal migration on Earth with over 1.5 million individuals. Can run at 80 km/h. Gives birth simultaneously in a 3-week window.",
      threats: "Habitat fragmentation, human encroachment, disease from livestock",
      desc: "The Wildebeest, also called the gnu, is a keystone species of the Serengeti famous for its epic annual migration."
    },
    rhino: {
      name: "Black Rhinoceros",
      scientificName: "Diceros bicornis",
      category: "Mammal",
      status: "Critically Endangered",
      statusClass: "endangered",
      population: "5,600",
      habitat: "Savannas, grasslands, scrublands",
      diet: "Herbivore - leaves, branches, shoots",
      behavior: "Solitary and territorial. Despite poor eyesight, has excellent hearing and smell. Can run up to 55 km/h. Uses dung middens as communication posts.",
      threats: "Illegal poaching for horns, habitat loss",
      desc: "The Black Rhinoceros is a critically endangered browser with a prehensile upper lip for grasping leaves and branches."
    }
  },

  init() {
    this.cacheElements();
    this.initSpeechRecognition();
    this.bindEvents();
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
    this.showResultView();
    const reader = new FileReader();
    reader.onload = (e) => {
      this.els.previewImg.src = e.target.result;
      this.simulateScan(file);
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
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        this.els.previewImg.src = dataUrl;
        if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
        if (modal.parentNode) modal.parentNode.removeChild(modal);
        this.showResultView();
        this.simulateScan(dataUrl);
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
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },

  simulateScan(input) {
    const speciesKeys = Object.keys(this.speciesDB);
    const randomKey = speciesKeys[Math.floor(Math.random() * speciesKeys.length)];
    const species = this.speciesDB[randomKey];
    const confidence = Math.floor(Math.random() * 15) + 85;
    this.currentResult = { species, confidence };
    this.els.loadingText.textContent = "Analyzing image with neural network...";
    setTimeout(() => {
      this.els.loadingText.textContent = "Detecting wildlife features...";
    }, 1000);
    setTimeout(() => {
      this.els.loadingText.textContent = "Matching against species database...";
    }, 1800);
    setTimeout(() => {
      this.els.loadingState.style.display = "none";
      this.els.resultState.style.display = "block";
      this.els.resultCategory.textContent = species.category;
      this.els.resultTitle.textContent = species.name;
      this.els.resultScientificName.textContent = species.scientificName;
      this.els.resultStatusBadge.className = "status-badge " + species.statusClass;
      this.els.resultStatusBadge.textContent = species.status;
      this.els.resultConfidence.textContent = confidence + "% confidence match";
      this.els.resultDetails.innerHTML =
        '<div class="detail-section"><h4><i class="fas fa-info-circle"></i> Description</h4><p>' + species.desc + '</p></div>' +
        '<div class="detail-section"><h4><i class="fas fa-users"></i> Population</h4><p>' + species.population + ' estimated in the wild</p></div>' +
        '<div class="detail-section"><h4><i class="fas fa-globe-africa"></i> Habitat</h4><p>' + species.habitat + '</p></div>' +
        '<div class="detail-section"><h4><i class="fas fa-utensils"></i> Diet</h4><p>' + species.diet + '</p></div>' +
        '<div class="detail-section"><h4><i class="fas fa-paw"></i> Behavior</h4><p>' + species.behavior + '</p></div>' +
        '<div class="detail-section"><h4><i class="fas fa-exclamation-triangle"></i> Threats</h4><p>' + species.threats + '</p></div>';
      if (window.speechSynthesis) {
        this.speak("Identified " + species.name + ", status " + species.status + ". " + species.desc);
      }
    }, 2800);
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

  speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  },

  readFieldGuide() {
    if (!this.currentResult) return;
    const { species } = this.currentResult;
    const text = species.name + ". " + species.scientificName + ". Status: " + species.status +
      ". Population: " + species.population + ". Habitat: " + species.habitat +
      ". Diet: " + species.diet + ". Behavior: " + species.behavior +
      ". Threats: " + species.threats;
    this.speak(text);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  WildlifeScan.init();
});
