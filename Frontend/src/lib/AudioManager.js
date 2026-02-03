// AudioManager.js - Enhanced sound effects management system
class AudioManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.3;
        this.ambientVolume = 0.15;
        this.initialized = false;
        this.audioContext = null;
        this.currentAmbient = null;
        this.ambientGainNode = null;
    }

    // Musical note frequencies (A4 = 440Hz standard)
    notes = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
        C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
        C6: 1046.50
    };

    // Initialize audio context
    async init() {
        if (this.initialized) return;

        console.log('🔊 Initializing Enhanced AudioManager...');

        if (typeof window !== 'undefined') {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('✅ AudioContext created');
            } catch (error) {
                console.warn('❌ Could not create AudioContext:', error);
            }
        }

        this.initialized = true;
    }

    // Play a single note
    playNote(frequency, duration = 0.1, type = 'sine') {
        if (this.isMuted) return;

        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.warn('Cannot create audio context:', error);
                return;
            }
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing note:', error);
        }
    }

    // Play a melody (array of notes with timing)
    playMelody(melody) {
        if (this.isMuted) return;

        melody.forEach(({ note, duration, delay }) => {
            setTimeout(() => {
                this.playNote(this.notes[note] || note, duration || 0.1);
            }, delay || 0);
        });
    }

    // Play ambient background sound
    playAmbient(type = 'ocean') {
        if (this.isMuted || this.currentAmbient === type) return;

        this.stopAmbient();

        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                return;
            }
        }

        // Create ambient sound using oscillators
        const oscillator = this.audioContext.createOscillator();
        this.ambientGainNode = this.audioContext.createGain();

        oscillator.connect(this.ambientGainNode);
        this.ambientGainNode.connect(this.audioContext.destination);

        // Different ambient types
        switch (type) {
            case 'ocean':
                oscillator.type = 'sine';
                oscillator.frequency.value = 80;
                break;
            case 'forest':
                oscillator.type = 'triangle';
                oscillator.frequency.value = 120;
                break;
            case 'wind':
                oscillator.type = 'sawtooth';
                oscillator.frequency.value = 60;
                break;
        }

        this.ambientGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.ambientGainNode.gain.linearRampToValueAtTime(this.ambientVolume, this.audioContext.currentTime + 2);

        oscillator.start();
        this.currentAmbient = { type, oscillator };
    }

    // Stop ambient sound
    stopAmbient() {
        if (this.currentAmbient && this.ambientGainNode) {
            this.ambientGainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
            setTimeout(() => {
                if (this.currentAmbient) {
                    this.currentAmbient.oscillator.stop();
                    this.currentAmbient = null;
                }
            }, 1000);
        }
    }

    // Play a sound effect
    play(soundName) {
        if (this.isMuted) {
            console.log('🔇 Sound muted');
            return;
        }

        if (!this.initialized) {
            this.init();
        }

        console.log(`🔊 Playing sound: ${soundName}`);

        switch (soundName) {
            case 'correct':
                this.playMelody([
                    { note: 'C5', duration: 0.1, delay: 0 },
                    { note: 'E5', duration: 0.15, delay: 80 }
                ]);
                break;

            case 'incorrect':
                this.playMelody([
                    { note: 'E4', duration: 0.15, delay: 0 },
                    { note: 'C4', duration: 0.2, delay: 100 }
                ]);
                break;

            case 'success':
                this.playMelody([
                    { note: 'C5', duration: 0.1, delay: 0 },
                    { note: 'E5', duration: 0.1, delay: 100 },
                    { note: 'G5', duration: 0.15, delay: 200 },
                    { note: 'C6', duration: 0.3, delay: 300 }
                ]);
                break;

            case 'points':
                this.playMelody([
                    { note: 'A5', duration: 0.08, delay: 0 },
                    { note: 'C6', duration: 0.12, delay: 60 }
                ]);
                break;

            case 'click':
                this.playNote(this.notes.A4, 0.05);
                break;

            case 'splash':
                this.playNote(300, 0.2, 'sine');
                setTimeout(() => this.playNote(200, 0.15, 'sine'), 50);
                break;

            case 'grow':
                this.playMelody([
                    { note: 'C4', duration: 0.1, delay: 0 },
                    { note: 'E4', duration: 0.1, delay: 80 },
                    { note: 'G4', duration: 0.1, delay: 160 },
                    { note: 'C5', duration: 0.2, delay: 240 }
                ]);
                break;

            case 'buzz':
                // Bee buzzing sound
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => this.playNote(250 + Math.random() * 50, 0.05, 'sawtooth'), i * 40);
                }
                break;

            case 'bloom':
                this.playMelody([
                    { note: 'G4', duration: 0.1, delay: 0 },
                    { note: 'B4', duration: 0.1, delay: 60 },
                    { note: 'D5', duration: 0.15, delay: 120 }
                ]);
                break;

            case 'combo':
                this.playMelody([
                    { note: 'E5', duration: 0.08, delay: 0 },
                    { note: 'G5', duration: 0.08, delay: 50 },
                    { note: 'B5', duration: 0.12, delay: 100 }
                ]);
                break;

            case 'warning':
                this.playNote(this.notes.F4, 0.3, 'square');
                break;

            case 'achievement':
                this.playMelody([
                    { note: 'C5', duration: 0.1, delay: 0 },
                    { note: 'E5', duration: 0.1, delay: 80 },
                    { note: 'G5', duration: 0.1, delay: 160 },
                    { note: 'C6', duration: 0.15, delay: 240 },
                    { note: 'C6', duration: 0.2, delay: 360 }
                ]);
                break;

            default:
                this.playNote(this.notes.A4, 0.1);
        }
    }

    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAmbient();
        }
        console.log(`🔊 Sound ${this.isMuted ? 'muted' : 'unmuted'}`);
        return this.isMuted;
    }

    // Set volume (0 to 1)
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        console.log(`🔊 Volume set to ${this.volume}`);
    }

    // Set ambient volume
    setAmbientVolume(vol) {
        this.ambientVolume = Math.max(0, Math.min(1, vol));
        if (this.ambientGainNode) {
            this.ambientGainNode.gain.setValueAtTime(this.ambientVolume, this.audioContext.currentTime);
        }
    }

    // Get mute status
    getMuteStatus() {
        return this.isMuted;
    }
}

// Create singleton instance
const audioManager = new AudioManager();

// Auto-initialize on first interaction
if (typeof window !== 'undefined') {
    const initOnInteraction = () => {
        audioManager.init();
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
        document.removeEventListener('touchstart', initOnInteraction);
    };

    document.addEventListener('click', initOnInteraction, { once: true });
    document.addEventListener('keydown', initOnInteraction, { once: true });
    document.addEventListener('touchstart', initOnInteraction, { once: true });
}

export default audioManager;
