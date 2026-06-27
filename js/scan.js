// scan.js - Basic scan functionality

const WildlifeScan = {
  // Elements
  previewImg: null,
  uploadBtn: null,
  cameraBtn: null,
  fileInput: null,
  resultTitle: null,
  resultStatus: null,
  resultDetails: null,
  libLink: null,

  // Mock species database
  mockSpecies: {
    elephant: { name: "African Bush Elephant", status: "Vulnerable", desc: "Large herbivore, key species." },
    lion: { name: "African Lion", status: "Vulnerable", desc: "Social apex predator." },
    giraffe: { name: "Giraffe", status: "Endangered", desc: "Tallest terrestrial animal." },
    zebra: { name: "Plains Zebra", status: "Near Threatened", desc: "Distinctive striped equid." },
    cheetah: { name: "Cheetah", status: "Vulnerable", desc: "Fastest land animal." },
    leopard: { name: "Leopard", status: "Vulnerable", desc: "Powerful, elusive big cat." },
    wildebeest: { name: "Wildebeest", status: "Least Concern", desc: "Migratory antelope." },
    undefined: { name: "Unknown Species", status: "Unidentified", desc: "Could not identify with high confidence." }
  },

  init() {
    this.previewImg = document.getElementById("previewImg");
    this.uploadBtn = document.getElementById("uploadBtn");
    this.cameraBtn = document.getElementById("cameraBtn");
    this.fileInput = document.getElementById("fileInput");
    this.resultTitle = document.getElementById("resultTitle");
    this.resultStatus = document.getElementById("resultStatus");
    this.resultDetails = document.getElementById("resultDetails");
    this.libLink = document.getElementById("libLink");

    this.bindEvents();
  },

  bindEvents() {
    this.uploadBtn.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", (e) => this.handleFile(e));
    this.cameraBtn.addEventListener("click", () => this.openCamera());
  },

  handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    this.displayResult("Analyzing image...");
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImg.src = e.target.result;
      this.previewImg.style.display = "block";
      this.simulateScan(file);
    };
    reader.readAsDataURL(file);
  },

  openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported on this browser.");
      return;
    }

    // Create modal overlay for camera
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
      .then
        ((stream) => {
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
      this.previewImg.src = dataUrl;
      this.previewImg.style.display = "block";
      if (streamRef) {
        streamRef.getTracks().forEach((t) => t.stop());
      }
      document.body.removeChild(modal);
      this.displayResult("Analyzing captured image...");
      this.simulateScan(dataUrl);
    });

    closeBtn.addEventListener("click", () => {
      if (streamRef) {
        streamRef.getTracks().forEach((t) => t.stop());
      }
      document.body.removeChild(modal);
    });
  },

  displayResult(status) {
    this.resultStatus.textContent = status;
  },

  simulateScan(input) {
    setTimeout(() => {
      const keys = Object.keys(this.mockSpecies).filter((k) => k !== "undefined");
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const species = this.mockSpecies[randomKey];
      this.resultTitle.textContent = species.name;
      this.resultStatus.textContent = "Status: " + species.status;
      this.resultDetails.innerHTML = "<p>" + species.desc + "</p><p><small>Confidence: 92%</small></p>";
      this.libLink.style.display = "inline-block";
      this.libLink.href = "library/library.html";
    }, 2000);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  WildlifeScan.init();
});
