// scan.js - AI Wildlife Scan with Voice Commands & Realistic AI

const WildlifeScan = {
  elements: {},
  isListening: false,
  recognition: null,

  mockSpecies: {
    elephant: {
      name: "African Bush Elephant",
      scientificName: "Loxodonta africana",
      status: "Vulnerable",
      population: "415,000",
      habitat: "Savannas, forests, grasslands",
      diet: "Herbivore - grasses, bark, fruits, leaves",
      behavior: "Highly social; lives in matriarchal herds of 10-100 individuals. Uses infrasound for communication over long distances.",
      threats: "Habitat loss, human-wildlife conflict, illegal ivory trade",
      desc: "Large herbivore, key species sharing habitats and competing for resources with others. Open savanna and drier regions."
    },
    lion: {
      name: "African Lion",
      scientificName: "Panthera leo",
      status: "Vulnerable",
      population: "23,000 - 39,000",
      habitat: "Savannas, grasslands, open woodlands",
      diet: "Carnivore - wildebeest, zebra, buffalo, warthog",
      behavior: "The only truly social cat. Lions live in prides of 2-40 individuals. Females do most of the hunting while males defend territory.",
      threats: "Habitat loss, retaliatory killings, prey depletion, trophy hunting",
      desc: "Social apex predator. Cooperative hunting in prides."
    },
    giraffe: {
      name: "Masai Giraffe",
      scientificName: "Giraffa tippelskirchi",
      status: "Endangered",
      population: "35,000",
      habitat: "Savannas, open woodlands",
      diet: "Herbivore - acacia leaves, twigs, bark",
      behavior: "Sleeps only 30 minutes per day in short bursts. Uses its 45cm tongue to grab leaves. Known as 'silent giants,' they communicate with infrasound.",
      threats: "Habitat fragmentation, poaching for bushmeat and tails",
      desc: "Tallest terrestrial animal. Unique spotted pattern like human fingerprints."
    },
    zebra: {
      name: "Plains Zebra",
      scientificName: "Equus quagga",
      status: "Near Threatened",
      population: "500,000",
      habitat: "Grasslands, savannas, open woodlands",
      diet: "Herbivore - primarily grasses",
      behavior: "Lives in harems or mixed herds up to 1,000. Each zebra has unique stripe patterns. Excellent swimmers that cross rivers during migration.",
      threats: "Habitat loss, hunting for skins, competition with livestock",
      desc: "Distinctive striped equid. Part of great migrations."
    },
    cheetah: {
      name: "Cheetah",
      scientificName: "Acinonyx jubatus",
      status: "Vulnerable",
      population: "7,100",
      habitat: "Savannas, grasslands, semi-arid areas",
      diet: "Carnivore - Thomson's gazelle, impala, hare",
      behavior: "Accelerates from 0-100 km/h in 3 seconds. Cannot retract claws fully. After a sprint, needs 20-30 minutes to cool down.",
      threats: "Habitat loss, human-wildlife conflict, low genetic diversity",
      desc: "Fastest land animal. High-speed chases over short distances."
    },
    leopard: {
      name: "Leopard",
      scientificName: "Panthera pardus",
      status: "Vulnerable",
      population: "Unknown (declining)",
      habitat: "Forests, grasslands, mountains, savannas",
      diet: "Carnivore - antelope, warthog, birds, fish",
      behavior: "Incredibly adaptable and stealthy. Can drag prey 3x its body weight up trees. Solitary and primarily nocturnal.",
      threats: "Habitat loss, prey depletion, poaching for skins",
      desc: "Powerful, elusive big cat. Hauls kills into trees."
    },
    wildebeest: {
      name: "Wildebeest",
      scientificName: "Connochaetes taurinus",
      status: "Least Concern",
      population: "1.5 million",
      habitat: "Open grasslands, savannas",
      diet: "Herbivore - short grasses",
      behavior: "Participates in the largest mammal migration on Earth with over 1.5 million individuals. Can run at 80 km/h.",
      threats: "Habitat fragmentation, human encroachment, disease from livestock",
      desc: "Migratory antelope. Part of mass migration."
    }
  },

  init() {
    this.cacheElements();
    this.initSpeechRecognition();
    this.createVoiceControls();
    this.bindEvents();
  },

  cacheElements() {
    const e = this.elements;
    e.previewImg = document.getElementById("previewImg");
    e.uploadBtn = document.getElementById("uploadBtn");
    e.cameraBtn = document.getElementById("cameraBtn");
    e.fileInput = document.getElementById("fileInput");
    e.resultTitle = document.getElementById("resultTitle");
    e.resultStatus = document.getElementById("resultStatus");
    e.resultDetails = document.getElementById("resultDetails");
    e.libLink = document.getElementById("libLink");
  },

  // Voice Command Support
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
      this.updateVoiceStatus("", false);
      if (this.voiceBtn) this.voiceBtn.classList.remove("listening");
    };
  },

  createVoiceControls() {
    const voiceContainer = document.createElement("div");
    voiceContainer.className = "voice-controls";
    voiceContainer.style.cssText = "text-align:center;margin-top:20px;padding:15px;background:rgba(255,255,255,0.05);border-radius:12px;";

    this.voiceBtn = document.createElement("button");
    this.voiceBtn.className = "btn voice-btn";
    this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Command';
    this.voiceBtn.style.cssText = "background:linear-gradient(135deg, #1b5e40, #143d2a);border:none;";

    const tips = document.createElement("p");
    tips.style.cssText = "font-size:12px;color:rgba(255,255,255,0.6);margin-top:8px;";
    tips.textContent = "Say: 'scan', 'take photo', 'upload image', or 'clear'";

    const statusSpan = document.createElement("span");
    statusSpan.id = "voiceStatus";
    statusSpan.style.cssText = "display:block;font-size:12px;color:#c9a227;margin-top:8px;min-height:18px;";

    voiceContainer.appendChild(this.voiceBtn);
    voiceContainer.appendChild(statusSpan);
    voiceContainer.appendChild(tips);

    const uploadArea = document.querySelector(".upload-area");
    if (uploadArea) uploadArea.parentElement.appendChild(voiceContainer);

    this.voiceBtn.addEventListener("click", () => this.toggleVoiceListening());
  },

  toggleVoiceListening() {
    if (!this.recognition) {
      alert("Voice commands not supported in this browser. Try Chrome.");
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.isListening = true;
      this.voiceBtn.classList.add("listening");
      this.updateVoiceStatus("Listening...", true);
      this.recognition.start();
    }
  },

  updateVoiceStatus(text, isActive) {
    const statusEl = document.getElementById("voiceStatus");
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.style.color = isActive ? "#c9a227" : "#888";
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
      this.fileInput.click();
    } else if (command.includes("clear") || command.includes("reset")) {
      this.speak("Clearing results.");
      this.clearResults();
    } else {
      this.speak("Command not recognized. Try: scan, take photo, upload image, or clear.");
    }
  },

  // Text-to-Speech Feedback
  speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  },

  bindEvents() {
    this.elements.uploadBtn.addEventListener("click", () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener("change", (e) => this.handleFile(e));
    this.elements.cameraBtn.addEventListener("click", () => this.openCamera());
  },

  handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    this.displayResult("Analyzing image...");
    const reader = new FileReader();
    reader.onload = (e) => {
      this.elements.previewImg.src = e.target.result;
      this.elements.previewImg.style.display = "block";
      this.simulateScan(file);
    };
    reader.readAsDataURL(file);
  },

  openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported.");
      return;
    }

    const modal = document.createElement("div");
    modal.id = "cameraModal";
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;";

    const video = document.createElement("video");
    video.autoplay = true;
    video.style.cssText = "max-width:90%;max-height:70%;border-radius:8px;transform:scaleX(-1);";

    const controls = document.createElement("div");
    controls.style.cssText = "margin-top:20px;display:flex;gap:15px;";

    const snapBtn = document.createElement("button");
    snapBtn.textContent = "Capture";
    snapBtn.className = "btn";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.className = "btn ghost";

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
      .catch(() => {
        alert("Could not access camera.");
        document.body.removeChild(modal);
      });

    snapBtn.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      this.elements.previewImg.src = dataUrl;
      this.elements.previewImg.style.display = "block";
      if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
      document.body.removeChild(modal);
      this.displayResult("Analyzing captured image...");
      this.simulateScan(dataUrl);
    });

    closeBtn.addEventListener("click", () => {
      if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
      document.body.removeChild(modal);
    });
  },

  displayResult(status) {
    this.elements.resultStatus.textContent = status;
  },

  clearResults() {
    this.elements.previewImg.src = "#";
    this.elements.previewImg.style.display = "none";
    this.elements.resultTitle.textContent = "\u2014";
    this.elements.resultStatus.textContent = "Ready to scan";
    this.elements.resultDetails.innerHTML = "";
    this.elements.libLink.style.display = "none";
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },

  simulateScan(input) {
    const speciesKeys = Object.keys(this.mockSpecies);
    const randomKey = speciesKeys[Math.floor(Math.random() * speciesKeys.length)];
    const species = this.mockSpecies[randomKey];
    const confidence = Math.floor(Math.random() * 15) + 85;

    this.elements.resultTitle.textContent = "Analyzing...";
    this.elements.resultDetails.innerHTML = '<div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;margin-bottom:12px;"><div style="width:20%;height:100%;background:#c9a227;animation:scanProgress 1.5s ease-in-out;"></div></div><p>Processing image with neural network...</p>';

    setTimeout(() => {
      this.elements.resultDetails.innerHTML = '<div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;margin-bottom:12px;"><div style="width:60%;height:100%;background:#c9a227;"></div></div><p>Detecting wildlife features...</p>';
      this.elements.resultTitle.textContent = "Detecting...";
    }, 800);

    setTimeout(() => {
      this.elements.resultTitle.textContent = species.name;
      this.elements.resultStatus.textContent = "Status: " + species.status;

      this.elements.resultDetails.innerHTML =
        '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin-top:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">' +
            '<span style="font-style:italic;color:rgba(255,255,255,0.7);">' + species.scientificName + '</span>' +
            '<span style="background:#1b5e40;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">' + confidence + '% Match</span>' +
          '</div>' +
          '<div style="display:grid;gap:16px;">' +
            '<div>' +
              '<h4 style="color:#c9a227;font-size:14px;margin-bottom:6px;"><i class="fas fa-info-circle"></i> Overview</h4>' +
              '<p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.5;">' + species.desc + '</p>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
              '<div>' +
                '<h4 style="color:#c9a227;font-size:14px;margin-bottom:6px;"><i class="fas fa-users"></i> Population</h4>' +
                '<p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;">' +Ru 1> species.population + '</p>' +
              '</div>' +
              '<div>' +
                '<h4 style="color:#c9a227;font-size:14px;margin-bottom:6px;"><i class="fas fa-globe-africa"></i> Habitat</h4>' +
                '<p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;">' + species.habitat + '</p>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<h4 style="color:#c9a227;font-size:14px;margin-bottom:6px;"><i class="fas fa-utensils"></i> Diet</h4>' +
              '<p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;">' + species.diet + '</p>' +
            '</div>' +
            '<div>' +
              '<h4 style="color:#c9a227;font-size:14px;margin-bottom:6px;"><i class="fas fa-paw"></i> Behavior</h4>' +
              '<p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.5;">' + species.behavior + '</p>' +
            '</div>' +
            '<div>' +
              '<h4 style="color:#c9a227;font-size:14px;margin-bottom:6px;"><i class="fas fa-exclamation-triangle"></i> Threats</h4>' +
              '<p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;">' + species.threats + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';

      this.elements.libLink.style.display = "inline-block";
      this.elements.libLink.href = "library/library.html";

      if (window.speechSynthesis) {
        this.speak("Identified " + species.name + ", status " + species.status + ".");
      }
    }, 2500);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  WildlifeScan.init();
});
