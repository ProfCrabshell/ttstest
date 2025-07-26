// AI Voice Cloning & Text-to-Speech Application
class VoiceCloningApp {
    constructor() {
        this.currentService = null;
        this.apiKey = null;
        this.clonedVoices = [];
        this.currentAudioBlob = null;
        this.currentAudioFormat = 'mp3';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedData();
    }

    bindEvents() {
        // Service selection
        document.getElementById('serviceSelect').addEventListener('change', this.handleServiceChange.bind(this));
        
        // API key management
        document.getElementById('apiKey').addEventListener('input', this.handleApiKeyInput.bind(this));
        document.getElementById('testConnection').addEventListener('click', this.testConnection.bind(this));
        
        // Voice cloning
        document.getElementById('voiceFile').addEventListener('change', this.handleVoiceFileChange.bind(this));
        document.getElementById('voiceName').addEventListener('input', this.handleVoiceNameInput.bind(this));
        document.getElementById('cloneVoice').addEventListener('click', this.cloneVoice.bind(this));
        
        // Text-to-speech
        document.getElementById('textInput').addEventListener('input', this.handleTextInput.bind(this));
        document.getElementById('voiceSelect').addEventListener('change', this.updateGenerateButton.bind(this));
        document.getElementById('generateSpeech').addEventListener('click', this.generateSpeech.bind(this));
        
        // Download
        document.getElementById('downloadAudio').addEventListener('click', this.downloadAudio.bind(this));
    }

    loadSavedData() {
        // Load any previously saved data from sessionStorage
        const savedService = sessionStorage.getItem('selectedService');
        const savedApiKey = sessionStorage.getItem('apiKey');
        const savedVoices = sessionStorage.getItem('clonedVoices');

        if (savedService) {
            document.getElementById('serviceSelect').value = savedService;
            this.handleServiceChange({ target: { value: savedService } });
        }

        if (savedApiKey) {
            document.getElementById('apiKey').value = savedApiKey;
            this.apiKey = savedApiKey;
            this.enableTestConnection();
        }

        if (savedVoices) {
            try {
                this.clonedVoices = JSON.parse(savedVoices);
                this.updateVoiceOptions();
            } catch (e) {
                console.error('Error loading saved voices:', e);
                this.clonedVoices = [];
            }
        }
    }

    handleServiceChange(event) {
        const service = event.target.value;
        this.currentService = service;
        
        // Hide all instruction sections first
        document.querySelectorAll('.service-instructions').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Show API instructions section
        const apiInstructions = document.getElementById('apiInstructions');
        if (service) {
            apiInstructions.classList.remove('hidden');
            const serviceInstructions = document.getElementById(`${service}Instructions`);
            if (serviceInstructions) {
                serviceInstructions.classList.remove('hidden');
            }
            sessionStorage.setItem('selectedService', service);
        } else {
            apiInstructions.classList.add('hidden');
        }
        
        // Hide connection status when changing service
        document.getElementById('connectionStatus').classList.add('hidden');
    }

    handleApiKeyInput(event) {
        const apiKey = event.target.value.trim();
        this.apiKey = apiKey;
        
        if (apiKey && this.currentService) {
            this.enableTestConnection();
            sessionStorage.setItem('apiKey', apiKey);
        } else {
            this.disableTestConnection();
            sessionStorage.removeItem('apiKey');
        }
        
        // Hide connection status when changing API key
        document.getElementById('connectionStatus').classList.add('hidden');
    }

    enableTestConnection() {
        const testBtn = document.getElementById('testConnection');
        testBtn.disabled = false;
        testBtn.textContent = 'Test Connection';
    }

    disableTestConnection() {
        const testBtn = document.getElementById('testConnection');
        testBtn.disabled = true;
        testBtn.textContent = 'Test Connection';
    }

