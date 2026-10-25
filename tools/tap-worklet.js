// records what reaches the speakers, 128 frames at a time, and posts them to the page (tools/clickcheck.js)
registerProcessor('tap', class extends AudioWorkletProcessor {
  process(ins) { const c = ins[0] && ins[0][0]; if (c) this.port.postMessage(c.slice()); return true; }
});
