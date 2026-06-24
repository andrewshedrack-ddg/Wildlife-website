// scan.js for WildGuard Explorer
document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    const fileInput = document.getElementById('fileInput');
    const previewImg = document.getElementById('previewImg');
    const resultTitle = document.getElementById('resultTitle');
    const resultStatus = document.getElementById('resultStatus');
    const resultDetails = document.getElementById('resultDetails');
    const libLink = document.getElementById('libLink');

    // Mock animal data
    const animals = [
        {
            commonName: 'African Elephant',
            scientificName: 'Loxodonta africana',
            classification: 'Mammal Â· Proboscidea Â· Elephantidae',
            habitat: 'Savannas, forests, and deserts across sub-Saharan Africa.',
            diet: 'Herivorous, feeding on grasses, leaves, bark, and fruits.',
            conservationStatus: 'Vulnerable',
            description: 'The African elephant is the largest land mammal, known for its distinctive tusks and complex social structures.',
            funFacts: [
                'Elephants can recognize themselves in mirrors, a sign of self-awareness.',
                'Their trunks have over 40,000 muscles, allowing incredible dexterity.',
                'Elephants communicate over long distances using infrasound.'
            ],
            confidence: 0.92
        },
        {
            commonName: 'Lion',
            scientificName: 'Panthera leo',
            classification: 'Mammal Â· Carnivora Â· Felidae',
            habitat: 'Grasslands, savannas, and open woodlands of sub-Saharan Africa.',
            diet: 'Carnivorous, primarily hunting large ungulates like zebras and wildebeest.',
            conservationStatus: 'Vulnerable',
            description: 'The lion is a apex predator known for its mane and cooperative hunting in prides.',
            funFacts: [
                'A lion\'s roar can be heard up to 8 kilometers away.',
                'Lions are the only truly social big cats, living in groups called prides.',
                'Female lions do most of the hunting for the pride.'
            ],
            confidence: 0.88
        },
        {
            commonName: 'Reticulated Giraffe',
            scientificName: 'Giraffa reticulata',
            classification: 'Mammal Â· Artiodactyla Â· Giraffidae',
            habitat: 'Open woodlands and savannas of the Horn of Africa.',
            diet: 'Herbivorous, feeding mainly on leaves of acacia and other trees.',
            conservationStatus: 'Endangered',
            description: 'The reticulated giraffe is the tallest terrestrial animal, known for its striking coat pattern.',
            funFacts: [
                'Giraffes only need to drink water every few days, getting most moisture from leaves.',
                'Their hearts can weigh up to 11 kg to pump blood to the brain.',
                'Giraffes sleep only about 2 hours per day, often standing up.'
            ],
            confidence: 0.95
        },
        {
            commonName: 'African Leopard',
            scientificName: 'Panthera pardus',
            classification: 'Mammal Â· Carnivora Â· Felidae',
            habitat: 'Various habitats from forests to grasslands across sub-Saharan Africa.',
            diet: 'Carnivorous, opportunistic predator eating a wide range of prey.',
            conservationStatus: 'Vulnerable',
            description: 'The leopard is a stealthy solitary predator known for its adaptability and strength.',
            funFacts: [
                'Leopards can carry prey up to three times their body weight into trees.',
                'Their rosette patterns provide excellent camouflage in dappled light.',
                'Leopards are excellent swimmers and often hunt near water.'
            ],
            confidence: 0.9
        },
        {
            commonName: 'Nile Crocodile',
            scientificName: 'Crocodylus niloticus',
            classification: 'Reptile Â· Crocodylia Â· Crocodylidae',
            habitat: 'Freshwater habitats like rivers, lakes, and marshes throughout sub-Saharan Africa.',
            diet: 'Carnivorous, feeding on fish, birds, mammals, and occasionally carrion.',
            conservationStatus: 'Least Concern',
            description: 'The Nile crocodile is an apex aquatic predator known for its powerful bite and ambush tactics.',
            funFacts: [
                'Nile crocodiles can hold their breath underwater for up to two hours.',
                'They have the strongest bite force of any animal, exceeding 5,000 psi.',
                'Female crocodiles guard their nests fiercely and help hatchlings reach water.'
            ],
            confidence: 0.93
        }
    ];

    // Mock AI identification function
    function mockIdentifyOrganism(imageDataUrl) {
        return new Promise((resolve) => {
            // Simulate processing delay
            setTimeout(() => {
                // Randomly select an animal (in a real app, this would be the AI result)
                const animal = animals[Math.floor(Math.random() * animals.length)];
                // Occasionally simulate no detection (5% chance)
                if (Math.random() < 0.05) {
                    resolve({
                        detected: false,
                        commonName: '',
                        scientificName: '',
                        classification: '',
                        habitat: '',
                        diet: '',
                        conservationStatus: '',
                        description: 'No living organism could be confidently identified in the image.',
                        funFacts: [],
                        confidence: 0.1
                    });
                } else {
                    resolve({
                        detected: true,
                        ...animal
                    });
                }
            }, 2000); // 2 second delay to simulate processing
        });
    }

    // Handle file upload
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            previewImg.src = event.target.result;
            previewImg.style.display = 'block';
            uploadBtn.style.display = 'none';
            cameraBtn.style.display = 'none';

            // Show loading state
            resultTitle.textContent = 'Analyzing...';
            resultStatus.textContent = 'Processing image...';
            resultDetails.innerHTML = '';
            libLink.style.display = 'none';

            // Call mock identification
            mockIdentifyOrganism(event.target.result).then(result => {
                displayResult(result);
                // Reset file input
                fileInput.value = '';
            });
        };
        reader.readAsDataURL(file);
    });

    // Handle camera capture
