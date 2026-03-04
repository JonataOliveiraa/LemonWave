
class AudioEngine {
   context: AudioContext;
   analyser: AnalyserNode;
  private buffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.context.destination);
  }

  /**
   * Generates a short synthesized beep as a fallback when a sound file is missing.
   * This ensures the visualizer and UI still function even without the physical assets.
   */
  private createFallbackBuffer(): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const duration = 0.1; // 100ms
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * Math.exp(-i / (sampleRate * 0.05));
    }
    return buffer;
  }

  async loadSound(url: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(url)) {
      return this.buffers.get(url)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sound: ${url} (Status: ${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn(`AudioEngine: Using fallback for ${url}. Error:`, error);
      // Return a synthesized fallback instead of null to keep the app interactive
      const fallback = this.createFallbackBuffer();
      this.buffers.set(url, fallback);
      return fallback;
    }
  }

  play(buffer: AudioBuffer, pitch: number, volume: number) {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    
    // Pitch Variance logic: TModLoader maps -1..1 to a variance.
    // In Web Audio, playbackRate is a multiplier. 
    // We use exponential scaling (2^pitch) to map -1..1 to 0.5x..2.0x playback rate.
    source.playbackRate.value = Math.pow(2, pitch);
    
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.analyser);

    source.start(0);
    return source;
  }
}

export const audioEngine = new AudioEngine();
