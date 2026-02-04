
export type SoundEffect = 'navigate' | 'transition' | 'choice' | 'start' | 'complete' | 'judgment';
export type Theme = 'Journey' | 'Battle' | 'Sanctuary' | 'Despair' | 'Mystery';

class AudioService {
    private audioContext: AudioContext | null = null;
    private mainGain: GainNode | null = null;
    private _isMuted: boolean = false;
    private currentMusic: { sources: OscillatorNode[], gain: GainNode, theme: Theme } | null = null;
    private musicVolume = 0.05;

    private init(): boolean {
        if (!this.audioContext && typeof window !== 'undefined') {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.mainGain = this.audioContext.createGain();
                this.mainGain.connect(this.audioContext.destination);
                if (this._isMuted) {
                    this.mainGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                }
            } catch (e) {
                console.error("Web Audio API is not supported in this browser", e);
                return false;
            }
        }
        return !!this.audioContext;
    }
    
    public playSound(type: SoundEffect): void {
        if (!this.init() || !this.audioContext || !this.mainGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.mainGain);
        osc.connect(gainNode);

        switch (type) {
            case 'navigate':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'transition':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'choice':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.exponentialRampToValueAtTime(659.26, now + 0.1); // E5
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'start':
            case 'complete':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.26, now + 0.1); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'judgment': // Low, resonant impact
                // Layer 1: Low sine drop
                const subOsc = this.audioContext.createOscillator();
                const subGain = this.audioContext.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(150, now);
                subOsc.frequency.exponentialRampToValueAtTime(30, now + 1.5);
                subGain.gain.setValueAtTime(0.5, now);
                subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
                subGain.connect(this.mainGain);
                subOsc.connect(subGain);
                subOsc.start(now);
                subOsc.stop(now + 1.5);

                // Layer 2: Noise burst (Simulated with erratic square)
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.2);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
        }
    }

    public playBackgroundMusic(theme: Theme): void {
        if (!this.init() || !this.audioContext || !this.mainGain) return;
        
        if (this.currentMusic && this.currentMusic.theme === theme) {
            return; 
        }

        const now = this.audioContext.currentTime;
        const fadeDuration = 1.5;

        // Fade out old music
        if (this.currentMusic) {
            const oldGain = this.currentMusic.gain;
            oldGain.gain.cancelScheduledValues(now);
            oldGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);
            this.currentMusic.sources.forEach(source => source.stop(now + fadeDuration));
        }

        // Create new music
        const newGain = this.audioContext.createGain();
        newGain.connect(this.mainGain);
        newGain.gain.setValueAtTime(0.0001, now);

        const newSources = this.createMusicSource(theme);
        newSources.forEach(source => {
            source.connect(newGain);
            source.start(now);
        });
        
        const targetVolume = Math.max(0.0001, this.musicVolume);
        newGain.gain.exponentialRampToValueAtTime(targetVolume, now + fadeDuration);

        this.currentMusic = { sources: newSources, gain: newGain, theme };
    }

    private createMusicSource(theme: Theme): OscillatorNode[] {
        if (!this.audioContext) return [];

        const createOsc = (freq: number, type: OscillatorType = 'sine', detune = 0): OscillatorNode => {
            const osc = this.audioContext!.createOscillator();
            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;
            return osc;
        };

        switch (theme) {
            case 'Journey': // Hopeful, moving
                return [createOsc(130.81, 'sine'), createOsc(196.00, 'sine', 2), createOsc(261.63, 'sine', -2)];
            case 'Battle': // Dissonant, tense
                return [createOsc(73.42, 'square'), createOsc(77.78, 'sawtooth', -5), createOsc(110.00, 'square', 5)];
            case 'Sanctuary': // Peaceful, holy
                return [createOsc(261.63, 'triangle'), createOsc(329.63, 'triangle', 3), createOsc(392.00, 'triangle', -3)];
            case 'Despair': // Low, somber
                return [createOsc(110.00, 'sawtooth'), createOsc(130.81, 'sawtooth', 3), createOsc(164.81, 'sawtooth', -3)];
            case 'Mystery': // Eerie, questioning
                return [createOsc(146.83, 'sine'), createOsc(185.00, 'sine', 4)];
            default:
                return [createOsc(130.81, 'sine')];
        }
    }

    public stopAllAudio(): void {
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        if (this.currentMusic) {
            this.currentMusic.gain.gain.cancelScheduledValues(now);
            this.currentMusic.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            this.currentMusic.sources.forEach(s => s.stop(now + 0.5));
            this.currentMusic = null;
        }
    }

    public setMusicVolume(volume: number): void {
        this.musicVolume = 0.1 * volume; // Scale to a max of 0.1
        if (this.init() && this.currentMusic && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.currentMusic.gain.gain.cancelScheduledValues(now);
            const targetVolume = Math.max(0.0001, this.musicVolume);
            this.currentMusic.gain.gain.exponentialRampToValueAtTime(targetVolume, now + 0.2);
        }
    }

    public toggleMute(): void {
        this._isMuted = !this._isMuted;
        if (this.init() && this.mainGain && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.mainGain.gain.cancelScheduledValues(now);
            const targetVolume = this._isMuted ? 0.0001 : 1;
            this.mainGain.gain.exponentialRampToValueAtTime(targetVolume, now + 0.2);
        }
    }

    public isMuted(): boolean {
        return this._isMuted;
    }
}

const audioService = new AudioService();
export default audioService;