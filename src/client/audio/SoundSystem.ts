/**
 * Web Audio API Synth Engine for Game Show Backsound and Sound Effects.
 * 100% self-contained, lightweight, zero external file dependencies.
 */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isBgmRunning: boolean = false;
  private bgmIntervalId: any = null;
  private currentVolume: number = 0.5;

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      this.bgmGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  /**
   * Starts rhythmic ambient game show background music
   */
  public startBGM(): void {
    if (this.isBgmRunning) return;
    this.initContext();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmRunning = true;
    let step = 0;
    const tempoMs = 240; // ~125 BPM 8th notes

    // Bass & Chord progression for game show: Am -> F -> C -> G
    const bassNotes = [220, 220, 174.61, 174.61, 261.63, 261.63, 196.0, 196.0];
    const synthNotes = [440, 523.25, 659.25, 523.25, 349.23, 440, 523.25, 392];

    this.bgmIntervalId = setInterval(() => {
      if (!this.isBgmRunning || !this.ctx || !this.bgmGain) return;

      const time = this.ctx.currentTime;
      const bassFreq = bassNotes[step % bassNotes.length];
      const leadFreq = synthNotes[step % synthNotes.length];

      // Bass synth note
      const bassOsc = this.ctx.createOscillator();
      const bassEnv = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq / 2, time);

      bassEnv.gain.setValueAtTime(0.18, time);
      bassEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      bassOsc.connect(bassEnv);
      bassEnv.connect(this.bgmGain);

      bassOsc.start(time);
      bassOsc.stop(time + 0.22);

      // Lead arpeggio note (every 2nd step)
      if (step % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadEnv = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreq, time);

        leadEnv.gain.setValueAtTime(0.12, time);
        leadEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        leadOsc.connect(leadEnv);
        leadEnv.connect(this.bgmGain);

        leadOsc.start(time);
        leadOsc.stop(time + 0.18);
      }

      step++;
    }, tempoMs);
  }

  /**
   * Pauses background music (e.g. when winner is found)
   */
  public pauseBGM(): void {
    this.isBgmRunning = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  /**
   * Plays celebratory winner fanfare
   */
  public playWinFanfare(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time + i * 0.12);

      gain.gain.setValueAtTime(0.3, time + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time + i * 0.12);
      osc.stop(time + i * 0.12 + 0.45);
    });
  }

  /**
   * Plays countdown tick sound
   */
  public playTick(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

export const soundSystem = new SoundSystem();