let webcamStream = null;
cameraBtn.addEventListener('click', async () => {
    if (!webcamStream) {
        // Start webcam
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcamStream = stream;
            const video = document.getElementById('webcamVideo');
            video.srcObject = stream;
            // Show webcam container, hide upload fallback
            document.getElementById('webcam-container').style.display = 'block';
            document.getElementById('uploadFallback').style.display = 'none';
            // Change button text to 'Capture'
            cameraBtn.textContent = 'Capture';
        } catch (err) {
            alert('Unable to access camera. Please ensure you grant permission and try again.');
            console.error(err);
        }
    } else {
        // Capture image from webcam video
        const video = document.getElementById('webcamVideo');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');

        // Stop webcam stream
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
        // Hide webcam container, show upload fallback
        document.getElementById('webcam-container').style.display = 'none';
        document.getElementById('uploadFallback').style.display = 'block';
        // Change button text back to 'Take Photo'
        cameraBtn.textContent = 'Take Photo';

        // Now proceed to show preview and analyze as in the upload flow
        // Show preview
        const previewImg = document.getElementById('previewImg');
        previewImg.src = imageDataUrl;
        previewImg.style.display = 'block';
        // Hide the buttons
        document.getElementById('uploadBtn').style.display = 'none';
        cameraBtn.style.display = 'none';

        // Show loading state
        const resultTitle = document.getElementById('resultTitle');
        const resultStatus = document.getElementById('resultStatus');
        const resultDetails = document.getElementById('resultDetails');
        const libLink = document.getElementById('libLink');

        resultTitle.textContent = 'Analyzing...';
        resultStatus.textContent = 'Processing image...';
        resultDetails.innerHTML = '';
        libLink.style.display = 'none';

        // Call mock identification
        mockIdentifyOrganism(imageDataUrl).then(result => {
            displayResult(result);
            // Reset file input (not needed for webcam, but we do it for consistency)
            // document.getElementById('fileInput').value = '';
        });
    }
});// Update year in footer
document.addEventListener('DOMContentLoaded', () => {
    const yearNode = document.querySelector('[data-current-year]');
    if (yearNode) {
        yearNode.textContent = String(new Date().getFullYear());
    }
});

