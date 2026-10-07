// Captures microphone audio, resamples to 16 kHz if needed, and posts 20 ms PCM16 frames (320 samples).
class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pending = new Float32Array(0);
    this.pos = 0;
    this.frame = new Int16Array(320);
    this.n = 0;
  }
  push(sample) {
    const s = Math.max(-1, Math.min(1, sample));
    this.frame[this.n++] = s < 0 ? s * 32768 : s * 32767;
    if (this.n === 320) {
      this.port.postMessage(this.frame.buffer.slice(0));
      this.n = 0;
    }
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    if (this.ratio === 1) {
      for (let i = 0; i < ch.length; i++) this.push(ch[i]);
      return true;
    }
    const buf = new Float32Array(this.pending.length + ch.length);
    buf.set(this.pending, 0);
    buf.set(ch, this.pending.length);
    let pos = this.pos;
    while (pos + 1 < buf.length) {
      const i = Math.floor(pos);
      const frac = pos - i;
      this.push(buf[i] * (1 - frac) + buf[i + 1] * frac);
      pos += this.ratio;
    }
    const consumed = Math.floor(pos);
    this.pending = buf.slice(Math.min(consumed, buf.length));
    this.pos = pos - consumed;
    return true;
  }
}
registerProcessor("pcm-worklet", PCMWorklet);