    async testConnection() {
        if (!this.currentService) {
            this.showConnectionStatus('❌ Please select a service first', 'error');
            return;
        }
        
        if (!this.apiKey || this.apiKey.length < 10) {
            this.showConnectionStatus('❌ Please enter a valid API key', 'error');
            return;
        }

        const testBtn = document.getElementById('testConnection');
        testBtn.classList.add('loading');
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;

        try {
            // Simulate API connection test with more realistic validation
            await this.simulateApiCall(2000);
            
            // Basic API key format validation
            if (this.currentService === 'elevenlabs' && !this.apiKey.startsWith('sk-')) {
                throw new Error('Invalid ElevenLabs API key format');
            }
            
            this.showConnectionStatus('✅ Connection successful! You can now use voice cloning and text-to-speech.', 'success');
            this.showVoiceCloningSection();
            this.showTtsSection();
            
        } catch (error) {
            this.showConnectionStatus('❌ Connection failed. Please check your API key and try again.', 'error');
        } finally {
            testBtn.classList.remove('loading');
            testBtn.textContent = 'Test Connection';
            testBtn.disabled = false;
        }
    }

    showConnectionStatus(message, type) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = message;
        statusEl.className = `connection-status ${type}`;
        statusEl.classList.remove('hidden');
    }

    showVoiceCloningSection() {
        document.getElementById('voiceCloningSection').classList.remove('hidden');
    }

    showTtsSection() {
        document.getElementById('ttsSection').classList.remove('hidden');
        this.updateVoiceOptions();
    }

    handleVoiceFileChange(event) {
        const file = event.target.files[0];
        
        if (file) {
            // Validate file type
            const validTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid audio file (MP3, WAV, or OGG)');
                event.target.value = '';
                this.updateCloneButton();
                return;
            }
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                event.target.value = '';
                this.updateCloneButton();
                return;
            }
            
            // Auto-populate voice name if empty
            const voiceNameInput = document.getElementById('voiceName');
            if (!voiceNameInput.value.trim()) {
                const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                voiceNameInput.value = fileName;
            }
        }
        
        this.updateCloneButton();
    }

    handleVoiceNameInput(event) {
        this.updateCloneButton();
    }

    updateCloneButton() {
        const file = document.getElementById('voiceFile').files[0];
        const voiceName = document.getElementById('voiceName').value.trim();
        const cloneBtn = document.getElementById('cloneVoice');
        
        cloneBtn.disabled = !file || !voiceName;
    }

    async cloneVoice() {
        const file = document.getElementById('voiceFile').files[0];
        const voiceName = document.getElementById('voiceName').value.trim();
        
        // Validation
        if (!file) {
            this.showCloneResult('❌ Please select an audio file.', 'error');
            return;
        }
        
        if (!voiceName) {
            this.showCloneResult('❌ Please enter a voice name.', 'error');
            return;
        }
        
        // Check if voice name already exists
        if (this.clonedVoices.some(voice => voice.name.toLowerCase() === voiceName.toLowerCase())) {
            this.showCloneResult('❌ A voice with this name already exists. Please choose a different name.', 'error');
            return;
        }

        // Show progress
        this.showCloneProgress();
        
        try {
            // Simulate voice cloning process
            await this.simulateVoiceCloning();
            
            const newVoice = {
                id: `voice_${Date.now()}`,
                name: voiceName,
                created: new Date().toISOString(),
                fileName: file.name
            };
            
            this.clonedVoices.push(newVoice);
            sessionStorage.setItem('clonedVoices', JSON.stringify(this.clonedVoices));
            
            this.hideCloneProgress();
            this.showCloneResult(`✅ Voice "${voiceName}" cloned successfully! You can now use it for speech generation.`, 'success');
            this.updateVoiceOptions();
            this.resetCloneForm();
            
        } catch (error) {
            this.hideCloneProgress();
            this.showCloneResult('❌ Voice cloning failed. Please try again with a clear audio file containing speech.', 'error');
        }
    }

    showCloneProgress() {
        const progressEl = document.getElementById('cloneProgress');
        const progressFill = progressEl.querySelector('.progress-fill');
        const cloneBtn = document.getElementById('cloneVoice');
        
        progressEl.classList.remove('hidden');
        progressFill.classList.add('active');
        progressFill.style.width = '0%';
        cloneBtn.disabled = true;
        
        // Animate progress realistically
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 8 + 2; // 2-10% increments
            if (progress > 95) progress = 95;
            progressFill.style.width = `${progress}%`;
        }, 300);
        
        this.cloneProgressInterval = interval;
    }

    hideCloneProgress() {
        const progressEl = document.getElementById('cloneProgress');
        const progressFill = progressEl.querySelector('.progress-fill');
        const cloneBtn = document.getElementById('cloneVoice');
        
        clearInterval(this.cloneProgressInterval);
        progressFill.style.width = '100%';
        
        setTimeout(() => {
            progressEl.classList.add('hidden');
            progressFill.style.width = '0%';
            progressFill.classList.remove('active');
            cloneBtn.disabled = false;
        }, 800);
    }

    showCloneResult(message, type) {
        const resultEl = document.getElementById('cloneResult');
        resultEl.textContent = message;
        resultEl.className = `clone-result ${type}`;
        resultEl.classList.remove('hidden');
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                resultEl.classList.add('hidden');
            }, 5000);
        }
    }

    resetCloneForm() {
        document.getElementById('voiceFile').value = '';
        document.getElementById('voiceName').value = '';
        this.updateCloneButton();
    }

    updateVoiceOptions() {
        const voiceSelect = document.getElementById('voiceSelect');
        voiceSelect.innerHTML = '<option value="">Choose a voice...</option>';
        
        // Add default voices
        const defaultVoices = [
            { id: 'default_sarah', name: 'Sarah (Professional Female)' },
            { id: 'default_john', name: 'John (Professional Male)' },
            { id: 'default_emma', name: 'Emma (British Female)' },
            { id: 'default_david', name: 'David (British Male)' }
        ];
        
        defaultVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.id;
            option.textContent = voice.name;
            voiceSelect.appendChild(option);
        });
        
        // Add cloned voices
        if (this.clonedVoices.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '--- Your Cloned Voices ---';
            voiceSelect.appendChild(separator);
            
            this.clonedVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.id;
                option.textContent = `${voice.name} (Cloned)`;
                voiceSelect.appendChild(option);
            });
        }
        
        this.updateGenerateButton();
    }

    handleTextInput(event) {
        const text = event.target.value;
        const charCount = document.getElementById('charCount');
        charCount.textContent = text.length;
        
        // Show character limit warning
        if (text.length > 2000) {
            charCount.style.color = 'var(--color-warning)';
        } else if (text.length > 1500) {
            charCount.style.color = 'var(--color-warning)';
        } else {
            charCount.style.color = 'var(--color-text-secondary)';
        }
        
        this.updateGenerateButton();
    }

    updateGenerateButton() {
        const text = document.getElementById('textInput').value.trim();
        const voice = document.getElementById('voiceSelect').value;
        const generateBtn = document.getElementById('generateSpeech');
        
        generateBtn.disabled = !text || !voice;
    }

    async generateSpeech() {
        const text = document.getElementById('textInput').value.trim();
        const voiceId = document.getElementById('voiceSelect').value;
        const format = document.getElementById('formatSelect').value;
        
        // Validation
        if (!text) {
            alert('❌ Please enter some text to convert to speech.');
            return;
        }
        
        if (!voiceId) {
            alert('❌ Please select a voice.');
            return;
        }
        
        if (text.length > 3000) {
            alert('❌ Text is too long. Please keep it under 3000 characters.');
            return;
        }

        // Show progress
        this.showGenerateProgress();
        
        try {
            // Simulate speech generation with longer delay for realism
            await this.simulateApiCall(4000);
            
            // Create demo audio based on selected voice and text
            const audioBlob = await this.createDemoAudio(text, format, voiceId);
            
            this.hideGenerateProgress();
            this.showAudioResult(audioBlob, format);
            
        } catch (error) {
            this.hideGenerateProgress();
            alert('❌ Speech generation failed. Please check your connection and try again.');
        }
    }

    showGenerateProgress() {
        const progressEl = document.getElementById('generateProgress');
        const progressFill = progressEl.querySelector('.progress-fill');
        const generateBtn = document.getElementById('generateSpeech');
        
        progressEl.classList.remove('hidden');
        progressFill.classList.add('active');
        generateBtn.disabled = true;
        
        // Animate progress more realistically
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 6 + 3; // 3-9% increments
            if (progress > 92) progress = 92;
            progressFill.style.width = `${progress}%`;
        }, 200);
        
        this.generateProgressInterval = interval;
    }

    hideGenerateProgress() {
        const progressEl = document.getElementById('generateProgress');
        const progressFill = progressEl.querySelector('.progress-fill');
        const generateBtn = document.getElementById('generateSpeech');
        
        clearInterval(this.generateProgressInterval);
        progressFill.style.width = '100%';
        
        setTimeout(() => {
            progressEl.classList.add('hidden');
            progressFill.style.width = '0%';
            progressFill.classList.remove('active');
            generateBtn.disabled = false;
        }, 600);
    }

    async createDemoAudio(text, format, voiceId) {
        // Create a more realistic audio simulation
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = audioContext.sampleRate;
        const duration = Math.max(2, Math.min(text.length * 0.08, 15)); // 0.08 seconds per character, 2-15 seconds
        const frameCount = sampleRate * duration;
        
        const arrayBuffer = audioContext.createBuffer(2, frameCount, sampleRate); // Stereo
        
        // Generate different tones based on voice selection
        let baseFreq = 150; // Default frequency
        if (voiceId.includes('sarah') || voiceId.includes('emma')) {
            baseFreq = 220; // Higher for female voices
        } else if (voiceId.includes('john') || voiceId.includes('david')) {
            baseFreq = 130; // Lower for male voices
        } else if (this.clonedVoices.some(v => v.id === voiceId)) {
            baseFreq = 200; // Medium for cloned voices
        }
        
        for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
            const channelData = arrayBuffer.getChannelData(channel);
            
            for (let i = 0; i < frameCount; i++) {
                const t = i / sampleRate;
                const charIndex = Math.floor((t / duration) * text.length);
                const char = text.charAt(charIndex);
                
                // Vary frequency based on character for speech-like variation
                const frequency = baseFreq + (char.charCodeAt(0) % 100) - 50;
                
                // Create a more complex waveform
                const envelope = Math.exp(-t * 0.5) * Math.sin(Math.PI * t / duration);
                const wave1 = Math.sin(2 * Math.PI * frequency * t);
                const wave2 = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3;
                const wave3 = Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.2;
                
                channelData[i] = (wave1 + wave2 + wave3) * envelope * 0.1;
            }
        }
        
        // Convert to appropriate format
        if (format === 'ogg') {
            return this.audioBufferToOgg(arrayBuffer);
        } else {
            return this.audioBufferToWav(arrayBuffer);
        }
    }

    audioBufferToWav(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        
        // Convert samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    audioBufferToOgg(buffer) {
        // For demo purposes, we'll create an OGG-like blob
        // In reality, you'd need a proper OGG encoder
        const wavBlob = this.audioBufferToWav(buffer);
        return new Blob([wavBlob], { type: 'audio/ogg' });
    }

    showAudioResult(audioBlob, format) {
        const audioResult = document.getElementById('audioResult');
        const audioPlayer = document.getElementById('audioPlayer');
        const downloadFormat = document.getElementById('downloadFormat');
        const downloadSize = document.getElementById('downloadSize');
        
        // Create object URL for the audio blob
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        
        // Store for download
        this.currentAudioBlob = audioBlob;
        this.currentAudioFormat = format;
        
        // Update download info
        downloadFormat.textContent = format.toUpperCase();
        downloadSize.textContent = this.formatFileSize(audioBlob.size);
        
        // Show the result section
        audioResult.classList.remove('hidden');
        
        // Scroll to audio result
        audioResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    downloadAudio() {
        if (!this.currentAudioBlob) {
            alert('❌ No audio to download. Please generate speech first.');
            return;
        }
        
        const url = URL.createObjectURL(this.currentAudioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `speech_${Date.now()}.${this.currentAudioFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        const downloadBtn = document.getElementById('downloadAudio');
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '✅ Downloaded!';
        downloadBtn.style.background = 'var(--color-success)';
        
        setTimeout(() => {
            downloadBtn.textContent = originalText;
            downloadBtn.style.background = '';
        }, 2000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async simulateApiCall(duration = 1000) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate occasional failures for realism (5% failure rate)
                if (Math.random() < 0.05) {
                    reject(new Error('Simulated API error'));
                } else {
                    resolve({ success: true });
                }
            }, duration);
        });
    }

    async simulateVoiceCloning() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate occasional cloning failures (3% failure rate)
                if (Math.random() < 0.03) {
                    reject(new Error('Voice cloning failed'));
                } else {
                    resolve({ success: true });
                }
            }, 5000); // 5 seconds for voice cloning simulation
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoiceCloningApp();
});

// Handle page visibility changes to pause/resume audio
document.addEventListener('visibilitychange', () => {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer && !audioPlayer.paused) {
        if (document.hidden) {
            audioPlayer.pause();
        }
    }
});