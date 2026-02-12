// ==========================================
// API SERVICE (Gemini & Runware)
// ==========================================

class ApiService {
    constructor() {
        this.geminiKeys = [
            'AIzaSyDn3Yoe0GKlA7hWIEHLKKV0wdVYB_CpXZU',
            'AIzaSyDEztr-lOVA4v3CDigpd4soenp7Q4edPvY',
            'AIzaSyCbpXGqa2Qrbx0bTja_2iZhCipRTyB0wp8'
        ];
        this.currentKeyIndex = 0;
        this.runwareKey = 'meJOUuRHKi5WPSUrR0t78IzHopqMvOz1';

        // Default fallback model, will be updated by initModelDiscovery
        this.currentModel = 'gemini-1.5-flash';
        this.initModelDiscovery();
    }

    getGeminiKey() {
        return this.geminiKeys[this.currentKeyIndex];
    }

    rotateKey() {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.geminiKeys.length;
        console.log(`Rotating to Gemini API Key #${this.currentKeyIndex + 1}`);
        // Re-discover models with new key
        this.initModelDiscovery();
    }

    async initModelDiscovery() {
        const key = this.getGeminiKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        try {
            console.log('Discovering available Gemini models...');
            const response = await fetch(url);
            const data = await response.json();

            if (data.models) {
                // Filter for models that support generateContent
                const validModels = data.models.filter(m =>
                    m.supportedGenerationMethods &&
                    m.supportedGenerationMethods.includes('generateContent')
                );

                console.log('Available Models:', validModels.map(m => m.name));

                // Preference list
                const preferredOrder = [
                    'models/gemini-1.5-flash',
                    'models/gemini-1.5-pro',
                    'models/gemini-pro',
                    'models/gemini-1.0-pro'
                ];

                let selectedModel = null;

                // Try to find a preferred model
                for (const pref of preferredOrder) {
                    if (validModels.find(m => m.name === pref)) {
                        selectedModel = pref;
                        break;
                    }
                }

                if (!selectedModel) {
                    const flash = validModels.find(m => m.name.includes('flash'));
                    const pro = validModels.find(m => m.name.includes('pro'));
                    if (flash) selectedModel = flash.name;
                    else if (pro) selectedModel = pro.name;
                    else if (validModels.length > 0) selectedModel = validModels[0].name;
                }

                if (selectedModel) {
                    this.currentModel = selectedModel.replace('models/', '');
                    console.log(`Selected Best Model: ${this.currentModel}`);
                }
            }
        } catch (error) {
            console.warn('Model discovery failed, using default:', error);
        }
    }

    /**
     * Generate text using Gemini API with dynamic model selection
     */
    async generateText(prompt, systemInstruction = '') {
        const key = this.getGeminiKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.currentModel}:generateContent?key=${key}`;

        const payload = {
            contents: [{
                parts: [{ text: systemInstruction ? `${systemInstruction}\n\nUser Request: ${prompt}` : prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMsg = response.statusText;
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody.error ? (errorBody.error.message || JSON.stringify(errorBody.error)) : JSON.stringify(errorBody);
                } catch (e) { try { errorMsg = await response.text(); } catch (e2) { } }

                console.error(`API Error (${response.status}):`, errorMsg);
                if (response.status === 429 || response.status === 403 || response.status === 503) {
                    this.rotateKey();
                }
                throw new Error(`Gemini API Error (${response.status}): ${errorMsg}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('No content in response');
            }
        } catch (error) {
            console.error('Gemini API call failed:', error);
            return `Error: ${error.message}.`;
        }
    }

    /**
     * Generate image using Runware API (WebSocket)
     * Handles authentication and image inference with variable aspect ratios.
     */
    async generateImage(prompt) {
        console.log(`Generating image for: ${prompt} using Runware API`);
        const runwareKey = this.runwareKey;

        // Determine aspect ratio based on prompt keywords or random
        let width = 1024;
        let height = 1024;

        const p = prompt.toLowerCase();
        if (p.includes('portrait') || p.includes('tall') || p.includes('vertical') || p.includes('9:16')) {
            width = 1024; height = 1792; // 9:16
        } else if (p.includes('landscape') || p.includes('wide') || p.includes('horizontal') || p.includes('16:9')) {
            width = 1792; height = 1024; // 16:9
        } else if (p.includes('wallpaper')) {
            width = 1792; height = 1024;
        }

        return new Promise((resolve, reject) => {
            const socket = new WebSocket('wss://ws-api.runware.ai/v1');
            let authenticated = false;
            let images = [];

            // Generate a random seed for variation
            const randomSeed = Math.floor(Math.random() * 1000000000);

            // Timeout to prevent hanging
            const timeout = setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) socket.close();
                console.warn('Runware timeout, using fallback');
                this.generateImageFallback(prompt, width, height).then(resolve);
            }, 12000);

            socket.onopen = () => {
                const authPayload = [{
                    taskType: 'authentication',
                    apiKey: runwareKey
                }];
                socket.send(JSON.stringify(authPayload));
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.error) {
                        console.error('Runware Error:', data.error);
                        clearTimeout(timeout);
                        socket.close();
                        this.generateImageFallback(prompt, width, height).then(resolve);
                        return;
                    }

                    if (data.data) {
                        data.data.forEach(task => {
                            if (task.taskType === 'authentication') {
                                authenticated = true;
                                console.log('Runware Authenticated');
                                // Send inference request
                                const generatePayload = [{
                                    taskType: 'imageInference',
                                    taskUUID: crypto.randomUUID(),
                                    positivePrompt: prompt,
                                    width: width,
                                    height: height,
                                    numberResults: 1,
                                    modelId: "runware:100@1",
                                    seed: randomSeed,
                                    steps: 20,
                                    CFGScale: 7
                                }];
                                socket.send(JSON.stringify(generatePayload));
                            } else if (task.taskType === 'imageInference') {
                                if (task.imageURL) {
                                    console.log('Runware Image Received:', task.imageURL);
                                    images.push({
                                        id: 1,
                                        url: task.imageURL,
                                        width: width,
                                        height: height,
                                        placeholder: '🎨'
                                    });

                                    clearTimeout(timeout);
                                    socket.close();
                                    resolve(images);
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error('Error parsing Runware message:', e);
                }
            };

            socket.onerror = (error) => {
                console.error('Runware WebSocket Error:', error);
                clearTimeout(timeout);
                this.generateImageFallback(prompt, width, height).then(resolve);
            };
        });
    }

    // Fallback method (Pollinations)
    async generateImageFallback(prompt, width, height) {
        console.log(`Runware failed, using Pollinations fallback`);
        return new Promise((resolve) => {
            const seed = Math.floor(Math.random() * 1000000);
            const encodedPrompt = encodeURIComponent(prompt);

            resolve([{
                id: 1,
                url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`,
                width: width,
                height: height,
                placeholder: '🎨'
            }]);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
